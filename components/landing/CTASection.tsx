'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import Link from 'next/link'

export function CTASection() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.cta-badge, .cta-heading, .cta-sub, .cta-actions', { opacity: 1, y: 0, scale: 1 })
        return
      }

      const trigger = {
        trigger: containerRef.current,
        start: 'top 75%',
        once: true,
      }

      gsap.from('.cta-badge', {
        opacity: 0,
        y: 12,
        duration: 0.4,
        ease: 'cg-out',
        scrollTrigger: trigger,
      })

      gsap.from('.cta-heading', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'cg-out',
        delay: 0.08,
        scrollTrigger: trigger,
      })

      gsap.from('.cta-sub', {
        opacity: 0,
        y: 12,
        duration: 0.4,
        ease: 'cg-out',
        delay: 0.2,
        scrollTrigger: trigger,
      })

      gsap.from('.cta-actions', {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: 'cg-spring',
        delay: 0.28,
        scrollTrigger: trigger,
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      className="relative flex w-full flex-col items-center justify-center overflow-hidden py-32 text-center bg-[var(--bg)]"
    >
      {/* Top divider */}
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      {/* Ambient accent glow from center */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(179, 236, 19, 0.04) 0%, transparent 70%)',
        }}
      />

      {/* Noise overlay */}
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.015] mix-blend-overlay">
        <filter id="cta-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#cta-noise)" />
      </svg>

      <div className="relative z-10 mx-auto max-w-[800px] px-[var(--space-6)] flex flex-col items-center">
        {/* Badge */}
        <div className="cta-badge mx-auto mb-6 flex w-max items-center gap-2 rounded-full border border-white/5 bg-white/[0.01] px-3.5 py-1.5 shadow-[var(--shadow-xs)]">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-label text-[9px] text-[var(--accent)] font-semibold tracking-[0.1em] uppercase">
            Open beta
          </span>
        </div>

        {/* Headline - display-xl, sentence case, Bricolage display font */}
        <h2 className="cta-heading text-display-xl text-[var(--text-primary)] font-bold uppercase tracking-tight max-w-[15ch] leading-none mb-6">
          Start building your context graph.
        </h2>

        {/* Sub text */}
        <p className="cta-sub mx-auto max-w-[50ch] text-body-lg text-[var(--text-secondary)] mb-10 leading-relaxed">
          Free to start. Works with every major AI tool. Your context, your data.
        </p>

        <div className="cta-actions flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <Link href="/dashboard" className="inline-block">
            <button
              className="min-h-11 px-5 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-[13px] transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] inline-flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Start Building
              <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-black/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                ↗
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
              className="min-h-11 px-6 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] font-medium text-[13px] transition-[border-color,background-color,transform] duration-150 ease-out hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.02)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              View on GitHub
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
