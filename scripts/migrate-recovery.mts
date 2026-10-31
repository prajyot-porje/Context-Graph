import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { getMigrations } from "better-auth/db/migration";
// Uses explicit environment, never silently loads a developer's .env.local.
if (!process.env.SUPABASE_DATABASE_URL)
  throw new Error(
    "Set SUPABASE_DATABASE_URL explicitly before running migrations.",
  );
const { auth } = await import("../lib/auth");
const { database } = await import("../lib/database");
try {
  const migration = await getMigrations(auth.options);
  const sql = await migration.compileMigrations();
  await mkdir(".test-output", { recursive: true });
  await writeFile(".test-output/auth-upgrade.sql", sql);
  console.log(
    "Auth upgrade SQL written to .test-output/auth-upgrade.sql for review.",
  );
  if (!process.argv.includes("--apply"))
    console.log(
      "Dry run only. No migration applied. Use --apply after reviewing the SQL and backing up your database.",
    );
  else {
    await migration.runMigrations();
    await database.query(
      await readFile("supabase/2026-10-30-oauth.sql", "utf8"),
    );
    await database.query(
      await readFile("supabase/2026-10-30-demo-recovery.sql", "utf8"),
    );
    await database.query(
      await readFile("supabase/2026-10-30-legacy-uniqueness.sql", "utf8"),
    );
    await database.query(await readFile("supabase/2026-10-31-auth-hardening.sql", "utf8"));
    console.log(
      "Additive recovery migrations applied. Existing context and API keys preserved.",
    );
  }
} finally {
  await database.end();
}
