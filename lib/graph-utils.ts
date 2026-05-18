import type { Node, Edge } from 'reactflow'
import type { MockNode } from './mock-data'

export interface ContextNodeData {
  scope: string
  title: string
  relevance: number
  depth: number
  content: string
}

/**
 * Converts mock nodes into React Flow nodes + edges with a static layout.
 *
 * Layout strategy (no auto-layout library):
 *   - depth 0 (ME): centered at (320, 40)
 *   - depth 1:      horizontal row at y: 200, starting at x: 120, spaced 400px
 *   - depth 2:      grouped under their parent at y: 360, spaced 160px apart
 */
export function convertNodesToFlow(nodes: MockNode[]): {
  nodes: Node<ContextNodeData>[]
  edges: Edge[]
} {
  const flowNodes: Node<ContextNodeData>[] = []
  const flowEdges: Edge[] = []

  // ---- Build a map of scope → id for resolving parent_scope → parent id ----
  const scopeToId = new Map<string, string>()
  for (const node of nodes) {
    scopeToId.set(node.scope, node.id)
  }

  // ---- Group depth-2 nodes under their parent scope ----
  const depth1Nodes = nodes.filter((n) => n.depth === 1)
  const depth2Nodes = nodes.filter((n) => n.depth === 2)

  // Track depth-1 x positions so children can be centered under them
  const depth1Positions = new Map<string, number>()

  // ---- Position depth 0 ----
  const meNode = nodes.find((n) => n.depth === 0)
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
  const childrenByParent = new Map<string, MockNode[]>()
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
  for (const node of nodes) {
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
