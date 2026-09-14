import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { Pool } from 'pg'

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL

if (!dbUrl) {
  console.error('Error: DATABASE_URL, POSTGRES_URL, or SUPABASE_DATABASE_URL environment variable must be set.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
})

const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROADMAP.md P1.5 — entries now carry a kind, so an "open_problem" can later
-- be marked "resolved" without deleting the history of what was tried.
ALTER TABLE context_entries
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'note';

ALTER TABLE context_entries
  DROP CONSTRAINT IF EXISTS context_entries_kind_check;

ALTER TABLE context_entries
  ADD CONSTRAINT context_entries_kind_check
  CHECK (kind IN ('decision', 'preference', 'constraint', 'open_problem', 'resolved', 'note'));

-- ROADMAP.md P1.4 — the \`remember\` tool writes here instantly (no LLM call on
-- the request path); a background job judges and drains this table in batches.
CREATE TABLE IF NOT EXISTS staged_context_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  raw_text    TEXT NOT NULL,
  kind_hint   TEXT,
  scope_hint  TEXT,
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staged_entries_created ON staged_context_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_staged_entries_user ON staged_context_entries(user_id);

ALTER TABLE staged_context_entries ENABLE ROW LEVEL SECURITY;

-- ROADMAP.md P2.2 (pulled forward) — MCP clients send clientInfo.name only on
-- \`initialize\`; later requests on the same key need a place to read it back
-- from, so \`source\` can be attached to entries created by any subsequent call.
ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS last_client_name TEXT;
`

async function runMigration() {
  try {
    await pool.query(sql)
    console.log('✓ Phase 1 migration complete — context_entries.kind, staged_context_entries, api_keys.last_client_name')
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
