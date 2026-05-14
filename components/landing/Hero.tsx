'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'
import { Button } from '@/components/ui/Button'

export function Hero() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.hero-anim, .hero-word, .hero-node, .hero-edge', {
          opacity: 1,
          y: 0,
          scale: 1,
        })
        return
      }

      const tl = gsap.timeline({ delay: 0.15 })

      // Left side
      tl.from('.hero-eyebrow', {
        opacity: 0,
        y: 10,
        duration: DUR.normal,
        ease: 'cg-out',
      })
        .from(
          '.hero-word',
          {
            opacity: 0,
            y: 36,
            duration: DUR.slow,
            ease: 'cg-out',
            stagger: 0.04,
          },
          '-=0.1'
        )
        .from(
          '.hero-subtitle',
          {
            opacity: 0,
            y: 16,
            duration: DUR.moderate,
            ease: 'cg-out',
          },
          '-=0.25'
        )
        .from(
          '.hero-cta > *',
          {
            opacity: 0,
            y: 12,
            duration: DUR.normal,
            ease: 'cg-spring',
            stagger: 0.08,
          },
          '-=0.2'
        )

      // Right side graph nodes
      tl.from(
        '.hero-graph-bg',
        {
          opacity: 0,
          duration: DUR.normal,
          ease: 'cg-out',
        },
        '-=0.4'
      )
        .from(
          '.hero-node-root',
          {
            opacity: 0,
            scale: 0.88,
            duration: DUR.moderate,
            ease: 'cg-spring',
          },
          '-=0.2'
        )
        .from(
          '.hero-node-branch',
          {
            opacity: 0,
            scale: 0.92,
            y: 10,
            duration: DUR.normal,
            ease: 'cg-out',
            stagger: 0.07,
          },
          '-=0.1'
        )
        .from(
          '.hero-edge',
          {
            opacity: 0,
            duration: DUR.moderate,
            ease: 'cg-soft',
            stagger: 0.03,
          },
          '-=0.2'
        )
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[calc(100vh-60px)] w-full items-center justify-center overflow-hidden bg-[var(--bg)]"
    >
      {/* Radial Gradient Background */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[var(--bg-gradient)]" />

      {/* Noise Texture Overlay */}
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-5 mix-blend-overlay">
        <filter id="hero-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-noise)" />
      </svg>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-[var(--space-16)] px-[var(--space-6)] py-[var(--space-24)] lg:grid-cols-2">
        {/* Left Side: Copy */}
        <div className="flex flex-col items-start text-left">
          <div className="hero-anim hero-eyebrow mb-[var(--space-6)] rounded-[var(--radius-full)] bg-[var(--badge-default-bg)] px-3 py-1">
            <span className="text-label text-[var(--text-secondary)]">
              Context Engine v1.0
            </span>
          </div>

          <h1 className="text-display-xxl text-[var(--text-primary)]">
            <span className="hero-word mr-[var(--space-3)] inline-block">
              Structured
            </span>
            <span className="hero-word mr-[var(--space-3)] inline-block">
              intelligence
            </span>
            <br className="hidden md:block" />
            <span className="hero-word mr-[var(--space-3)] inline-block">
              made
            </span>
            <span className="hero-word inline-block text-[var(--accent)]">
              visible.
            </span>
          </h1>

          <p className="hero-anim hero-subtitle mt-[var(--space-6)] max-w-lg text-body-lg text-[var(--text-secondary)]">
            ContextGraph is a cross-AI personal context engine. Store your
            identity, agency, and project context as a graph accessible to any
            MCP-compatible AI.
          </p>

          <div className="hero-anim hero-cta mt-[var(--space-10)] flex flex-wrap items-center gap-[var(--space-4)]">
            <Button variant="primary" size="lg">
              Start Building
            </Button>
            <Button variant="secondary" size="lg">
              Read Docs
            </Button>
          </div>
        </div>

        {/* Right Side: Graph Preview */}
        <div className="relative flex w-full items-center justify-center lg:justify-end">
          <div className="hero-graph-bg relative flex h-full min-h-[480px] w-full max-w-[480px] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-6)] [box-shadow:var(--shadow-lg),var(--shadow-inset)]">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 z-0 rounded-[var(--radius-xl)]"
              style={{
                backgroundImage: `radial-gradient(var(--graph-dot) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Mock Graph Elements */}
            <div className="relative z-10 flex w-full flex-col items-center pb-[var(--space-8)] pt-[var(--space-4)]">
              {/* Root Node */}
              <div className="hero-node-root hero-node relative z-10 flex min-w-[160px] flex-col items-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-gradient-to-b from-[var(--surface)] to-[var(--bg)] p-[var(--space-4)] [box-shadow:var(--shadow-md),var(--shadow-inset)]">
                <span className="text-display-sm text-[var(--text-primary)]">
                  @user
                </span>
                <div className="mt-[var(--space-3)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                  <div className="h-full w-full rounded-[var(--radius-full)] bg-[var(--accent)]" />
                </div>
              </div>

              {/* Gap 1 with Edge SVG */}
              <div className="relative z-0 -my-[var(--space-1)] h-[var(--space-16)] w-full">
                <svg
                  className="hero-edge absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <path
                    d="M 50 0 C 50 50, 25 50, 25 100"
                    fill="none"
                    stroke="var(--graph-edge)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d="M 50 0 C 50 50, 75 50, 75 100"
                    fill="none"
                    stroke="var(--graph-edge)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>

              {/* Branch Nodes Row */}
              <div className="z-10 grid w-full grid-cols-2 gap-[var(--space-4)] px-[var(--space-4)]">
                {/* Branch 1 */}
                <div className="flex justify-center">
                  <div className="hero-node-branch hero-node relative flex w-full max-w-[140px] flex-col items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--space-3)] [box-shadow:var(--shadow-sm),var(--shadow-inset)]">
                    <span className="text-heading-sm text-[var(--text-secondary)]">
                      Projects
                    </span>
                    <div className="mt-[var(--space-2)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                      <div className="h-full w-[85%] rounded-[var(--radius-full)] bg-[var(--success)]" />
                    </div>
                  </div>
                </div>

                {/* Branch 2 (Selected) */}
                <div className="flex justify-center">
                  <div className="hero-node-branch hero-node relative flex w-full max-w-[140px] flex-col items-center rounded-[var(--radius-md)] border border-[var(--accent)] bg-[var(--card)] p-[var(--space-3)] [box-shadow:var(--shadow-accent),var(--shadow-md)]">
                    <span className="text-heading-sm text-[var(--text-primary)]">
                      Identity
                    </span>
                    <div className="mt-[var(--space-2)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                      <div className="h-full w-[60%] rounded-[var(--radius-full)] bg-[var(--warning)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gap 2 with Edge SVG */}
              <div className="relative z-0 -my-[var(--space-1)] h-[var(--space-16)] w-full">
                <svg
                  className="hero-edge absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <path
                    d="M 25 0 C 25 50, 50 50, 50 100"
                    fill="none"
                    stroke="var(--graph-edge)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>

              {/* Leaf Node */}
              <div className="hero-node-branch hero-node relative z-10 flex min-w-[120px] flex-col items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-[var(--space-2)] [box-shadow:var(--shadow-xs)]">
                <span className="text-body-sm text-[var(--text-muted)]">
                  Devflow
                </span>
                <div className="mt-[var(--space-1)] h-[2px] w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                  <div className="h-full w-[40%] rounded-[var(--radius-full)] bg-[var(--text-disabled)]" />
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="hero-anim hero-node-branch absolute bottom-[var(--space-4)] z-20 flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--surface)] px-[var(--space-3)] py-1.5 [box-shadow:var(--shadow-sm)]">
              <div className="h-2 w-2 rounded-[var(--radius-full)] bg-[var(--accent)] [box-shadow:0_0_8px_var(--accent)]" />
              <span className="text-code-sm uppercase tracking-wider text-[var(--text-secondary)]">
                MCP Server Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
