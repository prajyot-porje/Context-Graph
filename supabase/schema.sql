-- ContextGraph — schema snapshot
-- Added 2026-09-05. See ARCHITECTURE.md §4 and §8 for context.
--
-- This is a SNAPSHOT of the live schema, reconstructed from types/index.ts's
-- Database type plus the two migrations that DO exist as scripts
-- (scripts/migrate.ts → rate_limits, scripts/migrate-edges.ts → context_edges).
-- The original CREATE TABLE statements for context_nodes, context_entries,
-- and api_keys were never checked in anywhere — they were run by hand against
-- the live Supabase project at some point before this snapshot existed.
-- Verify column defaults/constraints against the live project before trusting
-- this file as gospel. Going forward: add a new dated .sql file for each
-- schema change instead of editing this one silently, and log the change in
-- ARCHITECTURE.md.
--
-- Better Auth owns `user`, `session`, `account`, `verification` — those are
-- created/migrated by Better Auth itself, not listed here. This repo adds a
-- custom `onboarding_done boolean default false` column to `user`.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── context_nodes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS context_nodes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  scope         TEXT NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  relevance     NUMERIC NOT NULL DEFAULT 1.0 CHECK (relevance >= 0 AND relevance <= 1),
  tags          TEXT[] NOT NULL DEFAULT '{}',
  parent_scope  TEXT,
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scope)
);

CREATE INDEX IF NOT EXISTS idx_context_nodes_user ON context_nodes(user_id);

-- ── context_entries ─────────────────────────────────────────────────────────
-- `kind` added 2026-09-12 (ROADMAP.md P1.5, scripts/migrate-phase1.ts): lets an
-- `open_problem` entry later become `resolved` without deleting the history of
-- what was tried. Default 'note' covers entries written before this column existed.
CREATE TABLE IF NOT EXISTS context_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id     UUID NOT NULL REFERENCES context_nodes(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  entry_text  TEXT NOT NULL,
  score       NUMERIC NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 1),
  kind        TEXT NOT NULL DEFAULT 'note'
              CHECK (kind IN ('decision', 'preference', 'constraint', 'open_problem', 'resolved', 'note')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_entries_node ON context_entries(node_id);
CREATE INDEX IF NOT EXISTS idx_context_entries_user ON context_entries(user_id);

-- ── staged_context_entries ──────────────────────────────────────────────────
-- Added 2026-09-12 (ROADMAP.md P1.4, scripts/migrate-phase1.ts). The `remember`
-- MCP tool writes here synchronously with no LLM call — a background job
-- (app/api/cron/process-staged/route.ts) batches and judges rows from this
-- table, writing the kept ones into context_entries and deleting all
-- processed rows (kept or dropped) so this table never grows unbounded.
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

-- ── context_edges (added after the two tables above; see ARCHITECTURE.md log, 2026-06) ──
CREATE TABLE IF NOT EXISTS context_edges (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  source_node_id   UUID NOT NULL REFERENCES context_nodes(id) ON DELETE CASCADE,
  target_node_id   UUID NOT NULL REFERENCES context_nodes(id) ON DELETE CASCADE,
  edge_type        TEXT NOT NULL DEFAULT 'part_of',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_node_id, target_node_id)
);

CREATE INDEX IF NOT EXISTS idx_context_edges_user ON context_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_context_edges_source ON context_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_context_edges_target ON context_edges(target_node_id);

-- ── api_keys ─────────────────────────────────────────────────────────────────
-- `last_client_name` added 2026-09-12 (ROADMAP.md P2.2, pulled forward into
-- phase 1, scripts/migrate-phase1.ts): MCP clients only send `clientInfo.name`
-- on the `initialize` call. Persisting it here lets a later `remember` call on
-- the same key (which arrives without clientInfo) still be tagged with a source.
CREATE TABLE IF NOT EXISTS api_keys (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  key_hash          TEXT NOT NULL UNIQUE,
  key_prefix        TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used         TIMESTAMPTZ,
  last_client_name  TEXT
);

-- ── rate_limits (scaffolded, not yet enforced anywhere — see ARCHITECTURE.md §8) ──
CREATE TABLE IF NOT EXISTS rate_limits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id      UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start    TIMESTAMPTZ NOT NULL,
  request_count   INTEGER NOT NULL DEFAULT 1,
  UNIQUE (api_key_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_window ON rate_limits(api_key_id, window_start);

-- ── Realtime ────────────────────────────────────────────────────────────────
-- context_nodes, context_entries, and context_edges are replicated for
-- Supabase Realtime (used by components/providers/GraphProvider.tsx).
ALTER TABLE context_nodes REPLICA IDENTITY FULL;
ALTER TABLE context_entries REPLICA IDENTITY FULL;
ALTER TABLE context_edges REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'context_nodes') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE context_nodes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'context_entries') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE context_entries';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'context_edges') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE context_edges';
  END IF;
END $$;

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Verified 2026-09-12 against the live project: RLS is ENABLED on all four
-- tables below with zero policies attached, which means the anon key (public,
-- shipped in the browser bundle) can read and write nothing. Confirmed via
-- PostgREST: anon-key requests return `[]`, not a permission error — the
-- signature of "RLS on, no policies", not "RLS off, no grants" (that would 401).
--
-- This was already true live but was NOT reflected in this checked-in file or
-- in ARCHITECTURE.md, which both said "no RLS exists" — a real doc/reality
-- drift. Adding the explicit ENABLE statements here so the checked-in schema
-- matches the live project, and so this protection survives a fresh project
-- setup instead of depending on someone having clicked a toggle once.
--
-- The app still never relies on RLS for authorization — every read/write is
-- filtered by user_id in lib/db.ts using the service-role key server-side,
-- which bypasses RLS entirely. RLS here is a second, independent backstop
-- against the anon key specifically. If a policy is ever added (e.g. to let
-- the browser realtime subscription read filtered rows directly), write it
-- here and log the decision in ARCHITECTURE.md, since it changes the trust
-- model described there.

ALTER TABLE context_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE staged_context_entries ENABLE ROW LEVEL SECURITY;
