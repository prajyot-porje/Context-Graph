// Operator-only setup. Applies only the checked-in additive auth migration.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import { databaseConnectionConfig } from "../lib/database-config";

const apply = process.argv.includes("--apply");
if (!process.env.SUPABASE_DATABASE_URL)
  throw new Error("Set SUPABASE_DATABASE_URL before running auth preparation.");
const pool = new pg.Pool({
  ...databaseConnectionConfig(),
  max: 1,
  connectionTimeoutMillis: 10000,
});
const client = await pool.connect().catch((error) => {
  console.error(
    JSON.stringify({
      database: "unavailable",
      code: error.code || "CONNECTION_FAILED",
    }),
  );
  process.exitCode = 1;
  return null;
});
try {
  if (!client) process.exitCode = 1;
  else {
    const prerequisites =
      await client.query(`SELECT to_regclass('public.user') IS NOT NULL AS users,
      to_regclass('public.account') IS NOT NULL AS accounts, to_regclass('public.session') IS NOT NULL AS sessions`);
    if (!Object.values(prerequisites.rows[0]).every(Boolean))
      throw new Error("AUTH_SCHEMA_MISSING");
    const protectedCounts = () =>
      client.query(`SELECT
      (SELECT count(*) FROM "user") AS users,
      (SELECT count(*) FROM account) AS accounts,
      (SELECT count(*) FROM session) AS sessions,
      (SELECT count(*) FROM context_nodes) AS nodes,
      (SELECT count(*) FROM context_entries) AS entries,
      (SELECT count(*) FROM api_keys) AS api_keys`);
    const before = (await protectedCounts()).rows[0];
    if (apply) {
      // Reviewed migration owns BEGIN/COMMIT. No older migrations or provider
      // upgrades are applied by this command.
      const sql = await readFile(
        new URL("../supabase/2026-10-31-auth-hardening.sql", import.meta.url),
        "utf8",
      );
      await client.query(
        sql.replace(
          "BEGIN;",
          "BEGIN; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='15s';",
        ),
      );
    }
    const metadata = await client.query(`SELECT c.relrowsecurity AS rls,
      has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE') AS server_access,
      EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='auth_request_limits' AND indexname='auth_request_limits_expiry') AS expiry_index,
      (SELECT count(*)::int FROM pg_policies WHERE schemaname='public' AND tablename='auth_request_limits') AS public_policy_count
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname='auth_request_limits'`);
    const state = metadata.rows[0];
    let transactionalProbe = false;
    if (apply) {
      if (
        !state?.rls ||
        !state.server_access ||
        !state.expiry_index ||
        state.public_policy_count !== 0
      )
        throw new Error("AUTH_MIGRATION_CHECK_FAILED");
      const identity = createHash("sha256").update(randomUUID()).digest("hex");
      await client.query("BEGIN");
      try {
        await client.query(
          "INSERT INTO auth_request_limits(identity,expires_at) VALUES($1,now()+interval '1 minute')",
          [identity],
        );
        const probe = await client.query(
          "UPDATE auth_request_limits SET count=count+1 WHERE identity=$1 RETURNING count",
          [identity],
        );
        transactionalProbe = probe.rows[0]?.count === 2;
        if (!transactionalProbe) throw new Error("AUTH_WRITE_PROBE_FAILED");
      } finally {
        await client.query("ROLLBACK");
      }
    }
    const after = (await protectedCounts()).rows[0];
    const report = {
      checkedAt: new Date().toISOString(),
      databaseTls: "verified",
      migration: state ? "installed" : "pending",
      appliedThisRun: apply,
      rls: state?.rls ?? false,
      serverAccess: state?.server_access ?? false,
      expiryIndex: state?.expiry_index ?? false,
      publicPolicyCount: state?.public_policy_count ?? null,
      transactionalProbe: apply ? transactionalProbe : "not_requested",
      protectedRowCountsUnchanged:
        JSON.stringify(before) === JSON.stringify(after),
      gmailUserConfigured: !!process.env.GMAIL_SMTP_USER,
      gmailAppPasswordConfigured: !!process.env.GMAIL_SMTP_APP_PASSWORD,
      googleConfigured:
        !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    };
    await mkdir(".test-output", { recursive: true });
    await writeFile(
      ".test-output/auth-readiness.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report));
    if (!state && !apply)
      console.log(
        "Dry run: migration pending. Use --apply to install the checked-in auth migration.",
      );
  }
} catch (error) {
  console.error(
    JSON.stringify({
      setup: "failed",
      reason:
        error instanceof Error && /^[A-Z_]+$/.test(error.message)
          ? error.message
          : "DATABASE_CHECK_FAILED",
    }),
  );
  process.exitCode = 1;
} finally {
  client?.release();
  await pool.end();
}
