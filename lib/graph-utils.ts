import type { ContextNode, ContextEdge } from '@/types'
export type { ContextEdge }

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
  last_updated?: string
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
    last_updated: n.last_updated,
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

export interface TreeNode {
  node: ContextNode
  children: TreeNode[]
  depth: number
}

export function buildNodeTree(nodes: ContextNode[]): TreeNode[] {
  const nodeMap = new Map<string, ContextNode>()
  for (const n of nodes) nodeMap.set(n.scope, n)

  const roots: TreeNode[] = []

  function buildSubtree(node: ContextNode, depth: number): TreeNode {
    const children = nodes
      .filter(n => n.parent_scope === node.scope)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(child => buildSubtree(child, depth + 1))
    return { node, children, depth }
  }

  const rootNodes = nodes
    .filter(n => n.parent_scope === null || !nodeMap.has(n.parent_scope ?? ''))
    .sort((a, b) => {
      // ME always first, then alphabetical
      if (a.scope === 'me') return -1
      if (b.scope === 'me') return 1
      return a.title.localeCompare(b.title)
    })

  for (const root of rootNodes) {
    roots.push(buildSubtree(root, 0))
  }
  return roots
}

export function getNodePath(
  nodes: ContextNode[],
  selectedNode: ContextNode | null
): ContextNode[] {
  if (!selectedNode) return []
  const path: ContextNode[] = [selectedNode]
  let current = selectedNode
  let safety = 0
  while (current.parent_scope && safety < 10) {
    const parent = nodes.find(n => n.scope === current.parent_scope)
    if (!parent) break
    path.unshift(parent)
    current = parent
    safety++
  }
  return path
}

