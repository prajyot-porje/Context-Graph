'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, Compass } from 'lucide-react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'

export function NotFoundScene() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const entranceTargets =
        '.not-found-kicker, .not-found-title, .not-found-copy, .not-found-action, .not-found-panel, .not-found-node, .not-found-edge, .not-found-status'

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

      tl.from('.not-found-kicker', {
        autoAlpha: 0,
        y: 12,
        duration: DUR.normal,
      })
        .from(
          '.not-found-title',
          {
            autoAlpha: 0,
            y: 36,
            rotationX: 8,
            duration: DUR.slow,
          },
          '-=0.08'
        )
        .from(
          '.not-found-copy',
          {
            autoAlpha: 0,
            y: 16,
            duration: DUR.moderate,
          },
          '-=0.22'
        )
        .from(
          '.not-found-action',
          {
            autoAlpha: 0,
            y: 12,
            scale: 0.98,
            duration: DUR.moderate,
            ease: 'cg-spring',
          },
          '-=0.18'
        )
        .from(
          '.not-found-panel',
          {
            autoAlpha: 0,
            y: 28,
            scale: 0.96,
            duration: DUR.slow,
          },
          0.12
        )
        .from(
          '.not-found-edge',
          {
            autoAlpha: 0,
            duration: DUR.moderate,
            stagger: 0.06,
          },
          '-=0.18'
        )
        .from(
          '.not-found-node, .not-found-status',
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

      gsap.to('.not-found-float', {
        y: -8,
        rotation: 1.2,
        duration: 2.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.22,
          from: 'center',
        },
      })

      gsap.to('.not-found-edge--active', {
        strokeDashoffset: -24,
        duration: 1.5,
        ease: 'none',
        repeat: -1,
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      aria-labelledby="not-found-title"
      className="section-glow relative flex min-h-[calc(100vh-60px)] w-full items-center overflow-hidden bg-[var(--bg)]"
    >
      <div className="not-found-ambient pointer-events-none absolute inset-0 z-0" />

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.03] mix-blend-overlay"
      >
        <filter id="not-found-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#not-found-noise)" />
      </svg>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-[var(--space-16)] px-[var(--space-6)] py-[var(--space-24)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="max-w-xl text-left">
          <div className="not-found-kicker mb-[var(--space-6)] inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--badge-default-bg)] px-[var(--space-3)] py-[6px] [box-shadow:var(--shadow-xs)]">
            <Compass size={14} aria-hidden="true" />
            <span className="text-label text-[var(--text-secondary)]">
              404 / Route not found
            </span>
          </div>

          <h1
            id="not-found-title"
            className="not-found-title text-display-xl text-[var(--text-primary)]"
            style={{ perspective: '800px' }}
          >
            This context slipped out of the graph.
          </h1>

          <p className="not-found-copy mt-[var(--space-6)] max-w-lg text-body-lg text-[var(--text-secondary)]">
            The page you were looking for may have moved, been renamed, or
            never formed a node in the first place. Let&apos;s route you back to
            stable ground.
          </p>

          <div className="not-found-action mt-[var(--space-10)]">
            <Link
              href="/"
              className={cn(
                'inline-flex min-h-[44px] items-center justify-center gap-[var(--space-2)]',
                'rounded-[var(--radius-md)] px-[var(--space-6)] text-button-md font-medium',
                'bg-[var(--text-primary)] text-[var(--bg)] [box-shadow:var(--shadow-xs)]',
                'transition-[background-color,color,box-shadow,opacity,transform] duration-100 ease-out',
                'hover:-translate-y-[1px] hover:opacity-90 hover:[box-shadow:var(--shadow-sm)]',
                'active:translate-y-0 active:opacity-80',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
              )}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Return to homepage
            </Link>
          </div>
        </div>

        <div
          className="relative flex w-full items-center justify-center lg:justify-end"
          aria-hidden="true"
        >
          <div className="not-found-panel relative min-h-[360px] w-full max-w-[560px] overflow-hidden rounded-[var(--radius-xxl)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-6)] [box-shadow:var(--shadow-lg),var(--shadow-inset)] sm:min-h-[480px]">
            <div className="not-found-grid absolute inset-0 z-0 rounded-[var(--radius-xxl)]" />
            <div className="not-found-panel-light pointer-events-none absolute inset-0 z-0 rounded-[var(--radius-xxl)]" />

            <svg
              className="absolute inset-0 z-10 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                className="not-found-edge"
                d="M 18 28 C 34 15, 52 15, 68 28"
                fill="none"
                stroke="var(--graph-edge)"
                strokeWidth="0.45"
                vectorEffect="non-scaling-stroke"
              />
              <path
                className="not-found-edge not-found-edge--active"
                d="M 32 72 C 48 88, 66 86, 82 70"
                fill="none"
                stroke="var(--graph-edge)"
                strokeDasharray="4 4"
                strokeWidth="0.55"
                vectorEffect="non-scaling-stroke"
              />
              <path
                className="not-found-edge"
                d="M 20 30 C 28 48, 28 58, 32 72"
                fill="none"
                stroke="var(--graph-edge)"
                strokeDasharray="3 5"
                strokeWidth="0.45"
                vectorEffect="non-scaling-stroke"
              />
              <path
                className="not-found-edge"
                d="M 68 28 C 76 42, 78 56, 82 70"
                fill="none"
                stroke="var(--graph-edge)"
                strokeDasharray="3 5"
                strokeWidth="0.45"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="relative z-20 flex min-h-[312px] flex-col items-center justify-center sm:min-h-[432px]">
              <span className="not-found-number not-found-float not-found-accent-text select-none font-display text-[clamp(7rem,22vw,15rem)] font-bold leading-none tracking-[-0.08em]">
                404
              </span>

              <div className="not-found-node not-found-float absolute left-[var(--space-6)] top-[var(--space-8)] rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-gradient-to-b from-[var(--surface)] to-[var(--bg)] px-[var(--space-4)] py-[var(--space-3)] [box-shadow:var(--shadow-md),var(--shadow-inset)] sm:left-[var(--space-10)]">
                <span className="text-heading-sm text-[var(--text-primary)]">
                  Home
                </span>
                <div className="mt-[var(--space-2)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]" />
              </div>

              <div className="not-found-node not-found-float absolute right-[var(--space-5)] top-[var(--space-12)] rounded-[var(--radius-md)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] px-[var(--space-4)] py-[var(--space-3)] [box-shadow:var(--shadow-sm),var(--shadow-inset)] sm:right-[var(--space-10)]">
                <span className="text-heading-sm text-[var(--text-secondary)]">
                  Missing node
                </span>
                <div className="mt-[var(--space-2)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]" />
              </div>

              <div className="not-found-node not-found-float absolute bottom-[var(--space-8)] left-[var(--space-8)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-[var(--space-3)] py-[var(--space-2)] [box-shadow:var(--shadow-xs)] sm:left-[var(--space-16)]">
                <span className="text-body-sm text-[var(--text-muted)]">
                  stale edge
                </span>
              </div>

              <div className="not-found-status absolute bottom-[var(--space-5)] right-[var(--space-5)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--surface)] px-[var(--space-3)] py-[6px] [box-shadow:var(--shadow-sm)] sm:right-[var(--space-8)]">
                <span className="text-code-sm uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                  reroute ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
