'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Terminal, Shield, Sparkles, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    number: '01',
    title: 'Complete 3-minute onboarding',
    description:
      'Answer questions about your identity, stack, active projects, and primary goals. We analyze and structure your initial context graph automatically.',
  },
  {
    number: '02',
    title: 'Connect your AI clients',
    description:
      'Copy your secure API key. Add one configuration snippet to Claude Desktop, ChatGPT, or Cursor. Your AI client now has access to the Graph.',
  },
  {
    number: '03',
    title: 'Sync memory automatically',
    description:
      'Type /save at the end of any coding session. The protocol processes the conversation transcripts and appends relevant updates to the graph.',
  },
]

export function HowItWorks() {
  const container = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.hiw-header, .hiw-grid', { opacity: 1, y: 0 })
        return
      }

      const trigger = {
        trigger: container.current,
        start: 'top 85%',
        once: true,
      }

      gsap.from('.hiw-header', {
        opacity: 0,
        y: 20,
        duration: 0.45,
        ease: 'cg-out',
        scrollTrigger: trigger,
      })

      gsap.from('.hiw-grid', {
        opacity: 0,
        y: 32,
        duration: 0.55,
        ease: 'cg-out',
        scrollTrigger: trigger,
      })
    },
    { scope: container }
  )

  const renderVisualCompanion = (stepIdx: number) => {
    switch (stepIdx) {
      case 0:
        return (
          <div className="flex flex-col gap-3.5 w-full max-w-[320px] font-mono text-[11px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] p-5 shadow-sm text-left">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 mb-1">
              <Sparkles size={12} className="text-[var(--text-primary)]" strokeWidth={1.5} />
              <span className="font-semibold uppercase tracking-wider text-[10px]">onboarding_payload.json</span>
            </div>
            <div><span className="text-[var(--text-muted)]">"identity":</span> "Lead Full-Stack Architect"</div>
            <div><span className="text-[var(--text-muted)]">"skills":</span> ["TypeScript", "Next.js", "Postgres"]</div>
            <div><span className="text-[var(--text-muted)]">"projects":</span> ["TaskFlow SaaS", "ContextGraph"]</div>
            <div><span className="text-[var(--text-muted)]">"goals":</span> "Deploy cross-AI integration"</div>
          </div>
        )
      case 1:
        return (
          <div className="flex flex-col gap-3.5 w-full max-w-[340px] font-mono text-[11px] bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] p-5 shadow-sm text-left">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] border-b border-[var(--border)] pb-2 mb-1">
              <Terminal size={12} className="text-[var(--text-primary)]" strokeWidth={1.5} />
              <span className="font-semibold uppercase tracking-wider text-[10px]">mcp_config.json</span>
            </div>
            <div className="text-[var(--text-secondary)] whitespace-pre overflow-x-auto select-all leading-[1.6]">
{`{
  "mcpServers": {
    "context-graph": {
      "command": "npx",
      "args": ["-y", "@context-graph/mcp"],
      "env": {
        "CONTEXT_GRAPH_API_KEY": "cg_live_9f27...41d"
      }
    }
  }
}`}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="flex flex-col items-center justify-center gap-4 w-full max-w-[300px] border border-[var(--border)] rounded-[var(--radius-md)] p-6 bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] shadow-[var(--shadow-sm)] min-h-[180px]">
            <div className="flex items-center gap-6">
              {/* Parent node */}
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--text-secondary)]">
                <Shield size={16} strokeWidth={1.5} />
              </div>
              <div className="h-[1px] w-12 bg-[var(--border-strong)] relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] opacity-40" />
              </div>
              {/* Newly appended node */}
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--text-primary)] text-[var(--text-primary)] shadow-sm">
                <Network size={16} strokeWidth={1.5} />
              </div>
            </div>
            <div className="text-[10px] font-mono text-[var(--text-secondary)] font-semibold mt-3">
              Appended node: /projects/taskflow
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <section ref={container} className="relative py-24 bg-[var(--bg)]">
      <div className="section-divider absolute left-0 right-0 top-0" />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        {/* Section Header */}
        <div className="hiw-header mb-16 text-left">
          <span className="inline-block text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.1em] uppercase mb-4">
            INTELLIGENT RUNTIME
          </span>
          <h2 className="text-display-lg text-[var(--text-primary)] font-bold uppercase tracking-tight">
            Connected context in three steps
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
                    "group relative z-10 flex flex-row items-start p-5 rounded-[var(--radius-lg)] border transition-all duration-200 ease-out cursor-pointer text-left",
                    isActive
                      ? "bg-[rgba(255,255,255,0.02)] border-[var(--border-strong)] shadow-[var(--shadow-sm)]"
                      : "bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.01)]"
                  )}
                >
                  {/* Step Number Badge - High contrast neutral */}
                  <div className={cn(
                    "mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border text-[12px] font-bold transition-all duration-200 ease-out",
                    isActive
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg)]"
                      : "border-[var(--border-strong)] bg-[var(--card)] text-[var(--text-secondary)] group-hover:border-[var(--text-primary)] group-hover:text-[var(--text-primary)]"
                  )}>
                    {step.number}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <h3 className={cn(
                      "text-heading-sm font-bold transition-colors duration-200",
                      isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    )}>
                      {step.title}
                    </h3>
                    <p className={cn(
                      "mt-1.5 text-body-sm leading-relaxed transition-colors duration-200",
                      isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Visual companion card with Double Bezel */}
          <div className="lg:col-span-7 rounded-[var(--radius-xxl)] border border-[var(--border)] bg-[rgba(255,255,255,0.015)] p-[5px] shadow-[var(--shadow-sm)]">
            <div
              className="rounded-[calc(var(--radius-xxl)-5px)] p-8 flex items-center justify-center min-h-[310px] relative overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
              
              <div className="transition-[opacity,transform] duration-300 ease-out w-full flex items-center justify-center relative z-10">
                {renderVisualCompanion(activeStep)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
