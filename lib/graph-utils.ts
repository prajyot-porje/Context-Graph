import type { Node, Edge } from 'reactflow'
import type { ContextNode } from '@/types'

export interface ContextNodeData {
  scope: string
  title: string
  relevance: number
  depth: number
  content: string
}

/**
 * Converts context nodes into React Flow nodes + edges with a static layout.
 *
 * Layout strategy (no auto-layout library):
 *   - depth 0 (ME): centered at (320, 40)
 *   - depth 1:      horizontal row at y: 200, starting at x: 120, spaced 400px
 *   - depth 2:      grouped under their parent at y: 360, spaced 160px apart
 */
export function convertNodesToFlow(nodes: ContextNode[]): {
  nodes: Node<ContextNodeData>[]
  edges: Edge[]
} {
  const flowNodes: Node<ContextNodeData>[] = []
  const flowEdges: Edge[] = []

  // ---- Map scope to node ----
  const scopeMap = new Map<string, ContextNode>()
  for (const node of nodes) {
    scopeMap.set(node.scope, node)
  }

  // ---- Build a map of scope → id for resolving parent_scope → parent id ----
  const scopeToId = new Map<string, string>()
  for (const node of nodes) {
    scopeToId.set(node.scope, node.id)
  }

  // ---- Compute depth for each node dynamically ----
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

  const nodesWithDepth = nodes.map((n) => ({
    ...n,
    depth: getDepth(n),
  }))

  // ---- Group by depth ----
  const depth0Nodes = nodesWithDepth.filter((n) => n.depth === 0)
  const depth1Nodes = nodesWithDepth.filter((n) => n.depth === 1)
  const depth2Nodes = nodesWithDepth.filter((n) => n.depth === 2)

  // Track depth-1 x positions so children can be centered under them
  const depth1Positions = new Map<string, number>()

  // ---- Position depth 0 ----
  const meNode = depth0Nodes[0] || nodesWithDepth.find((n) => n.depth === 0)
  if (meNode) {
    flowNodes.push({
      id: meNode.id,
      type: 'contextNode',
      position: { x: 320, y: 40 },
      data: {
        scope: meNode.scope,
        title: meNode.title,
        relevance: meNode.relevance,
        depth: meNode.depth,
        content: meNode.content,
      },
    })
  }

  // ---- Position depth 1 ----
  const depth1StartX = 120
  const depth1Spacing = 400

  depth1Nodes.forEach((node, index) => {
    const x = depth1StartX + index * depth1Spacing
    depth1Positions.set(node.scope, x)

    flowNodes.push({
      id: node.id,
      type: 'contextNode',
      position: { x, y: 200 },
      data: {
        scope: node.scope,
        title: node.title,
        relevance: node.relevance,
        depth: node.depth,
        content: node.content,
      },
    })
  })

  // ---- Position depth 2 ----
  // Group children by their parent_scope
  const childrenByParent = new Map<string, typeof nodesWithDepth>()
  for (const node of depth2Nodes) {
    if (!node.parent_scope) continue
    const group = childrenByParent.get(node.parent_scope) ?? []
    group.push(node)
    childrenByParent.set(node.parent_scope, group)
  }

  for (const [parentScope, children] of childrenByParent) {
    const parentX = depth1Positions.get(parentScope) ?? 320
    const groupWidth = (children.length - 1) * 160
    const startX = parentX - groupWidth / 2

    children.forEach((node, index) => {
      flowNodes.push({
        id: node.id,
        type: 'contextNode',
        position: { x: startX + index * 160, y: 360 },
        data: {
          scope: node.scope,
          title: node.title,
          relevance: node.relevance,
          depth: node.depth,
          content: node.content,
        },
      })
    })
  }

  // ---- Create edges ----
  for (const node of nodesWithDepth) {
    if (!node.parent_scope) continue

    const parentId = scopeToId.get(node.parent_scope)
    if (!parentId) continue

    flowEdges.push({
      id: `e-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: 'smoothstep',
      style: {
        stroke: 'var(--graph-edge)',
        strokeWidth: 1.5,
      },
      markerEnd: undefined,
    })
  }

  return { nodes: flowNodes, edges: flowEdges }
}
