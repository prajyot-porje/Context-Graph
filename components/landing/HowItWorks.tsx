'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

export function HowItWorks() {
  const container = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set('.step-row', { opacity: 1, x: 0 })
      return
    }

    gsap.from('.step-row', {
      opacity: 0,
      x: -24,
      duration: 0.35,
      ease: 'cg-out',
      stagger: 0.12,
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
        <div className="mb-[var(--space-16)]">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            Setup
          </div>
          <h2 className="font-display text-[48px] font-bold tracking-[-1.5px] text-[var(--text-primary)]">
            Three steps to connected context
          </h2>
        </div>

        <div className="flex flex-col">
          {/* Step 1 */}
          <div className="step-row flex flex-row items-start border-b border-[var(--border)] py-[32px]">
            <div className="w-[64px] shrink-0 font-display text-[14px] font-bold text-[var(--accent)]">
              01
            </div>
            <div className="flex-1">
              <h3 className="font-geist text-[20px] font-semibold text-[var(--text-primary)]">
                Answer 4 questions
              </h3>
              <p className="mt-2 font-geist text-[15px] leading-[1.6] text-[var(--text-secondary)]">
                Sign up and complete a 3-minute onboarding. We generate your initial context graph — identity, skills, projects, and goals.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-row flex flex-row items-start border-b border-[var(--border)] py-[32px]">
            <div className="w-[64px] shrink-0 font-display text-[14px] font-bold text-[var(--accent)]">
              02
            </div>
            <div className="flex-1">
              <h3 className="font-geist text-[20px] font-semibold text-[var(--text-primary)]">
                Connect your AI tools
              </h3>
              <p className="mt-2 font-geist text-[15px] leading-[1.6] text-[var(--text-secondary)]">
                Copy your personal API key. Add one line to Claude, ChatGPT, or Codex config. Every session starts with your full context loaded.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-row flex flex-row items-start border-b border-[var(--border)] py-[32px]">
            <div className="w-[64px] shrink-0 font-display text-[14px] font-bold text-[var(--accent)]">
              03
            </div>
            <div className="flex-1">
              <h3 className="font-geist text-[20px] font-semibold text-[var(--text-primary)]">
                Let it grow automatically
              </h3>
              <p className="mt-2 font-geist text-[15px] leading-[1.6] text-[var(--text-secondary)]">
                Type /save at the end of any session. Your graph updates itself. Relevance scores keep your context fresh and your AI sharp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
