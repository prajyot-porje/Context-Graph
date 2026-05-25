'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useEffect, useState } from 'react'
import type { GraphData, GraphNode } from '@/lib/graph-utils'

// react-force-graph-3d uses Three.js/WebGL — must be client-only, no SSR
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
)

interface Props {
  data: GraphData
  onNodeClick: (node: GraphNode) => void
  selectedNodeId?: string | null
}

/* ------------------------------------------------------------------ */
/*  Theme-aware color palettes                                        */
/* ------------------------------------------------------------------ */

const THEME_COLORS = {
  dark: {
    bg:       '#080808',               // --bg
    root:     '#b3ec13',               // --accent
    agency:   '#ffffff',               // white — visible on dark
    project:  '#888888',               // --text-secondary
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
    agency:   '#2A2A2A',               // dark gray — visible on light
    project:  '#6B7280',               // medium gray
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

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ContextGraph3D({ data, onNodeClick, selectedNodeId }: Props) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const graphRef = useRef<any>(null)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  // Track whether we've done the initial zoom-to-fit
  const hasZoomedRef = useRef(false)

  // Read theme on mount + listen for toggle changes
  useEffect(() => {
    setTheme(getTheme())

    const handleThemeChange = () => setTheme(getTheme())
    window.addEventListener('cg-theme-change', handleThemeChange)
    return () => window.removeEventListener('cg-theme-change', handleThemeChange)
  }, [])

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
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <ForceGraph3D
      ref={graphRef}
      graphData={data}
      backgroundColor={colors.bg}
      /* ---- Node appearance ---- */
      nodeColor={getNodeColor}
      nodeVal={(node: any) => nodeSize(node as GraphNode)}
      nodeLabel={nodeLabel}
      nodeOpacity={0.95}
      nodeResolution={32}
      /* ---- Link appearance ---- */
      linkColor={() => colors.link}
      linkWidth={0.8}
      linkOpacity={0.5}
      /* ---- Interaction ---- */
      onNodeClick={handleNodeClick}
      onNodeDrag={handleNodeDrag}
      onNodeDragEnd={handleNodeDragEnd}
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
  )
}
