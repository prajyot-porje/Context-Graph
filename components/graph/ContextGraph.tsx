'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import dynamic from 'next/dynamic'
import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import type { GraphData, GraphNode } from '@/lib/graph-utils'

// react-force-graph-2d must be client-only, no SSR
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
)

interface Props {
  data: GraphData
  onNodeClick: (node: GraphNode) => void
  selectedNodeId?: string | null
  relevanceFilter?: number // 0.0 to 1.0 (hide nodes below this)
  showLabels?: boolean
  autoRotate?: boolean // Orbit rotation simulator
  zoomTrigger?: number // Trigger key to fit graph viewport
}


const THEME_COLORS = {
  dark: {
    bg: '#080808',
    accent: '#b3ec13',
    accentMuted: 'rgba(179, 236, 19, 0.15)',
    root: '#b3ec13',
    agency: '#ffffff',
    project: '#888888',
    link: 'rgba(255, 255, 255, 0.08)',
    linkActive: 'rgba(179, 236, 19, 0.4)',
    selectedGlow: 'rgba(179, 236, 19, 0.25)',
    text: '#F0F0F0',
    textMuted: '#888888',
    tooltip: {
      bg: '#111111',
      border: 'rgba(255,255,255,0.12)',
      text: '#F0F0F0',
      subtext: '#888888',
      shadow: '0 4px 12px rgba(0,0,0,0.4)',
    },
  },
  light: {
    bg: '#F8F8F8',
    accent: '#9fd411',
    accentMuted: 'rgba(159, 212, 17, 0.15)',
    root: '#9fd411',
    agency: '#111111',
    project: '#666666',
    link: 'rgba(0, 0, 0, 0.06)',
    linkActive: 'rgba(159, 212, 17, 0.3)',
    selectedGlow: 'rgba(159, 212, 17, 0.2)',
    text: '#0A0A0A',
    textMuted: '#666666',
    tooltip: {
      bg: '#ffffff',
      border: 'rgba(0,0,0,0.08)',
      text: '#0a0a0a',
      subtext: '#666666',
      shadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
  },
} as const

type ThemeMode = 'dark' | 'light'

function getTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark'
  return (document.documentElement.getAttribute('data-theme') as ThemeMode) || 'dark'
}

export default function ContextGraph({
  data,
  onNodeClick,
  selectedNodeId,
  relevanceFilter = 0,
  showLabels = true,
  autoRotate = false,
  zoomTrigger = 0,
}: Props) {
  const graphRef = useRef<any>(null)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Track dash flow animation offset
  const [animationOffset, setAnimationOffset] = useState(0)

  // Sync theme
  useEffect(() => {
    setTheme(getTheme())
    const handleThemeChange = () => setTheme(getTheme())
    window.addEventListener('cg-theme-change', handleThemeChange)
    return () => window.removeEventListener('cg-theme-change', handleThemeChange)
  }, [])

  // Auto-resize graph to container
  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width, height })
      }
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Link animated flow offset loop
  useEffect(() => {
    let animationId: number
    const animate = () => {
      setAnimationOffset((prev) => (prev + 0.01) % 1)
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [])

  const colors = THEME_COLORS[theme]

  // Filter nodes & links based on relevance
  const filteredData = useMemo(() => {
    const nodes = data.nodes.filter((n) => n.relevance >= relevanceFilter)
    const nodeIds = new Set(nodes.map((n) => n.id))
    const links = data.links.filter(
      (l) => {
        const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source
        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target
        return nodeIds.has(sourceId) && nodeIds.has(targetId)
      }
    )
    return { nodes, links }
  }, [data, relevanceFilter])

  // Zoom-to-fit trigger
  useEffect(() => {
    if (graphRef.current && filteredData.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(450, 55)
      }, 80)
    }
  }, [data, zoomTrigger])

  // Custom simulation forces configuration to declutter layout
  useEffect(() => {
    if (!graphRef.current) return
    const fg = graphRef.current
    
    const chargeForce = fg.d3Force('charge')
    if (chargeForce) {
      chargeForce.strength(-180)
    }
    
    const linkForce = fg.d3Force('link')
    if (linkForce) {
      linkForce.distance(80)
    }
  }, [filteredData])


  // Custom node rendering on HTML5 Canvas
  const drawNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Safeguard against NaN/undefined coordinates during initial D3 physics ticks
      if (!node || typeof node.x !== 'number' || typeof node.y !== 'number' || !isFinite(node.x) || !isFinite(node.y)) {
        return
      }

      const isSelected = node.id === selectedNodeId
      const relevance = node.relevance ?? 0.5
      
      // Determine radius based on node depth (ME > Agency > Project)
      const baseRadius = node.depth === 0 ? 9 : node.depth === 1 ? 6.5 : 4.5
      const radius = baseRadius + relevance * 1.5

      ctx.save()

      // 1. Draw relevance glow halo
      if (relevance > 0.4) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 5 + relevance * 4, 0, 2 * Math.PI)
        const gradient = ctx.createRadialGradient(
          node.x, node.y, radius - 1,
          node.x, node.y, radius + 5 + relevance * 4
        )
        const haloColor = isSelected ? colors.selectedGlow : colors.accentMuted
        gradient.addColorStop(0, haloColor)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // 2. Draw selection active border
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 2.5, 0, 2 * Math.PI)
        ctx.strokeStyle = colors.accent
        ctx.lineWidth = 1.5 / Math.min(2, globalScale) // scaling border width
        ctx.stroke()
      }

      // 3. Draw outer shadow ring for cards physical slab effect (overhead light mockup)
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetY = 1.5

      // 4. Fill node base circle
      let fillColor: string = colors.project
      if (node.depth === 0) fillColor = colors.root
      else if (node.depth === 1) fillColor = colors.agency

      ctx.fillStyle = fillColor
      ctx.fill()

      // Reset shadows
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // 5. Draw inner circle overlay to look premium (concentric styling)
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius * 0.5, 0, 2 * Math.PI)
      ctx.fillStyle = isSelected 
        ? '#080808' 
        : node.depth === 0 
          ? '#080808' 
          : 'rgba(0,0,0,0.15)'
      ctx.fill()

      // 6. Draw labels
      if (showLabels) {
        const label = node.label || ''
        const fontSize = Math.max(3.5, 11 / Math.sqrt(globalScale))
        ctx.font = `${node.depth === 0 ? '600' : '400'} ${fontSize}px 'Geist Sans', 'Inter', system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        // Text color matches selection or relevance scale
        ctx.fillStyle = isSelected 
          ? colors.accent 
          : node.depth === 2 
            ? colors.textMuted 
            : colors.text

        // Text offset below circle
        ctx.fillText(label, node.x, node.y + radius + 3.5)
      }

      ctx.restore()
    },
    [selectedNodeId, colors, showLabels]
  )

  // Custom Link rendering with animated flow particles
  const drawLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source
      const end = link.target

      if (typeof start !== 'object' || typeof end !== 'object') return
      if (typeof start.x !== 'number' || typeof start.y !== 'number' || typeof end.x !== 'number' || typeof end.y !== 'number') return
      if (!isFinite(start.x) || !isFinite(start.y) || !isFinite(end.x) || !isFinite(end.y)) return

      const isConnectedToSelected = start.id === selectedNodeId || end.id === selectedNodeId
      const linkColor = isConnectedToSelected ? colors.linkActive : colors.link
      const lineWidth = isConnectedToSelected 
        ? 1.5 / Math.min(2, globalScale) 
        : 0.8 / Math.min(2, globalScale)

      ctx.save()

      // Draw standard line
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.strokeStyle = linkColor
      ctx.lineWidth = lineWidth
      ctx.stroke()

      // Draw animated energy pulse particle flowing along link line
      // Flow goes from parent node to child node (source -> target)
      const particleCount = 1
      for (let i = 0; i < particleCount; i++) {
        const t = (animationOffset + (i / particleCount)) % 1
        const px = start.x + (end.x - start.x) * t
        const py = start.y + (end.y - start.y) * t

        ctx.beginPath()
        ctx.arc(px, py, 1.8 / Math.min(2, globalScale), 0, 2 * Math.PI)
        ctx.fillStyle = colors.accent
        ctx.shadowColor = colors.accent
        ctx.shadowBlur = 4
        ctx.fill()
      }

      ctx.restore()
    },
    [selectedNodeId, colors, animationOffset]
  )

  // Tooltip formatter
  const formatNodeTooltip = useCallback(
    (node: any) => {
      const t = colors.tooltip
      const relevancePercentage = Math.round((node.relevance ?? 0.5) * 100)
      const tier = node.depth === 0 ? 'Root Tier' : node.depth === 1 ? 'Agency Tier' : 'Project Tier'
      return `
        <div style="
          font-family: var(--font-sans, system-ui, sans-serif);
          background: ${t.bg};
          border: 1px solid ${t.border};
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: ${t.text};
          max-width: 240px;
          box-shadow: ${t.shadow};
        ">
          <div style="font-weight:600; font-size: 14px; margin-bottom: 4px; color: ${colors.accent};">${node.label}</div>
          <div style="font-mono; font-size: 11px; color: ${colors.textMuted}; margin-bottom: 8px;">scope: ${node.scope}</div>
          <div style="display: flex; justify-content: space-between; gap: 12px; font-size: 11px; margin-bottom: 4px;">
            <span style="color: ${colors.textMuted};">${tier}</span>
            <span style="font-weight: 600; color: ${colors.text};">${relevancePercentage}% relevance</span>
          </div>
          <div style="font-size: 11px; line-height: 1.4; color: ${colors.textMuted}; border-top: 1px solid ${t.border}; pt-6 mt-6 pt-[6px] mt-[6px]">
            ${node.content ? node.content.substring(0, 70) + (node.content.length > 70 ? '...' : '') : 'No description'}
          </div>
        </div>
      `
    },
    [colors]
  )

  const handleNodeClick = useCallback(
    (node: any) => {
      onNodeClick(node as GraphNode)
    },
    [onNodeClick]
  )


  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ minHeight: '300px' }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={filteredData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={colors.bg}
        minZoom={0.5}
        maxZoom={3.0}
        
        // Node / Link custom render
        nodeCanvasObject={drawNode}
        linkCanvasObject={drawLink}
        nodeLabel={formatNodeTooltip}
        
        // Interaction Handlers
        onNodeClick={handleNodeClick}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enablePointerInteraction={true}
        
        // Physics settings for high-fidelity spring effect
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.25}
        cooldownTicks={120}
        
        // Custom Forces to organize graph beautifully
        onEngineStop={() => {
          // Fit graph on initial load
          if (graphRef.current && filteredData.nodes.length > 0) {
            graphRef.current.zoomToFit(400, 60)
          }
        }}
      />
    </div>
  )
}
