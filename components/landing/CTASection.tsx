'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  const container = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set('.cta-badge, .cta-heading, .cta-sub, .cta-actions', { opacity: 1, y: 0, scale: 1 })
      return
    }

    const trigger = {
      trigger: container.current,
      start: 'top 75%',
      once: true,
    }

    gsap.from('.cta-badge', {
      opacity: 0,
      y: 12,
      duration: 0.3,
      ease: 'cg-out',
      scrollTrigger: trigger,
    })

    gsap.from('.cta-heading', {
      opacity: 0,
      y: 32,
      duration: 0.5,
      ease: 'cg-out',
      delay: 0.1,
      scrollTrigger: { ...trigger },
    })

    gsap.from('.cta-sub', {
      opacity: 0,
      y: 16,
      duration: 0.3,
      ease: 'cg-out',
      delay: 0.25,
      scrollTrigger: { ...trigger },
    })

    gsap.from('.cta-actions', {
      opacity: 0,
      y: 12,
      duration: 0.35,
      ease: 'cg-spring',
      delay: 0.35,
      scrollTrigger: { ...trigger },
    })
  }, { scope: container })

  return (
    <section
      ref={container}
      className="section-glow relative flex w-full flex-col items-center justify-center overflow-hidden py-[var(--space-32)] text-center"
    >
      {/* Top divider */}
      <div className="section-divider absolute left-0 right-0 top-0" />

      {/* Ambient accent glow from center */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(179, 236, 19, 0.04) 0%, transparent 70%)',
        }}
      />

      {/* Noise */}
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.03] mix-blend-overlay">
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

      <div className="relative z-10 mx-auto max-w-[800px] px-[var(--space-6)]">
        {/* Badge */}
        <div className="cta-badge cta-anim mx-auto mb-[var(--space-6)] flex w-max items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--badge-default-bg)] px-[var(--space-3)] py-[6px] [box-shadow:var(--shadow-xs)]">
          <div className="h-[6px] w-[6px] rounded-[var(--radius-full)] bg-[var(--accent)] cg-pulse-glow" />
          <span className="text-label text-[var(--accent)]">
            Open beta
          </span>
        </div>

        {/* Headline */}
        <h2 className="cta-heading cta-anim text-display-xl text-[var(--text-primary)] uppercase tracking-tight">
          Start building your
          <br />
          <span className="text-[var(--text-secondary)]">context graph</span>
        </h2>

        {/* Sub text */}
        <p className="cta-sub cta-anim mx-auto mt-[var(--space-5)] max-w-[500px] text-body-lg text-[var(--text-secondary)]">
          Free to start. Works with every major AI tool. Your context, your data.
        </p>

        <div className="cta-actions cta-anim mt-[var(--space-10)] flex flex-col items-center justify-center gap-[var(--space-4)] sm:flex-row">
          <Link href="/dashboard" passHref className="inline-block">
            <button
              className="min-h-11 px-6 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-[14px] transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] inline-flex items-center gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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
            passHref
            className="inline-block"
          >
            <button
              className="min-h-11 px-6 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] font-medium text-[14px] transition-[border-color,background-color,transform] duration-150 ease-out hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.03)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              View on GitHub
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
