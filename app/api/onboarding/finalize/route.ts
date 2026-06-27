import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { createSupabaseServer } from '@/lib/supabase'
import { createEdge } from '@/lib/db'
import OpenAI from 'openai'
import { randomBytes, createHash } from 'crypto'
import type { ContextNode } from '@/types'

interface GeneratedNode {
  scope: string
  title: string
  content: string
  tags?: string[]
  parent_scope: string | null
  relevance?: number
}

export const maxDuration = 60

import { logOpenRouterCall } from '@/lib/logging'

const CASCADE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'openrouter/free',
]

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  const startOverall = Date.now()
  let userId = 'unknown'
  try {
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Starting finalize request...`)

    const startAuth = Date.now()
    const user = await requireSessionUser()
    userId = user.id
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Session authorized for user ${userId} (took ${Date.now() - startAuth}ms)`)

    const startParse = Date.now()
    const { history } = (await req.json()) as { history: ConversationMessage[] }
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Request body parsed (took ${Date.now() - startParse}ms)`)

    const conversationText = history
      .map(m => `${m.role.toUpperCase()}: ${m.content.replace('[GRAPH_READY]', '').trim()}`)
      .join('\n')

    const GRAPH_PROMPT = `Based on this conversation, generate a context graph for the user.
Return ONLY a valid JSON array. No markdown fences, no explanation, no preamble.

Schema for each object in the array:
{
  "scope": string,          // unique slug. Use: "me", "agency", "personal/project-name", "personal/skills", "personal/goals", "agency/project-name"
  "title": string,          // short display name (e.g. "ME", "ContextGraph", "Dev Studio")
  "content": string,        // 3-5 rich sentences an AI reads to understand this context before a session. Write in third person about the user.
  "tags": string[],         // lowercase strings (e.g. ["developer", "nextjs", "saas"])
  "parent_scope": string | null,  // null for "me" node, "me" for most others, "agency" for agency projects
  "relevance": number       // 0.88 to 0.95 for fresh onboarding data
}

Rules:
- ALWAYS include a "me" node (parent_scope: null, relevance: 0.95)
- Include "agency" node ONLY if they mentioned running an agency, studio, or freelance business
- Include up to 3 project nodes using scope "personal/project-slug" or "agency/project-slug"
- Include "personal/skills" node if they mentioned 2+ technologies (parent_scope: "me")
- Always include "personal/goals" node (parent_scope: "me")
- Maximum 8 nodes total
- Scope slugs: lowercase, hyphens only, no spaces, no special characters
- Content must be rich enough that an AI reading it could immediately understand context without asking follow-up questions

Conversation:
${conversationText}`

    let rawText = ''
    let sourceUsed = ''
    let elapsedAI = 0

    // 1. PRIMARY: Gemini API Direct Call
    if (process.env.GEMINI_API_KEY) {
      const startGemini = Date.now()
      console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Querying primary Gemini API (gemini-2.5-flash)...`)
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: GRAPH_PROMPT }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            }
          }),
          signal: AbortSignal.timeout(10000)
        })

        if (res.ok) {
          const data = await res.json()
          rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          sourceUsed = 'Gemini API'
          elapsedAI = Date.now() - startGemini
          console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Gemini API SUCCESS (took ${elapsedAI}ms)`)
        } else {
          const errText = await res.text()
          console.warn(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Gemini API failed with status ${res.status}: ${errText}. Falling back to OpenRouter...`)
        }
      } catch (e: any) {
        console.warn(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Gemini API error: ${e.message || e}. Falling back to OpenRouter...`)
      }
    }

    // 2. FALLBACK: OpenRouter Cascade
    if (!rawText) {
      const startOpenRouter = Date.now()
      console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Entering OpenRouter cascade...`)

      const openrouterClient = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || '',
        defaultHeaders: {
          'HTTP-Referer': 'https://contextgraph.vercel.app',
          'X-Title': 'ContextGraph Onboarding Finalize',
        }
      })

      const messages = [{ role: 'user' as const, content: GRAPH_PROMPT }]

      for (const model of CASCADE_MODELS) {
        const startModel = Date.now()
        try {
          console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Trying OpenRouter model: ${model}...`)
          const completion = await openrouterClient.chat.completions.create({
            model,
            messages,
            max_tokens: 2000,
            temperature: 0.3,
          }, {
            timeout: 15000,
          })

          rawText = completion.choices[0]?.message?.content ?? ''
          sourceUsed = `OpenRouter (${model})`
          elapsedAI = Date.now() - startOpenRouter

          logOpenRouterCall({
            context: 'Onboarding Finalize',
            model,
            status: 'SUCCESS',
            modelUsed: completion.model || model,
            usage: {
              prompt_tokens: completion.usage?.prompt_tokens,
              completion_tokens: completion.usage?.completion_tokens,
              total_tokens: completion.usage?.total_tokens,
              cost: (completion as any).usage?.cost
            }
          })
          console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] OpenRouter model ${model} SUCCESS (took ${Date.now() - startModel}ms)`)
          break
        } catch (err: unknown) {
          const error = err as { status?: number; message?: string }
          const errMsg = error.message || String(error)
          console.warn(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] [FALLBACK] Model ${model} failed after ${Date.now() - startModel}ms: ${errMsg}.`)

          logOpenRouterCall({
            context: 'Onboarding Finalize',
            model,
            status: 'FAILED',
            error: `HTTP ${error.status ?? 'unknown'}: ${errMsg}`
          })

          if ([402, 429, 404, 502, 503].includes(error.status ?? 0) || error.status === undefined) {
            continue
          }
          throw err
        }
      }
    }

    if (!rawText) {
      console.error(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Graph generation failed. No AI response generated.`)
      return NextResponse.json({ error: 'AI generation failed to produce nodes.' }, { status: 500 })
    }

    // Clean JSON text
    let cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonStart = cleanedText.indexOf('[');
    const jsonEnd = cleanedText.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
    }

    const generatedNodes = JSON.parse(cleanedText) as GeneratedNode[]
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Parsed ${generatedNodes.length} nodes from ${sourceUsed}`)

    const supabase = createSupabaseServer()

    // Delete existing nodes/edges
    const startDelete = Date.now()
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Deleting existing nodes & edges for user: ${userId}...`)
    await supabase.from('context_edges').delete().eq('user_id', userId)
    await supabase.from('context_nodes').delete().eq('user_id', userId)
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Deletion complete (took ${Date.now() - startDelete}ms)`)

    // Filter duplicate scopes
    const seenScopes = new Set<string>()
    const uniqueNodes: GeneratedNode[] = []
    for (const node of generatedNodes) {
      if (!node.scope || seenScopes.has(node.scope)) {
        console.warn(`[ONBOARDING FINALIZE] Skipping duplicate or empty scope node: ${node.scope}`)
        continue
      }
      seenScopes.add(node.scope)
      uniqueNodes.push(node)
    }

    // Write all nodes
    const startDBWrite = Date.now()
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Writing ${uniqueNodes.length} nodes to database...`)
    const allInsertedNodes: ContextNode[] = []
    for (const node of uniqueNodes) {
      const { data: inserted, error: insertError } = await supabase
        .from('context_nodes')
        .insert({
          user_id: userId,
          scope: node.scope,
          title: node.title,
          content: node.content,
          tags: node.tags || [],
          parent_scope: node.parent_scope,
          relevance: node.relevance || 0.9,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error(`[ONBOARDING FINALIZE] Failed to insert node ${node.scope}:`, insertError.message)
        continue
      }
      allInsertedNodes.push(inserted)
    }

    // Connect edges
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Connecting parent-child edges for ${allInsertedNodes.length} nodes...`)
    for (const insertedNode of allInsertedNodes) {
      if (insertedNode.parent_scope) {
        const parentNode = allInsertedNodes.find(n => n.scope === insertedNode.parent_scope)
        if (parentNode) {
          await createEdge(supabase, userId, insertedNode.id, parentNode.id, 'part_of')
        }
      }
    }
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Node and edge creation complete (took ${Date.now() - startDBWrite}ms)`)

    // API key generation
    const startKeyGen = Date.now()
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Generating secure API key...`)
    const rawKey = 'ctx_' + randomBytes(32).toString('base64url')
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 12)

    await supabase.from('api_keys').delete().eq('user_id', userId)

    const { error: insertKeyError } = await supabase.from('api_keys').insert({
      user_id: userId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })

    if (insertKeyError) {
      throw new Error(`Failed to store API key: ${insertKeyError.message}`)
    }
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] API key created and stored (took ${Date.now() - startKeyGen}ms)`)

    // Mark onboarding complete
    const startUserUpdate = Date.now()
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Marking user onboarding complete...`)
    await supabase.from('user')
      .update({ onboarding_done: true })
      .eq('id', userId)
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] User onboarding complete (took ${Date.now() - startUserUpdate}ms)`)

    const totalDuration = Date.now() - startOverall
    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] FINALIZE SUCCESS: Total duration ${totalDuration}ms`)

    return NextResponse.json({ nodes: allInsertedNodes, apiKey: rawKey })

  } catch (error: unknown) {
    const err = error as Error
    const totalDuration = Date.now() - startOverall
    console.error(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] FINALIZE ERROR for user ${userId} (after ${totalDuration}ms):`, err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
