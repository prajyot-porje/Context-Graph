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
    if (prefersReducedMotion()) return

    const numericElements = container.current?.querySelectorAll('.stat-numeric')
    if (!numericElements) return

    numericElements.forEach((el) => {
      const targetValue = parseFloat(el.getAttribute('data-target') || '0')
      const hasPlus = el.getAttribute('data-has-plus') === 'true'
      
      const counter = { val: 0 }
      gsap.to(counter, {
        val: targetValue,
        duration: 1.2,
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
    <section ref={container} className="w-full border-y border-[var(--border)] py-[48px]" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="mx-auto max-w-[1200px] px-[24px]">
        <div className="grid grid-cols-2 gap-y-[var(--space-12)] md:flex md:w-full md:items-center md:justify-between">
          {STATS.map((stat, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div 
                  className={`font-display text-[48px] font-bold leading-[1.0] tracking-[-2px] text-[var(--text-primary)] ${stat.isNumeric ? 'stat-numeric' : ''}`}
                  data-target={stat.target}
                  data-has-plus={stat.hasPlus}
                >
                  {stat.isNumeric ? '0' : stat.value}
                </div>
                <div className="mt-[6px] font-geist text-[13px] font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                  {stat.label}
                </div>
              </div>
              {i !== STATS.length - 1 && (
                <div className="hidden h-[48px] w-[1px] bg-[var(--border)] md:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
