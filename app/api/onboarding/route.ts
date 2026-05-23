import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { generateContextGraph } from '@/lib/openrouter'
import { createNode, markOnboardingDone, storeApiKey } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'
import { randomBytes, createHash } from 'crypto'

export const maxDuration = 60 // Extend Vercel runtime to avoid timeout during AI generation

type GeneratedContextNode = {
  scope: string
  title: string
  content: string
  tags?: string[]
  parent_scope: string | null
}

type GeneratedContextGraph = {
  nodes: GeneratedContextNode[]
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser()

    if (user.onboarding_done) {
      return NextResponse.json({ error: 'Already onboarded' }, { status: 400 })
    }

    const answers = await req.json()

    // Generate context nodes via OpenRouter
    let generatedJson: string
    try {
      generatedJson = await generateContextGraph(answers)
    } catch (e) {
      console.error('OpenRouter generation error:', e)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    // Parse JSON — strip markdown fences if present
    let parsed: GeneratedContextGraph
    try {
      const clean = generatedJson.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch (e) {
      console.error('Failed to parse AI JSON response:', generatedJson, e)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Write all nodes to Supabase
    const createdNodes = []
    for (const node of parsed.nodes) {
      try {
        const created = await createNode(user.id, {
          scope: node.scope,
          title: node.title,
          content: node.content,
          tags: node.tags ?? [],
          parent_scope: node.parent_scope,
        })
        createdNodes.push(created)
      } catch (e) {
        console.error('Failed to create node:', node.scope, e)
      }
    }

    // Generate API key for this user
    const rawKey = `ctx_${randomBytes(24).toString('base64url')}`
    const hash = createHash('sha256').update(rawKey).digest('hex')
    const prefix = rawKey.slice(0, 12)
    await storeApiKey(user.id, hash, prefix)

    // Mark onboarding complete
    await markOnboardingDone(user.id)

    return NextResponse.json({
      success: true,
      nodeCount: createdNodes.length,
      apiKey: rawKey,  // returned ONCE to the user
      prefix,
    })
  } catch (error) {
    return handleRouteError(error, 'POST /api/onboarding')
  }
}
