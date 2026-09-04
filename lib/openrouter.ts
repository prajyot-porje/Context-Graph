import OpenAI from 'openai'
import { logOpenRouterCall } from './logging'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'ContextGraph',
  },
})

/**
 * Free model cascade — ordered by quality for structured JSON generation.
 * If any model is unavailable or rate-limited, we fall through to the next.
 */
const MODEL_CASCADE = [
  'meta-llama/llama-3.3-70b-instruct',
  'openrouter/free',
] as const

export async function judgeContext(prompt: string, isJson: boolean = false): Promise<string> {
  const startOverall = Date.now()

  // 1. PRIMARY: Gemini API key direct check
  if (process.env.GEMINI_API_KEY) {
    const startGemini = Date.now()
    console.log(`[${new Date().toISOString()}] [JUDGE CONTEXT] Trying Gemini API (gemini-2.5-flash)...`)
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: isJson ? "application/json" : undefined,
          }
        }),
        signal: AbortSignal.timeout(8000)
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const elapsed = Date.now() - startGemini
        console.log(`[${new Date().toISOString()}] [JUDGE CONTEXT] Gemini API SUCCESS (took ${elapsed}ms)`)
        return text
      } else {
        const errText = await res.text()
        const elapsed = Date.now() - startGemini
        console.warn(`[${new Date().toISOString()}] [JUDGE CONTEXT] Gemini API failed with status ${res.status} (took ${elapsed}ms): ${errText}. Falling back to OpenRouter...`)
      }
    } catch (e: any) {
      const elapsed = Date.now() - startGemini
      console.warn(`[${new Date().toISOString()}] [JUDGE CONTEXT] Gemini API error (took ${elapsed}ms): ${e.message || e}. Falling back to OpenRouter...`)
    }
  }

  // 2. FALLBACK: OpenRouter Cascade
  let lastError: unknown
  const messages = [{ role: 'user' as const, content: prompt }]

  for (const model of MODEL_CASCADE) {
    const startModel = Date.now()
    try {
      console.log(`[${new Date().toISOString()}] [JUDGE CONTEXT] Trying OpenRouter model: ${model}...`)
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 2000,
      }, {
        timeout: 15000,
      })
      const content = response.choices[0].message.content ?? ''
      const elapsed = Date.now() - startModel

      // Log successful call
      logOpenRouterCall({
        context: 'Judge Context',
        model: model,
        status: 'SUCCESS',
        modelUsed: response.model || model,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens,
          completion_tokens: response.usage?.completion_tokens,
          total_tokens: response.usage?.total_tokens,
          cost: (response as any).usage?.cost
        }
      })
      console.log(`[${new Date().toISOString()}] [JUDGE CONTEXT] OpenRouter model ${model} SUCCESS (took ${elapsed}ms)`)

      return content
    } catch (error: unknown) {
      lastError = error
      const status = (error as { status?: number }).status
      const msg = (error as { message?: string }).message || String(error)
      const elapsed = Date.now() - startModel

      console.warn(`[${new Date().toISOString()}] [JUDGE CONTEXT] [FALLBACK] Model ${model} failed after ${elapsed}ms (status ${status ?? 'unknown'}): ${msg}`)

      // Log individual model failure/retry
      logOpenRouterCall({
        context: 'Judge Context',
        model: model,
        status: 'FAILED',
        error: `HTTP ${status ?? 'unknown'}: ${msg}`
      })

      // Retry on: payment required (402), not found (404), rate-limit (429), or temporary server errors (502/503)
      if (status === 402 || status === 404 || status === 429 || status === 502 || status === 503) {
        continue
      }
      // For other errors (auth, bad request, etc.) throw immediately
      throw error
    }
  }

  // All models exhausted
  console.error(`[${new Date().toISOString()}] [JUDGE CONTEXT] All models exhausted (total duration: ${Date.now() - startOverall}ms)`)
  throw lastError
}
