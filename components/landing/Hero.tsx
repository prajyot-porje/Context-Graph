'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'
import { Network, Terminal, Shield, Layers } from 'lucide-react'
import Link from 'next/link'

interface AIClient {
  id: string
  name: string
  logoSrc: string
  y: number // Y-coordinate center for connection path
}

export function Hero() {
  const containerRef = useRef<HTMLElement>(null)
  const [activeClient, setActiveClient] = useState<string>('claude')
  const [isHovered, setIsHovered] = useState(false)

  // Auto-cycle active client node to make the page feel alive
  useEffect(() => {
    if (isHovered) return
    const clients = ['claude', 'chatgpt', 'gemini', 'antigravity', 'claudecode']
    const interval = setInterval(() => {
      setActiveClient(prev => {
        const idx = clients.indexOf(prev)
        return clients[(idx + 1) % clients.length]
      })
    }, 3200)
    return () => clearInterval(interval)
  }, [isHovered])

  // GSAP Entrance Animations
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(
          '.hero-eyebrow, .hero-title-line, .hero-subtitle, .hero-cta, .hero-visual-wrapper',
          { opacity: 1, y: 0 }
        )
        return
      }

      const tl = gsap.timeline({ delay: 0.1 })

      // Eyebrow badge fade-in
      tl.from('.hero-eyebrow', {
        opacity: 0,
        y: 12,
        duration: DUR.normal,
        ease: 'cg-out',
      })

      // Title lines slide-up and fade
      tl.from('.hero-title-line', {
        opacity: 0,
        y: 28,
        duration: DUR.slow,
        ease: 'cg-out',
        stagger: 0.08,
      }, '-=0.1')

      // Subtitle
      tl.from('.hero-subtitle', {
        opacity: 0,
        y: 16,
        duration: DUR.moderate,
        ease: 'cg-out',
      }, '-=0.25')

      // CTA Buttons
      tl.from('.hero-cta > *', {
        opacity: 0,
        y: 12,
        duration: DUR.normal,
        ease: 'cg-spring',
        stagger: 0.08,
      }, '-=0.2')

      // Visual Component Wrapper
      tl.from('.hero-visual-wrapper', {
        opacity: 0,
        scale: 0.97,
        duration: DUR.slow,
        ease: 'cg-out',
      }, '-=0.3')
    },
    { scope: containerRef }
  )

  const aiClients: AIClient[] = [
    {
      id: 'claude',
      name: 'Claude',
      y: 55,
      logoSrc: '/images/claude.png'
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      y: 140,
      logoSrc: '/images/ChatGPT.png'
    },
    {
      id: 'gemini',
      name: 'Gemini',
      y: 225,
      logoSrc: '/images/gemini.png'
    },
    {
      id: 'antigravity',
      name: 'Antigravity',
      y: 310,
      logoSrc: '/images/antigravity.png'
    },
    {
      id: 'claudecode',
      name: 'Claude Code',
      y: 395,
      logoSrc: '/images/claudecode.png'
    }
  ]

  // Mock payload updates based on active client
  const getMockSyncDetail = (clientId: string) => {
    switch (clientId) {
      case 'claude': return { action: 'READ', scope: 'me/profile', size: '1.2kb' }
      case 'chatgpt': return { action: 'SYNC', scope: 'projects/taskflow', size: '2.8kb' }
      case 'gemini': return { action: 'QUERY', scope: 'skills/backend', size: '0.9kb' }
      case 'antigravity': return { action: 'SYNC', scope: 'identity/focus', size: '1.5kb' }
      case 'claudecode': return { action: 'WRITE', scope: 'projects/active', size: '0.6kb' }
      default: return { action: 'IDLE', scope: 'none', size: '0kb' }
    }
  }

  const activeSync = getMockSyncDetail(activeClient)

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[calc(100dvh-60px)] lg:h-[calc(100dvh-60px)] w-full flex-col items-center justify-center overflow-hidden bg-[var(--bg)] px-[var(--space-6)] py-12 lg:py-0"
    >
      {/* Subtle top-center atmospheric radial highlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% -10%, rgba(255, 255, 255, 0.03) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Tactile Noise Grain Overlay */}
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.02] mix-blend-overlay" aria-hidden="true">
        <filter id="hero-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-noise)" />
      </svg>

      {/* Grid container separating visualizer and content */}
      <div className="relative z-10 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full max-w-[1200px]">
        
        {/* Left Column: Premium Editorial Copy */}
        <div className="lg:col-span-6 flex flex-col text-left items-start">
          
          {/* Eyebrow label - no neon, extremely minimal */}
          <div className="hero-eyebrow mb-[var(--space-5)] flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--badge-default-bg)] px-[var(--space-4)] py-[6px] shadow-[var(--shadow-xs)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.3)] shrink-0" />
            <span className="text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.08em]">
              Cross-AI Context Engine
            </span>
          </div>

          {/* Headline - strict freigeist Display, neutral zinc, 2 lines */}
          <h1
            className="hero-title text-display-xl text-[var(--text-primary)] font-bold tracking-[-0.03em] uppercase text-left mb-6"
            style={{ perspective: '1000px', lineHeight: '1.0' }}
          >
            <span className="hero-title-line block">One Context Graph.</span>
            <span className="hero-title-line block text-[var(--text-secondary)]">Every AI Client.</span>
          </h1>

          {/* Subtext - under 20 words for viewport fit */}
          <p className="hero-subtitle max-w-xl text-body-lg text-[var(--text-secondary)] leading-relaxed font-normal mb-8">
            Create a unified context graph. Feed active guidelines, preferences, and project files directly to all coding models.
          </p>

          {/* Grayscale CTAs with nested trailing icon circle */}
          <div className="hero-cta flex flex-wrap items-center gap-[var(--space-4)]">
            <Link href="/dashboard" passHref className="inline-block">
              <button
                className="min-h-11 px-5 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-[14px] transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] inline-flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Start Building
                {/* Button-in-button circle icon */}
                <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-black/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                  ↗
                </span>
              </button>
            </Link>
            <Link href="/docs" passHref className="inline-block">
              <button
                className="min-h-11 px-6 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] font-medium text-[14px] transition-[border-color,background-color,transform] duration-150 ease-out hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.03)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Explore Protocol
              </button>
            </Link>
          </div>
        </div>

        {/* Right Column: Node Connection Diagram (Main Component) */}
        <div className="hero-visual-wrapper lg:col-span-6 w-full flex items-center justify-center">
          {/* Double-Bezel Outer Shell */}
          <div className="w-full max-w-[520px] rounded-[2rem] p-2 bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/5 shadow-2xl relative">
            {/* Double-Bezel Inner Core */}
            <div
              className="relative w-full h-[450px] rounded-[calc(2rem-8px)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-white/[0.02] flex items-center justify-center select-none overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{ boxShadow: 'var(--shadow-inset)' }}
            >
              {/* Background grid dot overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />

              {/* SVG Path Canvas for flow lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 500 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Active Path pulse gradient */}
                  <linearGradient id="active-line-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--border-strong)" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
                  </linearGradient>
                  {/* MCP to Database Sync gradient */}
                  <linearGradient id="mcp-db-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Draw curved lines from each client center to MCP Host */}
                {aiClients.map(client => {
                  const isActive = activeClient === client.id
                  return (
                    <g key={client.id}>
                      {/* Base background line */}
                      <path
                        d={`M 155 ${client.y} C 195 ${client.y}, 195 225, 230 225`}
                        stroke={isActive ? 'var(--accent)' : 'var(--border)'}
                        strokeWidth={isActive ? '1.5' : '1'}
                        className="transition-[stroke,stroke-width] duration-300"
                        opacity={isActive ? 0.7 : 0.15}
                      />
                      {/* Moving pulse overlay (only active path has dash animation) */}
                      {isActive && (
                        <path
                          d={`M 155 ${client.y} C 195 ${client.y}, 195 225, 230 225`}
                          stroke="url(#active-line-pulse)"
                          strokeWidth="2"
                          strokeDasharray="6 12"
                          className="cg-dash-flow"
                        />
                      )}
                    </g>
                  )
                })}

                {/* Draw line from MCP Host to Graph Data */}
                <path
                  d="M 295 225 H 373"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  className="transition-opacity duration-300"
                  opacity={0.6}
                />
                <path
                  d="M 295 225 H 373"
                  stroke="url(#mcp-db-pulse)"
                  strokeWidth="2"
                  strokeDasharray="4 8"
                  className="cg-dash-flow"
                />

                {/* Draw helper lines from Graph Node center to context sub-nodes */}
                <line x1="410" y1="225" x2="350" y2="150" stroke="var(--border)" strokeWidth="0.75" opacity={0.3} />
                <line x1="410" y1="225" x2="470" y2="160" stroke="var(--border)" strokeWidth="0.75" opacity={0.3} />
                <line x1="410" y1="225" x2="350" y2="300" stroke="var(--border)" strokeWidth="0.75" opacity={0.3} />
                <line x1="410" y1="225" x2="470" y2="290" stroke="var(--border)" strokeWidth="0.75" opacity={0.3} />
              </svg>

              {/* 1. Client Nodes (Left) */}
              {aiClients.map(client => {
                const isActive = activeClient === client.id
                return (
                  <div
                    key={client.id}
                    onMouseEnter={() => {
                      setActiveClient(client.id)
                      setIsHovered(true)
                    }}
                    style={{
                      left: '5%',
                      top: `${client.y}px`,
                      transform: 'translateY(-50%)',
                      position: 'absolute'
                    }}
                    className={`w-[130px] h-[46px] rounded-[var(--radius-md)] border px-3 flex items-center gap-2.5 transition-all duration-200 cursor-pointer z-20 group ${
                      isActive
                        ? 'border-[var(--accent)] bg-[rgba(179,236,19,0.02)] [box-shadow:var(--shadow-accent),var(--shadow-inset)] translate-x-1 scale-[1.02]'
                        : 'border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center p-1 shrink-0 transition-all duration-200 ${
                      isActive
                        ? 'border-[var(--accent)] bg-[rgba(179,236,19,0.05)]'
                        : 'border-[var(--border)] bg-[rgba(255,255,255,0.02)]'
                    }`}>
                      <img
                        src={client.logoSrc}
                        className={`w-full h-full object-contain transition-all duration-300 ${
                          isActive ? 'scale-105 opacity-100' : 'opacity-50 group-hover:opacity-85'
                        }`}
                        alt={client.name}
                      />
                    </div>
                    <span className={`text-[11px] font-sans font-semibold tracking-tight transition-colors duration-200 ${
                      isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    }`}>
                      {client.name}
                    </span>
                  </div>
                )
              })}

              {/* 2. MCP Host Node (Center-Right) */}
              <div
                style={{ left: '46%', top: '225px', transform: 'translate(-50%, -50%)' }}
                className="absolute z-20"
              >
                {/* Double bezel shell */}
                <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-[4px] shadow-[var(--shadow-md)]">
                  <div
                    className="rounded-[calc(var(--radius-xl)-4px)] px-3 py-2.5 flex flex-col items-center justify-center gap-1 min-w-[125px] transition-all duration-300"
                    style={{
                      background: 'linear-gradient(180deg, var(--card-raised) 0%, var(--card) 100%)',
                      boxShadow: 'var(--shadow-inset)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]"></span>
                      </span>
                      <span className="text-[9px] font-mono font-bold tracking-[0.06em] text-[var(--text-primary)] uppercase">
                        MCP Host
                      </span>
                    </div>
                    {/* Sync status box */}
                    <div className="px-2 py-0.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[8px] font-mono text-[var(--text-secondary)] flex items-center gap-1 select-none">
                      <span className="text-[var(--accent)] font-semibold">{activeSync.action}</span>
                      <span className="opacity-40">·</span>
                      <span className="truncate max-w-[50px]">{activeSync.scope}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Central Context Graph Node (Right) */}
              <div
                style={{ left: '82%', top: '225px', transform: 'translate(-50%, -50%)' }}
                className="absolute z-20 flex flex-col items-center gap-1"
              >
                <div className="w-[74px] h-[74px] rounded-full border border-[var(--border)] bg-[var(--bg)] flex flex-col items-center justify-center shadow-[var(--shadow-lg)] relative">
                  {/* Floating ambient glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_0%,transparent_60%)] rounded-full animate-pulse pointer-events-none" />
                  <Network size={20} className="text-[var(--text-secondary)] mb-0.5" />
                  <span className="text-[9px] font-mono text-[var(--text-secondary)] font-bold tracking-wider">GRAPH</span>
                </div>
              </div>

              {/* 4. Sub-nodes surrounding the Graph Node */}
              {/* Identity node (Top-Left) */}
              <div
                style={{ left: '70%', top: '150px', transform: 'translate(-50%, -50%)' }}
                className="absolute z-20 flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-full px-2 py-0.5 shadow-sm scale-90"
              >
                <span className="text-[8px] font-mono text-[var(--text-secondary)]">identity</span>
              </div>

              {/* Projects node (Top-Right) */}
              <div
                style={{ left: '94%', top: '160px', transform: 'translate(-50%, -50%)' }}
                className="absolute z-20 flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-full px-2 py-0.5 shadow-sm scale-90"
              >
                <span className="text-[8px] font-mono text-[var(--text-secondary)]">projects</span>
              </div>

              {/* Skills node (Bottom-Left) */}
              <div
                style={{ left: '70%', top: '300px', transform: 'translate(-50%, -50%)' }}
                className="absolute z-20 flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-full px-2 py-0.5 shadow-sm scale-90"
              >
                <span className="text-[8px] font-mono text-[var(--text-secondary)]">skills</span>
              </div>

              {/* Rules node (Bottom-Right) */}
              <div
                style={{ left: '94%', top: '290px', transform: 'translate(-50%, -50%)' }}
                className="absolute z-20 flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-full px-2 py-0.5 shadow-sm scale-90"
              >
                <span className="text-[8px] font-mono text-[var(--text-secondary)]">rules</span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
