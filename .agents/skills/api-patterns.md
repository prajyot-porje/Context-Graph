# ContextGraph API Patterns

## Rules
- Every private route authorizes with Better Auth before touching data.
- MCP routes authorize with API keys, not Better Auth sessions.
- Validate request bodies and params explicitly.
- Return typed JSON responses with appropriate status codes.
- Do not leak stack traces in production responses.

## Recommended Structure
Split auth, validation, and data access into helpers so route handlers stay thin.

```ts
// /app/api/resource/route.ts
import { NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { getResource } from '@/lib/data/resource'

export async function GET() {
  try {
    const user = await requireSessionUser()
    const data = await getResource(user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return handleRouteError(error, 'GET /api/resource')
  }
}
```

## Error Handling Pattern
```ts
import { NextResponse } from 'next/server'

export function handleRouteError(error: unknown, label: string) {
  console.error(`[${label}]`, error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

## Session-Protected Context Route
```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionUser } from '@/lib/auth/server'
import { createNode, getUserNodes } from '@/lib/data/context'
import { handleRouteError } from '@/lib/api/errors'

const createNodeSchema = z.object({
  scope: z.string().min(1),
  title: z.string().min(1),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  parent_scope: z.string().nullable().default(null),
})

export async function GET() {
  try {
    const user = await requireSessionUser()
    const nodes = await getUserNodes(user.id)
    return NextResponse.json({ nodes })
  } catch (error) {
    return handleRouteError(error, 'GET /api/context')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const input = createNodeSchema.parse(await req.json())
    const node = await createNode(user.id, input)
    return NextResponse.json({ node }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'POST /api/context')
  }
}
```

## MCP Route Pattern
```ts
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/data/api-keys'
import { handleRouteError } from '@/lib/api/errors'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, x-api-key',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'x-api-key header required' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    const userId = await validateApiKey(apiKey)
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    // Continue MCP handling with the resolved userId.
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS })
  } catch (error) {
    return handleRouteError(error, 'POST /api/mcp')
  }
}
```

## Onboarding Route Pattern
```ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { requireSessionUser } from '@/lib/auth/server'
import { createNode } from '@/lib/data/context'
import { markOnboardingDone } from '@/lib/data/users'
import { handleRouteError } from '@/lib/api/errors'

const onboardingSchema = z.object({
  identity: z.string().min(1),
  skills: z.string().min(1),
  projects: z.string().min(1),
  goals: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const input = onboardingSchema.parse(await req.json())

    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const response = await client.chat.completions.create({
      model: 'google/gemma-4-31b-it:free',
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: buildOnboardingPrompt(input),
        },
      ],
    })

    const generatedNodes = parseGeneratedNodes(response.choices[0].message.content ?? '')

    for (const node of generatedNodes) {
      await createNode(user.id, node)
    }

    await markOnboardingDone(user.id)

    return NextResponse.json({ success: true, nodeCount: generatedNodes.length })
  } catch (error) {
    return handleRouteError(error, 'POST /api/onboarding')
  }
}
```

## API Key Route Pattern
```ts
import { NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { createApiKey, revokeApiKey } from '@/lib/data/api-keys'
import { handleRouteError } from '@/lib/api/errors'

export async function POST() {
  try {
    const user = await requireSessionUser()
    const result = await createApiKey(user.id)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'POST /api/apikey')
  }
}

export async function DELETE() {
  try {
    const user = await requireSessionUser()
    await revokeApiKey(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/apikey')
  }
}
```

## Cron Route Pattern
```ts
import { NextRequest, NextResponse } from 'next/server'
import { decayRelevanceScores } from '@/lib/data/context'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await decayRelevanceScores()
  return NextResponse.json({ success: true })
}
```

## Notes
- Keep route handlers thin.
- Put parsing and authorization near the top.
- Put Supabase queries in `/lib/data/*`.
- Prefer one route file per resource and one data module per domain.
