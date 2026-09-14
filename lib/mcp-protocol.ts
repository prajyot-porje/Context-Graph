import type { ContextEntryKind, StagedContextEntry } from '@/types'

export const VALID_KINDS: ContextEntryKind[] = ['decision', 'preference', 'constraint', 'open_problem', 'resolved', 'note']

// ROADMAP.md P1.1/P1.2/P1.3 — the standing rule that gets a model to call
// `remember` on its own. Kept short: tool descriptions cost tokens on every
// request. Repeated in three places (initialize.instructions, each tool's own
// description, and get_context's reply) because client support for
// `instructions` is inconsistent — whichever slot a given client actually
// reads, the rule still lands.
export const MEMORY_PROTOCOL = `ContextGraph gives you persistent memory across AI tools and sessions. Rules:
1. Call get_context at the very start of a session, before anything else.
2. Call remember(text, kind) immediately whenever the user decides something, states a preference or constraint, or gets stuck on an unresolved problem. Don't wait for the session to end. When in doubt, call it — you do not judge importance, the server does.
3. If get_context comes back empty or nearly empty, or the user says "initialize contextgraph": state what you already know about this user (from your own memory, or from project files like package.json, README, CLAUDE.md, git remote/user if you're in a repo) and call remember for each fact.`

export function buildGetContextReply(assembled: string, nodeCount: number, entryCount: number): string {
  const isNew = nodeCount === 0 || entryCount < 3
  const bootstrapNote = isNew
    ? `\n\n---\nThis ContextGraph looks new or nearly empty. State what you already know about this user right now — from your own memory, or from the project you're sitting in (package.json, README, CLAUDE.md, git remote/user) — and call remember for each distinct fact.`
    : ''
  return `${assembled}\n\n---\n${MEMORY_PROTOCOL}${bootstrapNote}`
}

// ROADMAP.md P1.6 — while a user's graph is still small, keep almost
// everything so it fills in one conversation instead of ten.
export const BOOTSTRAP_ENTRY_THRESHOLD = 5

export function buildBatchJudgePrompt(items: Array<{ staged: StagedContextEntry; bootstrap: boolean }>): string {
  const list = items.map((item, i) => {
    const { staged, bootstrap } = item
    return `${i + 1}. (bootstrap_mode: ${bootstrap}, kind_hint: ${staged.kind_hint ?? 'none'}, scope_hint: ${staged.scope_hint ?? 'none'}) ${staged.raw_text}`
  }).join('\n')

  return `You are ContextGraph's memory filter. Below are ${items.length} raw notes captured automatically during AI sessions. For each, decide whether it is worth keeping permanently.

Keep it if the user would be annoyed to have to explain it again: a decision, a preference, a constraint, or something still broken after real effort (mark this kind as "open_problem").
Do not keep: one-off bug fixes with no lasting decision, factual questions, rewrites/formatting/translation, anything routine.
If bootstrap_mode is true for an item, be lenient — this user's graph is still new, so keep it unless it is truly meaningless ("ok thanks", etc).

Items:
${list}

Return ONLY a JSON array, no markdown, exactly ${items.length} objects in the same order as the items:
[{"keep": boolean, "kind": "decision"|"preference"|"constraint"|"open_problem"|"note", "entry_text": "cleaned one-line version, max 25 words", "target_scope": "best-guess scope, e.g. me", "score": 0.0 to 1.0}]`
}
