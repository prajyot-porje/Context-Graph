import { NextRequest, NextResponse } from 'next/server'
import {
  getPendingStagedEntries,
  deleteStagedEntries,
  countUserEntries,
  getUserNodes,
  appendEntry,
} from '@/lib/db'
import { judgeContext } from '@/lib/openrouter'
import { scrubSecrets } from '@/lib/utils'
import { handleRouteError } from '@/lib/api/errors'
import { VALID_KINDS, BOOTSTRAP_ENTRY_THRESHOLD, buildBatchJudgePrompt } from '@/lib/mcp-protocol'
import type { ContextEntryKind } from '@/types'

export const maxDuration = 60

// ROADMAP.md P1.4 — the other half of the two-stage save. `remember` writes to
// staged_context_entries instantly with no LLM call; this job drains that
// table in one batched judge call instead of one call per item (~10-20x
// cheaper), off the request path entirely so no chat response ever waits on it.
const BATCH_SIZE = 20

interface Judgment {
  keep: boolean
  kind: string
  entry_text: string
  target_scope: string
  score: number
}

async function processBatch() {
  const staged = await getPendingStagedEntries(BATCH_SIZE)
  if (staged.length === 0) {
    return { processed: 0, kept: 0 }
  }

  const bootstrapByUser = new Map<string, boolean>()
  for (const entry of staged) {
    if (!bootstrapByUser.has(entry.user_id)) {
      const count = await countUserEntries(entry.user_id)
      bootstrapByUser.set(entry.user_id, count < BOOTSTRAP_ENTRY_THRESHOLD)
    }
  }

  const items = staged.map(s => ({ staged: s, bootstrap: bootstrapByUser.get(s.user_id) ?? false }))
  const prompt = buildBatchJudgePrompt(items)

  let judgments: Judgment[] = []
  try {
    const response = await judgeContext(prompt, true)
    const clean = response.replace(/```json|```/g, '').trim()
    judgments = JSON.parse(clean)
  } catch (e) {
    console.error('[process-staged] Batch judgment failed, leaving batch staged for retry:', e)
    return { processed: 0, kept: 0 }
  }

  if (!Array.isArray(judgments) || judgments.length !== staged.length) {
    console.error(`[process-staged] Judgment array length mismatch (got ${judgments?.length}, expected ${staged.length}), leaving batch staged for retry`)
    return { processed: 0, kept: 0 }
  }

  const nodesByUser = new Map<string, Awaited<ReturnType<typeof getUserNodes>>>()
  let kept = 0

  for (let i = 0; i < staged.length; i++) {
    const entry = staged[i]
    const judgment = judgments[i]
    if (!judgment?.keep) continue

    if (!nodesByUser.has(entry.user_id)) {
      nodesByUser.set(entry.user_id, await getUserNodes(entry.user_id))
    }
    const nodes = nodesByUser.get(entry.user_id)!
    const targetNode = nodes.find(n => n.scope === judgment.target_scope)
      ?? nodes.find(n => n.scope === entry.scope_hint)
      ?? nodes.find(n => n.scope === 'me')

    if (!targetNode) continue

    const kind: ContextEntryKind = VALID_KINDS.includes(judgment.kind as ContextEntryKind)
      ? (judgment.kind as ContextEntryKind)
      : 'note'
    const entryText = scrubSecrets(String(judgment.entry_text ?? entry.raw_text)).slice(0, 300)
    const score = typeof judgment.score === 'number' ? Math.min(1, Math.max(0, judgment.score)) : 0.6

    await appendEntry(targetNode.id, entry.user_id, entryText, score, kind)
    kept++
  }

  await deleteStagedEntries(staged.map(s => s.id))
  return { processed: staged.length, kept }
}

async function handleProcessStaged(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processBatch()
  return NextResponse.json({ success: true, ...result })
}

export async function GET(req: NextRequest) {
  try {
    return await handleProcessStaged(req)
  } catch (error) {
    return handleRouteError(error, 'GET /api/cron/process-staged')
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleProcessStaged(req)
  } catch (error) {
    return handleRouteError(error, 'POST /api/cron/process-staged')
  }
}
