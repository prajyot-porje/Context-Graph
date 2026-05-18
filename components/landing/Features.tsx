'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Users, Clock, Share2 } from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    title: 'Build once, use everywhere',
    description:
      'Set up your context graph once. Every MCP-compatible AI reads it automatically — Claude, ChatGPT, Codex, Cursor.',
    accent: false,
  },
  {
    icon: Clock,
    title: 'Auto-updates after every session',
    description:
      'Type /save at the end of any session. AI judges what is worth keeping and appends it to the right node automatically.',
    accent: true,
  },
  {
    icon: Share2,
    title: 'See your context as a living graph',
    description:
      'Watch your context grow over time. Relevance scores decay automatically so stale context never pollutes new sessions.',
    accent: false,
  },
]

export function Features() {
  const container = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.feature-header, .feature-card', { opacity: 1, y: 0 })
        return
      }

      gsap.from('.feature-header', {
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

      gsap.from('.feature-card', {
        opacity: 0,
        y: 40,
        duration: 0.45,
        ease: 'cg-out',
        stagger: 0.1,
        clearProps: 'all',
        scrollTrigger: {
          trigger: '.feature-grid',
          start: 'top 88%',
          once: true,
        },
      })
    },
    { scope: container }
  )

  return (
    <section ref={container} className="relative py-[var(--space-24)]">
      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        {/* Section Header */}
        <div className="feature-header mb-[var(--space-16)]">
          <div className="mb-[var(--space-4)] text-label text-[var(--accent)]">
            How it works
          </div>
          <h2 className="text-display-lg max-w-[600px] text-[var(--text-primary)]">
            Context that travels with you
          </h2>
          <p className="mt-[var(--space-4)] max-w-[500px] text-body-md text-[var(--text-secondary)]">
            Build your personal context graph once. Every AI you work with reads from the same source of truth.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="feature-grid grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="feature-card card-shine group relative flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-6)] [box-shadow:var(--shadow-sm),var(--shadow-inset)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:[box-shadow:var(--shadow-md),var(--shadow-inset)]"
              >
                {/* Icon */}
                <div className="icon-glow flex h-[40px] w-[40px] items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
                  <Icon
                    size={20}
                    className="text-[var(--accent)] transition-transform duration-200 group-hover:scale-110"
                  />
                </div>

                {/* Title */}
                <h3 className="mt-[var(--space-5)] text-heading-md text-[var(--text-primary)]">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="mt-[var(--space-2)] text-body-md text-[var(--text-secondary)]">
                  {feature.description}
                </p>

                {/* Bottom accent line — only on the middle card */}
                {feature.accent && (
                  <div className="absolute bottom-0 left-[var(--space-6)] right-[var(--space-6)] h-[2px] rounded-[var(--radius-full)] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
