import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StagedContextEntry, ContextNode } from '@/types'

const db = {
  getPendingStagedEntries: vi.fn(),
  deleteStagedEntries: vi.fn(),
  countUserEntries: vi.fn(),
  getUserNodes: vi.fn(),
  appendEntry: vi.fn(),
}
const judgeContext = vi.fn()

vi.mock('@/lib/db', () => db)
vi.mock('@/lib/openrouter', () => ({ judgeContext }))

const { processStagedBatch } = await import('./process-staged')

function makeStaged(overrides: Partial<StagedContextEntry> = {}): StagedContextEntry {
  return {
    id: 'staged-1',
    user_id: 'user-1',
    raw_text: 'Decided to use email OTP instead of passwords',
    kind_hint: null,
    scope_hint: null,
    source: 'claude-code',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeNode(overrides: Partial<ContextNode> = {}): ContextNode {
  return {
    id: 'node-1',
    user_id: 'user-1',
    scope: 'me',
    title: 'ME',
    content: '',
    relevance: 0.9,
    tags: [],
    parent_scope: null,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  db.countUserEntries.mockResolvedValue(10) // not in bootstrap mode by default
})

describe('processStagedBatch', () => {
  it('does nothing and never calls the judge when the queue is empty', async () => {
    db.getPendingStagedEntries.mockResolvedValue([])
    const result = await processStagedBatch()
    expect(result).toEqual({ processed: 0, kept: 0 })
    expect(judgeContext).not.toHaveBeenCalled()
  })

  it('leaves the batch staged for retry when the judge response is not valid JSON', async () => {
    db.getPendingStagedEntries.mockResolvedValue([makeStaged()])
    judgeContext.mockResolvedValue('not json at all')
    const result = await processStagedBatch()
    expect(result).toEqual({ processed: 0, kept: 0 })
    expect(db.deleteStagedEntries).not.toHaveBeenCalled()
  })

  it('leaves the batch staged for retry when the judgment array length does not match', async () => {
    db.getPendingStagedEntries.mockResolvedValue([makeStaged(), makeStaged({ id: 'staged-2' })])
    judgeContext.mockResolvedValue(JSON.stringify([{ keep: true, kind: 'note', entry_text: 'x', target_scope: 'me', score: 0.5 }]))
    const result = await processStagedBatch()
    expect(result).toEqual({ processed: 0, kept: 0 })
    expect(db.deleteStagedEntries).not.toHaveBeenCalled()
  })

  it('writes kept items to the matching node and always deletes the processed batch', async () => {
    db.getPendingStagedEntries.mockResolvedValue([makeStaged(), makeStaged({ id: 'staged-2', raw_text: 'one-off typo fix' })])
    db.getUserNodes.mockResolvedValue([makeNode()])
    judgeContext.mockResolvedValue(JSON.stringify([
      { keep: true, kind: 'decision', entry_text: 'Uses email OTP instead of passwords', target_scope: 'me', score: 0.8 },
      { keep: false, kind: 'note', entry_text: 'irrelevant', target_scope: 'me', score: 0.1 },
    ]))

    const result = await processStagedBatch()

    expect(result).toEqual({ processed: 2, kept: 1 })
    expect(db.appendEntry).toHaveBeenCalledTimes(1)
    expect(db.appendEntry).toHaveBeenCalledWith('node-1', 'user-1', 'Uses email OTP instead of passwords', 0.8, 'decision')
    expect(db.deleteStagedEntries).toHaveBeenCalledWith(['staged-1', 'staged-2'])
  })

  it('falls back to "note" for a kind the judge invents', async () => {
    db.getPendingStagedEntries.mockResolvedValue([makeStaged()])
    db.getUserNodes.mockResolvedValue([makeNode()])
    judgeContext.mockResolvedValue(JSON.stringify([
      { keep: true, kind: 'made_up_kind', entry_text: 'something', target_scope: 'me', score: 0.5 },
    ]))

    await processStagedBatch()

    expect(db.appendEntry).toHaveBeenCalledWith('node-1', 'user-1', 'something', 0.5, 'note')
  })

  it('skips a kept item when no matching node exists, without throwing', async () => {
    db.getPendingStagedEntries.mockResolvedValue([makeStaged({ scope_hint: 'personal/ghost-project' })])
    db.getUserNodes.mockResolvedValue([]) // user has no nodes at all
    judgeContext.mockResolvedValue(JSON.stringify([
      { keep: true, kind: 'note', entry_text: 'something', target_scope: 'personal/ghost-project', score: 0.5 },
    ]))

    const result = await processStagedBatch()

    expect(result).toEqual({ processed: 1, kept: 0 })
    expect(db.appendEntry).not.toHaveBeenCalled()
    expect(db.deleteStagedEntries).toHaveBeenCalledWith(['staged-1'])
  })
})
