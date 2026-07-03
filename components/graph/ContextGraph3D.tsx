'use client'

/**
 * ContextGraph3D — WebGL 3D Force Graph
 *
 * Key improvements vs v1:
 *  - ResizeObserver drives explicit width/height → graph always fills container
 *  - CSS-overlay label layer replaces SpriteText (no WebGL z-fighting / overlap)
 *  - Labels fade by depth: root always visible, agency visible, leaf on hover
 *  - Consolidated camera toolbar (no inline onMouseEnter style hacks)
 *  - Tooltip promoted to DESIGN.md tokens (no inline style strings for colors)
 *  - Lucide icon set with strokeWidth 1.5 for the control toolbar
 *  - console.log removed
 *  - Tooltip keyframes moved out of per-render <style> tags
 */

import dynamic from 'next/dynamic'
import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import type { GraphNode } from '@/lib/graph-utils'
import { computeDepths } from '@/lib/graph-utils'
import type { ContextNode, ContextEdge } from '@/types'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'

// react-force-graph-3d uses Three.js/WebGL — client-only, no SSR
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
)

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Props {
  nodes: ContextNode[]
  edges: ContextEdge[]
  onNodeClick: (node: GraphNode) => void
  selectedNodeId?: string | null
  relevanceFilter?: number
  showLabels?: boolean
  zoomTrigger?: number
}

interface ScreenLabel {
  id: string
  label: string
  depth: number
  relevance: number
  x: number
  y: number
  visible: boolean
}

/* ------------------------------------------------------------------ */
/*  Theme palette (CSS custom property values)                        */
/* ------------------------------------------------------------------ */

const THEME_COLORS = {
  dark: {
    bg:      '#080808',
    root:    '#b3ec13',
    agency:  '#EEEEEE',
    project: '#888888',
    link:    'rgba(255,255,255,0.10)',
    selected:'#b3ec13',
  },
  light: {
    bg:      '#F4F4F5',
    root:    '#b3ec13',
    agency:  '#1a1a1a',
    project: '#555555',
    link:    'rgba(0,0,0,0.08)',
    selected:'#b3ec13',
  },
} as const

type ThemeMode = 'dark' | 'light'

function getTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark'
  return (document.documentElement.getAttribute('data-theme') as ThemeMode) || 'dark'
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function nodeSize(node: GraphNode): number {
  const base = node.depth === 0 ? 8 : node.depth === 1 ? 5 : 3.5
  return base + node.relevance * 2
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Updated --'
  try {
    const d = new Date(dateString)
    return `Updated ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  } catch {
    return 'Updated --'
  }
}

function relevanceColor(r: number) {
  if (r >= 0.7) return 'var(--accent)'
  if (r >= 0.4) return 'var(--warning)'
  return 'var(--text-muted)'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const hasZoomedRef = useRef(false)
  const animFrameRef = useRef<number>(0)

  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [screenLabels, setScreenLabels] = useState<ScreenLabel[]>([])

  /* ---- Graph data ---- */
  const graphData = useMemo(() => {
    const withDepth = computeDepths(nodes)
    const filtered = withDepth.filter(n => n.relevance >= relevanceFilter)
    const nodeIds = new Set(filtered.map(n => n.id))

    return {
      nodes: filtered.map(n => ({
        id:           n.id,
        label:        n.title,
        depth:        n.depth,
        relevance:    n.relevance,
        scope:        n.scope,
        tags:         n.tags,
        content:      n.content,
        last_updated: n.last_updated,
      })),
      links: edges
        .filter(e => nodeIds.has(e.source_node_id) && nodeIds.has(e.target_node_id))
        .map(e => ({
          source: e.source_node_id,
          target: e.target_node_id,
          type:   e.edge_type,
        })),
    }
  }, [nodes, edges, relevanceFilter])

  /* ---- Container dimensions via ResizeObserver ---- */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) })
        }
      }
    })
    ro.observe(el)
    // Seed immediately in case observer fires late
    const { width, height } = el.getBoundingClientRect()
    if (width > 0 && height > 0) setDimensions({ width: Math.floor(width), height: Math.floor(height) })
    return () => ro.disconnect()
  }, [])

  /* ---- Theme detection ---- */
  useEffect(() => {
    const update = () => setTheme(getTheme())
    update()

    const observer = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') update()
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    window.addEventListener('cg-theme-change', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('cg-theme-change', update)
    }
  }, [])

  /* ---- Refresh graph on theme change ---- */
  useEffect(() => {
    graphRef.current?.refresh()
  }, [theme])

  /* ---- Configure OrbitControls + guard against stale-pointer crash ---- */
  useEffect(() => {
    const timer = setTimeout(() => {
      const fg = graphRef.current
      if (!fg || typeof fg.controls !== 'function') return
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const ctrl = fg.controls() as any
      if (!ctrl) return

      ctrl.enableRotate = false
      ctrl.enablePan = true
      ctrl.screenSpacePanning = true
      ctrl.panSpeed = 0.8

      // Patch _onPointerUp to prevent the stale-pointer crash.
      //
      // Root cause: DragControls and OrbitControls share the same pointer ID.
      // When DragControls takes over a drag it can remove the pointer from
      // OrbitControls' _pointerPositions. Then OrbitControls' onPointerUp
      // (case 1 branch) tries to access _pointerPositions[id].x → crash.
      //
      // Fix: wrap the bound handler so any TypeError from that access is caught
      // and controls state is cleaned up gracefully. We also re-register the
      // canvas 'pointercancel' listener because the constructor registered it
      // with the original (now-replaced) function reference.
      const origUp: ((e: Event) => void) | undefined = ctrl._onPointerUp
      if (typeof origUp === 'function') {
        const safeUp = (e: Event) => {
          try {
            origUp.call(ctrl, e)
          } catch {
            // Pointer position was undefined — reset OrbitControls state cleanly
            try { (ctrl._pointers as unknown[]).length = 0 } catch {}
            try { ctrl.state = 0 } catch {}
          }
        }
        ctrl._onPointerUp = safeUp
        // The constructor registered origUp with 'pointercancel' on the canvas —
        // swap it for safeUp so future pointercancel events use the safe version.
        const canvas = ctrl.domElement as HTMLElement | undefined
        if (canvas) {
          canvas.removeEventListener('pointercancel', origUp)
          canvas.addEventListener('pointercancel', safeUp)
        }
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  /* ---- Zoom-to-fit trigger ---- */
  useEffect(() => {
    if (!graphRef.current || graphData.nodes.length === 0) return
    const timer = setTimeout(() => graphRef.current?.zoomToFit?.(400, 60), 80)
    return () => clearTimeout(timer)
  }, [zoomTrigger, graphData])

  /* ---- CSS-overlay labels: project 3D positions to screen ---- */
  useEffect(() => {
    if (!showLabels || graphData.nodes.length === 0) {
      setScreenLabels([])
      return
    }

    let active = true
    const tick = () => {
      const fg = graphRef.current
      if (!fg || !containerRef.current) {
        if (active) animFrameRef.current = requestAnimationFrame(tick)
        return
      }

      const labels: ScreenLabel[] = []

      for (const node of graphData.nodes as any[]) {
        // Depth 0+1 are always visible; depth 2+ only when that specific node is hovered
        const isHoveredNode = hoveredNode?.id === node.id
        const depthVisible = node.depth <= 1 || isHoveredNode
        if (!depthVisible) continue

        try {
          // Returns canvas-relative CSS pixel coords (0..canvasWidth, 0..canvasHeight)
          const pos = fg.graph2ScreenCoords?.(node.x ?? 0, node.y ?? 0, node.z ?? 0)
          if (!pos) continue

          const { x, y } = pos

          // Cull nodes outside the canvas + small margin
          if (x < -40 || x > dimensions.width + 40 || y < -20 || y > dimensions.height + 20) continue

          labels.push({
            id:        node.id,
            label:     node.label ?? '',
            depth:     node.depth,
            relevance: node.relevance,
            x,
            y,
            visible:   true,
          })
        } catch {
          // Swallow projection errors during physics warm-up
        }
      }

      setScreenLabels(labels)
      if (active) animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      active = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [showLabels, graphData.nodes, hoveredNode])

  /* ---- Colors ---- */
  const colors = THEME_COLORS[theme]

  /* ---- Callbacks ---- */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node as GraphNode | null)
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default'
    }
  }, [])

  const handleNodeDrag = useCallback(() => {
    const controls = graphRef.current?.controls?.()
    if (controls?.enabled) controls.enabled = false
  }, [])

  const handleNodeDragEnd = useCallback((node: any) => {
    if (node) { node.fx = undefined; node.fy = undefined; node.fz = undefined }
    const controls = graphRef.current?.controls?.()
    if (controls) controls.enabled = true
  }, [])

  const handleNodeClick = useCallback(
    (node: any) => onNodeClick(node as GraphNode),
    [onNodeClick]
  )

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

  // Suppress the library's built-in Three.js tooltip — we use our own React overlay
  const nodeLabel = useCallback(() => '', [])

  /* ---- Zoom helpers ---- */
  const zoomIn  = useCallback(() => { const fg = graphRef.current; if (fg) fg.zoom(fg.zoom() * 1.3, 300) }, [])
  const zoomOut = useCallback(() => { const fg = graphRef.current; if (fg) fg.zoom(fg.zoom() / 1.3, 300) }, [])
  const fitView = useCallback(() => { graphRef.current?.zoomToFit?.(400, 50) }, [])

  const canRender = dimensions.width > 0 && dimensions.height > 0

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* ---- 3D Graph canvas ---- */}
      {canRender && (
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={colors.bg}
          /* Node */
          nodeColor={getNodeColor}
          nodeVal={(node: any) => nodeSize(node as GraphNode)}
          nodeLabel={nodeLabel}
          nodeOpacity={0.95}
          nodeResolution={32}
          /* We handle labels ourselves in the CSS overlay — no sprites */
          nodeThreeObjectExtend={false}
          /* Link */
          linkColor={() => colors.link}
          linkWidth={0.8}
          linkOpacity={0.45}
          /* Interaction */
          onNodeClick={handleNodeClick}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          onNodeHover={handleNodeHover}
          enableNavigationControls
          enablePointerInteraction
          controlType="orbit"
          /* Physics */
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          onEngineStop={() => {
            if (hasZoomedRef.current) return
            hasZoomedRef.current = true
            graphRef.current?.zoomToFit?.(800, 60)
          }}
          showNavInfo={false}
        />
      )}

      {/* ---- CSS overlay label layer ---- */}
      {showLabels && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          {screenLabels.map(lbl => {
            const isRoot    = lbl.depth === 0
            const isAgency  = lbl.depth === 1
            const isHovered = hoveredNode?.id === lbl.id
            const isSelected = lbl.id === selectedNodeId

            const offsetY = isRoot ? -22 : isAgency ? -18 : -16

            return (
              <span
                key={lbl.id}
                className="cg-graph-label"
                data-tier={isRoot ? 'root' : isAgency ? 'agency' : 'leaf'}
                data-selected={isSelected || undefined}
                data-hovered={isHovered || undefined}
                style={{
                  transform: `translate(-50%, ${offsetY}px)`,
                  left: `${lbl.x}px`,
                  top:  `${lbl.y}px`,
                }}
              >
                {lbl.label}
              </span>
            )
          })}
        </div>
      )}

      {/* ---- Hover tooltip ---- */}
      {hoveredNode && (
        <div
          className="cg-graph-tooltip pointer-events-none absolute z-[60]"
          style={{
            left: `${mousePos.x + 16}px`,
            top:  `${mousePos.y - 12}px`,
          }}
        >
          <div className="cg-graph-tooltip__title">{hoveredNode.label}</div>
          {hoveredNode.scope && (
            <div className="cg-graph-tooltip__scope">{hoveredNode.scope}</div>
          )}
          <div className="cg-graph-tooltip__row">
            <span className="cg-graph-tooltip__label">Relevance</span>
            <span
              className="cg-graph-tooltip__dot"
              style={{ color: relevanceColor(hoveredNode.relevance) }}
            >●</span>
            <span className="cg-graph-tooltip__value">
              {Math.round(hoveredNode.relevance * 100)}%
            </span>
          </div>
          <div className="cg-graph-tooltip__date">{formatDate(hoveredNode.last_updated)}</div>
          <div className="cg-graph-tooltip__divider" />
          <div className="cg-graph-tooltip__hint">Click to open</div>
        </div>
      )}

      {/* ---- Camera controls toolbar ---- */}
      <div className="cg-graph-controls absolute bottom-5 right-5 z-20 flex flex-col gap-1">
        <button
          onClick={fitView}
          title="Fit to view"
          className="cg-graph-controls__btn"
          aria-label="Fit graph to view"
        >
          <Maximize2 size={12} strokeWidth={1.5} />
        </button>
        <button
          onClick={zoomIn}
          title="Zoom in"
          className="cg-graph-controls__btn"
          aria-label="Zoom in"
        >
          <ZoomIn size={12} strokeWidth={1.5} />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom out"
          className="cg-graph-controls__btn"
          aria-label="Zoom out"
        >
          <ZoomOut size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
