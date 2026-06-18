import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import OpenAI from 'openai'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are the ContextGraph onboarding assistant. Your job is to learn about the user to build their personal AI context graph — a structured knowledge base that gives AI tools persistent memory about who they are.

Ask ONE focused question at a time. Keep ALL responses under 90 words. Be direct and conversational, not robotic or over-enthusiastic.

You need to learn across the conversation:
1. Their name and current role (student / developer / founder / etc)
2. Their primary tech stack or area of expertise
3. Up to 3 active projects they are working on (name + one sentence description)
4. Their primary goal right now (career placement, growing a business, shipping a product, learning, etc)
5. Any working style preferences (brief is fine — optional)

Start the very first message with: "Hey! I'll ask you a few quick questions to build your context graph. What's your name and what do you do?"

After you have gathered name, role, at least one skill, and at least one project — end your response with [GRAPH_READY] on a new line. Do not include [GRAPH_READY] until you have all four of those. Do not include [GRAPH_READY] in any intermediate message.`

const STREAM_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-235b-a22b:free',
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
          max_tokens: 180,
          temperature: 0.7,
        })

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()
            try {
              for await (const chunk of completion) {
                const text = chunk.choices[0]?.delta?.content ?? ''
                if (text) {
                  controller.enqueue(encoder.encode(text))
                }
              }
            } catch (err) {
              console.error(`Streaming error with model ${model}:`, err)
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
        console.warn(`Model ${model} failed, trying next cascade model. Error:`, error.message || error)
        if ([429, 404, 502, 503].includes(error.status ?? 0) || error.status === undefined) {
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
