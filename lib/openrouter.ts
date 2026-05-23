import OpenAI from 'openai'
import { OnboardingAnswers } from '@/types'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
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
  'minimax/minimax-m2.5:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
] as const

export async function judgeContext(prompt: string): Promise<string> {
  let lastError: unknown

  for (const model of MODEL_CASCADE) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
      })
      return response.choices[0].message.content ?? ''
    } catch (error: unknown) {
      lastError = error
      const status = (error as { status?: number }).status
      // Retry on: not found (404), rate-limit (429), or temporary server errors (502/503)
      if (status === 404 || status === 429 || status === 502 || status === 503) {
        console.warn(`Model ${model} returned ${status}, trying next fallback...`)
        continue
      }
      // For other errors (auth, bad request, etc.) throw immediately
      throw error
    }
  }

  // All models exhausted
  throw lastError
}

export async function generateContextGraph(answers: OnboardingAnswers): Promise<string> {
  const roles = answers.roles || answers.role || []
  const prompt = `
You are a context engine for a personal AI assistant.

A user just completed onboarding. Generate their initial context graph 
based on their answers. Return ONLY valid JSON — no markdown, no explanation.

User answers:
Name: ${answers.name}
Location: ${answers.location}
Roles: ${roles.join(', ')}
Description: ${answers.description}
Skills: ${answers.skills.join(', ')}
Stack: ${answers.stack.join(', ')}
Goals: ${answers.goals}
Preferences: ${answers.constraints}
Projects: ${JSON.stringify(answers.projects)}

Return this exact JSON structure:
{
  "nodes": [
    {
      "scope": "me",
      "title": "ME",
      "content": "detailed markdown paragraph about who this person is, their skills, working style, and goals",
      "tags": ["developer", "..."],
      "parent_scope": null
    },
    // If they have agency/freelance work:
    {
      "scope": "agency",
      "title": "agency or freelance name or their name + freelance",
      "content": "what they do professionally, clients, services",
      "tags": ["agency", "..."],
      "parent_scope": "me"
    },
    // One node per project they listed:
    {
      "scope": "personal/project-slug or agency/project-slug",
      "title": "Project Name",
      "content": "what the project is, current status, tech stack, goals",
      "tags": ["next.js", "..."],
      "parent_scope": "me or agency"
    }
  ]
}

Rules:
- me node is always first and always present
- content should be dense and factual — written for an AI to understand
- scope slugs use lowercase kebab-case
- parent_scope must match another node's scope field exactly
- maximum 6 nodes total
`
  return judgeContext(prompt)
}
