import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  claimStagedEntries: vi.fn(),
  finishStagedEntry: vi.fn(),
  failStagedEntry: vi.fn(),
  judgeContext: vi.fn(),
}));
vi.mock("./db", () => mocks);
vi.mock("./openrouter", () => ({ judgeContext: mocks.judgeContext }));
import { processStagedBatch } from "./process-staged";
beforeEach(() => vi.resetAllMocks());
const entry = {
  id: "staged-1",
  user_id: "user-1",
  raw_text: "We chose PostgreSQL for project storage.",
  kind_hint: "decision",
  scope_hint: "me",
  source: "Claude",
  lease_id: "lease",
  source_connection_id: null,
};
describe("background processing", () => {
  it("discards rejected candidates and preserves a tentative idea despite contradictory model rewrites", async () => {
    const rejected = {
      ...entry,
      id: "rejected",
      raw_text: "What is Spider-Man?",
      kind_hint: "note",
    };
    const idea = {
      ...entry,
      id: "idea",
      raw_text: "I might turn Project X into a budgeting app.",
      kind_hint: "future_idea",
      scope_hint: "personal/project-x/future-scope",
    };
    mocks.claimStagedEntries.mockResolvedValue([rejected, idea]);
    mocks.judgeContext.mockResolvedValue(
      JSON.stringify([
        {
          keep: false,
          kind: "preference",
          entry_text: "untrusted rewrite",
          target_scope: "me",
          score: 0,
        },
        {
          keep: true,
          kind: "decision",
          entry_text: "Project X will definitely change.",
          target_scope: "personal/wrong",
          score: 0.8,
        },
      ]),
    );
    expect(await processStagedBatch()).toEqual({ processed: 2, kept: 1 });
    expect(mocks.finishStagedEntry).toHaveBeenNthCalledWith(
      1,
      rejected,
      null,
      0,
    );
    expect(mocks.finishStagedEntry).toHaveBeenNthCalledWith(
      2,
      idea,
      expect.objectContaining({
        text: idea.raw_text,
        kind: "future_idea",
        scope: idea.scope_hint,
      }),
      0.8,
    );
  });
  it("does not call a model for an empty queue", async () => {
    mocks.claimStagedEntries.mockResolvedValue([]);
    expect(await processStagedBatch()).toEqual({ processed: 0, kept: 0 });
    expect(mocks.judgeContext).not.toHaveBeenCalled();
  });
  it("retains every leased item when model output is malformed", async () => {
    mocks.claimStagedEntries.mockResolvedValue([entry]);
    mocks.judgeContext.mockResolvedValue("invalid");
    await processStagedBatch();
    expect(mocks.failStagedEntry).toHaveBeenCalledWith(entry.id, "lease");
    expect(mocks.finishStagedEntry).not.toHaveBeenCalled();
  });
  it("preserves approved text and source instead of trusting model rewrites", async () => {
    mocks.claimStagedEntries.mockResolvedValue([entry]);
    mocks.judgeContext.mockResolvedValue(
      JSON.stringify([
        {
          keep: true,
          kind: "decision",
          entry_text: "fabricated model rewrite",
          target_scope: "me",
          score: 0.8,
        },
      ]),
    );
    expect(await processStagedBatch()).toEqual({ processed: 1, kept: 1 });
    expect(mocks.finishStagedEntry).toHaveBeenCalledWith(
      entry,
      expect.objectContaining({ text: entry.raw_text }),
      0.8,
    );
  });
  it("retains work when persistence fails", async () => {
    mocks.claimStagedEntries.mockResolvedValue([entry]);
    mocks.judgeContext.mockResolvedValue(
      JSON.stringify([
        {
          keep: true,
          kind: "decision",
          entry_text: "x",
          target_scope: "me",
          score: 0.8,
        },
      ]),
    );
    mocks.finishStagedEntry.mockRejectedValue(new Error("offline"));
    await processStagedBatch();
    expect(mocks.failStagedEntry).toHaveBeenCalledWith(entry.id, "lease");
  });
});
