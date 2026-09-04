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
CREATE TABLE IF NOT EXISTS context_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id     UUID NOT NULL REFERENCES context_nodes(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  entry_text  TEXT NOT NULL,
  score       NUMERIC NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_entries_node ON context_entries(node_id);
CREATE INDEX IF NOT EXISTS idx_context_entries_user ON context_entries(user_id);

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
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  key_hash    TEXT NOT NULL UNIQUE,
  key_prefix  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used   TIMESTAMPTZ
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
-- No RLS policies exist today (see ARCHITECTURE.md §4, §8). The app never
-- relies on RLS — every read/write is filtered by user_id in lib/db.ts using
-- the service-role key server-side. The browser realtime subscription uses
-- the anon key; if RLS is ever added, write the policies here and log the
-- decision in ARCHITECTURE.md, since it changes the trust model described there.
