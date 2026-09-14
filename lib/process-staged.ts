import { getPendingStagedEntries, deleteStagedEntries, countUserEntries, getUserNodes, appendEntry } from '@/lib/db'
import { judgeContext } from '@/lib/openrouter'
import { scrubSecrets } from '@/lib/utils'
import { VALID_KINDS, BOOTSTRAP_ENTRY_THRESHOLD, buildBatchJudgePrompt } from '@/lib/mcp-protocol'
import type { ContextEntryKind } from '@/types'

// ROADMAP.md P1.4 — the other half of the two-stage save. `remember` writes to
// staged_context_entries instantly with no LLM call; this drains that table in
// one batched judge call instead of one call per item (~10-20x cheaper).
//
// Triggered two ways (see ARCHITECTURE.md §6, log 2026-09-13):
// 1. Primary: fired via Next.js `after()` from the `remember` and `get_context`
//    MCP handlers — runs after the response is already sent, so it never adds
//    latency to a chat reply, and it drains on real usage instead of a clock.
// 2. Safety net: a daily Vercel cron (`app/api/cron/process-staged`), because
//    Vercel Hobby plan cron jobs cannot run more than once/day — a
//    `*/5 * * * *` schedule fails deployment outright on that plan. The cron
//    only exists to catch entries from a user who staged something and never
//    triggered another MCP call again.
const BATCH_SIZE = 20

interface Judgment {
  keep: boolean
  kind: string
  entry_text: string
  target_scope: string
  score: number
}

export interface ProcessStagedResult {
  processed: number
  kept: number
}

export async function processStagedBatch(): Promise<ProcessStagedResult> {
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

// Fire-and-forget wrapper for use inside Next.js `after()` — callers already
// run this outside the request/response cycle, so a thrown error here would
// only ever surface as an unhandled rejection in server logs, never to a user.
export function triggerBackgroundDrain(): void {
  processStagedBatch().catch(e => console.error('[process-staged] Background drain failed:', e))
}
