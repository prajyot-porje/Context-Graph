'use client'

import React, { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

const STATS = [
  { value: '5+', target: 5, hasPlus: true, label: 'AI tools supported', isNumeric: true },
  { value: '2', target: 2, hasPlus: false, label: 'MCP tools', isNumeric: true },
  { value: '< 1s', target: 0, hasPlus: false, label: 'Context load time', isNumeric: false },
  { value: 'Free', target: 0, hasPlus: false, label: 'To get started', isNumeric: false },
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

    // Numeric counter animation
    const numericElements = container.current?.querySelectorAll('.stat-numeric')
    if (!numericElements) return

    numericElements.forEach((el) => {
      const targetValue = parseFloat(el.getAttribute('data-target') || '0')
      const hasPlus = el.getAttribute('data-has-plus') === 'true'
      
      const counter = { val: 0 }
      gsap.to(counter, {
        val: targetValue,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: container.current,
          start: 'top 88%',
          once: true,
        },
        onUpdate: () => {
          el.innerHTML = Math.floor(counter.val) + (hasPlus ? '+' : '')
        }
      })
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
                <div 
                  className={`text-display-lg text-[var(--text-primary)] ${stat.isNumeric ? 'stat-numeric' : ''}`}
                  data-target={stat.target}
                  data-has-plus={stat.hasPlus}
                >
                  {stat.isNumeric ? '0' : stat.value}
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
