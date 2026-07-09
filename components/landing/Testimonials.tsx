'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'

const QUOTES = [
  {
    body: 'I set up my context graph on a Friday afternoon. By Monday, Claude, Cursor, and ChatGPT all knew my stack, my preferences, and what I was building. That week felt different.',
    name: 'Marcus Reyes',
    role: 'Principal Engineer',
    company: 'Fieldwork Labs',
  },
  {
    body: 'I used to spend the first 10 minutes of every AI session explaining myself. With ContextGraph, that time went to zero. The productivity gain is real.',
    name: 'Priya Sundaram',
    role: 'Staff Software Engineer',
    company: 'Orbit Systems',
  },
  {
    body: "Finally a tool that treats context as infrastructure, not an afterthought. The MCP integration is dead simple. It just works.",
    name: 'Tom Bergmann',
    role: 'Founding Engineer',
    company: 'Vanta AI',
  },
]

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.testi-header, .testi-card', { opacity: 1, y: 0 })
        return
      }

      gsap.from('.testi-header', {
        opacity: 0,
        y: 24,
        duration: DUR.slow,
        ease: 'cg-out',
        scrollTrigger: { trigger: '.testi-header', start: 'top 88%', once: true },
      })

      gsap.from('.testi-card', {
        opacity: 0,
        y: 36,
        duration: DUR.slow,
        ease: 'cg-out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.testi-grid', start: 'top 82%', once: true },
      })
    },
    { scope: sectionRef }
  )

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[var(--bg)] py-28 md:py-36"
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-8">

        {/* Header */}
        <div className="testi-header mb-4 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Early access
          </p>
        </div>

        <h2
          className="testi-header mb-16 font-display text-[var(--text-primary)]"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, lineHeight: 1.08, letterSpacing: 'clamp(-1px, -0.025em, -2px)' }}
        >
          Engineers who stopped<br className="hidden md:block" /> re-explaining themselves
        </h2>

        {/* Quotes grid — horizontal 3-col on desktop */}
        <div className="testi-grid grid grid-cols-1 gap-3 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <div key={i} className="testi-card">
              {/* Card — no border, just background contrast */}
              <div className="flex h-full flex-col rounded-[var(--radius-xxl)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-7 shadow-[var(--shadow-sm),var(--shadow-inset)] md:p-8">

                {/* Quote body — max 3 lines */}
                <blockquote className="flex-1 text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
                  {q.body}
                </blockquote>

                {/* Attribution */}
                <div className="mt-8 flex items-center gap-3">
                  {/* Avatar placeholder — monogram */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[rgba(255,255,255,0.08)] bg-[var(--surface)] text-[11px] font-bold text-[var(--text-muted)]">
                    {q.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--text-primary)]">{q.name}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{q.role}, {q.company}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
