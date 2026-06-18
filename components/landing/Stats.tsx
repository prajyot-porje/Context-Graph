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

    // Entrance animation for all stat items
    gsap.from('.stat-item', {
      opacity: 0,
      y: 24,
      duration: 0.4,
      ease: 'cg-out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: container.current,
        start: 'top 88%',
        once: true,
      },
    })
  }, { scope: container })

  return (
    <section ref={container} className="relative w-full overflow-hidden py-[var(--space-12)]">
      {/* Top gradient divider */}
      <div className="section-divider absolute left-0 right-0 top-0" />
      {/* Bottom gradient divider */}
      <div className="section-divider absolute bottom-0 left-0 right-0" />

      <div
        className="absolute inset-0 z-0"
        style={{ backgroundColor: 'var(--surface)' }}
      />
      
      <div className="relative z-10 mx-auto max-w-[1200px] px-[var(--space-6)]">
        <div className="grid grid-cols-2 gap-y-[var(--space-12)] md:flex md:w-full md:items-center md:justify-between">
          {STATS.map((stat, i) => (
            <React.Fragment key={i}>
              <div className="stat-item flex flex-1 flex-col items-center justify-center text-center">
                <div className="text-display-lg text-[var(--text-primary)]">
                  {stat.value}
                </div>
                <div className="mt-[var(--space-2)] text-label text-[var(--text-secondary)]">
                  {stat.label}
                </div>
              </div>
              {i !== STATS.length - 1 && (
                <div className="hidden h-[48px] w-[1px] md:block" style={{
                  background: 'linear-gradient(180deg, transparent, var(--border-strong), transparent)'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
