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

const STREAM_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-235b-a22b:free',
]

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const userId = user.id

    const { history } = (await req.json()) as { history: ConversationMessage[] }

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

    const openrouterClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || '',
      defaultHeaders: {
        'HTTP-Referer': 'https://contextgraph.vercel.app',
        'X-Title': 'ContextGraph Onboarding Finalize',
      }
    })

    let generatedNodes: GeneratedNode[] = []

    for (const model of STREAM_MODELS) {
      try {
        const completion = await openrouterClient.chat.completions.create({
          model,
          messages: [{ role: 'user', content: GRAPH_PROMPT }],
          max_tokens: 2000,
          temperature: 0.3,
        })

        let rawText = completion.choices[0]?.message?.content ?? ''
        // Strip markdown fences if present
        rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        generatedNodes = JSON.parse(rawText)
        break
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string }
        console.warn(`Model ${model} failed to generate JSON, trying next cascade model. Error:`, error.message || error)
        if ([429, 404, 502, 503].includes(error.status ?? 0) || error.status === undefined) {
          continue
        }
        throw err
      }
    }

    if (!generatedNodes || generatedNodes.length === 0) {
      return NextResponse.json({ error: 'AI generation failed to produce nodes.' }, { status: 500 })
    }

    const supabase = createSupabaseServer()

    // Write all nodes to Supabase
    const allInsertedNodes: ContextNode[] = []
    for (const node of generatedNodes) {
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
        console.error(`Failed to insert node ${node.scope}:`, insertError.message)
        continue
      }
      allInsertedNodes.push(inserted)
    }

    // Connect edges
    for (const insertedNode of allInsertedNodes) {
      if (insertedNode.parent_scope) {
        const parentNode = allInsertedNodes.find(n => n.scope === insertedNode.parent_scope)
        if (parentNode) {
          await createEdge(supabase, userId, insertedNode.id, parentNode.id, 'part_of')
        }
      }
    }

    // Generate API key for this user
    const rawKey = 'ctx_' + randomBytes(32).toString('base64url')
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 12)

    await supabase.from('api_keys').upsert(
      { user_id: userId, key_hash: keyHash, key_prefix: keyPrefix },
      { onConflict: 'user_id' }
    )

    // Mark onboarding complete
    await supabase.from('user')
      .update({ onboarding_done: true })
      .eq('id', userId)

    return NextResponse.json({ nodes: allInsertedNodes, apiKey: rawKey })

  } catch (error: unknown) {
    const err = error as Error
    console.error('Finalize route error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
