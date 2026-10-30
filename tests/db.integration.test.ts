import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { testDatabase } from "./database";
import type * as Db from "../lib/db";
import { assembleContext } from "../lib/context";
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
  it('expires unsaved drafts and respects capture pause',async()=>{
    const run=await db.createImport('alice','manual');await db.submitImport('alice',run.id,[{text:'A draft that must not become active'}]);
    await fixture.database.query("UPDATE context_imports SET expires_at=now()-interval '1 second' WHERE id=$1",[run.id]);
    expect((await db.getSetupStatus('alice')).run).toBeNull();expect((await db.getImport('alice',run.id)).items).toHaveLength(0);
    await seed();await db.setCaptureEnabled('alice',false);expect((await db.stageEntry({userId:'alice',rawText:'This should not be queued while paused.'})).staged).toBe(false)
  })
  it('caps processing retries, recovers a failed queue, and retains revocation cutoffs after reconnect',async()=>{
    await seed();await db.stageEntry({userId:'alice',rawText:'A meaningful note for retry verification.'});
    for(let i=0;i<5;i++){const [entry]=await db.claimStagedEntries(1);expect(entry).toBeDefined();await db.failStagedEntry(entry.id,entry.lease_id)}
    expect((await db.getSetupStatus('alice')).failedCount).toBe(1);expect(await db.claimStagedEntries(1)).toHaveLength(0);
    await db.retryStagedEntries('alice');expect(await db.claimStagedEntries(1)).toHaveLength(1);
    const connection=await db.observeConnection('alice','oauth:reconnect','Claude',Math.floor(Date.now()/1000));await db.revokeConnection('alice',connection.id);
    await expect(db.observeConnection('alice','oauth:reconnect','Claude',1)).rejects.toThrow('revoked');
    await db.observeConnection('alice','oauth:reconnect','Claude',Math.ceil(Date.now()/1000)+1);
    await expect(db.observeConnection('alice','oauth:reconnect','Claude',1)).rejects.toThrow('revoked');
  })
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
