import type { ContextNode } from '@/types'

/* ------------------------------------------------------------------ */
/*  3D Force-Graph data types                                         */
/* ------------------------------------------------------------------ */

export interface GraphNode {
  id: string
  label: string
  depth: number       // 0 = root (me), 1 = agency, 2 = project
  relevance: number   // 0.0 – 1.0
  scope: string
  tags?: string[]
  content: string
}

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

/* ------------------------------------------------------------------ */
/*  Shared depth computation (used by Sidebar + graph builder)        */
/* ------------------------------------------------------------------ */

export interface ContextNodeWithDepth extends ContextNode {
  depth: number
}

export function computeDepths(nodes: ContextNode[]): ContextNodeWithDepth[] {
  const scopeMap = new Map<string, ContextNode>()
  for (const node of nodes) {
    scopeMap.set(node.scope, node)
  }

  const memo = new Map<string, number>()
  function getDepth(node: ContextNode): number {
    if (node.parent_scope === null || !node.parent_scope || node.parent_scope === '') {
      return 0
    }
    if (memo.has(node.id)) {
      return memo.get(node.id)!
    }
    const parent = scopeMap.get(node.parent_scope)
    if (!parent) {
      return 1 // Fallback to level 1 if parent is missing
    }
    const depth = getDepth(parent) + 1
    memo.set(node.id, depth)
    return depth
  }

  return nodes.map((n) => ({
    ...n,
    depth: getDepth(n),
  }))
}

/* ------------------------------------------------------------------ */
/*  Build GraphData for react-force-graph-3d                          */
/* ------------------------------------------------------------------ */

export function buildGraphData(nodes: ContextNode[]): GraphData {
  const withDepth = computeDepths(nodes)

  // scope → id map for resolving parent_scope → parent id edges
  const scopeToId = new Map<string, string>()
  for (const node of withDepth) {
    scopeToId.set(node.scope, node.id)
  }

  const graphNodes: GraphNode[] = withDepth.map((n) => ({
    id: n.id,
    label: n.title,
    depth: n.depth,
    relevance: n.relevance,
    scope: n.scope,
    tags: n.tags,
    content: n.content,
  }))

  const graphLinks: GraphLink[] = []
  for (const node of withDepth) {
    if (!node.parent_scope) continue
    const parentId = scopeToId.get(node.parent_scope)
    if (!parentId) continue
    graphLinks.push({
      source: parentId,
      target: node.id,
    })
  }

  return { nodes: graphNodes, links: graphLinks }
}

/* ------------------------------------------------------------------ */
/*  Hierarchical sort (used by Sidebar tree)                          */
/* ------------------------------------------------------------------ */

export function sortNodesHierarchically(nodesWithDepth: ContextNodeWithDepth[]): ContextNodeWithDepth[] {
  const result: ContextNodeWithDepth[] = []
  
  // Find roots (nodes with depth === 0)
  const roots = nodesWithDepth.filter(n => n.depth === 0)
  
  // Create parent to child map
  const childrenMap = new Map<string, ContextNodeWithDepth[]>()
  for (const node of nodesWithDepth) {
    if (node.parent_scope) {
      const list = childrenMap.get(node.parent_scope) || []
      list.push(node)
      childrenMap.set(node.parent_scope, list)
    }
  }

  function traverse(node: ContextNodeWithDepth) {
    result.push(node)
    const children = childrenMap.get(node.scope) || []
    // Sort children by title or relevance
    children.sort((a, b) => a.title.localeCompare(b.title))
    for (const child of children) {
      traverse(child)
    }
  }

  for (const root of roots) {
    traverse(root)
  }

  // If there are any disconnected nodes (shouldn't happen, but as fallback), append them
  const addedIds = new Set(result.map(n => n.id))
  for (const node of nodesWithDepth) {
    if (!addedIds.has(node.id)) {
      result.push(node)
    }
  }

  return result
}
