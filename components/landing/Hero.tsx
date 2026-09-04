'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import the WebGL 3D Graph component to ensure SSR compatibility
const HeroGraph3D = dynamic(
  () => import('./HeroGraph3D').then(mod => mod.HeroGraph3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[350px] lg:min-h-[450px] flex items-center justify-center text-body-sm text-[var(--text-secondary)] font-mono animate-pulse">
        Initializing 3D viewport...
      </div>
    ),
  }
)

export function Hero() {
  const containerRef = useRef<HTMLElement>(null)

  // GSAP Entrance Animations
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(
          '.hero-eyebrow, .hero-title-line, .hero-subtitle, .hero-cta, .hero-visual-wrapper',
          { opacity: 1, y: 0 }
        )
        return
      }

      const tl = gsap.timeline({ delay: 0.2 })

      // Eyebrow badge fade-in
      tl.from('.hero-eyebrow', {
        opacity: 0,
        y: 12,
        duration: 0.5,
        ease: 'cg-out',
      })

      // Title lines slide-up and fade
      tl.from(
        '.hero-title-line',
        {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: 'cg-out',
          stagger: 0.08,
        },
        '-=0.2'
      )

      // Subtitle
      tl.from(
        '.hero-subtitle',
        {
          opacity: 0,
          y: 12,
          duration: 0.5,
          ease: 'cg-out',
        },
        '-=0.3'
      )

      // CTA Buttons
      tl.from(
        '.hero-cta > *',
        {
          opacity: 0,
          y: 10,
          duration: 0.5,
          ease: 'cg-spring',
          stagger: 0.06,
        },
        '-=0.25'
      )

      // Visual Component Wrapper
      tl.from(
        '.hero-visual-wrapper',
        {
          opacity: 0,
          scale: 0.98,
          duration: 0.8,
          ease: 'cg-out',
        },
        '-=0.3'
      )
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[calc(100dvh-60px)] lg:h-[calc(100dvh-60px)] w-full flex-col items-center justify-center overflow-hidden bg-[var(--bg)] px-[var(--space-6)] pt-24 pb-12 lg:py-0"
    >
      {/* Subtle top-center atmospheric radial highlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% -10%, rgba(255, 255, 255, 0.03) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Tactile Noise Grain Overlay */}
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.015] mix-blend-overlay"
        aria-hidden="true"
      >
        <filter id="hero-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-noise)" />
      </svg>

      {/* Grid container separating visualizer and content */}
      <div className="relative z-10 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full max-w-[1200px]">
        
        {/* Left Column: Premium Editorial Copy */}
        <div className="lg:col-span-6 flex flex-col text-left items-start">
          
          {/* Eyebrow label - no neon, extremely minimal */}
          <div className="hero-eyebrow mb-[var(--space-5)] flex items-center gap-[var(--space-2)] rounded-full border border-[var(--border)] bg-white/[0.02] px-3.5 py-1.5 shadow-[var(--shadow-xs)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0 animate-pulse" />
            <span className="text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.12em] uppercase">
              Cross-AI Context Engine
            </span>
          </div>

          {/* Headline - strict display font, sentence case */}
          <h1
            className="hero-title text-display-xl text-[var(--text-primary)] font-bold tracking-[-0.035em] uppercase text-left mb-6"
            style={{ lineHeight: '1.0' }}
          >
            <span className="hero-title-line block">Your context.</span>
            <span className="hero-title-line block text-[var(--text-secondary)]">Every AI Client.</span>
          </h1>

          {/* Subtext - under 65ch line constraint */}
          <p className="hero-subtitle max-w-[50ch] text-body-lg text-[var(--text-secondary)] leading-relaxed font-normal mb-8">
            Create a unified context graph. Expose custom instructions, identities, preferences, and project schemas directly to all models.
          </p>

          {/* Grayscale CTAs with nested trailing icon circle */}
          <div className="hero-cta flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="inline-block">
              <button
                className="min-h-11 px-5 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--bg)] font-semibold text-[13px] transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] inline-flex items-center gap-3.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Start Building
                {/* Button-in-button circle icon */}
                <span className="w-5 h-5 rounded-full bg-black/5 dark:bg-black/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                  ↗
                </span>
              </button>
            </Link>
            <Link href="/docs" className="inline-block">
              <button
                className="min-h-11 px-6 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] font-medium text-[13px] transition-[border-color,background-color,transform] duration-150 ease-out hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.02)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Explore Protocol
              </button>
            </Link>
          </div>
        </div>

        {/* Right Column: Interactive 3D Graph (Wow Factor) */}
        <div className="hero-visual-wrapper lg:col-span-6 w-full flex items-center justify-center">
          {/* Double-Bezel Outer Shell */}
          <div className="w-full max-w-[520px] rounded-[2.5rem] p-2 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/5 shadow-2xl relative">
            {/* Double-Bezel Inner Core */}
            <div
              className="relative w-full h-[350px] lg:h-[450px] rounded-[calc(2.5rem-8px)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-white/[0.02] flex items-center justify-center overflow-hidden"
              style={{ boxShadow: 'var(--shadow-inset)' }}
            >
              {/* Background grid dot overlay */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Render dynamic WebGL graph */}
              <div className="absolute inset-0 z-10 w-full h-full">
                <HeroGraph3D />
              </div>

              {/* Float tag indicators */}
              <div className="absolute top-6 left-6 z-20 pointer-events-none flex flex-col gap-1.5">
                <div className="px-2 py-0.5 rounded bg-[#080808]/80 border border-white/5 text-[9px] font-mono text-[var(--accent)] tracking-wider">
                  ACTIVE_SYNC
                </div>
              </div>

              <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex flex-col gap-1.5 text-right">
                <div className="px-2 py-0.5 rounded bg-[#080808]/80 border border-white/5 text-[9px] font-mono text-[var(--text-secondary)] tracking-wider">
                  LATENCY &lt; 8ms
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
