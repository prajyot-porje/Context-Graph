import { createHash, randomUUID } from "crypto";
import type { PoolClient } from "pg";
import { query, transaction } from "./database";
import {
  hasUsefulContext,
  normalizedNote,
  notesSchema,
  setupStep,
  type Connection,
  type ImportNote,
  type ImportRun,
  type Provider,
  type SetupStatus,
} from "./setup";
import type {
  ContextNode,
  ContextEdge,
  ContextEntry,
  ContextEntryKind,
  StagedContextEntry,
} from "@/types";

export class DataError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const one = <T>(rows: T[]) => {
  if (!rows[0])
    throw new DataError("Not found or changed. Refresh and try again.", 404);
  return rows[0];
};
async function lock(c: PoolClient, user: string) {
  await c.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE', [user]);
}
export async function getUserNodes(user: string): Promise<ContextNode[]> {
  return json(
    await query<ContextNode>(
      "SELECT * FROM context_nodes WHERE user_id=$1 ORDER BY created_at DESC",
      [user],
    ),
  );
}
export async function getUserEntries(user: string): Promise<ContextEntry[]> {
  return json(
    await query<ContextEntry>(
      "SELECT * FROM context_entries WHERE user_id=$1 ORDER BY created_at DESC",
      [user],
    ),
  );
}
export async function getNodeWithEntries(id: string, user: string) {
  const node = one(
    await query<ContextNode>(
      "SELECT * FROM context_nodes WHERE id=$1 AND user_id=$2",
      [id, user],
    ),
  );
  const entries = await query<ContextEntry>(
    "SELECT * FROM context_entries WHERE node_id=$1 AND user_id=$2 ORDER BY created_at DESC",
    [id, user],
  );
  return json({ node, entries });
}
async function edges(c: PoolClient, user: string) {
  await c.query("DELETE FROM context_edges WHERE user_id=$1", [user]);
  await c.query(
    `INSERT INTO context_edges(user_id,source_node_id,target_node_id) SELECT n.user_id,n.id,p.id FROM context_nodes n JOIN context_nodes p ON p.user_id=n.user_id AND p.scope=n.parent_scope WHERE n.user_id=$1`,
    [user],
  );
}
async function parent(
  c: PoolClient,
  user: string,
  scope: string,
  target: string | null,
) {
  const nodes = (
    await c.query<ContextNode>("SELECT * FROM context_nodes WHERE user_id=$1", [
      user,
    ])
  ).rows;
  const seen = new Set([scope]);
  let cursor = target;
  while (cursor) {
    if (seen.has(cursor))
      throw new DataError("A context cannot contain itself or its ancestors.");
    seen.add(cursor);
    const n = nodes.find((n) => n.scope === cursor);
    if (!n) throw new DataError("Parent context does not exist.");
    cursor = n.parent_scope;
  }
}
export async function createNode(
  user: string,
  data: Pick<
    ContextNode,
    "scope" | "title" | "content" | "tags" | "parent_scope"
  >,
) {
  return transaction(async (c) => {
    await lock(c, user);
    await parent(c, user, data.scope, data.parent_scope);
    const node = one(
      (
        await c.query<ContextNode>(
          "INSERT INTO context_nodes(user_id,scope,title,content,tags,parent_scope) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
          [
            user,
            data.scope,
            data.title,
            data.content,
            data.tags,
            data.parent_scope,
          ],
        )
      ).rows,
    );
    await edges(c, user);
    return json(node);
  });
}
export async function updateNode(
  id: string,
  user: string,
  data: Partial<
    Pick<
      ContextNode,
      "scope" | "title" | "content" | "tags" | "parent_scope" | "relevance"
    >
  >,
) {
  return transaction(async (c) => {
    await lock(c, user);
    const old = one(
        (
          await c.query<ContextNode>(
            "SELECT * FROM context_nodes WHERE id=$1 AND user_id=$2 FOR UPDATE",
            [id, user],
          )
        ).rows,
      ),
      n = { ...old, ...data };
    await parent(c, user, old.scope, n.parent_scope);
    const node = one(
      (
        await c.query<ContextNode>(
          "UPDATE context_nodes SET scope=$3,title=$4,content=$5,tags=$6,parent_scope=$7,relevance=$8,last_updated=now() WHERE id=$1 AND user_id=$2 RETURNING *",
          [
            id,
            user,
            n.scope,
            n.title,
            n.content,
            n.tags,
            n.parent_scope,
            n.relevance,
          ],
        )
      ).rows,
    );
    if (old.scope !== n.scope)
      await c.query(
        "UPDATE context_nodes SET parent_scope=$3 WHERE user_id=$1 AND parent_scope=$2",
        [user, old.scope, n.scope],
      );
    await parent(c, user, n.scope, n.parent_scope);
    await edges(c, user);
    return json(node);
  });
}
export async function deleteNode(id: string, user: string) {
  await transaction(async (c) => {
    await lock(c, user);
    const n = one(
      (
        await c.query<ContextNode>(
          "SELECT * FROM context_nodes WHERE id=$1 AND user_id=$2",
          [id, user],
        )
      ).rows,
    );
    await c.query(
      "UPDATE context_nodes SET parent_scope=$3 WHERE user_id=$1 AND parent_scope=$2",
      [user, n.scope, n.parent_scope],
    );
    await c.query("DELETE FROM context_nodes WHERE id=$1 AND user_id=$2", [
      id,
      user,
    ]);
    await edges(c, user);
  });
}
export async function getUserEdges(user: string): Promise<ContextEdge[]> {
  return json(
    await query<ContextEdge>(
      `SELECT n.id,n.user_id,n.id AS source_node_id,p.id AS target_node_id,'part_of' AS edge_type,n.created_at FROM context_nodes n JOIN context_nodes p ON n.user_id=p.user_id AND n.parent_scope=p.scope WHERE n.user_id=$1`,
      [user],
    ),
  );
}
async function ensureNode(c: PoolClient, user: string, scope: string) {
  await c.query(
    "INSERT INTO context_nodes(user_id,scope,title,content) VALUES($1,'me','ME','') ON CONFLICT(user_id,scope) DO NOTHING",
    [user],
  );
  if (scope !== "me") {
    const segments = scope.split("/");
    let parentScope = "me";
    for (let index = 0; index < segments.length; index++) {
      const part = segments.slice(0, index + 1).join("/");
      const title = segments[index].replace(/-/g, " ");
      await c.query(
        "INSERT INTO context_nodes(user_id,scope,title,content,parent_scope) VALUES($1,$2,$3,'',$4) ON CONFLICT(user_id,scope) DO NOTHING",
        [user, part, title, parentScope],
      );
      parentScope = part;
    }
  }
  return one(
    (
      await c.query<ContextNode>(
        "SELECT * FROM context_nodes WHERE user_id=$1 AND scope=$2",
        [user, scope],
      )
    ).rows,
  );
}
async function insertNote(
  c: PoolClient,
  user: string,
  n: ImportNote,
  connection: string | null,
  run: string | null,
  source: string,
  score = 0.8,
) {
  const node = await ensureNode(c, user, n.scope);
  const r = await c.query(
    `INSERT INTO context_entries(node_id,user_id,entry_text,kind,score,dedupe_hash,source_connection_id,import_id,source) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING RETURNING id`,
    [
      node.id,
      user,
      n.text,
      n.kind,
      score,
      hash(n.scope + "\n" + normalizedNote(n.text)),
      connection,
      run,
      source,
    ],
  );
  await c.query(
    "UPDATE context_nodes SET last_updated=now(),relevance=greatest(relevance,$3) WHERE id=$1 AND user_id=$2",
    [node.id, user, Math.min(1, score + 0.05)],
  );
  return r.rowCount === 1;
}
export async function appendEntry(
  id: string,
  user: string,
  text: string,
  score: number,
  kind: ContextEntryKind = "note",
) {
  const node = one(
    await query<ContextNode>(
      "SELECT * FROM context_nodes WHERE id=$1 AND user_id=$2",
      [id, user],
    ),
  );
  await transaction(async (c) => {
    await lock(c, user);
    await insertNote(
      c,
      user,
      notesSchema.parse([{ text, kind, scope: node.scope }])[0],
      null,
      null,
      "legacy",
      score,
    );
  });
}
export async function countUserEntries(user: string) {
  return Number(
    (
      await query<{ count: string }>(
        "SELECT count(*) FROM context_entries WHERE user_id=$1",
        [user],
      )
    )[0].count,
  );
}
export async function resolveEntry(id: string, user: string) {
  one(
    await query(
      "UPDATE context_entries SET kind='resolved' WHERE id=$1 AND user_id=$2 RETURNING id",
      [id, user],
    ),
  );
}
export async function forgetEntry(id: string, user: string) {
  one(
    await query(
      "DELETE FROM context_entries WHERE id=$1 AND user_id=$2 RETURNING id",
      [id, user],
    ),
  );
}
export interface SearchResult {
  entry: ContextEntry;
  nodeScope: string;
  nodeTitle: string;
}
export async function searchEntries(
  user: string,
  text: string,
): Promise<SearchResult[]> {
  const words = text
    .trim()
    .split(/\s+/)
    .slice(0, 12)
    .map((w) => `%${w.replace(/[\\%_]/g, "\\$&")}%`);
  const rows = await query<ContextEntry & { scope: string; title: string }>(
    `SELECT e.*,n.scope,n.title FROM context_entries e JOIN context_nodes n ON n.id=e.node_id AND n.user_id=e.user_id WHERE e.user_id=$1 AND e.entry_text ILIKE ANY($2) ORDER BY e.created_at DESC LIMIT 20`,
    [user, words],
  );
  return json(
    rows.map((r) => ({ entry: r, nodeScope: r.scope, nodeTitle: r.title })),
  );
}
export function sanitizeApiKey(raw: string) {
  if (typeof raw !== "string") return "";
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {}
  return s
    .replace(/^["']+|["']+$/g, "")
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
}
export interface ValidatedApiKey {
  userId: string;
  apiKeyId: string;
  lastClientName: string | null;
}
export async function validateApiKey(
  raw: string,
): Promise<ValidatedApiKey | null> {
  const key = sanitizeApiKey(raw);
  if (!key || /[•*]/.test(key)) return null;
  const r = (
    await query<{
      id: string;
      user_id: string;
      last_client_name: string | null;
    }>(
      "UPDATE api_keys SET last_used=now() WHERE key_hash=$1 RETURNING id,user_id,last_client_name",
      [hash(key)],
    )
  )[0];
  return r
    ? { userId: r.user_id, apiKeyId: r.id, lastClientName: r.last_client_name }
    : null;
}
export async function checkRateLimit(identity: string) {
  const r = await query<{ count: number }>(
    `INSERT INTO mcp_request_limits(identity,window_start) VALUES($1,date_trunc('hour',now())) ON CONFLICT(identity,window_start) DO UPDATE SET count=mcp_request_limits.count+1 RETURNING count`,
    [identity],
  );
  return r[0].count <= 300;
}
export async function storeApiKey(user: string, key: string, prefix: string) {
  await query(
    "INSERT INTO api_keys(user_id,key_hash,key_prefix) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET key_hash=$2,key_prefix=$3,last_used=NULL",
    [user, key, prefix],
  );
}
export async function revokeApiKey(user: string) {
  await query("DELETE FROM api_keys WHERE user_id=$1", [user]);
}
export async function getApiKeyInfo(user: string) {
  return json(
    (
      await query<{ prefix: string; last_used: string | null }>(
        "SELECT key_prefix AS prefix,last_used FROM api_keys WHERE user_id=$1",
        [user],
      )
    )[0] ?? null,
  );
}
export async function updateLastClientName(id: string, name: string) {
  await query("UPDATE api_keys SET last_client_name=$2 WHERE id=$1", [
    id,
    name.slice(0, 100),
  ]);
}
export async function markOnboardingDone(user: string) {
  await query('UPDATE "user" SET onboarding_done=true WHERE id=$1', [user]);
}
export interface AccountStatus {
  exists: boolean;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
}
export async function getAccountStatus(email: string): Promise<AccountStatus> {
  const u = (
    await query<{ id: string; emailVerified: boolean }>(
      'SELECT id,"emailVerified" FROM "user" WHERE lower(email)=$1',
      [email.trim().toLowerCase()],
    )
  )[0];
  if (!u)
    return {
      exists: false,
      emailVerified: false,
      hasPassword: false,
      hasGoogle: false,
    };
  const a = await query<{ providerId: string; password: string | null }>(
    'SELECT "providerId",password FROM account WHERE "userId"=$1',
    [u.id],
  );
  return {
    exists: true,
    emailVerified: u.emailVerified,
    hasPassword: a.some((a) => !!a.password),
    hasGoogle: a.some((a) => a.providerId === "google"),
  };
}
export async function decayRelevanceScores() {
  await query(
    "UPDATE context_nodes SET relevance=greatest(0.1,relevance*0.92) WHERE last_updated<now()-interval '30 days'",
  );
}

export async function observeConnection(
  user: string,
  credential: string,
  name: string,
  issuedAt?: number,
) {
  return transaction(async (c) => {
    await lock(c, user);
    const old = (
      await c.query<Connection & { revoked_before: string | null }>(
        "SELECT * FROM client_connections WHERE user_id=$1 AND credential_id=$2",
        [user, credential],
      )
    ).rows[0];
    const cutoff = old?.revoked_before ?? old?.revoked_at;
    if (cutoff && (!issuedAt || issuedAt * 1000 <= new Date(cutoff).getTime()))
      throw new DataError(
        "Connection revoked. Create a new authorization.",
        401,
      );
    return json(
      one(
        (
          await c.query<Connection>(
            `INSERT INTO client_connections(user_id,credential_id,client_name,provider) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,credential_id) DO UPDATE SET last_seen=now(),revoked_at=NULL,client_name=CASE WHEN $3 IN ('OAuth client','API-key client') THEN client_connections.client_name ELSE $3 END,provider=CASE WHEN $4='unknown' THEN client_connections.provider ELSE $4 END RETURNING *`,
            [
              user,
              credential,
              name.slice(0, 100),
              /claude/i.test(name)
                ? "claude"
                : /chatgpt|openai/i.test(name)
                  ? "chatgpt"
                  : "unknown",
            ],
          )
        ).rows,
      ),
    );
  });
}
export async function getSetupStatus(user: string): Promise<SetupStatus> {
  await query(
    "UPDATE context_imports SET status='canceled',items='[]',error='Import expired. Start again.' WHERE user_id=$1 AND expires_at<now() AND status IN ('waiting','review','failed')",
    [user],
  );
  const [nodes, total, connections, runs, users, counts] = await Promise.all([
    getUserNodes(user),
    countUserEntries(user),
    query<Connection>(
      "SELECT id,provider,client_name,last_seen,revoked_at FROM client_connections WHERE user_id=$1 ORDER BY last_seen DESC",
      [user],
    ),
    query<ImportRun>(
      "SELECT * FROM context_imports WHERE user_id=$1 AND status IN ('waiting','review','failed') AND expires_at>now() ORDER BY created_at DESC LIMIT 1",
      [user],
    ),
    query<{ capture_enabled: boolean }>(
      'SELECT capture_enabled FROM "user" WHERE id=$1',
      [user],
    ),
    query<{ pending: string; failed: string }>(
      "SELECT count(*) FILTER(WHERE state!='failed') AS pending,count(*) FILTER(WHERE state='failed') AS failed FROM staged_context_entries WHERE user_id=$1",
      [user],
    ),
  ]);
  const ready = hasUsefulContext(
      nodes.map((n) => n.content),
      total,
    ),
    run = runs[0] ?? null;
  return json({
    ready,
    run,
    connections,
    step: setupStep(ready, run, connections),
    captureEnabled: users[0]?.capture_enabled ?? false,
    pendingCount: Number(counts[0].pending),
    failedCount: Number(counts[0].failed),
  });
}
export async function createImport(user: string, provider: Provider) {
  return transaction(async (c) => {
    await lock(c, user);
    const old = (
      await c.query<ImportRun>(
        "SELECT * FROM context_imports WHERE user_id=$1 AND provider=$2 AND status IN ('waiting','review') AND expires_at>now() ORDER BY created_at DESC LIMIT 1",
        [user, provider],
      )
    ).rows[0];
    return json(
      old ??
        one(
          (
            await c.query<ImportRun>(
              "INSERT INTO context_imports(user_id,provider) VALUES($1,$2) RETURNING *",
              [user, provider],
            )
          ).rows,
        ),
    );
  });
}
export async function getImport(user: string, id: string) {
  return json(
    one(
      await query<ImportRun>(
        "SELECT * FROM context_imports WHERE id=$1 AND user_id=$2",
        [id, user],
      ),
    ),
  );
}
export async function submitImport(
  user: string,
  id: string,
  input: unknown,
  connection: string | null = null,
) {
  const items = notesSchema
      .parse(input)
      .map((n) => ({ ...n, id: randomUUID() })),
    digest = hash(
      JSON.stringify(
        items.map(({ text, kind, scope }) => ({ text, kind, scope })),
      ),
    );
  return transaction(async (c) => {
    await lock(c, user);
    const run = one(
      (
        await c.query<ImportRun & { input_digest: string }>(
          "SELECT * FROM context_imports WHERE user_id=$1 AND id=$2 FOR UPDATE",
          [user, id],
        )
      ).rows,
    );
    if (
      run.input_digest === digest &&
      ["review", "committed"].includes(run.status)
    )
      return json(run);
    if (run.status !== "waiting" || new Date(run.expires_at) < new Date())
      throw new DataError("Import is closed. Start a new import.", 409);
    if (connection)
      one(
        (
          await c.query(
            "SELECT id FROM client_connections WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL",
            [connection, user],
          )
        ).rows,
      );
    return json(
      one(
        (
          await c.query<ImportRun>(
            "UPDATE context_imports SET items=$3,status='review',connection_id=$4,input_digest=$5,revision=revision+1 WHERE id=$1 AND user_id=$2 RETURNING *",
            [id, user, JSON.stringify(items), connection, digest],
          )
        ).rows,
      ),
    );
  });
}
export async function reviewImport(
  user: string,
  id: string,
  input: unknown,
  revision: number,
) {
  const items = notesSchema.parse(input);
  return json(
    one(
      await query<ImportRun>(
        "UPDATE context_imports SET items=$3,revision=revision+1 WHERE id=$1 AND user_id=$2 AND status='review' AND revision=$4 AND expires_at>now() RETURNING *",
        [id, user, JSON.stringify(items), revision],
      ),
    ),
  );
}
export async function commitImport(user: string, id: string, revision: number) {
  return transaction(async (c) => {
    await lock(c, user);
    const run = one(
      (
        await c.query<ImportRun>(
          "SELECT * FROM context_imports WHERE id=$1 AND user_id=$2 FOR UPDATE",
          [id, user],
        )
      ).rows,
    );
    if (run.status === "committed") return json(run);
    if (
      run.status !== "review" ||
      run.revision !== revision ||
      new Date(run.expires_at) < new Date()
    )
      throw new DataError(
        "Import changed or expired. Refresh your review.",
        409,
      );
    const selected = notesSchema.parse(run.items).filter((n) => n.selected);
    if (!selected.length)
      throw new DataError(
        "Select at least one note, or create your own context.",
      );
    let accepted = 0;
    for (const n of selected)
      if (await insertNote(c, user, n, run.connection_id, id, run.provider))
        accepted++;
    await edges(c, user);
    return json(
      one(
        (
          await c.query<ImportRun>(
            "UPDATE context_imports SET status='committed',accepted=$3,skipped=$4,items='[]' WHERE id=$1 AND user_id=$2 RETURNING *",
            [id, user, accepted, selected.length - accepted],
          )
        ).rows,
      ),
    );
  });
}
export async function cancelImport(user: string, id: string) {
  one(
    await query(
      "UPDATE context_imports SET status='canceled',items='[]' WHERE id=$1 AND user_id=$2 AND status!='committed' RETURNING id",
      [id, user],
    ),
  );
}
export async function revokeConnection(user: string, id: string) {
  await transaction(async (c) => {
    await lock(c, user);
    const connection = one(
      (
        await c.query<{ credential_id: string }>(
          "UPDATE client_connections SET revoked_at=now(),revoked_before=now() WHERE user_id=$1 AND id=$2 RETURNING credential_id",
          [user, id],
        )
      ).rows,
    );
    if (connection.credential_id.startsWith("oauth:")) {
      const client = connection.credential_id.slice(6);
      for (const table of [
        "oauthRefreshToken",
        "oauthAccessToken",
        "oauthConsent",
      ])
        await c.query(
          `DELETE FROM "${table}" WHERE "userId"=$1 AND "clientId"=$2`,
          [user, client],
        );
    }
  });
}
export async function isOAuthSessionActive(
  user: string,
  client: string,
  session: string,
) {
  return (
    (
      await query(
        `SELECT s.id FROM session s JOIN "oauthClient" c ON c."clientId"=$2 WHERE s."userId"=$1 AND s.id=$3 AND s."expiresAt">now() AND COALESCE(c.disabled,false)=false`,
        [user, client, session],
      )
    ).length === 1
  );
}
export async function setCaptureEnabled(user: string, value: boolean) {
  await query('UPDATE "user" SET capture_enabled=$2 WHERE id=$1', [
    user,
    value,
  ]);
}
export async function stageEntry(p: {
  userId: string;
  rawText: string;
  kindHint?: string;
  scopeHint?: string;
  source?: string | null;
  connectionId?: string;
}) {
  const text = p.rawText.trim();
  if (text.length < 10) return { staged: false, reason: "too short" };
  const state = await getSetupStatus(p.userId);
  if (!state.ready)
    return { staged: false, reason: "Complete the reviewed setup first." };
  if (!state.captureEnabled)
    return { staged: false, reason: "Automatic capture is paused." };
  return transaction(async (c) => {
    await lock(c, p.userId);
    const dup = await c.query(
      "SELECT id FROM staged_context_entries WHERE user_id=$1 AND raw_text=$2 UNION ALL SELECT id FROM context_entries WHERE user_id=$1 AND lower(regexp_replace(entry_text,'\\s+',' ','g'))=$3 LIMIT 1",
      [p.userId, text, normalizedNote(text)],
    );
    if (dup.rows.length)
      return { staged: false, reason: "already saved or queued" };
    await c.query(
      "INSERT INTO staged_context_entries(user_id,raw_text,kind_hint,scope_hint,source,source_connection_id) VALUES($1,$2,$3,$4,$5,$6)",
      [
        p.userId,
        text,
        p.kindHint ?? "note",
        p.scopeHint ?? "me",
        p.source ?? null,
        p.connectionId ?? null,
      ],
    );
    return { staged: true };
  });
}
export async function claimStagedEntries(limit: number) {
  return json(
    await query<
      StagedContextEntry & {
        lease_id: string;
        source_connection_id: string | null;
      }
    >(
      `WITH pending AS(SELECT id FROM staged_context_entries WHERE attempts<5 AND(state='pending' OR(state='processing' AND lease_until<now())) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $1) UPDATE staged_context_entries SET state='processing',lease_until=now()+interval '2 minutes',lease_id=gen_random_uuid(),attempts=attempts+1 WHERE id IN(SELECT id FROM pending) RETURNING *`,
      [limit],
    ),
  );
}
export async function finishStagedEntry(
  e: StagedContextEntry & {
    lease_id: string;
    source_connection_id: string | null;
  },
  note: ImportNote | null,
  score: number,
) {
  await transaction(async (c) => {
    await lock(c, e.user_id);
    const owned = await c.query(
      "SELECT id FROM staged_context_entries WHERE id=$1 AND user_id=$2 AND lease_id=$3 FOR UPDATE",
      [e.id, e.user_id, e.lease_id],
    );
    if (!owned.rows.length) return;
    if (note)
      await insertNote(
        c,
        e.user_id,
        note,
        e.source_connection_id,
        null,
        e.source ?? "MCP",
        score,
      );
    await edges(c, e.user_id);
    await c.query(
      "DELETE FROM staged_context_entries WHERE id=$1 AND user_id=$2 AND lease_id=$3",
      [e.id, e.user_id, e.lease_id],
    );
  });
}
export async function failStagedEntry(id: string, lease: string) {
  await query(
    "UPDATE staged_context_entries SET state=CASE WHEN attempts>=5 THEN 'failed' ELSE 'pending' END,error='Processing failed; retry available.',lease_until=NULL WHERE id=$1 AND lease_id=$2",
    [id, lease],
  );
}
export async function retryStagedEntries(user: string) {
  await query(
    "UPDATE staged_context_entries SET state='pending',attempts=0,error=NULL WHERE user_id=$1 AND state='failed'",
    [user],
  );
}
export async function cleanupExpiredData() {
  await query(
    "UPDATE context_imports SET items='[]',status='canceled' WHERE expires_at<now() AND status IN ('waiting','review','failed')",
  );
  await query(
    "DELETE FROM mcp_request_limits WHERE window_start<now()-interval '2 days'",
  );
  await query(
    "DELETE FROM rate_limits WHERE window_start<now()-interval '2 days'",
  );
}
