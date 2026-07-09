'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'

const LINES = [
  'Every AI you talk to',
  'starts from zero.',
  'No memory. No context.',
  'No idea who you are.',
]

const CLOSER = 'ContextGraph changes that.'

export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const reduced = prefersReducedMotion()

      if (reduced) {
        gsap.set('.manifesto-line, .manifesto-closer, .manifesto-divider', { opacity: 1, y: 0 })
        return
      }

      // Divider line draws in
      gsap.from('.manifesto-divider', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: DUR.deliberate,
        ease: 'cg-out',
        scrollTrigger: {
          trigger: '.manifesto-divider',
          start: 'top 85%',
          once: true,
        },
      })

      // Lines stagger in from below
      gsap.from('.manifesto-line', {
        opacity: 0,
        y: 48,
        duration: DUR.deliberate,
        ease: 'cg-out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 78%',
          once: true,
        },
      })

      // Closer line (bold statement) comes in last with emphasis
      gsap.from('.manifesto-closer', {
        opacity: 0,
        y: 32,
        duration: DUR.slow,
        ease: 'cg-spring',
        scrollTrigger: {
          trigger: '.manifesto-closer',
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[var(--bg)] py-28 md:py-40"
    >
      {/* Subtle horizontal divider at top */}
      <div className="manifesto-divider mx-auto mb-20 h-px max-w-[1280px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent px-6 md:px-8" />

      <div className="mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="max-w-[820px]">
          {/* Problem lines — muted, reads like prose */}
          <div className="mb-12 space-y-2">
            {LINES.map((line, i) => (
              <p
                key={i}
                className="manifesto-line font-display text-[var(--text-muted)]"
                style={{
                  fontSize: 'clamp(28px, 4.5vw, 60px)',
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: 'clamp(-1px, -0.02em, -2.5px)',
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Solution line — bright, lands as a thesis */}
          <p
            className="manifesto-closer font-display text-[var(--text-primary)]"
            style={{
              fontSize: 'clamp(30px, 4.8vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: 'clamp(-1px, -0.02em, -2.8px)',
            }}
          >
            {CLOSER}
          </p>
        </div>
      </div>
    </section>
  )
}
