'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Server, Database, Network, Cpu, Activity } from 'lucide-react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'

export function MaintenanceScene() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const entranceTargets =
        '.maint-kicker, .maint-title, .maint-copy, .maint-status-card, .maint-panel, .maint-node, .maint-edge, .maint-status'

      if (prefersReducedMotion()) {
        gsap.set(entranceTargets, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
        })
        return
      }

      const tl = gsap.timeline({
        defaults: {
          ease: 'cg-out',
        },
      })

      tl.from('.maint-kicker', {
        autoAlpha: 0,
        y: 12,
        duration: DUR.normal,
      })
        .from(
          '.maint-title',
          {
            autoAlpha: 0,
            y: 36,
            rotationX: 8,
            duration: DUR.slow,
          },
          '-=0.08'
        )
        .from(
          '.maint-copy',
          {
            autoAlpha: 0,
            y: 16,
            duration: DUR.moderate,
          },
          '-=0.22'
        )
        .from(
          '.maint-status-card',
          {
            autoAlpha: 0,
            y: 16,
            duration: DUR.moderate,
            stagger: 0.08,
          },
          '-=0.18'
        )
        .from(
          '.maint-panel',
          {
            autoAlpha: 0,
            y: 28,
            scale: 0.96,
            duration: DUR.slow,
          },
          0.12
        )
        .from(
          '.maint-edge',
          {
            autoAlpha: 0,
            duration: DUR.moderate,
            stagger: 0.06,
          },
          '-=0.18'
        )
        .from(
          '.maint-node, .maint-status',
          {
            autoAlpha: 0,
            y: 12,
            scale: 0.92,
            duration: DUR.moderate,
            ease: 'cg-spring',
            stagger: 0.07,
          },
          '-=0.18'
        )

      // Idle float animation
      gsap.to('.maint-float', {
        y: -6,
        rotation: 0.8,
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.25,
          from: 'center',
        },
      })

      // Pulsing glows for offline indicators
      gsap.to('.maint-pulse-amber', {
        opacity: 0.3,
        duration: 1.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.to('.maint-edge-flow', {
        strokeDashoffset: -20,
        duration: 2.5,
        ease: 'none',
        repeat: -1,
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      aria-labelledby="maint-title"
      className="section-glow relative flex min-h-screen w-full items-center overflow-hidden bg-[var(--bg)]"
    >
      {/* Reusing 404 ambient bg styling for consistent atmosphere */}
      <div className="not-found-ambient pointer-events-none absolute inset-0 z-0" />

      {/* Tactile noise overlay */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.03] mix-blend-overlay"
      >
        <filter id="maint-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#maint-noise)" />
      </svg>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-[var(--space-16)] px-[var(--space-6)] py-[var(--space-24)] lg:grid-cols-[1fr_1fr]">
        {/* Left Side: Copy and Status List */}
        <div className="max-w-xl text-left">
          <div className="maint-kicker mb-[var(--space-6)] inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--badge-default-bg)] px-[var(--space-3)] py-[6px] [box-shadow:var(--shadow-xs)]">
            <span className="relative flex h-2 w-2">
              <span className="maint-pulse-amber absolute inline-flex h-full w-full rounded-full bg-[var(--warning)] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--warning)]"></span>
            </span>
            <span className="text-label text-[var(--text-secondary)] uppercase tracking-[0.08em] text-[11px]">
              System Offline
            </span>
          </div>

          <h1
            id="maint-title"
            className="maint-title text-[clamp(2rem,6vw,3.5rem)] font-bold font-[family-name:var(--font-display-fallback)] text-[var(--text-primary)] leading-[1.1] tracking-[-0.04em]"
            style={{ perspective: '800px' }}
          >
            We are working on some upgrades.
          </h1>

          <p className="maint-copy mt-[var(--space-6)] text-body-lg text-[var(--text-secondary)]">
            ContextGraph is temporarily down for planned database schema migrations and system optimizations. Any AI agents reading from your context engine API keys will queue requests or receive a retry response. We are actively working on it and will be back online shortly.
          </p>

          {/* Status grid */}
          <div className="mt-[var(--space-10)] space-y-[var(--space-4)]">
            <div className="maint-status-card flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-4)] [box-shadow:var(--shadow-sm),var(--shadow-inset)]">
              <div className="flex items-center gap-[var(--space-4)]">
                <div className="rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.03)] p-2 border border-[var(--border)]">
                  <Database size={18} className="text-[var(--text-secondary)]" />
                </div>
                <div>
                  <h4 className="text-body-md font-semibold text-[var(--text-primary)]">Postgres Database</h4>
                  <p className="text-body-sm text-[var(--text-secondary)]">Migrating schemas and sync operations</p>
                </div>
              </div>
              <span className="rounded-[var(--radius-full)] bg-[rgba(245,158,11,0.08)] px-[var(--space-3)] py-1 text-code-sm font-semibold uppercase tracking-[0.08em] text-[var(--warning)] border border-[rgba(245,158,11,0.15)]">
                Upgrading
              </span>
            </div>

            <div className="maint-status-card flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-4)] [box-shadow:var(--shadow-sm),var(--shadow-inset)]">
              <div className="flex items-center gap-[var(--space-4)]">
                <div className="rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.03)] p-2 border border-[var(--border)]">
                  <Cpu size={18} className="text-[var(--text-secondary)]" />
                </div>
                <div>
                  <h4 className="text-body-md font-semibold text-[var(--text-primary)]">Context Graph Engine</h4>
                  <p className="text-body-sm text-[var(--text-secondary)]">Recalculating node relevance algorithms</p>
                </div>
              </div>
              <span className="rounded-[var(--radius-full)] bg-[rgba(245,158,11,0.08)] px-[var(--space-3)] py-1 text-code-sm font-semibold uppercase tracking-[0.08em] text-[var(--warning)] border border-[rgba(245,158,11,0.15)]">
                Optimizing
              </span>
            </div>

            <div className="maint-status-card flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-4)] [box-shadow:var(--shadow-sm),var(--shadow-inset)]">
              <div className="flex items-center gap-[var(--space-4)]">
                <div className="rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.03)] p-2 border border-[var(--border)]">
                  <Network size={18} className="text-[var(--text-secondary)]" />
                </div>
                <div>
                  <h4 className="text-body-md font-semibold text-[var(--text-primary)]">MCP API Gateway</h4>
                  <p className="text-body-sm text-[var(--text-secondary)]">Standing by for database restoration</p>
                </div>
              </div>
              <span className="rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.05)] px-[var(--space-3)] py-1 text-code-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] border border-[var(--border)]">
                Paused
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Graph Representation */}
        <div
          className="relative flex w-full items-center justify-center lg:justify-end"
          aria-hidden="true"
        >
          <div className="maint-panel relative min-h-[380px] w-full max-w-[560px] overflow-hidden rounded-[var(--radius-xxl)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-6)] [box-shadow:var(--shadow-lg),var(--shadow-inset)] sm:min-h-[480px]">
            <div className="not-found-grid absolute inset-0 z-0 rounded-[var(--radius-xxl)]" />
            <div className="not-found-panel-light pointer-events-none absolute inset-0 z-0 rounded-[var(--radius-xxl)]" />

            {/* SVG graph connections */}
            <svg
              className="absolute inset-0 z-10 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {/* Pulsing connections */}
              <path
                className="maint-edge"
                d="M 50 25 L 25 70"
                fill="none"
                stroke="var(--graph-edge)"
                strokeWidth="0.45"
                vectorEffect="non-scaling-stroke"
              />
              <path
                className="maint-edge maint-edge-flow"
                d="M 50 25 L 75 70"
                fill="none"
                stroke="var(--graph-edge)"
                strokeDasharray="4 4"
                strokeWidth="0.55"
                vectorEffect="non-scaling-stroke"
              />
              <path
                className="maint-edge"
                d="M 25 70 L 75 70"
                fill="none"
                stroke="var(--graph-edge)"
                strokeDasharray="3 5"
                strokeWidth="0.45"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Float groups and Node boxes */}
            <div className="relative z-20 flex min-h-[332px] flex-col items-center justify-center sm:min-h-[432px]">
              {/* Root node (Me) - Offline/Warning state */}
              <div className="maint-node maint-float absolute top-[12%] rounded-[var(--radius-lg)] border border-[var(--warning)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--bg)] px-[var(--space-4)] py-[var(--space-3)] [box-shadow:var(--shadow-md),var(--shadow-inset)] flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="maint-pulse-amber absolute inline-flex h-full w-full rounded-full bg-[var(--warning)] opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--warning)]"></span>
                </span>
                <span className="text-heading-sm text-[var(--text-primary)] font-semibold">
                  Identity Graph
                </span>
              </div>

              {/* Database Node */}
              <div className="maint-node maint-float absolute bottom-[18%] left-[8%] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] px-[var(--space-4)] py-[var(--space-3)] [box-shadow:var(--shadow-sm),var(--shadow-inset)] flex items-center gap-2">
                <Server size={14} className="text-[var(--text-secondary)] animate-pulse" />
                <span className="text-body-md text-[var(--text-secondary)]">
                  Store
                </span>
              </div>

              {/* Engine Node */}
              <div className="maint-node maint-float absolute bottom-[18%] right-[8%] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] px-[var(--space-4)] py-[var(--space-3)] [box-shadow:var(--shadow-sm),var(--shadow-inset)] flex items-center gap-2">
                <Cpu size={14} className="text-[var(--text-secondary)]" />
                <span className="text-body-md text-[var(--text-secondary)]">
                  Engine
                </span>
              </div>

              {/* Status bar */}
              <div className="maint-status absolute bottom-[5%] rounded-full border border-[var(--border)] bg-[var(--surface)] px-[var(--space-4)] py-[6px] [box-shadow:var(--shadow-sm)] flex items-center gap-2">
                <Activity size={12} className="text-[var(--warning)] animate-pulse" />
                <span className="text-code-sm uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                  Updating Graph Schema v1.2
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
