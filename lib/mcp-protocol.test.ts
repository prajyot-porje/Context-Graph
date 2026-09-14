import { describe, it, expect } from 'vitest'
import { buildGetContextReply, buildBatchJudgePrompt, MEMORY_PROTOCOL } from './mcp-protocol'
import type { StagedContextEntry } from '@/types'

describe('buildGetContextReply', () => {
  it('always includes the standing memory protocol', () => {
    const reply = buildGetContextReply('# ME\n\nSome content', 5, 10)
    expect(reply).toContain(MEMORY_PROTOCOL)
  })

  it('adds the bootstrap note when there are no nodes at all', () => {
    const reply = buildGetContextReply('No context found for this scope.', 0, 0)
    expect(reply).toContain('looks new or nearly empty')
  })

  it('adds the bootstrap note when nodes exist but entries are still sparse', () => {
    const reply = buildGetContextReply('# ME\n\nJust the me node', 1, 2)
    expect(reply).toContain('looks new or nearly empty')
  })

  it('omits the bootstrap note once the graph has enough entries', () => {
    const reply = buildGetContextReply('# ME\n\nRich content', 4, 12)
    expect(reply).not.toContain('looks new or nearly empty')
  })

  it('preserves the assembled context verbatim ahead of the protocol text', () => {
    const reply = buildGetContextReply('# ME\n\nUnique marker XYZ', 3, 10)
    expect(reply.startsWith('# ME\n\nUnique marker XYZ')).toBe(true)
  })
})

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

describe('buildBatchJudgePrompt', () => {
  it('includes every item, numbered, in order', () => {
    const items = [
      { staged: makeStaged({ raw_text: 'first note' }), bootstrap: false },
      { staged: makeStaged({ raw_text: 'second note' }), bootstrap: false },
    ]
    const prompt = buildBatchJudgePrompt(items)
    expect(prompt).toContain('1. (bootstrap_mode: false')
    expect(prompt).toContain('first note')
    expect(prompt).toContain('2. (bootstrap_mode: false')
    expect(prompt).toContain('second note')
  })

  it('flags bootstrap_mode per item', () => {
    const items = [{ staged: makeStaged(), bootstrap: true }]
    const prompt = buildBatchJudgePrompt(items)
    expect(prompt).toContain('bootstrap_mode: true')
  })

  it('asks for an array of exactly the input length', () => {
    const items = [1, 2, 3].map(() => ({ staged: makeStaged(), bootstrap: false }))
    const prompt = buildBatchJudgePrompt(items)
    expect(prompt).toContain('exactly 3 objects')
  })

  it('surfaces kind_hint and scope_hint when present', () => {
    const items = [{ staged: makeStaged({ kind_hint: 'decision', scope_hint: 'personal/foo' }), bootstrap: false }]
    const prompt = buildBatchJudgePrompt(items)
    expect(prompt).toContain('kind_hint: decision')
    expect(prompt).toContain('scope_hint: personal/foo')
  })
})
