'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Terminal, Network, Layers } from 'lucide-react'
import Link from 'next/link'

function HeroVisualNodeDeck() {
  const deckRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      // Float animations applied to outer wrappers to keep inner hover transforms isolated
      gsap.to('.hero-visual-card-1-wrapper', {
        y: -12,
        rotateZ: -1.5,
        duration: 3.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.to('.hero-visual-card-2-wrapper', {
        y: 14,
        rotateZ: 2,
        duration: 4.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 0.4,
      })

      gsap.to('.hero-visual-card-3-wrapper', {
        y: -10,
        rotateZ: 1,
        duration: 4.0,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 0.8,
      })
    },
    { scope: deckRef }
  )

  return (
    <div
      ref={deckRef}
      className="relative w-full max-w-[420px] h-[380px] flex items-center justify-center select-none"
    >
      {/* Background ambient circular glow inside deck */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(179,236,19,0.05)_0%,transparent_60%)] blur-3xl" />

      {/* Grid Pattern overlay card container */}
      <div className="absolute inset-0 opacity-[0.03] border border-[var(--border)] rounded-[var(--radius-xl)] bg-[rgba(255,255,255,0.01)] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }} />

      {/* Card 1: identity (top left) */}
      <div className="hero-visual-card-1-wrapper absolute top-[15%] left-[-2%] z-20">
        <div className="w-[180px] rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-4 shadow-[var(--shadow-md)] shadow-[var(--shadow-inset)] backdrop-blur-[12px] transition-[transform,border-color,box-shadow] duration-300 ease-out hover:scale-[1.04] hover:border-[rgba(255,255,255,0.18)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] active:scale-[0.98] cursor-pointer">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-[var(--accent)]">
              <Layers size={11} />
              <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">identity</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          </div>
          <div className="space-y-1 font-mono text-[9.5px] text-[var(--text-secondary)]">
            <div>role: "Lead Engineer"</div>
            <div>focus: "AI Systems"</div>
            <div>pref: "TS, NextJS"</div>
          </div>
        </div>
      </div>

      {/* Card 2: projects (center right) */}
      <div className="hero-visual-card-2-wrapper absolute top-[35%] right-[-2%] z-30">
        <div className="w-[190px] rounded-[var(--radius-lg)] border border-[rgba(179,236,19,0.15)] bg-gradient-to-br from-[#0c0c0c] to-[#141414] p-4 shadow-[var(--shadow-lg)] shadow-[var(--shadow-inset)] backdrop-blur-[12px] transition-[transform,border-color,box-shadow] duration-300 ease-out hover:scale-[1.04] hover:border-[rgba(179,236,19,0.3)] hover:shadow-[0_0_15px_rgba(179,236,19,0.08)] active:scale-[0.98] cursor-pointer">
          <div className="flex items-center justify-between border-b border-[rgba(179,236,19,0.15)] pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
              <Network size={11} className="text-[var(--accent)]" />
              <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">projects.db</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
          </div>
          <div className="space-y-1 font-mono text-[9.5px] text-[var(--text-secondary)]">
            <div>name: "TaskFlow SaaS"</div>
            <div>stack: "Better Auth"</div>
            <div className="text-[var(--accent)]">relevance: 98%</div>
          </div>
        </div>
      </div>

      {/* Card 3: skills (bottom left) */}
      <div className="hero-visual-card-3-wrapper absolute bottom-[12%] left-[10%] z-40">
        <div className="w-[170px] rounded-[var(--radius-lg)] border border-[rgba(255,255,255,0.06)] bg-gradient-to-tr from-[var(--card)] to-[rgba(10,10,10,0.8)] p-4 shadow-[var(--shadow-md)] shadow-[var(--shadow-inset)] backdrop-blur-[8px] transition-[transform,border-color,box-shadow] duration-300 ease-out hover:scale-[1.04] hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)] active:scale-[0.98] cursor-pointer">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Terminal size={11} />
              <span className="text-[10px] font-mono tracking-wider uppercase">skills.log</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.3)]" />
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] border border-[var(--border)] text-[8px] font-mono text-[var(--text-secondary)]">React</span>
            <span className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] border border-[var(--border)] text-[8px] font-mono text-[var(--text-secondary)]">Supabase</span>
            <span className="px-1.5 py-0.5 rounded bg-[rgba(179,236,19,0.05)] border border-[rgba(179,236,19,0.15)] text-[8px] font-mono text-[var(--accent)]">GSAP</span>
          </div>
        </div>
      </div>

      {/* Fine connection lines between cards (SVG) with active path pulses */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 300 300" fill="none">
        {/* Connection 1 */}
        <path d="M 80 110 Q 150 160 210 180" stroke="rgba(179,236,19,0.12)" strokeWidth="1" />
        <path d="M 80 110 Q 150 160 210 180" stroke="url(#accent-dash-grad)" strokeWidth="1.5" strokeDasharray="4 12" className="cg-dash-flow" />

        {/* Connection 2 */}
        <path d="M 210 180 Q 140 230 110 250" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <path d="M 210 180 Q 140 230 110 250" stroke="url(#white-dash-grad)" strokeWidth="1.5" strokeDasharray="4 12" className="cg-dash-flow" style={{ animationDirection: 'reverse' }} />

        {/* Gradients for dashes */}
        <defs>
          <linearGradient id="accent-dash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="white-dash-grad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--text-primary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export function Hero() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(
          '.hero-eyebrow, .hero-word, .hero-subtitle, .hero-cta, .hero-visual-wrapper',
          { opacity: 1, y: 0, x: 0, scale: 1 }
        )
        return
      }

      // Eyebrow badge slide-in
      gsap.from('.hero-eyebrow', {
        opacity: 0,
        y: 12,
        duration: DUR.normal,
        ease: 'cg-out',
        delay: 0.05,
      })

      // Word-by-word headline reveal
      gsap.from('.hero-word', {
        opacity: 0,
        y: 32,
        rotateX: 10,
        duration: DUR.slow,
        ease: 'cg-out',
        stagger: 0.06,
        delay: 0.1,
      })

      // Subtitle
      gsap.from('.hero-subtitle', {
        opacity: 0,
        y: 16,
        duration: DUR.moderate,
        ease: 'cg-out',
        delay: 0.35,
      })

      // CTA buttons
      gsap.from('.hero-cta', {
        opacity: 0,
        y: 12,
        duration: DUR.moderate,
        ease: 'cg-spring',
        delay: 0.45,
      })

      // Right visual block fade-in
      gsap.from('.hero-visual-wrapper', {
        opacity: 0,
        scale: 0.96,
        duration: DUR.slow,
        ease: 'cg-out',
        delay: 0.25,
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[85dvh] w-full flex-col items-center justify-center overflow-hidden bg-[var(--bg)] px-[var(--space-6)] pt-16 lg:pt-24 pb-12 lg:pb-16"
    >
      {/* Ambient Atmospheric Radial Highlight — top center */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(179, 236, 19, 0.08) 0%, transparent 65%)',
        }}
      />

      {/* Noise Grain Overlay for Tactile Texture (3% opacity) */}
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.03] mix-blend-overlay">
        <filter id="hero-noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-noise-filter)" />
      </svg>

      {/* Grid container splitting visual and typography columns */}
      <div className="relative z-10 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full max-w-[1200px]">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-7 flex flex-col text-left items-start">
          {/* Custom Premium Badge */}
          <div className="hero-eyebrow mb-[var(--space-6)] flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--badge-default-bg)] px-[var(--space-4)] py-[6px] shadow-[var(--shadow-xs)]">
            <span className="relative flex h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.4)]" />
            <span className="text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.08em]">
              CROSS-AI CONTEXT ENGINE
            </span>
          </div>

          {/* Display headline block using responsive font sizing */}
          <h1
            className="text-[44px] sm:text-[64px] md:text-[80px] lg:text-[96px] font-display text-[var(--text-primary)] font-bold tracking-[-0.03em] uppercase max-w-2xl text-left"
            style={{ perspective: '1000px', lineHeight: '1.0' }}
          >
            <span className="hero-word mr-[var(--space-3)] inline-block">
              Your
            </span>
            <span className="hero-word text-[var(--accent)] mr-[var(--space-3)] inline-block">
              Context.
            </span>
            <br />
            <span className="hero-word mr-[var(--space-3)] inline-block">
              Every
            </span>
            <span className="hero-word mr-[var(--space-3)] inline-block">
              AI.
            </span>
            <span className="hero-word inline-block">
              Always.
            </span>
          </h1>

          {/* Subtext - strictly capped under 20 words for viewport fit */}
          <p className="hero-subtitle mt-[var(--space-5)] max-w-xl text-body-lg text-[var(--text-secondary)] leading-relaxed font-normal text-left">
            Build a unified personal context graph. Feed active guidelines, preferences, and project specifications directly to your coding models.
          </p>

          {/* Action Buttons */}
          <div className="hero-cta mt-[var(--space-8)] flex flex-wrap items-center gap-[var(--space-4)]">
            <Link href="/dashboard" passHref className="inline-block">
              <Button variant="accent" size="lg" className="text-button-md min-h-[48px] px-6">
                Start Building
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </Link>
            <Link href="/docs" passHref className="inline-block">
              <Button variant="secondary" size="lg" className="text-button-md min-h-[48px] px-6">
                Explore Protocol
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Dynamic Visual Deck */}
        <div className="hero-visual-wrapper lg:col-span-5 w-full flex items-center justify-center">
          <HeroVisualNodeDeck />
        </div>
      </div>
    </section>
  )
}
