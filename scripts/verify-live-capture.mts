// Operator-only release smoke test. Seeds one synthetic account, uses real HTTP
// auth/MCP and model filtering, then removes only that account. Sends no email.
import { Pool } from "pg";
import { randomUUID, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { databaseConnectionConfig } from "../lib/database-config";

const args = process.argv.slice(2),
  baseIndex = args.indexOf("--base");
if (baseIndex < 0 || !process.env.SUPABASE_DATABASE_URL)
  throw new Error("EXPLICIT_TARGET_REQUIRED");
const base = new URL(args[baseIndex + 1]).origin;
if (base !== "https://context-graph-amber.vercel.app")
  throw new Error("UNAPPROVED_SMOKE_TARGET");
const pool = new Pool({
  ...databaseConnectionConfig(),
  max: 1,
  connectionTimeoutMillis: 10000,
});
const id = `capture_release_${randomUUID()}`,
  email = `${id}@example.test`,
  password = randomBytes(32).toString("base64url");
const jar = new Map<string, string>(),
  checks: string[] = [];
let created = false,
  cleaned = false,
  phase = "SEED",
  failure = false,
  rpcId = 0;
function check(value: unknown, label: string): asserts value {
  if (!value) throw new Error(label);
  checks.push(label);
}
async function request(
  path: string,
  method = "GET",
  body?: unknown,
  bearer?: string,
) {
  const response = await fetch(base + path, {
    method,
    redirect: "manual",
    signal: AbortSignal.timeout(45000),
    headers: {
      Origin: base,
      "Content-Type": "application/json",
      ...(bearer
        ? {
            Authorization: `Bearer ${bearer}`,
            Accept: "application/json, text/event-stream",
          }
        : { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!bearer)
    for (const line of response.headers.getSetCookie()) {
      const part = line.split(";")[0],
        split = part.indexOf("=");
      jar.set(part.slice(0, split), part.slice(split + 1));
    }
  check(response.ok, `${phase}_HTTP_${response.status}`);
  return response;
}
interface Status {
  captureEnabled: boolean;
  captureConsentedAt: string | null;
  ready: boolean;
  dashboardAccessible: boolean;
}
interface Note {
  id: string;
  kind: string;
  entry_text: string;
  node_id: string;
}
interface Node {
  id: string;
  scope: string;
  parent_scope: string | null;
}
const state = async (): Promise<Status> =>
  (await request("/api/setup/status")).json();
const context = async (): Promise<{ entries: Note[]; nodes: Node[] }> =>
  (await request("/api/context")).json();
try {
  const hashed = await hashPassword(password);
  await pool.query(
    'INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt",onboarding_done,capture_enabled) VALUES($1,$2,$3,true,now(),now(),false,false)',
    [id, "Synthetic capture release check", email],
  );
  created = true;
  await pool.query(
    'INSERT INTO account(id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES($1,$2,\'credential\',$2,$3,now(),now())',
    [randomUUID(), id, hashed],
  );
  phase = "LOGIN";
  await request("/api/auth/sign-in/email", "POST", { email, password });
  phase = "CAPTURE_DEFAULT";
  const initial = await state();
  check(
    !initial.captureEnabled &&
      initial.captureConsentedAt === null &&
      !initial.dashboardAccessible,
    "DEFAULT_OFF_NO_CONSENT",
  );
  const key = (await (await request("/api/apikey", "POST", {})).json())
    .key as string;
  check(
    typeof key === "string" && key.startsWith("ctx_"),
    "SCOPED_TEST_KEY_CREATED",
  );
  async function mcp(name: string, parameters: object) {
    const response = await request(
      "/api/mcp",
      "POST",
      { jsonrpc: "2.0", id: ++rpcId, method: name, params: parameters },
      key,
    );
    const body = (await response.json()) as {
      error?: unknown;
      result?: {
        isError?: boolean;
        instructions?: string;
        content?: { text: string }[];
      };
    };
    check(
      !body.error && !!body.result && !body.result.isError,
      `${phase}_MCP_OK`,
    );
    return body.result;
  }
  const call = async (name: string, arguments_: object) =>
    (await mcp("tools/call", { name, arguments: arguments_ })).content?.[0]
      ?.text ?? "";
  const initialized = await mcp("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "ContextGraph synthetic release test", version: "1" },
  });
  check(
    initialized.instructions?.includes("without requiring a save command"),
    "DEPLOYED_AUTOMATIC_PROTOCOL",
  );
  check(
    (
      await call("remember", { text: "I love Spider-Man.", kind: "preference" })
    ).startsWith("Skipped:"),
    "UNCONSENTED_CAPTURE_REJECTED",
  );
  phase = "OPT_IN";
  const first = (await (
    await request("/api/setup/status", "PATCH", { consentCapture: true })
  ).json()) as Status;
  check(
    first.captureEnabled &&
      !!first.captureConsentedAt &&
      first.dashboardAccessible &&
      !first.ready,
    "EMPTY_ACCOUNT_OPT_IN",
  );
  check(
    (await call("get_context", {})).includes("Capture status: enabled"),
    "MCP_READS_CAPTURE_STATUS",
  );
  await request("/api/context", "POST", {
    scope: "personal/release-check",
    title: "Synthetic release project",
    content: "Synthetic release verification only.",
    parent_scope: null,
  });
  phase = "REMEMBER";
  check(
    (
      await call("remember", { text: "I love Spider-Man.", kind: "preference" })
    ).includes("Queued for processing"),
    "PREFERENCE_QUEUED",
  );
  const idea = "I might turn the release-check project into a budgeting app.";
  check(
    (
      await call("remember", {
        text: idea,
        kind: "future_idea",
        scope: "personal/release-check",
      })
    ).includes("Queued for processing"),
    "FUTURE_IDEA_QUEUED",
  );
  phase = "WAIT_FOR_FILTER";
  let saved = await context();
  for (
    let attempt = 0;
    attempt < 20 &&
    !(
      saved.entries.some((e) => e.entry_text === idea) &&
      saved.entries.some((e) => e.entry_text === "I love Spider-Man.")
    );
    attempt++
  ) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    saved = await context();
  }
  const future = saved.entries.find((e) => e.entry_text === idea),
    preference = saved.entries.find(
      (e) => e.entry_text === "I love Spider-Man.",
    );
  check(
    future?.kind === "future_idea" && !!preference,
    "REAL_MODEL_FILTER_SAVED_NOTES",
  );
  check(
    saved.nodes.find((n) => n.id === future.node_id)?.scope ===
      "personal/release-check/future-scope",
    "PROJECT_FUTURE_SCOPE",
  );
  check(
    (await call("get_context", { scope: "personal/release-check" })).includes(
      "Tentative future idea (not a decision)",
    ),
    "TENTATIVE_PROJECT_RETRIEVAL",
  );
  phase = "PAUSE_AND_RECONSENT";
  await request("/api/setup/status", "PATCH", { captureEnabled: false });
  const paused = (await (
    await request("/api/setup/status", "PATCH", { consentCapture: true })
  ).json()) as Status;
  check(
    !paused.captureEnabled &&
      paused.captureConsentedAt === first.captureConsentedAt,
    "RECONSENT_PRESERVES_PAUSE",
  );
  check(
    (
      await call("remember", {
        text: "Do not persist this synthetic paused note.",
      })
    ).startsWith("Skipped:"),
    "PAUSED_CAPTURE_REJECTED",
  );
  const resumed = (await (
    await request("/api/setup/status", "PATCH", { captureEnabled: true })
  ).json()) as Status;
  check(
    resumed.captureEnabled &&
      resumed.captureConsentedAt === first.captureConsentedAt,
    "RESUME_PRESERVES_FIRST_CONSENT",
  );
  phase = "REMOVE";
  await request(`/api/entries/${preference.id}`, "DELETE");
  check(
    !(await context()).entries.some((e) => e.id === preference.id),
    "REMOVE_PERSISTED",
  );
} catch {
  failure = true;
} finally {
  try {
    if (created) {
      await pool.query("DELETE FROM mcp_request_limits WHERE identity=$1", [
        id,
      ]);
      await pool.query('DELETE FROM "user" WHERE id=$1 AND email=$2', [
        id,
        email,
      ]);
      const remaining = await pool.query('SELECT id FROM "user" WHERE id=$1', [
        id,
      ]);
      cleaned = remaining.rowCount === 0;
    } else cleaned = true;
  } catch {
    cleaned = false;
  }
  await pool.end();
  const report = {
    base,
    checkedAt: new Date().toISOString(),
    passed: !failure && cleaned,
    phase,
    checks,
    syntheticAccountRemoved: cleaned,
  };
  await mkdir(".test-output", { recursive: true });
  await writeFile(
    ".test-output/capture-live-deployed.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
  if (!report.passed) process.exitCode = 1;
}
