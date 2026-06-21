'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Terminal, Network, RefreshCw, Layers } from 'lucide-react'

export function Features() {
  const container = useRef<HTMLElement>(null)
  const [decayScore, setDecayScore] = useState(0.95)

  // Simulation of relevance decay score animation
  useEffect(() => {
    if (prefersReducedMotion()) return
    const interval = setInterval(() => {
      setDecayScore(prev => {
        if (prev <= 0.65) return 0.95
        return parseFloat((prev - 0.05).toFixed(2))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.feature-header, .bento-tile', { opacity: 1, y: 0 })
        return
      }

      const trigger = {
        trigger: container.current,
        start: 'top 85%',
        once: true,
      }

      gsap.from('.feature-header', {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: 'cg-out',
        scrollTrigger: trigger,
      })

      gsap.from('.bento-tile', {
        opacity: 0,
        y: 32,
        duration: 0.5,
        ease: 'cg-out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.bento-grid',
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: container }
  )

  return (
    <section ref={container} className="relative py-[var(--space-24)]">
      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        {/* Section Header */}
        <div className="feature-header mb-[var(--space-16)]">
          <h2 className="text-display-lg max-w-[600px] text-[var(--text-primary)] font-bold">
            Context that travels with you
          </h2>
          <p className="mt-[var(--space-4)] max-w-[500px] text-body-md text-[var(--text-secondary)]">
            A single, self-updating graph that feeds your identity, guidelines, and project specifications directly to your AI.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="bento-grid grid grid-cols-1 md:grid-cols-3 gap-[var(--space-6)]">
          
          {/* Tile 1: Build once, use everywhere (Large, span-2) */}
          <div className="bento-tile col-span-1 md:col-span-2 group relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-8)] shadow-[var(--shadow-sm)] shadow-[var(--shadow-inset)] overflow-hidden transition-[border-color,box-shadow] duration-200 ease-out hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
            {/* Ambient subtle glow background */}
            <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-[rgba(179,236,19,0.015)] blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row h-full gap-8 relative z-10">
              {/* Text Area */}
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] group-hover:scale-105 transition-transform duration-200">
                    <Layers size={18} />
                  </div>
                  <h3 className="mt-[var(--space-6)] text-heading-lg text-[var(--text-primary)] font-bold tracking-tight">
                    Build once, use everywhere
                  </h3>
                  <p className="mt-[var(--space-2)] text-body-md text-[var(--text-secondary)]">
                    Create your profile and guidelines. Every MCP-compatible assistant reads from the same structured Graph in your database, preventing context fragmentation.
                  </p>
                </div>
                <div className="mt-6 md:mt-0 text-[12px] font-mono text-[var(--text-muted)]">
                  protocol_type: mcp/v1.0
                </div>
              </div>

              {/* Graphic Area */}
              <div className="flex-1 flex items-center justify-center bg-[rgba(0,0,0,0.15)] rounded-[var(--radius-md)] border border-[var(--border)] p-4 min-h-[160px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                  backgroundSize: '12px 12px'
                }} />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex flex-col items-center justify-center p-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--accent)] shadow-[var(--shadow-accent)]">
                    <Network size={20} />
                    <span className="text-[9px] font-mono mt-1">Graph</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-[2px] w-12 bg-gradient-to-r from-[var(--accent)] to-[var(--text-secondary)] opacity-50 relative">
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-[ping_1.5s_infinite]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-mono px-2 py-1 rounded bg-[rgba(255,255,255,0.03)] border border-[var(--border)] text-[var(--text-secondary)]">
                      Claude.ai
                    </div>
                    <div className="text-[10px] font-mono px-2 py-1 rounded bg-[rgba(255,255,255,0.03)] border border-[var(--border)] text-[var(--text-secondary)]">
                      Cursor
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tile 2: Auto-updates after sessions (Small, span-1, Accent BG option) */}
          <div className="bento-tile col-span-1 group relative rounded-[var(--radius-lg)] border border-[rgba(179,236,19,0.12)] bg-gradient-to-br from-[#0d0f04] to-[#080808] p-[var(--space-8)] shadow-[var(--shadow-sm)] shadow-[var(--shadow-inset)] overflow-hidden transition-[border-color,box-shadow] duration-200 ease-out hover:border-[rgba(179,236,19,0.25)] hover:shadow-[var(--shadow-md)]">
            {/* Ambient subtle glow background */}
            <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-[rgba(179,236,19,0.03)] blur-2xl pointer-events-none" />
            
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[rgba(179,236,19,0.15)] bg-[rgba(179,236,19,0.04)] text-[var(--accent)] group-hover:scale-105 transition-transform duration-200">
                  <Terminal size={18} />
                </div>
                <h3 className="mt-[var(--space-6)] text-heading-md text-[var(--text-primary)] font-bold tracking-tight">
                  Auto-updates
                </h3>
                <p className="mt-[var(--space-2)] text-body-md text-[var(--text-secondary)]">
                  Type <code className="text-[12px] font-mono text-[var(--text-primary)] bg-[rgba(255,255,255,0.05)] px-1 py-0.5 rounded">/save</code> at the end of any session. The AI judges what to update and records it automatically.
                </p>
              </div>

              {/* Console Mockup */}
              <div className="mt-6 p-3 rounded-[var(--radius-md)] bg-[#050505] border border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)]">
                <div className="text-[var(--text-muted)]">&gt; /save</div>
                <div className="text-[var(--accent)] mt-1">Analyzing context...</div>
                <div className="text-[var(--success)] mt-0.5">✓ Graph updated successfully.</div>
              </div>
            </div>
          </div>

          {/* Tile 3: Relevance Decay (Small, span-1) */}
          <div className="bento-tile col-span-1 group relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-tr from-[#141414] via-[var(--card)] to-[#0c0c0c] p-[var(--space-8)] shadow-[var(--shadow-sm)] shadow-[var(--shadow-inset)] overflow-hidden transition-[border-color,box-shadow] duration-200 ease-out hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
            {/* Background fine grid overlay */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
              backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
              backgroundSize: '8px 8px'
            }} />
            
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] group-hover:scale-105 transition-transform duration-200">
                  <RefreshCw size={18} />
                </div>
                <h3 className="mt-[var(--space-6)] text-heading-md text-[var(--text-primary)] font-bold tracking-tight">
                  Relevance decay
                </h3>
                <p className="mt-[var(--space-2)] text-body-md text-[var(--text-secondary)]">
                  Context nodes age and decay over time. Stale information sinks, keeping newer focus nodes active so your AI never gets cluttered.
                </p>
              </div>

              {/* Dynamic Score Indicator */}
              <div className="mt-6 flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[rgba(0,0,0,0.12)] border border-[var(--border)]">
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">node_relevance</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] transition-[width] duration-500 ease-out" style={{ width: `${decayScore * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-[var(--accent)] font-semibold w-8 text-right">
                    {Math.round(decayScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
