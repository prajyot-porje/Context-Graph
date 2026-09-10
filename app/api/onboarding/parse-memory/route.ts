import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { judgeContext } from '@/lib/openrouter'

export const maxDuration = 30

interface ParsedMemory {
  name?: string
  role?: string
  location?: string
  skills?: string[]
  stack?: string[]
  projects?: { name: string; description: string; status: string }[]
  goals?: string
  workingStyle?: string
  agencyName?: string
}

const PARSE_PROMPT = (chatgpt: string, claude: string) => `Extract structured facts about a developer from the pasted AI memory below. Return ONLY a valid JSON object, no markdown fences, no explanation, with this exact shape (omit any key you cannot find, never invent data):
{
  "name": string,
  "role": string,
  "location": string,
  "skills": string[],
  "stack": string[],
  "projects": [{ "name": string, "description": string, "status": "active"|"paused"|"shipped" }],
  "goals": string,
  "workingStyle": string,
  "agencyName": string
}

${chatgpt ? `### ChatGPT memory\n${chatgpt}\n` : ''}
${claude ? `### Claude memory\n${claude}\n` : ''}`

export async function POST(req: NextRequest) {
  try {
    await requireSessionUser()
    const { chatgpt = '', claude = '' } = (await req.json()) as { chatgpt?: string; claude?: string }

    if (!chatgpt.trim() && !claude.trim()) {
      return NextResponse.json({ error: 'No memory text provided' }, { status: 400 })
    }

    try {
      const raw = await judgeContext(PARSE_PROMPT(chatgpt.trim(), claude.trim()), true)
      let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.substring(start, end + 1)
      const parsed = JSON.parse(cleaned) as ParsedMemory
      return NextResponse.json({ parsed })
    } catch (aiError) {
      console.warn('[ONBOARDING PARSE-MEMORY] AI parse failed, returning empty result:', aiError)
      // Never block the user — they land on Step 1 with blank fields instead.
      return NextResponse.json({ parsed: {} as ParsedMemory })
    }
  } catch (error: unknown) {
    const err = error as Error
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
