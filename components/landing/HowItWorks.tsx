'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

const STEPS = [
  {
    number: '01',
    title: 'Answer 4 questions',
    description:
      'Sign up and complete a 3-minute onboarding. We generate your initial context graph: identity, skills, projects, and goals.',
  },
  {
    number: '02',
    title: 'Connect your AI tools',
    description:
      'Copy your personal API key. Add one line to Claude, ChatGPT, or Codex config. Every session starts with your full context loaded.',
  },
  {
    number: '03',
    title: 'Let it grow automatically',
    description:
      'Type /save at the end of any session. Your graph updates itself. Relevance scores keep your context fresh and your AI sharp.',
  },
]

export function HowItWorks() {
  const container = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.step-header, .step-row, .step-line', { opacity: 1, x: 0, scaleY: 1 })
        return
      }

      gsap.from('.step-header', {
        opacity: 0,
        y: 24,
        duration: 0.4,
        ease: 'cg-out',
        scrollTrigger: {
          trigger: container.current,
          start: 'top 88%',
          once: true,
        },
      })

      gsap.from('.step-row', {
        opacity: 0,
        x: -32,
        duration: 0.4,
        ease: 'cg-out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: '.step-list',
          start: 'top 88%',
          once: true,
        },
      })

      gsap.from('.step-line', {
        scaleY: 0,
        transformOrigin: 'top',
        duration: 0.6,
        ease: 'cg-out',
        stagger: 0.2,
        scrollTrigger: {
          trigger: '.step-list',
          start: 'top 88%',
          once: true,
        },
      })
    },
    { scope: container }
  )

  return (
    <section ref={container} className="relative py-[var(--space-24)]">
      <div className="section-divider absolute left-0 right-0 top-0" />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        <div className="step-header mb-[var(--space-16)]">
          <div className="mb-[var(--space-4)] text-label text-[var(--accent)]">
            Setup
          </div>
          <h2 className="text-display-lg text-[var(--text-primary)]">
            Three steps to connected context
          </h2>
        </div>

        <div className="step-list flex flex-col">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="step-row group relative flex flex-row items-start py-[var(--space-8)]"
            >
              <div className="relative mr-[var(--space-8)] flex w-[var(--space-12)] shrink-0 flex-col items-center">
                <div className="relative z-10 flex h-[var(--space-12)] w-[var(--space-12)] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] text-[14px] font-bold text-[var(--accent)] [box-shadow:var(--shadow-sm),var(--shadow-inset)] transition-[border-color,box-shadow] duration-200 group-hover:border-[var(--accent)] group-hover:[box-shadow:var(--shadow-accent)]">
                  {step.number}
                </div>

                {i < STEPS.length - 1 && (
                  <div
                    className="step-line absolute top-[var(--space-12)] w-[1px]"
                    style={{
                      height: 'calc(100% - var(--space-12) + var(--space-8))',
                      background:
                        'linear-gradient(180deg, var(--border-strong) 0%, var(--border) 100%)',
                    }}
                  />
                )}
              </div>

              <div className="flex-1 pt-[var(--space-2)]">
                <h3 className="text-heading-lg text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--accent)]">
                  {step.title}
                </h3>
                <p className="mt-[var(--space-2)] max-w-[520px] text-body-md text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
