'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'

const TOOLS = [
  'Claude', 'ChatGPT', 'Gemini', 'Codex', 'Cursor',
  'Antigravity', 'Claude Code', 'Cline', 'Windsurf', 'Copilot',
]

export function Integrations() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.int-header', { opacity: 1, y: 0 })
        return
      }
      gsap.from('.int-header', {
        opacity: 0,
        y: 24,
        duration: DUR.slow,
        ease: 'cg-out',
        scrollTrigger: { trigger: '.int-header', start: 'top 88%', once: true },
      })
    },
    { scope: sectionRef }
  )

  // Duplicate tools for seamless infinite marquee
  const doubled = [...TOOLS, ...TOOLS]

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[var(--bg)] py-24 md:py-32"
    >
      {/* Top divider */}
      <div className="section-divider mx-auto mb-20 max-w-[1280px] px-6 md:px-8" />

      <div className="mx-auto max-w-[1280px] px-6 md:px-8">
        <p className="int-header mb-3 text-[13px] text-[var(--text-secondary)]">
          Works with every MCP-compatible tool
        </p>
      </div>

      {/* Marquee container — full bleed with fade masks */}
      <div className="relative mt-5">
        {/* Left fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32"
          style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }}
        />
        {/* Right fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32"
          style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }}
        />

        {/* Scrolling track */}
        <div className="flex overflow-hidden">
          <div className="cg-marquee flex shrink-0 items-center gap-3">
            {doubled.map((tool, i) => (
              <div
                key={`${tool}-${i}`}
                className="flex shrink-0 items-center gap-2.5 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] px-5 py-3"
              >
                {/* Neutral status dot */}
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(255,255,255,0.2)]" />
                <span className="whitespace-nowrap text-[13px] font-semibold text-[var(--text-secondary)]">
                  {tool}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
