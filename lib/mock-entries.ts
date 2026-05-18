export interface MockEntry {
  id: string
  entry_text: string
  score: number
  created_at: string
}

export const mockEntries: Record<string, MockEntry[]> = {
  '1': [  // ME node
    { id: 'e1', entry_text: 'Decided to skip Phase 2 and go directly to SaaS build', score: 0.9, created_at: '2026-05-08' },
    { id: 'e2', entry_text: 'Accent color set to #b3ec13 (electric lime)', score: 0.7, created_at: '2026-05-07' },
    { id: 'e3', entry_text: 'Using Better Auth instead of Clerk for resume value', score: 0.85, created_at: '2026-05-06' },
  ],
  '2': [  // Dev Studio
    { id: 'e4', entry_text: 'Dev Studio remains solo — Chaitanya is commission-based only', score: 0.8, created_at: '2026-04-20' },
    { id: 'e5', entry_text: 'Services list: Web Dev, SEO/AEO, AI integrations', score: 0.75, created_at: '2026-04-15' },
  ],
  '5': [  // ContextGraph
    { id: 'e6', entry_text: 'MCP server successfully connected to Claude.ai and Claude desktop', score: 0.95, created_at: '2026-05-10' },
    { id: 'e7', entry_text: 'Switched from Railway to Cloudflare Workers for MCP hosting', score: 0.88, created_at: '2026-05-14' },
    { id: 'e8', entry_text: 'Phase 1 complete — GitHub storage + Railway deployment working', score: 0.9, created_at: '2026-05-08' },
  ],
}
