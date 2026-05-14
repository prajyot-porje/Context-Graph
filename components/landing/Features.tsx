'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

export function Features() {
  const container = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set('.feature-card', { opacity: 1, y: 0 })
      return
    }

    gsap.from('.feature-card', {
      opacity: 0,
      y: 32,
      duration: 0.35,
      ease: 'cg-out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: container.current,
        start: 'top 88%',
        once: true,
      }
    })
  }, { scope: container })

  return (
    <section ref={container} className="py-[96px]">
      <div className="mx-auto max-w-[1200px] px-[24px]">
        <div className="mb-[64px]">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--accent)' }}>
            How it works
          </div>
          <h2 className="max-w-[600px] font-display text-[36px] font-bold leading-[1.05] tracking-[-1.5px] md:text-[48px]" style={{ color: 'var(--text-primary)' }}>
            Context that travels with you
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card 1 */}
          <div className="feature-card flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[28px] [box-shadow:var(--shadow-sm),var(--shadow-inset)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:[box-shadow:var(--shadow-md),var(--shadow-inset)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-muted)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 21a8 8 0 0 0-16 0" />
                <circle cx="10" cy="8" r="5" />
                <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
              </svg>
            </div>
            <h3 className="mt-5 font-geist text-[20px] font-semibold text-[var(--text-primary)]">
              Build once, use everywhere
            </h3>
            <p className="mt-2 font-geist text-[15px] leading-[1.6] text-[var(--text-secondary)]">
              Set up your context graph once. Every MCP-compatible AI reads it automatically — Claude, ChatGPT, Codex, Cursor.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[28px] [box-shadow:var(--shadow-sm),var(--shadow-inset)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:[box-shadow:var(--shadow-md),var(--shadow-inset)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-muted)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="mt-5 font-geist text-[20px] font-semibold text-[var(--text-primary)]">
              Auto-updates after every session
            </h3>
            <p className="mt-2 font-geist text-[15px] leading-[1.6] text-[var(--text-secondary)]">
              Type /save at the end of any session. AI judges what is worth keeping and appends it to the right node automatically.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[28px] [box-shadow:var(--shadow-sm),var(--shadow-inset)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:[box-shadow:var(--shadow-md),var(--shadow-inset)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-muted)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <h3 className="mt-5 font-geist text-[20px] font-semibold text-[var(--text-primary)]">
              See your context as a living graph
            </h3>
            <p className="mt-2 font-geist text-[15px] leading-[1.6] text-[var(--text-secondary)]">
              Watch your context grow over time. Relevance scores decay automatically so stale context never pollutes new sessions.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
