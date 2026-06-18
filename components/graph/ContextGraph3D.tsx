'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import type { GraphNode } from '@/lib/graph-utils'
import { computeDepths } from '@/lib/graph-utils'
import type { ContextNode, ContextEdge } from '@/types'
import SpriteText from 'three-spritetext'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'

// react-force-graph-3d uses Three.js/WebGL — must be client-only, no SSR
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
)

interface Props {
  nodes: ContextNode[]
  edges: ContextEdge[]
  onNodeClick: (node: GraphNode) => void
  selectedNodeId?: string | null
  relevanceFilter?: number
  showLabels?: boolean
  zoomTrigger?: number
}

/* ------------------------------------------------------------------ */
/*  Theme-aware color palettes                                        */
/* ------------------------------------------------------------------ */

const THEME_COLORS = {
  dark: {
    bg:       '#080808',               // --bg
    root:     '#b3ec13',               // --accent
    agency:   '#EEEEEE',               // depth 1 nodes
    project:  '#888888',               // depth 2+ nodes
    link:     'rgba(255,255,255,0.12)',
    selected: '#b3ec13',
    tooltip: {
      bg:       '#111111',
      border:   'rgba(255,255,255,0.12)',
      text:     '#F0F0F0',
      subtext:  '#888888',
      shadow:   '0 4px 12px rgba(0,0,0,0.4)',
    },
  },
  light: {
    bg:       '#F4F4F5',               // light off-white
    root:     '#b3ec13',               // --accent
    agency:   '#1a1a1a',               // depth 1 nodes
    project:  '#555555',               // depth 2+ nodes
    link:     'rgba(0,0,0,0.10)',
    selected: '#b3ec13',
    tooltip: {
      bg:       '#ffffff',
      border:   'rgba(0,0,0,0.08)',
      text:     '#1a1a1a',
      subtext:  '#6b7280',
      shadow:   '0 4px 12px rgba(0,0,0,0.08)',
    },
  },
} as const

type ThemeMode = 'dark' | 'light'

function getTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark'
  return (document.documentElement.getAttribute('data-theme') as ThemeMode) || 'dark'
}

function nodeSize(node: GraphNode): number {
  const base = node.depth === 0 ? 8 : node.depth === 1 ? 5 : 3.5
  return base + node.relevance * 2
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Updated --'
  try {
    const date = new Date(dateString)
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `Updated ${formatted}`
  } catch {
    return 'Updated --'
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ContextGraph3D({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
  relevanceFilter = 0,
  showLabels = true,
  zoomTrigger = 0,
}: Props) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const graphRef = useRef<any>(null)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const hasZoomedRef = useRef(false)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const graphData = useMemo(() => {
    const withDepth = computeDepths(nodes)
    
    // Filter nodes by relevance threshold
    const filteredNodes = withDepth.filter(n => n.relevance >= relevanceFilter)
    const nodeIds = new Set(filteredNodes.map(n => n.id))

    const graphNodes = filteredNodes.map(n => ({
      id: n.id,
      label: n.title,
      depth: n.depth,
      relevance: n.relevance,
      scope: n.scope,
      tags: n.tags,
      content: n.content,
      last_updated: n.last_updated,
    }))

    const graphLinks = edges
      .filter(e => nodeIds.has(e.source_node_id) && nodeIds.has(e.target_node_id))
      .map(e => ({
        source: e.source_node_id,
        target: e.target_node_id,
        type: e.edge_type,
      }))

    console.log('graphLinks length:', graphLinks.length)

    return { nodes: graphNodes, links: graphLinks }
  }, [nodes, edges, relevanceFilter])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node as GraphNode | null)
  }, [])

  // Read theme on mount + listen for toggle changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setTheme(getTheme())
    }, 0)

    const handleThemeChange = () => setTheme(getTheme())

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          handleThemeChange()
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    window.addEventListener('cg-theme-change', handleThemeChange)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('cg-theme-change', handleThemeChange)
    }
  }, [])

  // Refresh graph when theme updates to apply new color assignments live
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.refresh()
    }
  }, [theme])

  const colors = THEME_COLORS[theme]

  // Configure controls after the graph fully initializes
  useEffect(() => {
    const fg = graphRef.current
    if (!fg) return

    // Delay so the Three.js controls are fully mounted
    const timer = setTimeout(() => {
      const controls = fg.controls()
      if (controls) {
        // Disable rotation so right-dragging pans cleanly
        controls.enableRotate = false
        // Enable flat panning in screen coordinates
        controls.enablePan = true
        controls.screenSpacePanning = true
        controls.panSpeed = 0.8
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  // Zoom-to-fit trigger
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 60)
      }, 80)
    }
  }, [zoomTrigger, graphData])

  // ---------------------------------------------------------------
  // FIX: Disable OrbitControls during node drag to prevent the
  // "Cannot read properties of undefined (reading 'x')" crash.
  //
  // Root cause: When you drag-stretch a node, the internal
  // DragControls dispatches a 'pointercancel' event. OrbitControls
  // listens for this and tries to look up the pointer in its
  // internal tracking array, but the pointer was already removed.
  // The result: OrbitControls.onPointerUp → undefined.x → crash.
  //
  // Solution: Disable OrbitControls while a node drag is active.
  // This prevents OrbitControls from processing any pointer events
  // during the drag, so the stale-pointer lookup never happens.
  // ---------------------------------------------------------------

  const handleNodeDrag = useCallback(() => {
    const fg = graphRef.current
    if (!fg) return
    const controls = fg.controls()
    if (controls && controls.enabled) {
      controls.enabled = false
    }
  }, [])

  const handleNodeDragEnd = useCallback((node: any) => {
    // Release the dragged node's position so it snaps back with spring physics
    if (node) {
      node.fx = undefined
      node.fy = undefined
      node.fz = undefined
    }

    // Re-enable OrbitControls now that the drag is finished
    const fg = graphRef.current
    if (!fg) return
    const controls = fg.controls()
    if (controls) {
      controls.enabled = true
    }
  }, [])

  // Node click — select node WITHOUT moving the camera
  const handleNodeClick = useCallback(
    (node: any) => {
      onNodeClick(node as GraphNode)
    },
    [onNodeClick]
  )

  // Color resolver — theme-aware
  const getNodeColor = useCallback(
    (node: any) => {
      const n = node as GraphNode
      if (n.id === selectedNodeId) return colors.selected
      if (n.depth === 0) return colors.root
      if (n.depth === 1) return colors.agency
      return colors.project
    },
    [selectedNodeId, colors]
  )

  // Label sprite - theme-aware
  const nodeThreeObject = useCallback(
    (node: any) => {
      const n = node as GraphNode
      const labelText = showLabels ? (n.label || (n as any).title || (n as any).name || '') : ''
      const sprite = new SpriteText(labelText)
      sprite.textHeight = 8
      sprite.color = theme === 'light' ? '#333333' : '#CCCCCC'
      sprite.position.y = -14
      return sprite
    },
    [theme, showLabels]
  )

  // Tooltip — theme-aware
  const nodeLabel = useCallback(
    (node: any) => {
      const n = node as GraphNode
      const t = colors.tooltip
      return `<div style="
        font-family: var(--font-geist-sans, sans-serif);
        background: ${t.bg};
        border: 1px solid ${t.border};
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        color: ${t.text};
        max-width: 200px;
        box-shadow: ${t.shadow};
      ">
        <div style="font-weight:600;margin-bottom:3px">${n.label}</div>
        <div style="color:${t.subtext};font-size:11px">Relevance: ${Math.round(n.relevance * 100)}%</div>
      </div>`
    },
    [colors.tooltip]
  )

  return (
    <div className="relative w-full h-full" onMouseMove={handleMouseMove}>
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        backgroundColor={colors.bg}
        /* ---- Node appearance ---- */
        nodeColor={getNodeColor}
        nodeVal={(node: any) => nodeSize(node as GraphNode)}
        nodeLabel={nodeLabel}
        nodeOpacity={0.95}
        nodeResolution={32}
        nodeThreeObjectExtend={true}
        nodeThreeObject={nodeThreeObject}
        /* ---- Link appearance ---- */
        linkColor={() => colors.link}
        linkWidth={0.8}
        linkOpacity={0.5}
        /* ---- Interaction ---- */
        onNodeClick={handleNodeClick}
        onNodeDrag={handleNodeDrag}
        onNodeDragEnd={handleNodeDragEnd}
        onNodeHover={handleNodeHover}
        enableNavigationControls={true}
        enablePointerInteraction={true}
        controlType="orbit"
        /* ---- Physics ---- */
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        onEngineStop={() => {
          // Once physics settle on first load, center and zoom the camera
          if (hasZoomedRef.current) return
          hasZoomedRef.current = true
          const fg = graphRef.current
          if (fg) fg.zoomToFit(800, 60)
        }}
        /* ---- Misc ---- */
        showNavInfo={false}
        width={undefined}
        height={undefined}
      />

      {/* Node Hover Tooltip */}
      {hoveredNode && (
        <>
          <style>{`
            @keyframes tooltipFadeIn {
              from { opacity: 0; transform: scale(0.97); }
              to { opacity: 1; transform: scale(1); }
            }
            .tooltip-fade-in {
              animation: tooltipFadeIn 120ms ease-out forwards;
              transform-origin: top left;
            }
          `}</style>
          <div
            className="absolute pointer-events-none rounded-lg border border-[var(--border-strong)] bg-[var(--card)] px-3.5 py-2.5 shadow-[var(--shadow-md)] z-[9999] tooltip-fade-in text-left flex flex-col gap-0.5"
            style={{
              left: `${mousePos.x + 14}px`,
              top: `${mousePos.y - 10}px`,
            }}
          >
            <div className="text-[13px] font-bold text-[var(--text-primary)]">
              {hoveredNode.label}
            </div>
            <div className="font-mono text-[11px] text-[var(--text-muted)]">
              {hoveredNode.scope}
            </div>
            <div className="text-[11px] text-[var(--text-primary)] flex items-center gap-1 mt-0.5">
              <span className="text-[var(--text-muted)]">Relevance:</span>
              <span 
                style={{ 
                  color: hoveredNode.relevance >= 0.7 
                    ? '#b3ec13' 
                    : hoveredNode.relevance >= 0.4 
                      ? '#f59e0b' 
                      : '#888888' 
                }} 
                className="text-[10px]"
              >
                ●
              </span>
              <span className="font-semibold">{Math.round(hoveredNode.relevance * 100)}%</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {formatDate(hoveredNode.last_updated)}
            </div>
            <div className="my-1.5 h-[1px] bg-[var(--border)] w-full" />
            <div className="text-[11px] text-[var(--text-muted)] italic">
              Click to open →
            </div>
          </div>
        </>
      )}

      {/* Camera Controls Toolbar Overlay */}
      <div 
        className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 select-none"
        style={{ pointerEvents: 'auto' }}
      >
        <button
          onClick={() => graphRef.current?.zoomToFit(400, 50)}
          title="Fit to view"
          className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--border)] transition-colors duration-150 cursor-pointer bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)]"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
          }}
        >
          <Maximize2 size={14} className="text-[var(--text-secondary)]" />
        </button>

        <button
          onClick={() => {
            const fg = graphRef.current
            if (fg) {
              fg.zoom(fg.zoom() * 1.3, 300)
            }
          }}
          title="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--border)] transition-colors duration-150 cursor-pointer bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)]"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
          }}
        >
          <ZoomIn size={14} className="text-[var(--text-secondary)]" />
        </button>

        <button
          onClick={() => {
            const fg = graphRef.current
            if (fg) {
              fg.zoom(fg.zoom() / 1.3, 300)
            }
          }}
          title="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--border)] transition-colors duration-150 cursor-pointer bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)]"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
          }}
        >
          <ZoomOut size={14} className="text-[var(--text-secondary)]" />
        </button>
      </div>
    </div>
  )
}

/* eslint-enable @typescript-eslint/no-explicit-any */
