-- Additive recovery migration. Apply after schema.sql / existing application schema.
BEGIN;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS capture_enabled boolean NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS client_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  credential_id text NOT NULL,
  provider text NOT NULL DEFAULT 'unknown',
  client_name text NOT NULL DEFAULT 'MCP client',
  last_seen timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_before timestamptz,
  UNIQUE(user_id, credential_id)
);
CREATE TABLE IF NOT EXISTS context_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK(provider IN ('claude','chatgpt','manual','export')),
  connection_id uuid REFERENCES client_connections(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','review','committed','canceled','failed')),
  items jsonb NOT NULL DEFAULT '[]',
  input_digest text,
  revision integer NOT NULL DEFAULT 0,
  accepted integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'
);
CREATE INDEX IF NOT EXISTS context_imports_owner ON context_imports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS connections_owner ON client_connections(user_id);
ALTER TABLE client_connections ADD COLUMN IF NOT EXISTS revoked_before timestamptz;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_entries ADD COLUMN IF NOT EXISTS source_connection_id uuid REFERENCES client_connections(id) ON DELETE SET NULL;
ALTER TABLE context_entries ADD COLUMN IF NOT EXISTS import_id uuid REFERENCES context_imports(id) ON DELETE SET NULL;
ALTER TABLE context_entries ADD COLUMN IF NOT EXISTS dedupe_hash text;
ALTER TABLE context_entries ADD COLUMN IF NOT EXISTS source text;
-- New writes use per-user dedupe hashes. Preserve historic duplicates rather than deleting data.
CREATE UNIQUE INDEX IF NOT EXISTS context_entry_dedupe ON context_entries(user_id, dedupe_hash) WHERE dedupe_hash IS NOT NULL;
ALTER TABLE staged_context_entries ADD COLUMN IF NOT EXISTS source_connection_id uuid REFERENCES client_connections(id) ON DELETE SET NULL;
ALTER TABLE staged_context_entries ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'pending';
ALTER TABLE staged_context_entries ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE staged_context_entries ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE staged_context_entries ADD COLUMN IF NOT EXISTS lease_id uuid;
ALTER TABLE staged_context_entries ADD COLUMN IF NOT EXISTS error text;
CREATE TABLE IF NOT EXISTS mcp_request_limits (
  identity text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  PRIMARY KEY(identity, window_start)
);
ALTER TABLE client_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_request_limits ENABLE ROW LEVEL SECURITY;
COMMIT;
