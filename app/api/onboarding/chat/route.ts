import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import OpenAI from 'openai'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are the ContextGraph onboarding assistant. Your job is to learn about the user to build their personal AI context graph.

Follow this exact flow:
1. The conversation starts with the greeting: "Hey! I'll ask you a few quick questions to build your context graph. What's your name and what do you do?"
2. When the user replies with their name and role/what they do, acknowledge them warmly, and let them know we'll set up their context graph. Keep your text response very short and concise (under 25 words), and end it immediately with the token [CHOOSE_PATH] on a new line. Do NOT write out details, instructions, or markdown prompts for Path A and Path B in your text response, since the UI renders visual cards instead.
   Example: "Nice to meet you, [Name]! Let's get your context graph set up. Choose a path below to get started:\n[CHOOSE_PATH]"
3. If the user pastes an AI memory profile (containing ChatGPT and/or Claude memory blocks), you MUST exhaustively parse and extract their details. 
   - CRITICAL parsing rule: Do NOT ask for any details (such as tech stack, projects, name, role, or goals) that are already present in their pasted memory.
   - Accept summaries, bullet points, and brief descriptions as valid information. Do not demand conversational enrichment if the data is there.
   - If the pasted memory contains: (a) name and role, (b) skills or tech stack, (c) at least one active project, and (d) a primary goal — then you have ALL required information. In this case, you MUST immediately respond with ONLY the token [GRAPH_READY] on a new line. Do not ask any follow-up questions.
   - If there are completely missing required fields (e.g. absolutely no projects or no goal listed), ask ONE focused question at a time to gather the missing details:
     * Name and current role
     * Primary tech stack / expertise
     * Up to 3 active projects (name + one-sentence description)
     * Primary goal right now (e.g. shipping a product, career placement, learning)
     * Working style preferences (optional)
     Only ask about what is missing or needs clarification to make the graph perfect.
4. Keep all conversational questions/replies direct, concise (under 90 words), and friendly.
5. Once you have all the information (name, role, skills, at least one project, and primary goal) — end your response with [GRAPH_READY] on a new line. Do not include [GRAPH_READY] in any intermediate message.`

import { logOpenRouterCall } from '@/lib/logging'

const STREAM_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'openrouter/free',
]

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    await requireSessionUser()

    // 2. Parse body
    const { history } = await req.json()

    const openrouterClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || '',
      defaultHeaders: {
        'HTTP-Referer': 'https://contextgraph.vercel.app',
        'X-Title': 'ContextGraph Onboarding',
      }
    })

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...((history ?? []).slice(-10)) // last 10 messages max
    ]

    for (const model of STREAM_MODELS) {
      try {
        const completion = await openrouterClient.chat.completions.create({
          model,
          messages,
          stream: true,
          max_tokens: 1000,
          temperature: 0.7,
        }, {
          timeout: 12000,
        })

        let accumulatedContent = ''
        let accumulatedReasoning = ''
        let modelUsedActual = model

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()
            try {
              for await (const chunk of completion) {
                if (chunk.model) {
                  modelUsedActual = chunk.model
                }
                const text = chunk.choices[0]?.delta?.content ?? ''
                const reasoning = (chunk.choices[0]?.delta as any)?.reasoning ?? ''

                if (text) {
                  accumulatedContent += text
                  controller.enqueue(encoder.encode(text))
                }
                if (reasoning) {
                  accumulatedReasoning += reasoning
                }
              }

              // Stream completed successfully, write to logs
              logOpenRouterCall({
                context: 'Onboarding Chat',
                model,
                status: 'SUCCESS',
                modelUsed: modelUsedActual,
              })
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err)
              console.error(`Streaming error with model ${model}:`, err)

              // Log streaming error
              logOpenRouterCall({
                context: 'Onboarding Chat',
                model,
                status: 'FAILED',
                modelUsed: modelUsedActual,
                error: errMsg
              })

              controller.error(err)
            } finally {
              controller.close()
            }
          }
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
          }
        })
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string }
        console.warn(`[${new Date().toISOString()}] [ONBOARDING CHAT] [FALLBACK] Model ${model} failed: ${error.message || error}. Trying next model...`)

        // Log initial connection failure
        logOpenRouterCall({
          context: 'Onboarding Chat',
          model,
          status: 'FAILED',
          error: `HTTP ${error.status ?? 'unknown'}: ${error.message || String(error)}`
        })

        if ([402, 429, 404, 502, 503].includes(error.status ?? 0) || error.status === undefined) {
          continue
        }
        throw err
      }
    }

    return NextResponse.json(
      { error: 'All models unavailable. Please try again in a moment.' },
      { status: 503 }
    )
  } catch (error: unknown) {
    const err = error as Error
    console.error('Onboarding chat route error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
