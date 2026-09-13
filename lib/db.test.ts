import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sanitizeApiKey } from './db'

describe('sanitizeApiKey', () => {
  it('strips a Bearer prefix', () => {
    expect(sanitizeApiKey('Bearer ctx_abc123')).toBe('ctx_abc123')
  })

  it('strips wrapping quotes', () => {
    expect(sanitizeApiKey('"ctx_abc123"')).toBe('ctx_abc123')
    expect(sanitizeApiKey("'ctx_abc123'")).toBe('ctx_abc123')
  })

  it('strips quotes around a Bearer-prefixed key', () => {
    expect(sanitizeApiKey('"Bearer ctx_abc123"')).toBe('ctx_abc123')
  })

  it('decodes a URL-encoded key', () => {
    expect(sanitizeApiKey('ctx_abc%20123')).toBe('ctx_abc 123')
  })

  it('trims whitespace', () => {
    expect(sanitizeApiKey('  ctx_abc123  ')).toBe('ctx_abc123')
  })

  it('returns empty string for non-string input', () => {
    // @ts-expect-error deliberately passing a bad type to check the guard
    expect(sanitizeApiKey(null)).toBe('')
  })
})

// ── Mocked tests below: a minimal fake Supabase query builder ───────────────
// Every chain method (.select/.eq/.insert/...) returns the same object, which
// resolves to the next entry in `queue` when awaited — regardless of which
// methods were called. This verifies the *branching logic* in lib/db.ts (what
// happens on duplicate / over-limit / error), not the exact query shape sent
// to Supabase. Push results in the same order the function under test makes
// its calls.
const queue: Array<{ data?: unknown; error?: unknown }> = []

function nextChainable() {
  const result = queue.shift() ?? { data: null, error: null }
  const chain: Record<string, unknown> = {}
  const passthrough = ['select', 'eq', 'gt', 'lt', 'order', 'limit', 'insert', 'update', 'delete', 'in', 'ilike', 'maybeSingle', 'single']
  for (const method of passthrough) {
    chain[method] = () => chain
  }
  chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject)
  return chain
}

vi.mock('@/lib/supabase', () => ({
  createSupabaseServer: () => ({
    from: () => nextChainable(),
  }),
}))

const { checkRateLimit, stageEntry, resolveEntry, forgetEntry } = await import('./db')

beforeEach(() => {
  queue.length = 0
})

describe('checkRateLimit', () => {
  it('allows the first request in a new window', async () => {
    queue.push({ data: null, error: null }) // select: no existing window row
    queue.push({ data: null, error: null }) // insert
    expect(await checkRateLimit('key-1')).toBe(true)
  })

  it('allows a request under the hourly threshold', async () => {
    queue.push({ data: { id: 'rl-1', request_count: 10 }, error: null }) // select: well under 300
    queue.push({ data: null, error: null }) // update
    expect(await checkRateLimit('key-1')).toBe(true)
  })

  it('blocks once the hourly threshold is reached', async () => {
    queue.push({ data: { id: 'rl-1', request_count: 300 }, error: null }) // select: at the cap
    expect(await checkRateLimit('key-1')).toBe(false)
  })
})

describe('stageEntry', () => {
  it('rejects text that is too short, without touching the database', async () => {
    const result = await stageEntry({ userId: 'u1', rawText: 'ok' })
    expect(result).toEqual({ staged: false, reason: 'too short' })
    expect(queue.length).toBe(0) // untouched — proves the DB was never called
  })

  it('skips a duplicate already sitting in the staging queue', async () => {
    queue.push({ data: { id: 'staged-1' }, error: null }) // pending-duplicate check: found
    const result = await stageEntry({ userId: 'u1', rawText: 'a real decision was made here' })
    expect(result).toEqual({ staged: false, reason: 'already queued' })
  })

  it('skips text already saved to context_entries in the last 24h', async () => {
    queue.push({ data: null, error: null }) // pending-duplicate check: none
    queue.push({ data: { id: 'entry-1' }, error: null }) // recent-entry check: found
    const result = await stageEntry({ userId: 'u1', rawText: 'a real decision was made here' })
    expect(result).toEqual({ staged: false, reason: 'already saved recently' })
  })

  it('stages genuinely new text', async () => {
    queue.push({ data: null, error: null }) // pending-duplicate check: none
    queue.push({ data: null, error: null }) // recent-entry check: none
    queue.push({ data: null, error: null }) // insert
    const result = await stageEntry({ userId: 'u1', rawText: 'a real decision was made here' })
    expect(result).toEqual({ staged: true })
  })
})

describe('resolveEntry / forgetEntry', () => {
  it('resolveEntry succeeds when the update reports no error', async () => {
    queue.push({ data: null, error: null })
    await expect(resolveEntry('entry-1', 'user-1')).resolves.toBeUndefined()
  })

  it('resolveEntry throws when the update reports an error', async () => {
    queue.push({ data: null, error: { message: 'boom' } })
    await expect(resolveEntry('entry-1', 'user-1')).rejects.toThrow('boom')
  })

  it('forgetEntry succeeds when the delete reports no error', async () => {
    queue.push({ data: null, error: null })
    await expect(forgetEntry('entry-1', 'user-1')).resolves.toBeUndefined()
  })

  it('forgetEntry throws when the delete reports an error', async () => {
    queue.push({ data: null, error: { message: 'boom' } })
    await expect(forgetEntry('entry-1', 'user-1')).rejects.toThrow('boom')
  })
})
