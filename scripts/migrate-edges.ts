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

-- Create edges table
CREATE TABLE IF NOT EXISTS context_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES context_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES context_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'part_of',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_node_id, target_node_id)
);

CREATE INDEX IF NOT EXISTS idx_context_edges_user
  ON context_edges(user_id);

CREATE INDEX IF NOT EXISTS idx_context_edges_source
  ON context_edges(source_node_id);

CREATE INDEX IF NOT EXISTS idx_context_edges_target
  ON context_edges(target_node_id);

-- Backfill edges from existing parent_scope relationships
INSERT INTO context_edges (user_id, source_node_id, target_node_id, edge_type)
SELECT
  child.user_id,
  child.id AS source_node_id,
  parent.id AS target_node_id,
  'part_of'
FROM context_nodes child
JOIN context_nodes parent
  ON child.user_id = parent.user_id
  AND child.parent_scope = parent.scope
WHERE child.parent_scope IS NOT NULL
ON CONFLICT (source_node_id, target_node_id) DO NOTHING;

-- Enable real-time on edges table
ALTER TABLE context_edges REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'context_edges'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE context_edges';
  END IF;
END $$;
`

async function runMigration() {
  try {
    await pool.query(sql)
    console.log('✓ Edge migration complete')
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
