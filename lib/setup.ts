import { z } from "zod";
import { scrubSecrets } from "./utils";

export const kinds = [
  "decision",
  "preference",
  "constraint",
  "open_problem",
  "resolved",
  "note",
] as const;
export const providerSchema = z.enum(["claude", "chatgpt", "manual", "export"]);
export const noteSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().trim().min(1).max(2000).transform(scrubSecrets),
  kind: z.enum(kinds).default("note"),
  scope: z
    .string()
    .regex(/^(me|agency|personal)(\/[a-z0-9-]+)*$/)
    .max(120)
    .default("me"),
  selected: z.boolean().default(true),
});
export const notesSchema = z.array(noteSchema).min(1).max(100);
export type ImportNote = z.infer<typeof noteSchema>;
export type Provider = z.infer<typeof providerSchema>;
export interface Connection {
  id: string;
  provider: string;
  client_name: string;
  last_seen: string;
  revoked_at: string | null;
}
export interface ImportRun {
  id: string;
  provider: Provider;
  connection_id: string | null;
  status: "waiting" | "review" | "committed" | "canceled" | "failed";
  items: ImportNote[];
  revision: number;
  accepted: number;
  skipped: number;
  error: string | null;
  created_at: string;
  expires_at: string;
}
export interface SetupStatus {
  ready: boolean;
  step: "choose" | "connect" | "import" | "review" | "ready";
  connections: Connection[];
  run: ImportRun | null;
  captureEnabled: boolean;
  pendingCount: number;
  failedCount: number;
}
export function normalizedNote(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
export function hasUsefulContext(contents: string[], entryCount: number) {
  return entryCount > 0 || contents.some((text) => text.trim().length > 0);
}
export function setupStep(
  ready: boolean,
  run: ImportRun | null,
  connections: Connection[],
): SetupStatus["step"] {
  if (run?.status === "review") return "review";
  if (run?.status === "waiting")
    return connections.some((c) => !c.revoked_at) ? "import" : "connect";
  return ready ? "ready" : "choose";
}
export function setupPrompt(runId: string) {
  return `Set up ContextGraph. Call contextgraph_setup with attempt_id "${runId}" first. Prepare concise notes from facts actually available to you about me: preferences, stack, active projects, decisions, constraints, and unresolved problems. Do not invent missing facts, include secrets, or claim access to all saved memories or chat history. Show the exact notes and ask my permission before sending anything. Let me correct or remove facts. Only after I explicitly approve, call submit_context_import with this attempt_id and the approved notes. For a transport retry or a replacement attempt, you may reuse my approval for the exact same unchanged notes; never add facts without asking. Always use the attempt_id returned by contextgraph_setup, which can point to a newer website-created attempt. Do not use remember to bypass import review. If you have no useful facts, ask me for a little context or a memory export. After submission, tell me to return to ContextGraph to review and save the notes.`;
}
