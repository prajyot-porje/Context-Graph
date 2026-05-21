'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/gsap'
import type { ContextNode } from '@/types'
import { convertNodesToFlow, type ContextNodeData } from '@/lib/graph-utils'
import { ContextNode as GraphContextNode } from './ContextNode'

/* ---- Register custom node types (stable reference) ---- */
const nodeTypes = { contextNode: GraphContextNode }

interface ContextGraphProps {
  nodes: ContextNode[]
  selectedNodeId: string | null
  onNodeSelect: (id: string | null) => void
}

export function ContextGraph({ nodes: dbNodes, selectedNodeId, onNodeSelect }: ContextGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [flowReady, setFlowReady] = useState(false)

  /* ---- Convert mock data to React Flow format ---- */
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertNodesToFlow(dbNodes),
    [dbNodes]
  )

  /* ---- Inject selected state into nodes ---- */
  const nodes: Node<ContextNodeData>[] = useMemo(
    () =>
      initialNodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [initialNodes, selectedNodeId]
  )

  const edges: Edge[] = initialEdges

  /* ---- Handlers ---- */
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id)
    },
    [onNodeSelect]
  )

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null)
  }, [onNodeSelect])

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    // Mark flow as ready so GSAP animation triggers
    setFlowReady(true)
    setTimeout(() => ScrollTrigger.refresh(), 100)
  }, [])

  /* ---- GSAP entrance animation (waits for React Flow to be ready) ---- */
  useGSAP(
    () => {
      if (!flowReady) return

      if (prefersReducedMotion()) {
        gsap.set(
          '[data-node-root], [data-node-depth], .react-flow__edge',
          { opacity: 1, y: 0, scale: 1 }
        )
        return
      }

      // Set initial states for all elements before timeline starts
      gsap.set('[data-node-root="true"]', { opacity: 0, scale: 0.85 })
      gsap.set('[data-node-depth="1"]', { opacity: 0, y: 12 })
      gsap.set('[data-node-depth="2"]', { opacity: 0, y: 8 })
      gsap.set('.react-flow__edge', { opacity: 0 })

      const tl = gsap.timeline({
        delay: 0.1,
        onComplete: () => {
          ScrollTrigger.refresh()
        },
      })

      // 1. ME node entrance
      tl.to('[data-node-root="true"]', {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'cg-spring',
      })

      // 2. Depth-1 nodes
      .to(
        '[data-node-depth="1"]',
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'cg-out',
          stagger: 0.08,
        },
        '-=0.1'
      )

      // 3. Depth-2 nodes
      .to(
        '[data-node-depth="2"]',
        {
          opacity: 1,
          y: 0,
          duration: 0.25,
          ease: 'cg-out',
          stagger: 0.05,
        },
        '-=0.1'
      )

      // 4. Edges
      .to(
        '.react-flow__edge',
        {
          opacity: 1,
          duration: 0.4,
          ease: 'cg-soft',
          stagger: 0.04,
        },
        '-=0.15'
      )

      return () => {
        tl.kill()
      }
    },
    { scope: containerRef, dependencies: [flowReady] }
  )

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: 'var(--bg)' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.5}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onInit={handleInit}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.08)"
        />
        <Controls
          className="cg-flow-controls"
          position="bottom-left"
        />
      </ReactFlow>
    </div>
  )
}
