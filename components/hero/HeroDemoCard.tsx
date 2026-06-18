'use client'

import { useState, useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function HeroDemoCard() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Listen to document.documentElement's data-theme changes to synchronize visuals
  useEffect(() => {
    const root = document.documentElement
    const getTheme = () =>
      root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    setTheme(getTheme())
    const observer = new MutationObserver(() => setTheme(getTheme()))
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  // Calculate theme-dependent colors dynamically
  const colors = {
    cardBg: theme === 'dark' ? '#111111' : '#f5f5f5',
    border: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    node1Fill: '#b3ec13', // ME — same in both modes
    node1Text: '#000000',
    node2Fill: theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.09)',
    node2Text: theme === 'dark' ? '#EEEEEE' : '#111111',
    node3Fill: theme === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
    node3Text: theme === 'dark' ? '#CCCCCC' : '#333333',
    edgeStroke: theme === 'dark' ? 'rgba(179,236,19,0.3)' : 'rgba(100,150,0,0.25)',
    mutedText: theme === 'dark' ? '#666666' : '#999999',
    statusBg: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  }

  useGSAP(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(
        '#demo-node-me, #demo-node-cg, #demo-node-ds, #demo-edge-1, #demo-edge-2, #demo-status, #demo-context-label, #demo-relevance-me, #demo-relevance-cg, #demo-relevance-ds',
        { opacity: 1 }
      )
      gsap.set('#demo-edge-1', { strokeDashoffset: 0 })
      gsap.set('#demo-edge-2', { strokeDashoffset: 0 })
      return
    }

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 })

    // 0.0s — ME node fades in with scale
    tl.fromTo('#demo-node-me',
      { opacity: 0, scale: 0.6, transformOrigin: '240px 100px' },
      { opacity: 1, scale: 1, duration: 0.55, ease: 'cg-out' }
    )

    // 0.6s — Edge 1 draws from ME to ContextGraph
    tl.to('#demo-edge-1',
      { strokeDashoffset: 0, opacity: 1, duration: 0.45, ease: 'none' },
      '+=0.15'
    )

    // 1.1s — ContextGraph node appears
    tl.fromTo('#demo-node-cg',
      { opacity: 0, scale: 0.6, transformOrigin: '130px 210px' },
      { opacity: 1, scale: 1, duration: 0.45, ease: 'cg-out' },
      '-=0.05'
    )

    // 1.6s — Edge 2 draws from ME to Dev Studio
    tl.to('#demo-edge-2',
      { strokeDashoffset: 0, opacity: 1, duration: 0.4, ease: 'none' },
      '+=0.2'
    )

    // 2.0s — Dev Studio node appears
    tl.fromTo('#demo-node-ds',
      { opacity: 0, scale: 0.6, transformOrigin: '355px 215px' },
      { opacity: 1, scale: 1, duration: 0.4, ease: 'cg-out' },
      '-=0.05'
    )

    // 2.5s — Relevance labels appear (stagger)
    tl.to(
      ['#demo-relevance-me', '#demo-relevance-cg', '#demo-relevance-ds'],
      { opacity: 1, duration: 0.25, stagger: 0.12, ease: 'cg-out' },
      '+=0.3'
    )

    // 3.1s — Status bar slides up and fades in
    tl.fromTo('#demo-status',
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'cg-out' },
      '+=0.2'
    )

    // 3.5s — Context label fades in
    tl.fromTo('#demo-context-label',
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'cg-out' }
    )

    // 3.8s — Hold, then fade everything out for loop reset
    tl.to(
      '#demo-node-me, #demo-node-cg, #demo-node-ds, #demo-edge-1, #demo-edge-2, #demo-status, #demo-context-label, #demo-relevance-me, #demo-relevance-cg, #demo-relevance-ds',
      { opacity: 0, duration: 0.7, ease: 'cg-in' },
      '+=1.8'
    )

    // Reset stroke offsets for next loop
    tl.set('#demo-edge-1', { strokeDashoffset: 220 })
    tl.set('#demo-edge-2', { strokeDashoffset: 200 })

  }, []) // no theme dependency — SVG fill attributes update via React re-render

  return (
    <div
      className="hero-graph-bg cg-float"
      style={{
        width: '100%',
        maxWidth: '480px',
        aspectRatio: '3/2',
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        padding: '0',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 480 320"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        {/* Dot grid background - subtle */}
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle
              cx="1"
              cy="1"
              r="0.8"
              fill={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            />
          </pattern>
        </defs>
        <rect width="480" height="320" fill="url(#dotgrid)" />

        {/* EDGES — rendered behind nodes */}
        <line
          id="demo-edge-1"
          x1="240"
          y1="100"
          x2="130"
          y2="210"
          stroke={colors.edgeStroke}
          strokeWidth="1.5"
          strokeDasharray="220"
          strokeDashoffset="220"
          opacity="0"
        />
        <line
          id="demo-edge-2"
          x1="240"
          y1="100"
          x2="355"
          y2="215"
          stroke={colors.edgeStroke}
          strokeWidth="1.5"
          strokeDasharray="200"
          strokeDashoffset="200"
          opacity="0"
        />

        {/* NODE — ME (root, electric lime) */}
        <g id="demo-node-me" opacity="0">
          <circle cx="240" cy="100" r="32" fill={colors.node1Fill} />
          <text
            x="240"
            y="105"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill={colors.node1Text}
            fontFamily="var(--font-geist, sans-serif)"
          >
            ME
          </text>
          <text
            x="240"
            y="140"
            textAnchor="middle"
            fontSize="10"
            fill="#b3ec13"
            fontFamily="var(--font-geist, sans-serif)"
            id="demo-relevance-me"
            opacity="0"
          >
            95%
          </text>
        </g>

        {/* NODE — ContextGraph */}
        <g id="demo-node-cg" opacity="0">
          <circle cx="130" cy="210" r="24" fill={colors.node2Fill} />
          <text
            x="130"
            y="208"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="600"
            fill={colors.node2Text}
            fontFamily="var(--font-geist, sans-serif)"
          >
            Context
          </text>
          <text
            x="130"
            y="220"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="600"
            fill={colors.node2Text}
            fontFamily="var(--font-geist, sans-serif)"
          >
            Graph
          </text>
          <text
            x="130"
            y="242"
            textAnchor="middle"
            fontSize="9"
            fill="#f59e0b"
            fontFamily="var(--font-geist, sans-serif)"
            id="demo-relevance-cg"
            opacity="0"
          >
            88%
          </text>
        </g>

        {/* NODE — Dev Studio */}
        <g id="demo-node-ds" opacity="0">
          <circle cx="355" cy="215" r="22" fill={colors.node3Fill} />
          <text
            x="355"
            y="213"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="600"
            fill={colors.node3Text}
            fontFamily="var(--font-geist, sans-serif)"
          >
            Dev
          </text>
          <text
            x="355"
            y="224"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="600"
            fill={colors.node3Text}
            fontFamily="var(--font-geist, sans-serif)"
          >
            Studio
          </text>
          <text
            x="355"
            y="246"
            textAnchor="middle"
            fontSize="9"
            fill={colors.mutedText}
            fontFamily="var(--font-geist, sans-serif)"
            id="demo-relevance-ds"
            opacity="0"
          >
            82%
          </text>
        </g>

        {/* STATUS BAR */}
        <g id="demo-status" opacity="0">
          <rect x="14" y="288" width="210" height="20" rx="6" fill={colors.statusBg} />
          <circle cx="26" cy="298" r="3.5" fill="#b3ec13">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <text
            x="36"
            y="302"
            fontSize="9"
            fill="#b3ec13"
            letterSpacing="1"
            fontFamily="var(--font-geist, sans-serif)"
          >
            MCP SERVER ACTIVE
          </text>
        </g>

        {/* CONTEXT INJECT LABEL */}
        <text
          id="demo-context-label"
          x="234"
          y="298"
          fontSize="9"
          fill={colors.mutedText}
          fontFamily="var(--font-mono, monospace)"
          opacity="0"
        >
          Context loaded · 3 nodes · &lt;1s
        </text>
      </svg>
    </div>
  )
}
