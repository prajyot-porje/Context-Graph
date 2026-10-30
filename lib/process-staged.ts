import { claimStagedEntries, failStagedEntry, finishStagedEntry } from "./db";
import { judgeContext } from "./openrouter";
import { buildBatchJudgePrompt } from "./mcp-protocol";
import { noteSchema } from "./setup";
import { z } from "zod";

const judgmentSchema = z.array(
  z.object({
    keep: z.boolean(),
    kind: z.string(),
    entry_text: z.string().max(2000),
    target_scope: z.string(),
    score: z.number().min(0).max(1),
  }),
);
export async function processStagedBatch(): Promise<{
  processed: number;
  kept: number;
}> {
  const staged = await claimStagedEntries(20);
  if (!staged.length) return { processed: 0, kept: 0 };
  let processed = 0,
    kept = 0;
  try {
    const raw = await judgeContext(
      buildBatchJudgePrompt(
        staged.map((s) => ({ staged: s, bootstrap: false })),
      ),
      true,
    );
    const judgments = judgmentSchema.parse(
      JSON.parse(raw.replace(/```json|```/g, "").trim()),
    );
    if (judgments.length !== staged.length)
      throw new Error("Invalid judgment count");
    for (let i = 0; i < staged.length; i++) {
      const e = staged[i],
        j = judgments[i];
      const note = j.keep
        ? noteSchema.parse({
            text: e.raw_text,
            kind: e.kind_hint || "note",
            scope: e.scope_hint || "me",
          })
        : null;
      await finishStagedEntry(e, note, j.score);
      processed++;
      if (note) kept++;
    }
  } catch {
    // Keep failed writes for a bounded retry; never delete unpersisted accepted notes.
    await Promise.all(staged.map((e) => failStagedEntry(e.id, e.lease_id)));
    console.error(
      "[process-staged] Processing failed; queued notes retained for retry.",
    );
  }
  return { processed, kept };
}
export async function triggerBackgroundDrain(): Promise<void> {
  await processStagedBatch();
}
