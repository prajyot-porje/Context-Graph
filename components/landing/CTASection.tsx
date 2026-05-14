'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import Link from 'next/link'

export function CTASection() {
  const container = useRef<HTMLElement>(null)
  
  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set('.cta-heading', { opacity: 1, y: 0 })
      return
    }

    gsap.from('.cta-heading', {
      opacity: 0,
      y: 24,
      duration: 0.5,
      ease: 'cg-out',
      scrollTrigger: {
        trigger: container.current,
        start: 'top 88%',
        once: true,
      }
    })
  }, { scope: container })

  return (
    <section ref={container} className="relative flex w-full flex-col items-center justify-center border-t border-[var(--border)] bg-[var(--bg-gradient)] py-[96px] text-center overflow-hidden">
      {/* Background Gradient & Noise like Hero */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[var(--bg-gradient)]" />
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-5 mix-blend-overlay">
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
      
      <div className="relative z-10 mx-auto max-w-[800px] px-[24px]">
        <div className="mx-auto mb-[20px] rounded-[var(--radius-full)] bg-[var(--badge-default-bg)] px-3 py-1 w-max">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)] font-geist">
            Open beta
          </span>
        </div>

        <h2 className="cta-heading mb-[20px] font-display text-[36px] font-bold leading-[1.0] tracking-[-2px] text-[var(--text-primary)] md:text-[48px] lg:text-[64px]">
          Start building your<br />context graph
        </h2>

        <p className="mx-auto mb-[40px] max-w-[500px] font-geist text-[18px] text-[var(--text-secondary)]">
          Free to start. Works with every major AI tool. Your context, your data.
        </p>

        <div className="flex flex-col items-center justify-center gap-[12px] sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-[48px] items-center justify-center rounded-[var(--radius-md)] px-[32px] font-geist text-[15px] font-semibold transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            style={{ color: 'var(--bg)', backgroundColor: 'var(--text-primary)' }}
          >
            Get Started Free
          </Link>
          <Link
            href="/docs"
            className="inline-flex h-[48px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent px-[32px] font-geist text-[15px] font-medium text-[var(--text-primary)] transition-[border-color,background-color] duration-150 hover:border-[rgba(255,255,255,0.28)] hover:bg-[rgba(255,255,255,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </section>
  )
}
