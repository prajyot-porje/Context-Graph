'use client'

import React, { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

const STATS = [
  { value: '7+', label: 'AI CLIENTS SUPPORTED' },
  { value: '< 1s', label: 'CONTEXT LOAD TIME' },
  { value: 'Free', label: 'TO GET STARTED' },
  { value: '100%', label: 'YOUR DATA' },
]

export function Stats() {
  const container = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (prefersReducedMotion()) {
      gsap.set('.stat-item', { opacity: 1, y: 0 })
      return
    }

    gsap.from('.stat-item', {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: 'cg-out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: container.current,
        start: 'top 90%',
        once: true,
      },
    })
  }, { scope: container })

  return (
    <section ref={container} className="relative w-full overflow-hidden py-[var(--space-16)]">
      {/* Top and Bottom Gradient Dividers */}
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />
      <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      {/* Surface background with a very subtle precision dot pattern */}
      <div className="absolute inset-0 z-0 bg-[var(--surface)] opacity-[0.4]" />
      <div
        className="absolute inset-0 z-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      
      <div className="relative z-10 mx-auto max-w-[1100px] px-[var(--space-6)]">
        <div className="grid grid-cols-2 gap-y-[var(--space-10)] md:flex md:w-full md:items-center md:justify-between">
          {STATS.map((stat, i) => (
            <React.Fragment key={i}>
              <div className="stat-item flex flex-1 flex-col items-center justify-center text-center px-[var(--space-4)]">
                <div className="text-display-lg text-[var(--text-primary)] font-bold tracking-tight tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-[var(--space-3)] text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.1em] uppercase">
                  {stat.label}
                </div>
              </div>
              {i !== STATS.length - 1 && (
                <div className="hidden h-[48px] w-[1px] md:block bg-gradient-to-b from-transparent via-[var(--border-strong)] to-transparent shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
