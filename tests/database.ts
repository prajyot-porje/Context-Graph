import EmbeddedPostgres from "embedded-postgres";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export async function testDatabase(port = 55440) {
  const dir = await mkdtemp(join(tmpdir(), "contextgraph-unit-"));
  const postgres = new EmbeddedPostgres({
    databaseDir: dir,
    port,
    user: "postgres",
    password: "test-only",
    persistent: false,
    initdbFlags: ["--encoding=UTF8"],
    onLog: () => {},
    onError: console.error,
  });
  await postgres.initialise();
  await postgres.start();
  Object.assign(process.env, {
    SUPABASE_DATABASE_URL: `postgres://postgres:test-only@127.0.0.1:${port}/postgres`,
    DATABASE_SSL: "false",
    BETTER_AUTH_SECRET: "test-secret-long-enough-for-the-auth-library",
    BETTER_AUTH_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  });
  const { auth } = await import("../lib/auth");
  const { getMigrations } = await import("better-auth/db/migration");
  const { database } = await import("../lib/database");
  await (await getMigrations(auth.options)).runMigrations();
  const base = (await readFile("supabase/schema.sql", "utf8")).replace(
    /-- ── Realtime[\s\S]*?-- ── Row Level Security/,
    "-- ── Row Level Security",
  );
  await database.query(base);
  await database.query(
    await readFile("supabase/2026-10-30-demo-recovery.sql", "utf8"),
  );
  await database.query(await readFile("supabase/2026-10-30-oauth.sql", "utf8"));
  return {
    database,
    async stop() {
      await database.end();
      await postgres.stop();
    },
  };
}
