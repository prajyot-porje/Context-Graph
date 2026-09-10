'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useEffect, useState } from 'react'
import * as THREE from 'three'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'

// react-force-graph-3d uses Three.js/WebGL — client-only
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
)

interface HeroGraphNode {
  id: string
  label: string
  depth: number // 0 = root, 1 = branch, 2 = leaf
  relevance: number
  scope: string
  x?: number
  y?: number
  z?: number
  fx?: number
  fy?: number
  fz?: number
  __threeObj?: THREE.Object3D
}

interface HeroGraphLink {
  source: string | HeroGraphNode
  target: string | HeroGraphNode
}

interface ScreenLabel {
  id: string
  label: string
  depth: number
  x: number
  y: number
  visible: boolean
}

const HERO_GRAPH_NODES: HeroGraphNode[] = [
  // Root node (ME / Core)
  {
    id: 'me',
    label: 'Developer Core',
    depth: 0,
    relevance: 1.0,
    scope: 'me',
    x: 0,
    y: 0,
    z: 0,
    fx: 0,
    fy: 0,
    fz: 0,
  },

  // Tier 1 branches
  {
    id: 'stack',
    label: 'Tech Stack',
    depth: 1,
    relevance: 0.95,
    scope: 'stack',
    x: -105,
    y: 20,
    z: 0,
    fx: -105,
    fy: 20,
    fz: 0,
  },
  {
    id: 'rules',
    label: 'Coding Rules',
    depth: 1,
    relevance: 0.92,
    scope: 'rules',
    x: 80,
    y: 60,
    z: 0,
    fx: 80,
    fy: 60,
    fz: 0,
  },
  {
    id: 'clients',
    label: 'Connected AIs',
    depth: 1,
    relevance: 0.88,
    scope: 'clients',
    x: -45,
    y: -50,
    z: 0,
    fx: -45,
    fy: -50,
    fz: 0,
  },
  {
    id: 'projects',
    label: 'Active Projects',
    depth: 1,
    relevance: 0.9,
    scope: 'projects',
    x: 85,
    y: -90,
    z: 0,
    fx: 85,
    fy: -90,
    fz: 0,
  },

  // Tier 2 leaves (Stack)
  {
    id: 'typescript',
    label: 'TypeScript Strict',
    depth: 2,
    relevance: 0.92,
    scope: 'stack/typescript',
    x: -160,
    y: 75,
    z: 0,
    fx: -160,
    fy: 75,
    fz: 0,
  },
  {
    id: 'postgres',
    label: 'PostgreSQL DB',
    depth: 2,
    relevance: 0.9,
    scope: 'stack/postgres',
    x: -95,
    y: 115,
    z: 0,
    fx: -95,
    fy: 115,
    fz: 0,
  },
  {
    id: 'nextjs',
    label: 'Next.js 15',
    depth: 2,
    relevance: 0.95,
    scope: 'stack/nextjs',
    x: -35,
    y: 80,
    z: 0,
    fx: -35,
    fy: 80,
    fz: 0,
  },

  // Tier 2 leaves (Rules)
  {
    id: 'clean_arch',
    label: 'Clean Architecture',
    depth: 2,
    relevance: 0.9,
    scope: 'rules/architecture',
    x: 55,
    y: 110,
    z: 0,
    fx: 55,
    fy: 110,
    fz: 0,
  },
  {
    id: 'design_tokens',
    label: 'Design Tokens',
    depth: 2,
    relevance: 0.85,
    scope: 'rules/tokens',
    x: 170,
    y: 60,
    z: 0,
    fx: 170,
    fy: 60,
    fz: 0,
  },

  // Tier 2 leaves (Clients)
  {
    id: 'cursor',
    label: 'Cursor IDE',
    depth: 2,
    relevance: 0.85,
    scope: 'clients/cursor',
    x: -145,
    y: -65,
    z: 0,
    fx: -145,
    fy: -65,
    fz: 0,
  },
  {
    id: 'claude',
    label: 'Claude Code',
    depth: 2,
    relevance: 0.85,
    scope: 'clients/claude',
    x: -120,
    y: -125,
    z: 0,
    fx: -120,
    fy: -125,
    fz: 0,
  },

  // Tier 2 leaves (Projects)
  {
    id: 'api_service',
    label: 'Core API Service',
    depth: 2,
    relevance: 0.88,
    scope: 'projects/api',
    x: 20,
    y: -145,
    z: 0,
    fx: 20,
    fy: -145,
    fz: 0,
  },
  {
    id: 'saas_platform',
    label: 'Production SaaS',
    depth: 2,
    relevance: 0.95,
    scope: 'projects/saas',
    x: 130,
    y: -135,
    z: 0,
    fx: 130,
    fy: -135,
    fz: 0,
  },
]

const HERO_GRAPH_LINKS: HeroGraphLink[] = [
  { source: 'me', target: 'stack' },
  { source: 'me', target: 'rules' },
  { source: 'me', target: 'clients' },
  { source: 'me', target: 'projects' },
  { source: 'stack', target: 'typescript' },
  { source: 'stack', target: 'postgres' },
  { source: 'stack', target: 'nextjs' },
  { source: 'rules', target: 'clean_arch' },
  { source: 'rules', target: 'design_tokens' },
  { source: 'clients', target: 'cursor' },
  { source: 'clients', target: 'claude' },
  { source: 'projects', target: 'api_service' },
  { source: 'projects', target: 'saas_platform' },
]

const THEME_COLORS = {
  dark: {
    root: '#b3ec13',
    branch: '#f0f0f0',
    leaf: '#888888',
    link: 'rgba(255, 255, 255, 0.12)',
    linkActive: 'rgba(179, 236, 19, 0.4)',
    bg: '#080808',
  },
  light: {
    root: '#b3ec13',
    branch: '#0a0a0a',
    leaf: '#666666',
    link: 'rgba(0, 0, 0, 0.10)',
    linkActive: 'rgba(179, 236, 19, 0.4)',
    bg: '#ffffff',
  },
}

export function HeroGraph3D() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const animFrameRef = useRef<number>(0)
  const hasCenteredRef = useRef(false)

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredNode, setHoveredNode] = useState<HeroGraphNode | null>(null)
  const [screenLabels, setScreenLabels] = useState<ScreenLabel[]>([])

  // Watch for theme flips
  useEffect(() => {
    const checkTheme = () => {
      const current = (document.documentElement.getAttribute('data-theme') || 'dark') as 'dark' | 'light'
      setTheme(current)
    }
    checkTheme()

    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    window.addEventListener('cg-theme-change', checkTheme)

    return () => {
      observer.disconnect()
      window.removeEventListener('cg-theme-change', checkTheme)
    }
  }, [])

  // Track container dimensions via ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) })
        }
      }
    })

    ro.observe(el)
    const { width, height } = el.getBoundingClientRect()
    if (width > 0 && height > 0) setDimensions({ width: Math.floor(width), height: Math.floor(height) })

    return () => ro.disconnect()
  }, [])

  // Configure OrbitControls: stable by default, user-interactive only
  useEffect(() => {
    const timer = setTimeout(() => {
      const fg = graphRef.current
      if (!fg || typeof fg.controls !== 'function') return
      const ctrl = fg.controls()
      if (!ctrl) return

      ctrl.enableRotate = true
      ctrl.enablePan = true
      ctrl.enableZoom = true
      ctrl.autoRotate = false   // Stable — no automatic rotation
      ctrl.enableDamping = true
      ctrl.dampingFactor = 0.08

      // Safe pointer event wrapping to prevent drag crash
      const origUp = ctrl._onPointerUp
      if (typeof origUp === 'function') {
        ctrl._onPointerUp = (e: Event) => {
          try {
            origUp.call(ctrl, e)
          } catch {
            try { (ctrl._pointers as unknown[]).length = 0 } catch {}
          }
        }
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [])

  // Projection tick: project 3D node positions into 2D CSS screen coordinates
  useEffect(() => {
    let active = true

    const tick = () => {
      const fg = graphRef.current
      if (!fg || !containerRef.current || dimensions.width === 0) {
        if (active) animFrameRef.current = requestAnimationFrame(tick)
        return
      }

      const labels: ScreenLabel[] = []
      const nodes = HERO_GRAPH_NODES

      for (const node of nodes) {
        try {
          const coords = fg.graph2ScreenCoords?.(node.x ?? 0, node.y ?? 0, node.z ?? 0)
          if (!coords) continue

          const { x, y } = coords
          // Cull labels that leave container bounds with margin
          if (x < -30 || x > dimensions.width + 30 || y < -30 || y > dimensions.height + 30) continue

          labels.push({
            id: node.id,
            label: node.label,
            depth: node.depth,
            x,
            y,
            visible: true,
          })
        } catch {
          // Ignore warmup frame projection errors
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
  }, [dimensions])

  // Center view on engine stop
  const handleEngineStop = useCallback(() => {
    if (hasCenteredRef.current) return
    hasCenteredRef.current = true
    graphRef.current?.zoomToFit?.(400, 45)
  }, [])

  // Auto-center camera nicely once container dimensions are measured
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const timer = setTimeout(() => {
        graphRef.current?.zoomToFit?.(400, 45)
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [dimensions])

  // Drag: pin node at the position the user drops it (static placement)
  const handleNodeDrag = useCallback((node: any) => {
    node.fx = node.x
    node.fy = node.y
    node.fz = node.z
  }, [])

  const handleNodeDragEnd = useCallback((node: any) => {
    if (node) {
      // Keep pinned at the drop location — user placement is preserved
      node.fx = node.x
      node.fy = node.y
      node.fz = node.z
    }
  }, [])

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node as HeroGraphNode | null)
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'grab' : 'default'
    }
  }, [])

  // Camera toolbar helpers
  const fitView = useCallback(() => graphRef.current?.zoomToFit?.(400, 40), [])
  const zoomIn = useCallback(() => { const fg = graphRef.current; if (fg) fg.zoom(fg.zoom() * 1.3, 300) }, [])
  const zoomOut = useCallback(() => { const fg = graphRef.current; if (fg) fg.zoom(fg.zoom() / 1.3, 300) }, [])

  const colors = THEME_COLORS[theme]

  const getNodeColor = useCallback((node: any) => {
    if (node.depth === 0) return colors.root
    if (node.depth === 1) return colors.branch
    return colors.leaf
  }, [colors])

  const getNodeVal = useCallback((node: any) => {
    if (node.depth === 0) return 7
    if (node.depth === 1) return 4.5
    return 3
  }, [])

  const canRender = dimensions.width > 0 && dimensions.height > 0

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[350px] lg:min-h-[450px] select-none overflow-hidden"
    >
      {canRender && (
        <ForceGraph3D
          ref={graphRef}
          graphData={{ nodes: HERO_GRAPH_NODES, links: HERO_GRAPH_LINKS }}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeVal={getNodeVal}
          nodeColor={getNodeColor}
          nodeResolution={24}
          nodeOpacity={0.95}
          nodeLabel={() => ''} // Handled via CSS overlay
          linkColor={() => colors.link}
          linkWidth={1.2}
          linkOpacity={0.6}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          onNodeHover={handleNodeHover}
          enableNavigationControls={false}
          enablePointerInteraction={true}
          controlType="orbit"
          cooldownTicks={1}
          warmupTicks={0}
          onEngineStop={handleEngineStop}
          showNavInfo={false}
        />
      )}

      {/* Screen-Projected CSS Labels */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {screenLabels.map((lbl) => {
          const isRoot = lbl.depth === 0
          const isBranch = lbl.depth === 1
          const isHovered = hoveredNode?.id === lbl.id

          const offsetY = isRoot ? -24 : isBranch ? -20 : -16

          return (
            <div
              key={lbl.id}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none transition-transform duration-75 ease-out whitespace-nowrap',
                isHovered ? 'scale-110 z-30' : isRoot ? 'z-20' : isBranch ? 'z-10' : 'z-0'
              )}
              style={{
                left: `${lbl.x}px`,
                top: `${lbl.y + offsetY}px`,
              }}
            >
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border font-mono leading-none tracking-wide transition-[border-color,background-color,color] duration-150',
                  isRoot
                    ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)] font-bold text-[10px] [box-shadow:var(--shadow-xs)]'
                    : isBranch
                    ? 'border-[var(--border-strong)] bg-[var(--card)]/90 text-[var(--text-primary)] font-semibold text-[10px] [box-shadow:var(--shadow-xs)]'
                    : 'border-[var(--border)] bg-[var(--surface)]/85 text-[var(--text-secondary)] font-medium text-[9px]'
                )}
              >
                {isRoot && <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                <span>{lbl.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Minimalist Floating Controls Toolbar */}
      <div className="absolute bottom-3.5 right-3.5 z-30 flex flex-col gap-1">
        <button
          onClick={fitView}
          title="Reset View"
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md text-[var(--text-secondary)] shadow-[var(--shadow-xs)] transition-[color,background-color,border-color] duration-150 hover:bg-[var(--card-raised)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-95 cursor-pointer"
          aria-label="Reset View"
        >
          <Maximize2 size={12} strokeWidth={1.75} />
        </button>
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md text-[var(--text-secondary)] shadow-[var(--shadow-xs)] transition-[color,background-color,border-color] duration-150 hover:bg-[var(--card-raised)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-95 cursor-pointer"
          aria-label="Zoom In"
        >
          <ZoomIn size={12} strokeWidth={1.75} />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md text-[var(--text-secondary)] shadow-[var(--shadow-xs)] transition-[color,background-color,border-color] duration-150 hover:bg-[var(--card-raised)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-95 cursor-pointer"
          aria-label="Zoom Out"
        >
          <ZoomOut size={12} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
