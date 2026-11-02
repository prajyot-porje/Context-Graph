// Explicit operator command: only the reviewed capture-consent migration.
// Load the intended environment before invocation. Default: verify and roll back.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { Pool } from "pg";
import type { TLSSocket } from "node:tls";
import { databaseConnectionConfig } from "../lib/database-config";

if (!process.env.SUPABASE_DATABASE_URL) throw new Error("DATABASE_REQUIRED");
const apply = process.argv.includes("--apply");
const pool = new Pool({
  ...databaseConnectionConfig(),
  max: 1,
  connectionTimeoutMillis: 10000,
});
const tables = [
  "user",
  "account",
  "session",
  "context_nodes",
  "context_entries",
  "api_keys",
  "client_connections",
] as const;
const sql = await readFile(
  new URL("../supabase/2026-11-02-capture-consent.sql", import.meta.url),
  "utf8",
);
if (!/^BEGIN;/.test(sql) || !/COMMIT;\s*$/.test(sql))
  throw new Error("UNEXPECTED_MIGRATION_BOUNDARY");
const client = await pool.connect();
let committed = false;
try {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
  await client.query("SET LOCAL lock_timeout='5s'");
  await client.query("SET LOCAL statement_timeout='45s'");
  const counts = async () => {
    const result: Record<string, number> = {};
    for (const table of tables) {
      // Identifiers come only from the constant allowlist above.
      const { rows } = await client.query<{ count: string }>(
        `SELECT count(*) AS count FROM "${table}"`,
      );
      result[table] = Number(rows[0].count);
    }
    return result;
  };
  const before = await counts();
  await client.query(sql.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
  const after = await counts();
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("ROW_COUNTS_CHANGED");
  const { rows: columns } = await client.query<{
    column_name: string;
    column_default: string | null;
    data_type: string;
  }>(
    "SELECT column_name,column_default,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='user' AND column_name IN ('capture_enabled','capture_consented_at')",
  );
  if (
    columns.find((c) => c.column_name === "capture_enabled")?.column_default !==
    "false"
  )
    throw new Error("DEFAULT_NOT_DISABLED");
  if (
    columns.find((c) => c.column_name === "capture_consented_at")?.data_type !==
    "timestamp with time zone"
  )
    throw new Error("CONSENT_COLUMN_MISSING");
  const { rows: constraints } = await client.query<{ definition: string }>(
    "SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.context_entries'::regclass AND conname='context_entries_kind_check'",
  );
  if (!constraints[0]?.definition.includes("future_idea"))
    throw new Error("FUTURE_KIND_MISSING");
  const { rows: invalid } = await client.query<{ count: string }>(
    'SELECT count(*) AS count FROM "user" WHERE capture_enabled AND capture_consented_at IS NULL',
  );
  if (Number(invalid[0].count)) throw new Error("LEGACY_CAPTURE_STILL_ENABLED");
  // Supabase's pooler terminates client TLS; pg_stat_ssl describes its separate
  // database connection. Verify our socket and certificate instead.
  const stream = (
    client as unknown as { connection: { stream: Partial<TLSSocket> } }
  ).connection.stream;
  const tlsVerified = stream.encrypted === true && stream.authorized === true;
  if (
    !tlsVerified &&
    !["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(process.env.SUPABASE_DATABASE_URL).hostname,
    )
  )
    throw new Error("TLS_REQUIRED");
  await client.query(apply ? "COMMIT" : "ROLLBACK");
  committed = apply;
  const report = {
    checkedAt: new Date().toISOString(),
    applied: apply,
    passed: true,
    migration: "2026-11-02-capture-consent.sql",
    tls: tlsVerified,
    preservedRowCounts: after,
    verified: [
      "capture_default_off",
      "consent_timestamp",
      "future_idea_constraint",
      "no_unconsented_capture",
    ],
  };
  await mkdir(".test-output", { recursive: true });
  await writeFile(
    `.test-output/capture-migration-${apply ? "applied" : "dry-run"}.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
} catch (error) {
  if (!committed) await client.query("ROLLBACK").catch(() => {});
  // Do not print database errors, URLs or credential values.
  console.error(
    JSON.stringify({
      passed: false,
      committed,
      code:
        error instanceof Error && /^[A-Z_]+$/.test(error.message)
          ? error.message
          : "CAPTURE_MIGRATION_FAILED",
    }),
  );
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
