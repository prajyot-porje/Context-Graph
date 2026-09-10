'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import {
  Cpu,
  Layers,
  Sparkles,
  Database,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

interface ClientTarget {
  id: string
  name: string
  icon: string
  type: string
  scope: string[]
  sampleOutput: string
}

const CLIENT_TARGETS: ClientTarget[] = [
  {
    id: 'cursor',
    name: 'Cursor IDE',
    icon: '⚡',
    type: 'Editor Extension',
    scope: ['@stack/nextjs15', '@rules/tailwind-v4', '@rules/programmatic-auth'],
    sampleOutput: 'Inline completions adhere strictly to Next.js 15 App Router & zero-inline-SQL rules without repeating guidelines.',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    icon: '🔮',
    type: 'CLI / Terminal',
    scope: ['@identity/lead-architect', '@projects/taskflow', '@rules/strict-ts'],
    sampleOutput: 'Terminal CLI immediately understands repository architecture, dependency tiers, and active migration status.',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    icon: '⚙️',
    type: 'Agentic Worker',
    scope: ['@stack/supabase-postgres', '@rules/session-auth', '@projects/contextgraph'],
    sampleOutput: 'Autonomous task execution loads typed db helpers from lib/db.ts without querying Supabase directly from client.',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT / Web',
    icon: '💬',
    type: 'Chat Assistant',
    scope: ['@rules/design-tokens', '@identity/developer-profile'],
    sampleOutput: 'Generates UI designs using exact CSS custom properties and 4px spacing grid from DESIGN.md on prompt 1.',
  },
]

export function Features() {
  const containerRef = useRef<HTMLElement>(null)
  const [selectedClient, setSelectedClient] = useState<ClientTarget>(CLIENT_TARGETS[0])

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.feature-header, .feature-card', { opacity: 1, y: 0 })
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      })

      tl.from('.feature-header', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'cg-out',
      }).from(
        '.feature-card',
        {
          opacity: 0,
          y: 24,
          duration: 0.6,
          ease: 'cg-out',
          stagger: 0.08,
        },
        '-=0.3'
      )
    },
    { scope: containerRef }
  )

  return (
    <section
      id="features"
      ref={containerRef}
      className="relative py-28 bg-[var(--bg)] border-t border-[var(--border)] overflow-hidden"
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-[5%] left-[20%] w-[500px] h-[350px] rounded-full bg-[var(--accent)] opacity-[0.015] blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[10%] right-[10%] w-[500px] h-[350px] rounded-full bg-[var(--accent)] opacity-[0.015] blur-[140px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)] relative z-10">
        {/* Section Header */}
        <div className="feature-header mb-16 text-left">
          <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] w-max px-3.5 py-1 shadow-[var(--shadow-xs)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0 animate-pulse" />
            <span className="text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.12em] uppercase">
              Cross-Platform Protocol
            </span>
          </div>

          <h2 className="text-display-lg max-w-[700px] text-[var(--text-primary)] font-bold uppercase tracking-tight">
            Context that travels with you.
          </h2>

          <p className="mt-[var(--space-4)] max-w-[56ch] text-body-md text-[var(--text-secondary)] leading-relaxed">
            Stop copy-pasting system instructions and tech stack rules into every new prompt.
            ContextGraph unifies your identities, projects, and architecture patterns into a single living graph queryable by every AI.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1 (col-span-12 lg:col-span-7): Universal Protocol Handshake */}
          <div className="feature-card md:col-span-12 lg:col-span-7 group rounded-[2rem] p-1.5 bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:border-[var(--border-strong)] transition-[border-color,box-shadow] duration-300">
            <div
              className="rounded-[calc(2rem-6px)] p-6 sm:p-8 flex flex-col justify-between h-full text-left"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--accent)] shadow-[var(--shadow-xs)]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[10px] font-mono text-[var(--text-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-ping" />
                    MCP Protocol v1.0
                  </div>
                </div>

                <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight uppercase">
                  Universal Model Handshake
                </h3>
                <p className="mt-2 text-body-md text-[var(--text-secondary)] leading-relaxed">
                  Click any connected client below to inspect how ContextGraph dynamically injects relevant context scopes on demand.
                </p>

                {/* Client Target Switcher Pills */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {CLIENT_TARGETS.map((target) => {
                    const isSelected = selectedClient.id === target.id
                    return (
                      <button
                        key={target.id}
                        onClick={() => setSelectedClient(target)}
                        className={cn(
                          'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-medium border transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-95 cursor-pointer',
                          isSelected
                            ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--text-primary)] font-semibold shadow-[0_0_12px_rgba(179,236,19,0.15)]'
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                        )}
                      >
                        <span>{target.icon}</span>
                        <span>{target.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Handshake Display Box */}
              <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-inner font-mono">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)] text-[11px]">
                  <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                    <span>{selectedClient.icon}</span>
                    <span>{selectedClient.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">({selectedClient.type})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--accent)] text-[10px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Synchronized (4ms)
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-secondary)] mb-2 font-medium">
                  Active Context Scopes Injected:
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedClient.scope.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[10px] text-[var(--text-primary)] font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] leading-relaxed font-sans">
                  &ldquo;{selectedClient.sampleOutput}&rdquo;
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 (col-span-12 lg:col-span-5): Auto-Evolving Memory */}
          <div className="feature-card md:col-span-12 lg:col-span-5 group rounded-[2rem] p-1.5 bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:border-[var(--border-strong)] transition-[border-color,box-shadow] duration-300">
            <div
              className="rounded-[calc(2rem-6px)] p-6 sm:p-8 flex flex-col justify-between h-full text-left"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--accent)] shadow-[var(--shadow-xs)]">
                  <Sparkles className="w-5 h-5" />
                </div>

                <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight uppercase">
                  Automatic Memory Evolution
                </h3>
                <p className="mt-2 text-body-md text-[var(--text-secondary)] leading-relaxed">
                  Type <code className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[12px] font-semibold text-[var(--text-primary)]">/save</code> at the end of any coding session. The engine parses the conversation and updates nodes automatically.
                </p>
              </div>

              {/* Memory Capture Simulation Card */}
              <div className="mt-8 flex flex-col gap-2.5 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] font-mono text-[11px]">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] text-[var(--text-muted)] text-[10px]">
                  <span>RECENT GRAPH MUTATIONS</span>
                  <span className="text-[var(--accent)]">● LIVE</span>
                </div>

                <div className="flex items-start gap-2 text-left">
                  <span className="text-[var(--accent)] mt-0.5 font-bold">+</span>
                  <div>
                    <div className="text-[var(--text-primary)] font-semibold text-[11px]">Migrated auth to Better Auth</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Scope: @rules/auth • Relevance: 98%</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-left">
                  <span className="text-[var(--accent)] mt-0.5 font-bold">+</span>
                  <div>
                    <div className="text-[var(--text-primary)] font-semibold text-[11px]">Added Lenis + GSAP animation rules</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">Scope: @rules/motion • Relevance: 95%</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-left opacity-60">
                  <span className="text-[var(--text-muted)] mt-0.5 font-bold">~</span>
                  <div>
                    <div className="text-[var(--text-secondary)] text-[11px]">Deprecated NextAuth custom middleware</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Archived from active retrieval</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 (col-span-12 lg:col-span-5): Intelligent Relevance Decay */}
          <div className="feature-card md:col-span-12 lg:col-span-5 group rounded-[2rem] p-1.5 bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:border-[var(--border-strong)] transition-[border-color,box-shadow] duration-300">
            <div
              className="rounded-[calc(2rem-6px)] p-6 sm:p-8 flex flex-col justify-between h-full text-left"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--accent)] shadow-[var(--shadow-xs)]">
                  <Layers className="w-5 h-5" />
                </div>

                <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight uppercase">
                  Relevance Decay & Token Pruning
                </h3>
                <p className="mt-2 text-body-md text-[var(--text-secondary)] leading-relaxed">
                  Model context windows are precious. ContextGraph ages inactive nodes so you don&apos;t waste tokens on dead tasks, keeping queries ultra-fast and laser focused.
                </p>
              </div>

              {/* Decay Indicator Visualizer */}
              <div className="mt-8 flex flex-col gap-2.5 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] font-mono text-[11px]">
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] pb-2 border-b border-[var(--border)]">
                  <span>NODE IDENTIFIER</span>
                  <span>PRIORITY WEIGHT</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-primary)] font-semibold">@rules/strict-ts</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-[var(--card)] overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-[var(--accent)] w-[98%]" />
                    </div>
                    <span className="text-[var(--accent)] font-bold text-[10px]">98%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-primary)] font-semibold">@projects/taskflow</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-[var(--card)] overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-[var(--accent)] w-[84%]" />
                    </div>
                    <span className="text-[var(--text-primary)] font-bold text-[10px]">84%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between opacity-50">
                  <span className="text-[var(--text-secondary)]">@temp/migration-notes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-[var(--card)] overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-[var(--text-muted)] w-[25%]" />
                    </div>
                    <span className="text-[var(--text-muted)] text-[10px]">25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 (col-span-12 lg:col-span-7): Self-Sovereign Postgres Storage */}
          <div className="feature-card md:col-span-12 lg:col-span-7 group rounded-[2rem] p-1.5 bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:border-[var(--border-strong)] transition-[border-color,box-shadow] duration-300">
            <div
              className="rounded-[calc(2rem-6px)] p-6 sm:p-8 flex flex-col justify-between h-full text-left"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--accent)] shadow-[var(--shadow-xs)]">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Encrypted At Rest
                  </div>
                </div>

                <h3 className="mt-6 text-heading-lg text-[var(--text-primary)] font-bold tracking-tight uppercase">
                  Self-Sovereign Postgres Storage
                </h3>
                <p className="mt-2 text-body-md text-[var(--text-secondary)] leading-relaxed">
                  Your architecture decisions and code conventions never live on closed vendor silos.
                  Everything sits in your private Supabase Postgres instance, governed by programmatic tenant isolation and your personal API keys.
                </p>
              </div>

              {/* Database Schema Blueprint Graphic */}
              <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-inner font-mono text-[11px]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border)] text-[10px]">
                  <span className="text-[var(--text-primary)] font-bold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm bg-[var(--accent)]" />
                    DATABASE: public.context_nodes
                  </span>
                  <span className="text-[var(--text-muted)]">POSTGRESQL 16</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--border)]">
                  <span>Column</span>
                  <span>Type</span>
                  <span>Attributes</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 text-[11px] text-[var(--text-secondary)] border-b border-[var(--border)]">
                  <span className="text-[var(--text-primary)] font-semibold">user_id</span>
                  <span>uuid</span>
                  <span className="text-[var(--text-muted)]">Foreign Key</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 text-[11px] text-[var(--text-secondary)] border-b border-[var(--border)]">
                  <span className="text-[var(--text-primary)] font-semibold">scope</span>
                  <span>text</span>
                  <span className="text-[var(--accent)] font-semibold">Unique Index</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 text-[11px] text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-semibold">embedding</span>
                  <span>vector(1536)</span>
                  <span className="text-[var(--text-muted)]">HNSW Cosine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
