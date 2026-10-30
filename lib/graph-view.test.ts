import { describe, it, expect } from "vitest";
import { buildGraphView } from "./graph-view";
import type { ContextNode, ContextEntry } from "@/types";
const root: ContextNode = {
  id: "root",
  user_id: "user",
  scope: "me",
  parent_scope: null,
  title: "ME",
  content: "Original profile",
  relevance: 1,
  tags: [],
  created_at: "",
  last_updated: "",
};
const note = (
  id: string,
  kind: ContextEntry["kind"] = "preference",
): ContextEntry => ({
  id,
  node_id: "root",
  user_id: "user",
  entry_text: `Real saved fact ${id}`,
  kind,
  score: 0.8,
  created_at: "",
});
describe("saved-note graph projection", () => {
  it("reveals root notes as grouped leaves while preserving storage objects", () => {
    const entries = [note("one"), note("two"), note("three", "decision")];
    const before = JSON.stringify({ root, entries });
    const view = buildGraphView([root], entries, []);
    expect(view.nodes).toHaveLength(6);
    expect(view.edges).toHaveLength(5);
    expect(view.entryByNode.get("note:one")).toEqual(entries[0]);
    expect(view.nodes.find((n) => n.id === "note:one")?.parent_scope).toBe(
      "me/preference",
    );
    expect(JSON.stringify({ root, entries })).toBe(before);
  });
  it("attaches project notes to their existing scope and excludes resolved or missing-owner notes", () => {
    const project = {
      ...root,
      id: "project",
      scope: "me/project",
      parent_scope: "me",
    };
    const entries = [
      { ...note("active"), node_id: "project" },
      note("resolved", "resolved"),
      { ...note("orphan"), node_id: "missing" },
    ];
    const view = buildGraphView([root, project], entries, []);
    expect(view.nodes).toHaveLength(3);
    expect(view.nodes[2].parent_scope).toBe(project.scope);
    expect(view.entryByNode.size).toBe(1);
  });
  it("keeps long note text intact while shortening only graph labels", () => {
    const text = "Useful real fact ".repeat(20);
    const view = buildGraphView(
      [root],
      [{ ...note("long"), entry_text: text }],
      [],
    );
    const leaf = view.nodes.find((n) => n.id === "note:long")!;
    expect(leaf.title.length).toBeLessThanOrEqual(64);
    expect(leaf.content).toBe(text);
  });
});
