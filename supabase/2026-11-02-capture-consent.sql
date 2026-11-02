BEGIN;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS capture_consented_at timestamptz;
ALTER TABLE "user" ALTER COLUMN capture_enabled SET DEFAULT false;
-- Legacy default-enabled values are not evidence of an explicit opt-in.
UPDATE "user" SET capture_enabled=false WHERE capture_consented_at IS NULL;
ALTER TABLE context_entries DROP CONSTRAINT IF EXISTS context_entries_kind_check;
ALTER TABLE context_entries ADD CONSTRAINT context_entries_kind_check
  CHECK (kind IN ('decision','preference','constraint','open_problem','future_idea','resolved','note'));
COMMIT;
