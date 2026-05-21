'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(
          '.hero-eyebrow, .hero-word, .hero-subtitle, .hero-cta, .hero-graph-bg, .hero-node-root, .hero-node-branch, .hero-edge, .hero-status',
          { opacity: 1, y: 0, x: 0, scale: 1 }
        )
        return
      }

      // Eyebrow badge
      gsap.from('.hero-eyebrow', {
        opacity: 0,
        y: 12,
        duration: DUR.normal,
        ease: 'cg-out',
        delay: 0.15,
      })

      // Word-by-word headline reveal
      gsap.from('.hero-word', {
        opacity: 0,
        y: 40,
        rotateX: 12,
        duration: DUR.slow,
        ease: 'cg-out',
        stagger: 0.06,
        delay: 0.2,
      })

      // Subtitle
      gsap.from('.hero-subtitle', {
        opacity: 0,
        y: 16,
        duration: DUR.moderate,
        ease: 'cg-out',
        delay: 0.5,
      })

      // CTA buttons
      gsap.from('.hero-cta', {
        opacity: 0,
        y: 14,
        duration: DUR.moderate,
        ease: 'cg-spring',
        delay: 0.6,
      })

      // Graph panel
      gsap.from('.hero-graph-bg', {
        opacity: 0,
        scale: 0.96,
        y: 20,
        duration: DUR.moderate,
        ease: 'cg-out',
        delay: 0.3,
      })

      gsap.from('.hero-node-root', {
        opacity: 0,
        scale: 0.85,
        duration: DUR.moderate,
        ease: 'cg-spring',
        delay: 0.5,
      })

      gsap.from('.hero-node-branch', {
        opacity: 0,
        scale: 0.9,
        y: 12,
        duration: DUR.normal,
        ease: 'cg-out',
        stagger: 0.08,
        delay: 0.6,
      })

      gsap.from('.hero-edge', {
        opacity: 0,
        duration: DUR.moderate,
        ease: 'cg-soft',
        stagger: 0.04,
        delay: 0.65,
      })

      gsap.from('.hero-status', {
        opacity: 0,
        y: 8,
        duration: DUR.normal,
        ease: 'cg-out',
        delay: 0.75,
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      className="section-glow relative flex min-h-[calc(100vh-60px)] w-full items-center justify-center overflow-hidden bg-[var(--bg)]"
    >
      {/* Ambient Radial Glow — top center */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(179, 236, 19, 0.06) 0%, transparent 60%)',
        }}
      />

      {/* Noise Texture Overlay */}
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.03] mix-blend-overlay">
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

      {/* Vignette edges */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, var(--ambient-vignette) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-[var(--space-16)] px-[var(--space-6)] py-[var(--space-24)] lg:grid-cols-2">
        {/* Left Side: Copy */}
        <div className="flex flex-col items-start text-left">
          <div className="hero-anim hero-eyebrow mb-[var(--space-6)] flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--badge-default-bg)] px-[var(--space-3)] py-[6px] [box-shadow:var(--shadow-xs)]">
            <div className="h-[6px] w-[6px] rounded-[var(--radius-full)] bg-[var(--accent)] cg-pulse-glow" />
            <span className="text-label text-[var(--text-secondary)]">
              Context Engine v1.0
            </span>
          </div>

          <h1 className="text-display-xxl text-[var(--text-primary)]" style={{ perspective: '800px' }}>
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
            <span className="hero-word inline-block text-gradient-accent">
              visible.
            </span>
          </h1>

          <p className="hero-anim hero-subtitle mt-[var(--space-6)] max-w-lg text-body-lg text-[var(--text-secondary)]">
            ContextGraph is a cross-AI personal context engine. Store your
            identity, agency, and project context as a graph — accessible to any
            MCP-compatible AI.
          </p>

          <div className="hero-cta mt-[var(--space-10)] flex flex-wrap items-center gap-[var(--space-4)]">
            <Link href="/dashboard" passHref className="inline-block">
              <Button variant="accent" size="lg">
                Start Building
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              Read Docs
            </Button>
          </div>
        </div>

        {/* Right Side: Graph Preview */}
        <div className="relative flex w-full items-center justify-center lg:justify-end">
          <div className="hero-graph-bg cg-float relative flex h-full min-h-[480px] w-full max-w-[480px] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-6)] [box-shadow:var(--shadow-lg),var(--shadow-inset)]">
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 z-0 rounded-[var(--radius-xl)]"
              style={{
                backgroundImage: `radial-gradient(var(--graph-dot) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Ambient top highlight */}
            <div
              className="pointer-events-none absolute inset-0 z-0 rounded-[var(--radius-xl)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
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

              {/* Edge SVG layer 1 */}
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
                    className="cg-dash-flow"
                  />
                  <path
                    d="M 50 0 C 50 50, 75 50, 75 100"
                    fill="none"
                    stroke="var(--graph-edge)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                    className="cg-dash-flow"
                  />
                </svg>
              </div>

              {/* Branch Nodes Row */}
              <div className="z-10 grid w-full grid-cols-2 gap-[var(--space-4)] px-[var(--space-4)]">
                {/* Branch 1 */}
                <div className="flex justify-center">
                  <div className="hero-node-branch hero-node card-shine relative flex w-full max-w-[140px] flex-col items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-3)] [box-shadow:var(--shadow-sm),var(--shadow-inset)]">
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
                  <div className="hero-node-branch hero-node relative flex w-full max-w-[140px] flex-col items-center rounded-[var(--radius-md)] border border-[var(--accent)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-3)] [box-shadow:var(--shadow-accent),var(--shadow-md)]">
                    <span className="text-heading-sm text-[var(--text-primary)]">
                      Identity
                    </span>
                    <div className="mt-[var(--space-2)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                      <div className="h-full w-[60%] rounded-[var(--radius-full)] bg-[var(--warning)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Edge SVG layer 2 */}
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
                    className="cg-dash-flow"
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
            <div className="hero-status absolute bottom-[var(--space-4)] z-20 flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--surface)] px-[var(--space-3)] py-1.5 [box-shadow:var(--shadow-sm)]">
              <div className="h-2 w-2 rounded-[var(--radius-full)] bg-[var(--accent)] cg-pulse-glow" />
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
