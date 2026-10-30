// Fixed loopback test database only; intentionally does not load environment files.
import { Pool } from "pg";
import { readFile } from "node:fs/promises";
const pool = new Pool({
  connectionString:
    "postgres://postgres:isolated-test-password@127.0.0.1:55439/postgres",
});
try {
  await pool.query(
    await readFile("supabase/2026-10-30-demo-recovery.sql", "utf8"),
  );
  await pool.query(await readFile("supabase/2026-10-30-oauth.sql", "utf8"));
  console.log("Isolated migrations applied.");
} finally {
  await pool.end();
}
