'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Database, Network, RefreshCw, Terminal, Layers } from 'lucide-react'

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
        duration: 0.45,
        ease: 'cg-out',
        scrollTrigger: trigger,
      })

      gsap.from('.bento-tile', {
        opacity: 0,
        y: 32,
        duration: 0.55,
        ease: 'cg-out',
        stagger: 0.08,
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
    <section ref={container} className="relative py-24 bg-[var(--bg)] border-t border-[var(--border)] overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-[10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-[rgba(255,255,255,0.01)] blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[rgba(255,255,255,0.01)] blur-[100px] pointer-events-none" aria-hidden="true" />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        
        {/* Section Header */}
        <div className="feature-header mb-16 text-left">
          {/* Eyebrow Label - Restricted count rule */}
          <span className="inline-block text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.1em] uppercase mb-4">
            AESTHETIC INTELLIGENCE
          </span>
          <h2 className="text-display-lg max-w-[620px] text-[var(--text-primary)] font-bold uppercase tracking-tight">
            Context that travels with you.
          </h2>
          <p className="mt-[var(--space-4)] max-w-[500px] text-body-md text-[var(--text-secondary)] leading-relaxed">
            A unified, self-updating graph that exposes identity, guidelines, and project specifications directly to all your AI assistants.
          </p>
        </div>

        {/* Bento Grid Layout - Asymmetric masonry */}
        <div className="bento-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Unified Context (col-span-2) */}
          <div className="bento-tile col-span-1 md:col-span-2 group relative rounded-[var(--radius-xxl)] border border-[var(--border)] bg-[rgba(255,255,255,0.015)] p-[5px] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
            <div
              className="rounded-[calc(var(--radius-xxl)-5px)] p-6 md:p-8 flex flex-col md:flex-row h-full gap-8 justify-between"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {/* Text side */}
              <div className="flex flex-col justify-between flex-1 text-left">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-transform duration-200 group-hover:scale-105">
                    <Layers size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight">
                    Build once, use everywhere
                  </h3>
                  <p className="mt-3 text-body-md text-[var(--text-secondary)] leading-relaxed">
                    Create your profile and guidelines once. Every MCP-compatible assistant queries the same structured Graph in your private database, eliminating duplicate instructions and context fragmentation.
                  </p>
                </div>
                <div className="mt-8 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Protocol: MCP v1.0
                </div>
              </div>

              {/* Graphic side */}
              <div className="flex-1 flex items-center justify-center bg-[var(--bg)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6 min-h-[180px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                  backgroundSize: '12px 12px'
                }} />
                
                {/* Visual flowchart representation */}
                <div className="flex items-center gap-6 relative z-10">
                  <div className="flex flex-col items-center justify-center p-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--text-secondary)] shadow-sm">
                    <Network size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-mono mt-1 text-[var(--text-muted)]">Graph</span>
                  </div>
                  
                  {/* Flow Arrow */}
                  <div className="flex flex-col gap-2">
                    <div className="h-[1px] w-12 bg-gradient-to-r from-[var(--border-strong)] to-[var(--text-secondary)] relative">
                      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] opacity-40" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="text-[10px] font-mono px-3 py-1.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                      Claude.ai
                    </div>
                    <div className="text-[10px] font-mono px-3 py-1.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                      Cursor
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Auto-updates (col-span-1) */}
          <div className="bento-tile col-span-1 group relative rounded-[var(--radius-xxl)] border border-[var(--border)] bg-[rgba(255,255,255,0.015)] p-[5px] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
            <div
              className="rounded-[calc(var(--radius-xxl)-5px)] p-6 md:p-8 flex flex-col h-full justify-between text-left"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-transform duration-200 group-hover:scale-105">
                  <Terminal size={18} strokeWidth={1.5} />
                </div>
                <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight">
                  Auto-updates
                </h3>
                <p className="mt-3 text-body-md text-[var(--text-secondary)] leading-relaxed">
                  Type <code className="text-[12px] font-mono text-[var(--text-primary)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">/save</code> at the end of any session. The model processes the transcripts and appends changes dynamically.
                </p>
              </div>

              {/* Console Mockup */}
              <div className="mt-8 p-4 rounded-[var(--radius-md)] bg-[var(--bg)] border border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)] shadow-inner">
                <div className="text-[var(--text-muted)]">&gt; /save</div>
                <div className="text-[var(--text-primary)] mt-1.5 animate-pulse">Syncing context...</div>
                <div className="text-[var(--text-secondary)] mt-1 opacity-70">✓ Appended projects/taskflow</div>
              </div>
            </div>
          </div>

          {/* Card 3: Relevance Decay (col-span-1) */}
          <div className="bento-tile col-span-1 group relative rounded-[var(--radius-xxl)] border border-[var(--border)] bg-[rgba(255,255,255,0.015)] p-[5px] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
            <div
              className="rounded-[calc(var(--radius-xxl)-5px)] p-6 md:p-8 flex flex-col h-full justify-between text-left"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-transform duration-200 group-hover:scale-105">
                  <RefreshCw size={18} strokeWidth={1.5} />
                </div>
                <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight">
                  Relevance decay
                </h3>
                <p className="mt-3 text-body-md text-[var(--text-secondary)] leading-relaxed">
                  Stale context nodes age and decay over time. Inactive data sinks to lower priority, while active nodes stay queryable. Keeps your context clean.
                </p>
              </div>

              {/* Dynamic Score Indicator */}
              <div className="mt-8 flex items-center justify-between p-3.5 rounded-[var(--radius-md)] bg-[var(--bg)] border border-[var(--border)] shadow-inner">
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">node_decay</span>
                <div className="flex items-center gap-2.5">
                  <div className="w-16 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--text-primary)] opacity-80 transition-[width] duration-500 ease-out" style={{ width: `${decayScore * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-primary)] font-semibold w-8 text-right select-none">
                    {Math.round(decayScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Self-Sovereign Storage (col-span-2) */}
          <div className="bento-tile col-span-1 md:col-span-2 group relative rounded-[var(--radius-xxl)] border border-[var(--border)] bg-[rgba(255,255,255,0.015)] p-[5px] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
            <div
              className="rounded-[calc(var(--radius-xxl)-5px)] p-6 md:p-8 flex flex-col md:flex-row h-full gap-8 justify-between"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {/* Text side */}
              <div className="flex flex-col justify-between flex-1 text-left">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition-transform duration-200 group-hover:scale-105">
                    <Database size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight">
                    Self-sovereign database
                  </h3>
                  <p className="mt-3 text-body-md text-[var(--text-secondary)] leading-relaxed">
                    Your context is yours alone. All nodes reside in your own secure Supabase Postgres database. No centralized servers reading your codebase guidelines or projects.
                  </p>
                </div>
                <div className="mt-8 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Provider: Supabase Postgres
                </div>
              </div>

              {/* Graphic side */}
              <div className="flex-1 flex items-center justify-center bg-[var(--bg)] rounded-[var(--radius-xl)] border border-[var(--border)] p-6 min-h-[180px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }} />
                
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)] shadow-sm">
                    <Database size={20} strokeWidth={1.5} />
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] uppercase tracking-widest text-center select-none">
                    local_storage_lock
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
