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

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(api_key_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_window
  ON rate_limits(api_key_id, window_start);

-- Enable full replica identity for real-time change capture
ALTER TABLE context_nodes REPLICA IDENTITY FULL;
ALTER TABLE context_entries REPLICA IDENTITY FULL;

-- Safely add tables to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'context_nodes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE context_nodes';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'context_entries'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE context_entries';
  END IF;
END $$;
`

async function runMigration() {
  try {
    await pool.query(sql)
    console.log('✓ Migration complete — rate_limits created, real-time enabled')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
