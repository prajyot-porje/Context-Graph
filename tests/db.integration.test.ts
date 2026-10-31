import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { testDatabase } from "./database";
import type * as Db from "../lib/db";
import { assembleContext } from "../lib/context";
import { readFile } from "node:fs/promises";
let fixture: Awaited<ReturnType<typeof testDatabase>>, db: typeof Db;
beforeAll(async () => {
  fixture = await testDatabase();
  db = await import("../lib/db");
}, 120000);
afterAll(async () => {
  await fixture?.stop();
}, 30000);
beforeEach(async () => {
  await fixture.database.query('DELETE FROM "user"');
  for (const id of ["alice", "bob"])
    await fixture.database.query(
      'INSERT INTO "user"(id,name,email,"emailVerified",onboarding_done) VALUES($1,$1,$2,true,false)',
      [id, `${id}@example.test`],
    );
});
async function seed(text = "Prefers concise technical answers.") {
  const run = await db.createImport("alice", "manual");
  const draft = await db.submitImport("alice", run.id, [
    { text, kind: "preference" },
  ]);
  return db.commitImport("alice", run.id, draft.revision);
}
describe("real PostgreSQL memory lifecycle", () => {
  it("upgrades legacy schemas without scope/key-owner uniqueness before using upserts", async () => {
    await fixture.database.query(
      "ALTER TABLE context_nodes DROP CONSTRAINT IF EXISTS context_nodes_user_id_scope_key",
    );
    await fixture.database.query(
      "ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_key",
    );
    await fixture.database.query(
      "DROP INDEX IF EXISTS context_nodes_user_id_scope_key",
    );
    await fixture.database.query("DROP INDEX IF EXISTS api_keys_user_id_key");
    const migration = await readFile(
      "supabase/2026-10-30-legacy-uniqueness.sql",
      "utf8",
    );
    await fixture.database.query(migration);
    await fixture.database.query(migration);
    await seed();
    await db.storeApiKey("alice", "first-hash", "ctx_first");
    await db.storeApiKey("alice", "replacement-hash", "ctx_second");
    expect((await db.getApiKeyInfo("alice"))?.prefix).toBe("ctx_second");
    expect(await db.countUserEntries("alice")).toBe(1);
  });
  it("expires unsaved drafts and respects capture pause", async () => {
    const run = await db.createImport("alice", "manual");
    await db.submitImport("alice", run.id, [
      { text: "A draft that must not become active" },
    ]);
    await fixture.database.query(
      "UPDATE context_imports SET expires_at=now()-interval '1 second' WHERE id=$1",
      [run.id],
    );
    expect((await db.getSetupStatus("alice")).run).toBeNull();
    expect((await db.getImport("alice", run.id)).items).toHaveLength(0);
    await seed();
    await db.setCaptureEnabled("alice", false);
    expect(
      (
        await db.stageEntry({
          userId: "alice",
          rawText: "This should not be queued while paused.",
        })
      ).staged,
    ).toBe(false);
  });
  it("caps processing retries, recovers a failed queue, and retains revocation cutoffs after reconnect", async () => {
    await seed();
    await db.stageEntry({
      userId: "alice",
      rawText: "A meaningful note for retry verification.",
    });
    for (let i = 0; i < 5; i++) {
      const [entry] = await db.claimStagedEntries(1);
      expect(entry).toBeDefined();
      await db.failStagedEntry(entry.id, entry.lease_id);
    }
    expect((await db.getSetupStatus("alice")).failedCount).toBe(1);
    expect(await db.claimStagedEntries(1)).toHaveLength(0);
    await db.retryStagedEntries("alice");
    expect(await db.claimStagedEntries(1)).toHaveLength(1);
    const connection = await db.observeConnection(
      "alice",
      "oauth:reconnect",
      "Claude",
      Math.floor(Date.now() / 1000),
    );
    await db.revokeConnection("alice", connection.id);
    await expect(
      db.observeConnection("alice", "oauth:reconnect", "Claude", 1),
    ).rejects.toThrow("revoked");
    await db.observeConnection(
      "alice",
      "oauth:reconnect",
      "Claude",
      Math.ceil(Date.now() / 1000) + 1,
    );
    await expect(
      db.observeConnection("alice", "oauth:reconnect", "Claude", 1),
    ).rejects.toThrow("revoked");
  });
  it("does not unlock for handshake or draft; reviewed notes unlock an empty account", async () => {
    expect((await db.getSetupStatus("alice")).ready).toBe(false);
    await db.observeConnection("alice", "oauth:claude", "Claude");
    const run = await db.createImport("alice", "claude"),
      draft = await db.submitImport("alice", run.id, [
        { text: "Uses Next.js for personal projects." },
      ]);
    expect((await db.getSetupStatus("alice")).ready).toBe(false);
    await db.commitImport("alice", run.id, draft.revision);
    expect((await db.getSetupStatus("alice")).ready).toBe(true);
    expect(
      assembleContext(
        await db.getUserNodes("alice"),
        "me",
        4000,
        await db.getUserEntries("alice"),
      ),
    ).toContain("Uses Next.js");
  });
  it("makes duplicate commits and imports idempotent and preserves the key", async () => {
    await db.storeApiKey("alice", "hash", "ctx_prefix");
    const receipt = await seed();
    await db.commitImport("alice", receipt.id, 0);
    const second = await seed();
    expect(second.accepted).toBe(0);
    expect(second.skipped).toBe(1);
    expect(await db.countUserEntries("alice")).toBe(1);
    expect((await db.getApiKeyInfo("alice"))?.prefix).toBe("ctx_prefix");
  });
  it("blocks cross-user access and stale review commits", async () => {
    const run = await db.createImport("alice", "manual"),
      draft = await db.submitImport("alice", run.id, [
        { text: "A private preference" },
      ]);
    await expect(db.getImport("bob", run.id)).rejects.toThrow();
    const edited = await db.reviewImport(
      "alice",
      run.id,
      draft.items.map((n) => ({ ...n, text: "Corrected private preference" })),
      draft.revision,
    );
    await expect(
      db.commitImport("alice", run.id, draft.revision),
    ).rejects.toThrow("changed");
    await db.commitImport("alice", run.id, edited.revision);
    expect(await db.countUserEntries("bob")).toBe(0);
  });
  it("rolls back all notes if any item cannot be persisted", async () => {
    const run = await db.createImport("alice", "manual"),
      draft = await db.submitImport("alice", run.id, [
        { text: "First note" },
        { text: "Second note" },
      ]);
    await fixture.database.query(
      `CREATE FUNCTION fail_second() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entry_text='Second note' THEN RAISE EXCEPTION 'fixture failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_failure BEFORE INSERT ON context_entries FOR EACH ROW EXECUTE FUNCTION fail_second()`,
    );
    try {
      await expect(
        db.commitImport("alice", run.id, draft.revision),
      ).rejects.toThrow();
      expect(await db.countUserEntries("alice")).toBe(0);
      expect((await db.getImport("alice", run.id)).status).toBe("review");
    } finally {
      await fixture.database.query(
        "DROP TRIGGER test_failure ON context_entries; DROP FUNCTION fail_second()",
      );
    }
  });
  it("serializes simultaneous commits and repairs derived hierarchy on parent changes", async () => {
    const run = await db.createImport("alice", "manual"),
      draft = await db.submitImport("alice", run.id, [
        { text: "Concurrent note" },
      ]);
    await Promise.all([
      db.commitImport("alice", run.id, draft.revision),
      db.commitImport("alice", run.id, draft.revision),
    ]);
    expect(await db.countUserEntries("alice")).toBe(1);
    const n = await db.createNode("alice", {
      scope: "personal/project",
      title: "Project",
      content: "",
      tags: [],
      parent_scope: "me",
    });
    await db.updateNode(n.id, "alice", { parent_scope: null });
    expect(await db.getUserEdges("alice")).toHaveLength(0);
    await expect(
      db.updateNode(n.id, "alice", { parent_scope: "personal/project" }),
    ).rejects.toThrow("itself");
  });
  it("claims work once, preserves source, and removes forgotten/resolved notes from context", async () => {
    await seed();
    const connection = await db.observeConnection(
      "alice",
      "oauth:test",
      "Claude",
    );
    await db.stageEntry({
      userId: "alice",
      rawText: "Authentication is still broken after multiple attempts.",
      kindHint: "open_problem",
      connectionId: connection.id,
      source: "Claude",
    });
    const [a, b] = await Promise.all([
      db.claimStagedEntries(20),
      db.claimStagedEntries(20),
    ]);
    expect(a.length + b.length).toBe(1);
    const e = [...a, ...b][0];
    await db.finishStagedEntry(
      e,
      { text: e.raw_text, kind: "open_problem", scope: "me", selected: true },
      0.9,
    );
    const entries = await db.getUserEntries("alice"),
      saved = entries.find((n) => n.kind === "open_problem")!;
    expect(saved.source).toBe("Claude");
    await db.resolveEntry(saved.id, "alice");
    expect(
      assembleContext(
        await db.getUserNodes("alice"),
        "me",
        4000,
        await db.getUserEntries("alice"),
      ),
    ).not.toContain("Authentication is still broken");
    await db.forgetEntry(saved.id, "alice");
    expect(
      (await db.getUserEntries("alice")).some((n) => n.id === saved.id),
    ).toBe(false);
  });
});

describe("connection import recovery and settings boundaries", () => {
  it("keeps provider attempts alive and resolves only a same-owner same-provider replacement", async () => {
    const chat = await db.createImport("alice", "chatgpt");
    const claude = await db.createImport("alice", "claude");
    expect((await db.createImport("alice", "chatgpt")).id).toBe(chat.id);
    expect((await db.getSetupStatus("alice", chat.id)).run?.id).toBe(chat.id);
    const draft = await db.submitImport("alice", chat.id, [
      { text: "An approved fact survives visiting another provider." },
    ]);
    expect(draft.status).toBe("review");
    expect((await db.getImport("alice", claude.id)).status).toBe("waiting");
    await db.cancelImport("alice", chat.id);
    expect((await db.getSetupImport("alice", chat.id)).status).toBe("canceled");
    const replacement = await db.createImport("alice", "chatgpt");
    expect((await db.getSetupImport("alice", chat.id)).id).toBe(replacement.id);
    expect((await db.getImport("alice", chat.id)).status).toBe("canceled");
    await expect(
      db.submitImport("alice", chat.id, [
        { text: "A discarded attempt stays closed." },
      ]),
    ).rejects.toThrow("closed");
    await expect(db.getSetupImport("bob", chat.id)).rejects.toThrow();
    const received = await db.submitImport("alice", replacement.id, [
      { text: "A second approved import." },
    ]);
    await db.commitImport("alice", replacement.id, received.revision);
    expect((await db.getSetupImport("alice", replacement.id)).status).toBe(
      "committed",
    );
    const next = await db.createImport("alice", "chatgpt");
    expect((await db.getSetupImport("alice", replacement.id)).id).toBe(next.id);
    expect((await db.getImport("alice", replacement.id)).status).toBe(
      "committed",
    );
  });
  it("exports only the owner's saved content and never credentials or unsaved drafts", async () => {
    await seed("An exported approved preference.");
    await db.storeApiKey("alice", "private-key-hash", "ctx_private");
    const unsaved = await db.createImport("alice", "export");
    await db.submitImport("alice", unsaved.id, [
      { text: "Not yet approved for the graph." },
    ]);
    const other = await db.createImport("bob", "manual");
    const draft = await db.submitImport("bob", other.id, [
      { text: "Another owner's private fact." },
    ]);
    await db.commitImport("bob", other.id, draft.revision);
    const data = await db.exportUserContext("alice");
    const serialized = JSON.stringify(data);
    expect(data.nodes).toHaveLength(1);
    expect(data.notes).toHaveLength(1);
    expect(serialized).toContain("An exported approved preference.");
    expect(serialized).not.toContain("private-key-hash");
    expect(serialized).not.toContain("ctx_private");
    expect(serialized).not.toContain("Another owner's");
    expect(serialized).not.toContain("Not yet approved");
    expect(await db.discardUserDrafts("alice")).toBe(1);
    expect((await db.getImport("alice", unsaved.id)).status).toBe("canceled");
    expect(await db.countUserEntries("alice")).toBe(1);
    expect(await db.countUserEntries("bob")).toBe(1);
  });
  it("updates only the owner's profile and keeps session tokens on the server", async () => {
    await db.updateUserProfile("alice", "Alice Updated", "/avatars/orbit.svg");
    expect((await db.getUserProfile("alice")).name).toBe("Alice Updated");
    expect((await db.getUserProfile("bob")).name).toBe("bob");
    await fixture.database.query(
      `INSERT INTO session(id,token,"userId","expiresAt","createdAt","updatedAt") VALUES($1,$2,$3,now()+interval '1 day',now(),now())`,
      ["owned-session", "private-session-token", "alice"],
    );
    expect(await db.getOwnedSessionToken("alice", "owned-session")).toBe(
      "private-session-token",
    );
    await expect(
      db.getOwnedSessionToken("bob", "owned-session"),
    ).rejects.toThrow();
  });
});
