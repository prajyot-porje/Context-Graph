'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import Link from 'next/link'
import { ArrowUpRight, Check } from 'lucide-react'

export function CTASection() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.cta-badge, .cta-heading, .cta-sub, .cta-pills, .cta-actions', {
          opacity: 1,
          y: 0,
          scale: 1,
        })
        return
      }

      const trigger = {
        trigger: containerRef.current,
        start: 'top 75%',
        once: true,
      }

      gsap.from('.cta-pod', {
        opacity: 0,
        y: 28,
        duration: 0.7,
        ease: 'cg-out',
        scrollTrigger: trigger,
      })

      gsap.from('.cta-badge', {
        opacity: 0,
        y: 12,
        duration: 0.4,
        ease: 'cg-out',
        delay: 0.1,
        scrollTrigger: trigger,
      })

      gsap.from('.cta-heading', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'cg-out',
        delay: 0.18,
        scrollTrigger: trigger,
      })

      gsap.from('.cta-sub', {
        opacity: 0,
        y: 12,
        duration: 0.4,
        ease: 'cg-out',
        delay: 0.26,
        scrollTrigger: trigger,
      })

      gsap.from('.cta-pills', {
        opacity: 0,
        y: 10,
        duration: 0.4,
        ease: 'cg-out',
        delay: 0.32,
        scrollTrigger: trigger,
      })

      gsap.from('.cta-actions', {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: 'cg-spring',
        delay: 0.38,
        scrollTrigger: trigger,
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      className="relative flex w-full flex-col items-center justify-center overflow-hidden py-28 text-center bg-[var(--bg)]"
    >
      {/* Top section divider */}
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      <div className="relative z-10 mx-auto max-w-[1200px] w-full px-[var(--space-6)]">
        {/* Sculptured Double-Bezel Pod */}
        <div className="cta-pod max-w-[1000px] mx-auto rounded-[2.5rem] p-2 bg-gradient-to-b from-[var(--border-strong)] to-[var(--border)] border border-[var(--border)] shadow-2xl">
          <div
            className="relative rounded-[calc(2.5rem-8px)] p-10 sm:p-16 flex flex-col items-center overflow-hidden text-center"
            style={{
              background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
              boxShadow: 'var(--shadow-inset)',
            }}
          >
            {/* Top-center atmospheric highlight */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-40"
              style={{
                background:
                  'radial-gradient(ellipse 80% 50% at 50% -10%, var(--accent-muted) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            {/* Tactile noise texture */}
            <svg
              className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.02] mix-blend-overlay"
              aria-hidden="true"
            >
              <filter id="cta-noise-grain">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.8"
                  numOctaves="3"
                  stitchTiles="stitch"
                />
              </filter>
              <rect width="100%" height="100%" filter="url(#cta-noise-grain)" />
            </svg>

            {/* Content Core */}
            <div className="relative z-10 flex flex-col items-center max-w-[700px] mx-auto">
              {/* Badge */}
              <div className="cta-badge mb-6 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 shadow-[var(--shadow-xs)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="text-label text-[10px] text-[var(--accent)] font-semibold tracking-[0.12em] uppercase">
                  Open Beta • Free to start
                </span>
              </div>

              {/* Headline */}
              <h2 className="cta-heading text-display-xl text-[var(--text-primary)] font-bold uppercase tracking-tight leading-none mb-6">
                Start building your context graph.
              </h2>

              {/* Subtitle */}
              <p className="cta-sub max-w-[50ch] text-body-lg text-[var(--text-secondary)] mb-8 leading-relaxed font-normal">
                One unified context layer for every coding assistant. Stop re-explaining your stack and start building faster.
              </p>

              {/* Value Proposition Pills */}
              <div className="cta-pills mb-10 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                  <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                  30-Second Setup
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                  <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Private Supabase Storage
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                  <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Zero Model Lock-In
                </span>
              </div>

              {/* Action Buttons */}
              <div className="cta-actions flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <Link href="/dashboard" className="inline-block">
                  <button
                    className="group min-h-11 px-6 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-[15px] tracking-[-0.01em] transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] inline-flex items-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    <span>Start Building</span>
                    <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center shrink-0 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-inherit" />
                    </span>
                  </button>
                </Link>

                <Link
                  href="https://github.com/context-graph/context-graph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <button
                    className="min-h-11 px-6 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] font-medium text-[15px] tracking-[-0.01em] transition-[border-color,background-color,transform] duration-150 ease-out hover:border-[var(--accent)] hover:bg-[var(--card-raised)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    View on GitHub
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
