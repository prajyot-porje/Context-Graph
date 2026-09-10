import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { createSupabaseServer } from '@/lib/supabase'
import { createEdge } from '@/lib/db'
import { judgeContext } from '@/lib/openrouter'
import { randomBytes, createHash } from 'crypto'
import type { ContextNode } from '@/types'

export const maxDuration = 60

interface Project {
  name: string
  description: string
  status: string
}

interface FinalizePayload {
  name: string
  role: string
  location?: string
  skills: string[]
  stack: string[]
  projects: Project[]
  goals: string
  workingStyle?: string
  agencyName?: string
}

interface PlannedNode {
  scope: string
  title: string
  parent_scope: string | null
  tags: string[]
  relevance: number
}

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled'

// Always available, even if the AI content call fails entirely.
function deterministicContent(node: PlannedNode, payload: FinalizePayload): string {
  const { name, role, location, skills, stack, goals, workingStyle, agencyName } = payload
  if (node.scope === 'me') {
    return `${name} is a ${role}${location ? ` based in ${location}` : ''}. Primary stack: ${stack.join(', ') || 'not specified'}. Additional skills: ${skills.join(', ') || 'not specified'}.`
  }
  if (node.scope === 'agency') {
    return `${agencyName} — a professional/freelance practice run by ${name}.`
  }
  if (node.scope === 'personal/skills') {
    return `Technical skills and stack: ${[...stack, ...skills].join(', ') || 'not specified'}.`
  }
  if (node.scope === 'personal/goals') {
    return `Current goals: ${goals || 'not specified'}.${workingStyle ? ` Preferred working style: ${workingStyle}.` : ''}`
  }
  const project = payload.projects.find(p => node.scope.endsWith('/' + slugify(p.name)))
  if (project) return `${project.name} (${project.status}): ${project.description}`
  return node.title
}

function planNodes(payload: FinalizePayload): PlannedNode[] {
  const nodes: PlannedNode[] = [
    { scope: 'me', title: 'ME', parent_scope: null, tags: [...payload.stack, ...payload.skills].slice(0, 12), relevance: 0.95 },
  ]

  const projectParentScope = payload.agencyName ? 'agency' : 'me'
  if (payload.agencyName) {
    nodes.push({ scope: 'agency', title: payload.agencyName, parent_scope: 'me', tags: ['agency'], relevance: 0.9 })
  }

  if (payload.skills.length || payload.stack.length) {
    nodes.push({ scope: 'personal/skills', title: 'Skills & Stack', parent_scope: 'me', tags: [...payload.stack, ...payload.skills].slice(0, 12), relevance: 0.9 })
  }

  for (const project of payload.projects.slice(0, 3)) {
    const scope = `${projectParentScope === 'agency' ? 'agency' : 'personal'}/${slugify(project.name)}`
    nodes.push({ scope, title: project.name, parent_scope: projectParentScope, tags: [project.status], relevance: 0.9 })
  }

  if (payload.goals) {
    nodes.push({ scope: 'personal/goals', title: 'Goals', parent_scope: 'me', tags: [], relevance: 0.9 })
  }

  return nodes
}

const CONTENT_PROMPT = (payload: FinalizePayload, scopes: string[]) => `Write content fields for a personal AI context graph. Given these facts about a developer, return ONLY a valid JSON object mapping each of the listed scopes to a dense, factual markdown paragraph (3-5 sentences, third person) meant to be read by an AI assistant before a coding session. No markdown fences, no explanation.

Facts: ${JSON.stringify(payload)}

Scopes to fill (use exactly these keys): ${JSON.stringify(scopes)}`

export async function POST(req: NextRequest) {
  const startOverall = Date.now()
  let userId = 'unknown'
  try {
    const user = await requireSessionUser()
    userId = user.id

    const payload = (await req.json()) as FinalizePayload
    const plannedNodes = planNodes(payload)
    const scopes = plannedNodes.map(n => n.scope)

    let contentMap: Record<string, string> = {}
    try {
      const raw = await judgeContext(CONTENT_PROMPT(payload, scopes), true)
      let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) cleaned = cleaned.substring(start, end + 1)
      contentMap = JSON.parse(cleaned) as Record<string, string>
    } catch (aiError) {
      console.warn(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] AI content generation failed, using deterministic fallback:`, aiError)
    }

    const supabase = createSupabaseServer()

    await supabase.from('context_edges').delete().eq('user_id', userId)
    await supabase.from('context_nodes').delete().eq('user_id', userId)

    const allInsertedNodes: ContextNode[] = []
    for (const node of plannedNodes) {
      const content = contentMap[node.scope]?.trim() || deterministicContent(node, payload)
      const { data: inserted, error: insertError } = await supabase
        .from('context_nodes')
        .insert({
          user_id: userId,
          scope: node.scope,
          title: node.title,
          content,
          tags: node.tags,
          parent_scope: node.parent_scope,
          relevance: node.relevance,
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

    for (const insertedNode of allInsertedNodes) {
      if (insertedNode.parent_scope) {
        const parentNode = allInsertedNodes.find(n => n.scope === insertedNode.parent_scope)
        if (parentNode) {
          await createEdge(supabase, userId, insertedNode.id, parentNode.id, 'part_of')
        }
      }
    }

    const rawKey = 'ctx_' + randomBytes(32).toString('base64url')
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 12)

    await supabase.from('api_keys').delete().eq('user_id', userId)
    const { error: insertKeyError } = await supabase.from('api_keys').insert({
      user_id: userId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    if (insertKeyError) throw new Error(`Failed to store API key: ${insertKeyError.message}`)

    await supabase.from('user').update({ onboarding_done: true }).eq('id', userId)

    console.log(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Success for user ${userId} (${Date.now() - startOverall}ms, ${allInsertedNodes.length} nodes)`)

    return NextResponse.json({ nodes: allInsertedNodes, apiKey: rawKey })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`[${new Date().toISOString()}] [ONBOARDING FINALIZE] Error for user ${userId} (${Date.now() - startOverall}ms):`, err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
