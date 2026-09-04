'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'

export function Features() {
  const containerRef = useRef<HTMLElement>(null)
  const [decayScore, setDecayScore] = useState(95)

  // Simulation of relevance decay score animation
  useEffect(() => {
    if (prefersReducedMotion()) return
    const interval = setInterval(() => {
      setDecayScore(prev => {
        if (prev <= 40) return 95
        return prev - 5
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

      // Single timeline triggered by the section container to ensure everything reveals together
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        }
      })

      tl.from('.feature-header', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'cg-out',
      })

      tl.from('.bento-tile', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'cg-out',
        stagger: 0.08,
      }, '-=0.3')
    },
    { scope: containerRef }
  )

  return (
    <section 
      ref={containerRef} 
      className="relative py-24 bg-[var(--bg)] border-t border-[var(--border)] overflow-hidden"
    >
      {/* Subtle atmospheric ambient glow */}
      <div 
        className="pointer-events-none absolute top-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-white/[0.01] blur-[120px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute bottom-[10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-white/[0.01] blur-[120px]" 
        aria-hidden="true" 
      />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        
        {/* Section Header */}
        <div className="feature-header mb-16 text-left">
          {/* Eyebrow badge */}
          <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.01] w-max px-3.5 py-1 shadow-[var(--shadow-xs)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="text-label text-[9px] text-[var(--text-secondary)] font-semibold tracking-[0.12em] uppercase">
              Aesthetic Intelligence
            </span>
          </div>
          <h2 className="text-display-lg max-w-[620px] text-[var(--text-primary)] font-bold uppercase tracking-tight">
            Context that travels with you.
          </h2>
          <p className="mt-[var(--space-4)] max-w-[50ch] text-body-md text-[var(--text-secondary)] leading-relaxed">
            A self-updating, persistent graph built for developers. One integration feeds all coding assistants and clients.
          </p>
        </div>

        {/* Bento Grid Layout - Asymmetric masonry */}
        <div className="bento-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Build once, use everywhere (col-span-2) */}
          <div className="bento-tile col-span-1 md:col-span-2 group relative rounded-[2rem] p-1.5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/5 shadow-[var(--shadow-sm)] hover:border-white/10 transition-all duration-300">
            <div
              className="rounded-[calc(2rem-6px)] p-8 flex flex-col md:flex-row h-full gap-8 justify-between"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {/* Text side */}
              <div className="flex flex-col justify-between flex-1 text-left">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-white/5 bg-white/[0.02] text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-105 shadow-[var(--shadow-inset)]">
                    <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.905 0-5.64-.5-8.157-1.418m16.314 0C19.645 11.724 16.002 12.5 12 12.5c-4.002 0-7.644-.776-9.843-1.918" />
                    </svg>
                  </div>
                  <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight uppercase">
                    Build once, use everywhere
                  </h3>
                  <p className="mt-3 text-body-md text-[var(--text-secondary)] leading-relaxed">
                    Create your profile and project rules once. Every MCP-compatible assistant queries the same structured Graph in your private database, eliminating duplicate instructions and context fragmentation.
                  </p>
                </div>
                <div className="mt-8 text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Protocol Specification: MCP v1.0
                </div>
              </div>

              {/* Graphic side: Premium client network node visual */}
              <div className="flex-1 flex items-center justify-center bg-[#080808]/40 rounded-2xl border border-white/5 p-6 min-h-[220px] relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-[0.015] pointer-events-none" 
                  style={{
                    backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                    backgroundSize: '12px 12px'
                  }} 
                />
                
                <div className="flex flex-col items-center gap-4 relative z-10 w-full">
                  <div className="flex items-center justify-between w-full max-w-[240px] border border-white/5 bg-white/[0.01] p-3 rounded-xl shadow-sm">
                    <span className="text-[10px] font-mono text-white/50">sync_status</span>
                    <span className="text-[9px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] border border-[rgba(179,236,19,0.1)] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">connected</span>
                  </div>

                  <div className="flex items-center justify-center gap-5 w-full">
                    {/* Source node */}
                    <div className="flex flex-col items-center p-3.5 rounded-2xl bg-[#0a0a0a] border border-[var(--accent)] shadow-[0_0_15px_rgba(179,236,19,0.15)] z-10">
                      <div className="h-6 w-6 flex items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
                        </svg>
                      </div>
                      <span className="text-[8px] font-mono mt-1 text-[var(--accent)] tracking-wider font-bold">CORE</span>
                    </div>

                    {/* Glowing connect lines */}
                    <div className="flex-1 flex flex-col gap-2.5 max-w-[50px] relative">
                      <div className="h-[1px] bg-gradient-to-r from-[var(--accent)] to-white/10 relative w-full">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-1 rounded-full bg-[var(--accent)] animate-ping" />
                      </div>
                    </div>

                    {/* AI client destinations */}
                    <div className="flex flex-col gap-2">
                      <div className="text-[9px] font-mono px-3.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/5 text-white/80 shadow-sm flex items-center gap-2 hover:border-white/10 transition-colors">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        Claude
                      </div>
                      <div className="text-[9px] font-mono px-3.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/5 text-white/80 shadow-sm flex items-center gap-2 hover:border-white/10 transition-colors">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        Cursor
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Auto-updates (col-span-1) */}
          <div className="bento-tile col-span-1 group relative rounded-[2rem] p-1.5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/5 shadow-[var(--shadow-sm)] hover:border-white/10 transition-all duration-300">
            <div
              className="rounded-[calc(2rem-6px)] p-8 flex flex-col h-full justify-between text-left"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-white/5 bg-white/[0.02] text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-105 shadow-[var(--shadow-inset)]">
                  <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                </div>
                <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight uppercase">
                  Auto-updates
                </h3>
                <p className="mt-3 text-body-md text-[var(--text-secondary)] leading-relaxed">
                  Type <code className="text-[12px] font-mono text-[var(--text-primary)] bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5 font-semibold">/save</code> at the end of any session. The model processes the transcripts and appends changes dynamically.
                </p>
              </div>

              {/* Console Mockup - macOS Style Terminal */}
              <div className="mt-8 rounded-xl bg-[#080808]/80 border border-white/5 overflow-hidden shadow-inner font-mono text-[10px] text-[var(--text-secondary)]">
                <div className="h-6 bg-black/40 border-b border-white/5 flex items-center px-3 gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
                <div className="p-4 text-left">
                  <div className="text-white/40">&gt; /save</div>
                  <div className="text-[var(--accent)] mt-1.5 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-[var(--accent)] animate-ping" />
                    syncing memory graph...
                  </div>
                  <div className="text-white/80 mt-1 opacity-70">✓ appended projects/taskflow</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Relevance Decay (col-span-1) */}
          <div className="bento-tile col-span-1 group relative rounded-[2rem] p-1.5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/5 shadow-[var(--shadow-sm)] hover:border-white/10 transition-all duration-300">
            <div
              className="rounded-[calc(2rem-6px)] p-8 flex flex-col h-full justify-between text-left"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-white/5 bg-white/[0.02] text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-105 shadow-[var(--shadow-inset)]">
                  <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight uppercase">
                  Relevance decay
                </h3>
                <p className="mt-3 text-body-md text-[var(--text-secondary)] leading-relaxed">
                  Stale context nodes age and decay over time. Inactive data sinks to lower priority, while active nodes stay queryable. Keeps your context clean.
                </p>
              </div>

              {/* Node Decay Simulation Visual */}
              <div className="mt-8 flex flex-col gap-2 p-4 rounded-xl bg-[#080808]/40 border border-white/5 shadow-inner">
                {/* Node 1 */}
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-white/95 font-semibold">AGENTS.md</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--accent)] font-semibold">98%</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  </div>
                </div>
                {/* Node 2 */}
                <div className="flex items-center justify-between text-[9px] font-mono opacity-70">
                  <span className="text-white/80">DESIGN.md</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">82%</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  </div>
                </div>
                {/* Node 3 */}
                <div className="flex items-center justify-between text-[9px] font-mono opacity-30">
                  <span className="text-white/50">legacy-config.json</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/30">35%</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Self-Sovereign Storage (col-span-2) */}
          <div className="bento-tile col-span-1 md:col-span-2 group relative rounded-[2rem] p-1.5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/5 shadow-[var(--shadow-sm)] hover:border-white/10 transition-all duration-300">
            <div
              className="rounded-[calc(2rem-6px)] p-8 flex flex-col md:flex-row h-full gap-8 justify-between"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {/* Text side */}
              <div className="flex flex-col justify-between flex-1 text-left">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-white/5 bg-white/[0.02] text-[var(--text-primary)] transition-transform duration-300 group-hover:scale-105 shadow-[var(--shadow-inset)]">
                    <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight uppercase">
                    Self-sovereign database
                  </h3>
                  <p className="mt-3 text-body-md text-[var(--text-secondary)] leading-relaxed">
                    Your context is yours alone. All nodes reside in your own secure Supabase Postgres database. No centralized servers reading your codebase guidelines, rules, or private repositories.
                  </p>
                </div>
                <div className="mt-8 text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Storage Provider: Supabase Postgres
                </div>
              </div>

              {/* Graphic side: Premium Postgres Cylinder table mock */}
              <div className="flex-1 flex items-center justify-center bg-[#080808]/40 rounded-2xl border border-white/5 p-6 min-h-[220px] relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-[0.015] pointer-events-none" 
                  style={{
                    backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }} 
                />
                
                <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-[200px]">
                  <div className="w-full flex items-center gap-2 border border-white/5 bg-[#0a0a0a]/80 p-2.5 rounded-xl shadow-sm text-left">
                    <div className="h-5 w-5 flex items-center justify-center rounded bg-white/[0.03] border border-white/10 text-white/40">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-white/95 font-semibold leading-none">supabase_db</span>
                      <span className="text-[7px] font-mono text-white/30 mt-1 uppercase tracking-wider">authorized RLS</span>
                    </div>
                  </div>

                  <div className="w-full flex flex-col gap-1 text-[8px] font-mono text-white/40 bg-[#080808]/60 border border-white/5 p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between border-b border-white/5 pb-1 mb-1 font-bold text-white/60">
                      <span>column_name</span>
                      <span>type</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--accent)]">id</span>
                      <span>uuid</span>
                    </div>
                    <div className="flex justify-between">
                      <span>node_type</span>
                      <span>text</span>
                    </div>
                    <div className="flex justify-between">
                      <span>embedding</span>
                      <span>vector(1536)</span>
                    </div>
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
