'use client'

import React, { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

const STATS = [
  { value: '7+', label: 'AI clients supported' },
  { value: '< 8ms', label: 'Context load time' },
  { value: '0.0s', label: 'Manual copy-paste' },
  { value: '100%', label: 'Self-sovereign data' },
]

export function Stats() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.stat-card', { opacity: 1, y: 0 })
        return
      }

      gsap.from('.stat-card', {
        opacity: 0,
        y: 16,
        duration: 0.55,
        ease: 'cg-out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 88%',
          once: true,
        },
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden py-16 bg-[var(--bg)]"
    >
      {/* Top and Bottom Gradient Dividers */}
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />
      <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      {/* Surface background with a very subtle precision dot pattern */}
      <div className="absolute inset-0 z-0 bg-[var(--surface)] opacity-[0.25]" />
      <div
        className="absolute inset-0 z-0 opacity-[0.01]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-[var(--space-6)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="stat-card group rounded-2xl p-1 bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/5 shadow-[var(--shadow-sm)]"
            >
              <div
                className="rounded-[12px] p-6 flex flex-col justify-center items-start text-left h-full transition-[border-color,transform] duration-200 group-hover:border-white/10"
                style={{
                  background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                  boxShadow: 'var(--shadow-inset)',
                }}
              >
                {/* Numeric Stat Value - display-lg, tabular figures */}
                <div className="text-display-lg text-[var(--text-primary)] font-bold tracking-tight leading-none font-display tabular-nums">
                  {stat.value}
                </div>
                {/* Micro uppercase label */}
                <div className="mt-3 text-label text-[9px] text-[var(--text-secondary)] font-semibold tracking-[0.1em] uppercase">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
