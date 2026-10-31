// Explicit operator smoke test: real Gmail, memory-only OTPs/passwords, and a
// unique sender-owned Gmail alias. Deletes only the account this run creates.
import { ImapFlow } from "imapflow";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import pg from "pg";
import { databaseConnectionConfig } from "../lib/database-config";
import { extractTestCode } from "./mail-code";

const args = process.argv.slice(2);
const receiptOnly = args.includes("--receipt-only");
const baseIndex = args.indexOf("--base");
const base = new URL(
  baseIndex >= 0 ? args[baseIndex + 1] : "http://localhost:3000",
).origin;
const host = new URL(base).hostname;
if (
  !["localhost", "127.0.0.1"].includes(host) &&
  !/^context-graph(?:-[a-z0-9]+)?(?:-prajyots-projects-667cd1d9)?\.vercel\.app$/.test(
    host,
  )
)
  throw new Error("UNAPPROVED_SMOKE_TARGET");
const user = process.env.GMAIL_SMTP_USER?.trim();
const pass = process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s/g, "");
if (!user || !pass || !/^[^\s@]+@gmail\.com$/i.test(user))
  throw new Error("GMAIL_CONFIGURATION_REQUIRED");
const imap = new ImapFlow({
  host: "imap.gmail.com",
  port: 993,
  secure: true,
  auth: { user, pass },
  logger: false,
  disableAutoIdle: true,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  maxLiteralSize: 256 * 1024,
  maxResponseSize: 512 * 1024,
  tls: { rejectUnauthorized: true },
});
imap.on("error", () => {}); // Do not let raw protocol errors leak into operator logs.
const token = randomUUID().replace(/-/g, "");
const alias =
  `${user.split("@")[0].split("+")[0]}+cg-smoke-${token}@gmail.com`.toLowerCase();
const started = new Date();
const checks: Record<string, boolean> = {};
let phase = "CONNECT_IMAP",
  created = false,
  cleanup = true,
  accountId: string | undefined;
const pool = new pg.Pool({
  ...databaseConnectionConfig(),
  max: 1,
  connectionTimeoutMillis: 10000,
});
function requireCheck(ok: unknown, name: string): asserts ok {
  if (!ok) throw new Error(name);
  checks[name] = true;
}
async function request(path: string, body?: object, cookie?: string) {
  return fetch(`${base}${path}`, {
    method: body ? "POST" : "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(45000),
    headers: {
      Origin: base,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function readCode(recipient: string, since: Date) {
  for (let attempt = 0; attempt < 15; attempt++) {
    await imap.noop();
    const ids = await imap.search(
      { from: user, to: recipient, since },
      { uid: true },
    );
    for (const uid of (ids || []).slice(-5).reverse()) {
      const message = await imap.fetchOne(
        uid,
        { source: true, internalDate: true, envelope: true },
        { uid: true },
      );
      if (
        !message ||
        !message.source ||
        !message.envelope?.subject?.includes("ContextGraph")
      )
        continue;
      if (
        message.internalDate &&
        new Date(String(message.internalDate)).getTime() <
          since.getTime() - 3000
      )
        continue;
      const code = extractTestCode(message.source.toString("utf8"));
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("TEST_EMAIL_NOT_RECEIVED");
}
try {
  await imap.connect();
  const lock = await imap.getMailboxLock("INBOX", { readOnly: true });
  try {
    if (receiptOnly) {
      await readCode(user, new Date(Date.now() - 30 * 60 * 1000));
      checks.SMTP_TEST_RECEIVED_IN_INBOX = true;
    } else {
      phase = "SIGNUP";
      requireCheck(
        (await pool.query('SELECT id FROM "user" WHERE email=$1', [alias]))
          .rowCount === 0,
        "UNIQUE_TEST_ACCOUNT",
      );
      created = true;
      const sentAt = new Date();
      const sent = await request("/api/account/send", {
        email: alias,
        mode: "signup",
      });
      const sendCompletedAt=Date.now();
      requireCheck(sent.status === 200, "SIGNUP_CODE_REQUEST");
      const pending = await pool.query<{ id: string }>(
        'SELECT id FROM "user" WHERE email=$1',
        [alias],
      );
      requireCheck(pending.rows[0]?.id, "DEPLOYMENT_DATABASE_MATCHES");
      accountId = pending.rows[0].id;
      const otp = await readCode(alias, sentAt);
      checks.SIGNUP_CODE_RECEIVED = true;
      requireCheck(
        (
          await request("/api/account/check", {
            email: alias,
            otp: otp === "000000" ? "111111" : "000000",
          })
        ).status === 400,
        "WRONG_CODE_REJECTED",
      );
      requireCheck(
        (await request("/api/account/check", { email: alias, otp })).status ===
          200,
        "SIGNUP_CODE_VERIFIED",
      );
      let password = randomBytes(24).toString("base64url");
      requireCheck(
        (
          await request("/api/account/complete", {
            email: alias,
            otp,
            password,
          })
        ).status === 200,
        "SIGNUP_PASSWORD_SAVED",
      );
      requireCheck(
        (
          await request("/api/account/complete", {
            email: alias,
            otp,
            password,
          })
        ).status === 400,
        "REPLAY_REJECTED",
      );
      const login = await request("/api/auth/sign-in/email", {
        email: alias,
        password,
      });
      requireCheck(login.status === 200, "PASSWORD_LOGIN");
      const cookie = login.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      requireCheck(!!cookie, "SESSION_COOKIE");
      const session = await (
        await request("/api/auth/get-session", undefined, cookie)
      ).json();
      requireCheck(session?.user?.email === alias, "AUTHENTICATED_SESSION");
      requireCheck(session.user.id === accountId, "ACCOUNT_ID_MATCHES");
      console.log(
        JSON.stringify({ phase: "signup_verified", base, emailReceipt: true }),
      );
      // Respect the real recipient cooldown rather than disabling any control.
      while (Date.now() - sendCompletedAt < 62000)
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.min(20000, 62000 - (Date.now() - sendCompletedAt)),
          ),
        );
      phase = "RECOVERY";
      const recoveryAt = new Date();
      requireCheck(
        (await request("/api/account/send", { email: alias, mode: "recovery" }))
          .status === 200,
        "RECOVERY_CODE_REQUEST",
      );
      const recoveryCode = await readCode(alias, recoveryAt);
      checks.RECOVERY_CODE_RECEIVED = true;
      const replacement = randomBytes(24).toString("base64url");
      requireCheck(
        (
          await request("/api/account/complete", {
            email: alias,
            otp: recoveryCode,
            password: replacement,
          })
        ).status === 200,
        "RECOVERY_COMPLETED",
      );
      const revoked = await (
        await request("/api/auth/get-session", undefined, cookie)
      ).json();
      requireCheck(!revoked, "OLD_SESSION_REVOKED");
      requireCheck(
        (await request("/api/auth/sign-in/email", { email: alias, password }))
          .status === 401,
        "OLD_PASSWORD_REJECTED",
      );
      password = "";
      requireCheck(
        (
          await request("/api/auth/sign-in/email", {
            email: alias,
            password: replacement,
          })
        ).status === 200,
        "NEW_PASSWORD_LOGIN",
      );
    }
  } finally {
    lock.release();
  }
} catch (error) {
  checks[`${phase}_FAILED`] = false;
  const reason =
    error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
      ? error.message
      : "LIVE_AUTH_CHECK_FAILED";
  console.error(JSON.stringify({ phase, reason }));
  process.exitCode = 1;
} finally {
  if (created) {
    try {
      const deleted = await pool.query(
        'DELETE FROM "user" WHERE email=$1 AND ($2::text IS NULL OR id=$2) RETURNING id',
        [alias, accountId || null],
      );
      if (accountId && deleted.rowCount !== 1) {
        cleanup = false;
        process.exitCode = 1;
      }
    } catch {
      cleanup = false;
      process.exitCode = 1;
    }
    checks.TEST_ACCOUNT_REMOVED = cleanup;
  }
  await pool.end();
  await imap.logout().catch(() => imap.close());
  const report = {
    startedAt: started.toISOString(),
    checkedAt: new Date().toISOString(),
    base,
    receiptOnly,
    passed: process.exitCode !== 1,
    checks,
  };
  await mkdir(".test-output", { recursive: true });
  const label = receiptOnly
    ? "mailbox"
    : host === "localhost" || host === "127.0.0.1"
      ? "local"
      : "deployed";
  await writeFile(
    `.test-output/live-auth-${label}.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
}
