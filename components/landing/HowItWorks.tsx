'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    number: '01',
    title: 'Complete onboarding',
    description:
      'Answer details about your stack, preferences, rules, and current projects. The system structures your profile automatically.',
  },
  {
    number: '02',
    title: 'Connect your AI clients',
    description:
      'Copy your secure context key. Inject the MCP configuration block into Claude, ChatGPT, or Cursor to bridge the graph.',
  },
  {
    number: '03',
    title: 'Sync memory dynamically',
    description:
      'Type /save at the end of sessions. The protocol processes your conversation transcripts and appends key graph updates.',
  },
]

export function HowItWorks() {
  const containerRef = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.hiw-header, .hiw-grid', { opacity: 1, y: 0 })
        return
      }

      gsap.from('.hiw-header', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'cg-out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          once: true,
        },
      })

      gsap.from('.hiw-grid', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'cg-out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      })
    },
    { scope: containerRef }
  )

  const renderVisualCompanion = (stepIdx: number) => {
    switch (stepIdx) {
      case 0:
        return (
          <div className="flex flex-col w-full text-left font-mono text-[11px] leading-relaxed">
            <div className="text-white/40 mb-1">$ context-engine init</div>
            <div className="flex items-center gap-1.5 text-white/90">
              <span className="text-[var(--accent)] font-bold">?</span> What is your primary focus?
              <span className="text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5 rounded font-semibold">Lead Full-Stack Architect</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90 mt-2">
              <span className="text-[var(--accent)] font-bold">?</span> Enter your main libraries:
              <span className="text-white/60 bg-white/[0.03] border border-white/5 px-1.5 py-0.5 rounded">TypeScript, Next.js, Postgres</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90 mt-2">
              <span className="text-[var(--accent)] font-bold">?</span> Enter active project name:
              <span className="text-white/60 bg-white/[0.03] border border-white/5 px-1.5 py-0.5 rounded">TaskFlow SaaS</span>
            </div>
            <div className="text-[var(--accent)] mt-4 font-semibold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-ping" />
              ✓ Profile saved! Context graph initialized.
            </div>
          </div>
        )
      case 1:
        return (
          <div className="flex flex-col w-full text-left font-mono text-[11px] leading-relaxed">
            <div className="text-white/40 mb-2">// config file: mcp_config.json</div>
            <div className="text-white/80 whitespace-pre overflow-x-auto select-all bg-[#080808]/80 border border-white/5 p-4 rounded-xl shadow-inner">
{`{
  "mcpServers": {
    "context-graph": {
      "command": "npx",
      "args": ["-y", "@context-graph/mcp"],
      "env": {
        "CONTEXT_GRAPH_API_KEY": "`}<span className="text-[var(--accent)] font-bold">cg_live_9f27...41d</span>{`"
      }
    }
  }
}`}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="flex flex-col w-full text-left font-mono text-[11px] leading-relaxed">
            <div className="text-white/40 mb-1">$ context-engine sync --session session_01a</div>
            <div className="text-white/60">[info] Authenticating client credentials...</div>
            <div className="text-white/60">[info] Reading session transcript (4,812 tokens)...</div>
            <div className="text-[var(--accent)] font-semibold mt-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              ✓ Appended node: /projects/active (relevance: 95%)
            </div>
            <div className="text-[var(--accent)] font-semibold flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              ✓ Updated rules: AGENTS.md (relevance: 90%)
            </div>
            <div className="text-white/60 mt-1">[info] Memory graph synchronized successfully.</div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <section ref={containerRef} className="relative py-24 bg-[var(--bg)]">
      <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        {/* Section Header */}
        <div className="hiw-header mb-16 text-left">
          {/* Eyebrow badge */}
          <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.01] w-max px-3.5 py-1 shadow-[var(--shadow-xs)]">
            <span className="h-1 w-1 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="text-label text-[9px] text-[var(--text-secondary)] font-semibold tracking-[0.12em] uppercase">
              Intelligent runtime
            </span>
          </div>
          <h2 className="text-display-lg text-[var(--text-primary)] font-bold uppercase tracking-tight">
            Connected context in three steps.
          </h2>
        </div>

        {/* 2-Column Grid */}
        <div className="hiw-grid grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Vertical timeline steppers */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[36px] top-6 bottom-6 w-[1px] bg-gradient-to-b from-[var(--border)] via-[var(--border-strong)] to-[var(--border)] z-0 hidden sm:block pointer-events-none" />

            {STEPS.map((step, i) => {
              const isActive = activeStep === i
              return (
                <div
                  key={i}
                  onMouseEnter={() => setActiveStep(i)}
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    "group relative z-10 flex flex-row items-start p-5 rounded-[20px] border transition-all duration-300 ease-out cursor-pointer text-left",
                    isActive
                      ? "bg-white/[0.015] border-white/10 shadow-[var(--shadow-sm)]"
                      : "bg-transparent border-transparent hover:bg-white/[0.005]"
                  )}
                >
                  {/* Step Number Badge */}
                  <div className={cn(
                    "mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold transition-all duration-300 ease-out",
                    isActive
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)]"
                      : "border-white/10 bg-[#080808]/40 text-[var(--text-secondary)] group-hover:border-white/20 group-hover:text-[var(--text-primary)]"
                  )}>
                    {step.number}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <h3 className={cn(
                      "text-heading-sm font-bold transition-colors duration-300 uppercase tracking-tight",
                      isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    )}>
                      {step.title}
                    </h3>
                    <p className={cn(
                      "mt-2 text-body-sm leading-relaxed transition-colors duration-300",
                      isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Console Mockup inside Double Bezel card */}
          <div className="lg:col-span-7 rounded-[2rem] border border-white/5 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-1.5 shadow-[var(--shadow-sm)]">
            
            {/* Double Bezel Inner Core - macOS Console Interface */}
            <div
              className="rounded-[calc(2rem-6px)] flex flex-col h-full min-h-[310px] overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {/* macOS Header Chrome */}
              <div className="h-9 bg-black/40 border-b border-white/5 flex items-center px-5 gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="mx-auto text-[9px] font-mono text-white/30 tracking-wider">
                  context_console.sh
                </div>
              </div>

              {/* Console Body Content */}
              <div className="p-8 flex-1 flex items-center justify-center relative overflow-hidden bg-[#080808]/20">
                <div 
                  className="absolute inset-0 opacity-[0.01] pointer-events-none" 
                  style={{
                    backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} 
                />
                
                <div className="transition-all duration-300 ease-out w-full flex items-center justify-center relative z-10">
                  {renderVisualCompanion(activeStep)}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
