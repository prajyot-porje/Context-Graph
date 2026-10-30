import type {
  ContextNode,
  ContextEdge,
  ContextEntry,
  ContextEntryKind,
} from "@/types";

export const noteCategories: Record<ContextEntryKind, string> = {
  preference: "Preferences",
  decision: "Decisions",
  constraint: "Constraints",
  open_problem: "Open problems",
  note: "Notes",
  resolved: "Resolved",
};

/** A read-only projection: notes become leaves without duplicating stored facts. */
export function buildGraphView(
  nodes: ContextNode[],
  entries: ContextEntry[],
  edges: ContextEdge[],
) {
  const graphNodes = [...nodes],
    graphEdges = [...edges];
  const entryByNode = new Map<string, ContextEntry>();
  const scopeByGroup = new Map<string, string>();
  const groups = new Set<string>();
  const saved = new Map(nodes.map((n) => [n.id, n]));
  for (const entry of entries) {
    const owner = saved.get(entry.node_id);
    if (!owner || entry.kind === "resolved") continue;
    let parent = owner;
    if (owner.scope === "me") {
      const id = `category:${owner.id}:${entry.kind}`;
      if (!groups.has(id)) {
        groups.add(id);
        graphNodes.push({
          ...owner,
          id,
          scope: `${owner.scope}/${entry.kind}`,
          parent_scope: owner.scope,
          title: noteCategories[entry.kind],
          content: "",
          tags: [],
        });
        graphEdges.push({
          id: `edge:${id}`,
          user_id: owner.user_id,
          source_node_id: id,
          target_node_id: owner.id,
          edge_type: "part_of",
          created_at: entry.created_at,
        });
        scopeByGroup.set(id, owner.id);
      }
      parent = graphNodes.find((n) => n.id === id)!;
    }
    const id = `note:${entry.id}`;
    const text = entry.entry_text.trim().replace(/\s+/g, " ");
    graphNodes.push({
      ...owner,
      id,
      scope: `${parent.scope}/note-${entry.id}`,
      parent_scope: parent.scope,
      title: text.length > 64 ? `${text.slice(0, 61)}…` : text,
      content: entry.entry_text,
      relevance: Math.max(0.3, entry.score),
      tags: [entry.kind],
      created_at: entry.created_at,
      last_updated: entry.created_at,
    });
    graphEdges.push({
      id: `edge:${id}`,
      user_id: owner.user_id,
      source_node_id: id,
      target_node_id: parent.id,
      edge_type: "part_of",
      created_at: entry.created_at,
    });
    entryByNode.set(id, entry);
  }
  return { nodes: graphNodes, edges: graphEdges, entryByNode, scopeByGroup };
}
