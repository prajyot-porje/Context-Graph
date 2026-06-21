'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { ArrowRight, Terminal, Shield, Sparkles, Network } from 'lucide-react'
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
      'Copy your generated secure API key. Add one line to your Claude, ChatGPT, or Cursor system prompts. Your AI now has access to the Graph.',
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
        duration: 0.4,
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
          <div className="flex flex-col gap-3 w-full max-w-[320px] font-mono text-[11px] bg-[#0c0c0c] border border-[var(--border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] border-b border-[var(--border)] pb-2 mb-1">
              <Sparkles size={12} className="text-[var(--accent)]" />
              <span>onboarding_payload.json</span>
            </div>
            <div><span className="text-[var(--text-muted)]">"identity":</span> "Senior Full-Stack Engineer"</div>
            <div><span className="text-[var(--text-muted)]">"skills":</span> ["TypeScript", "Next.js", "Supabase"]</div>
            <div><span className="text-[var(--text-muted)]">"projects":</span> ["TaskFlow SaaS", "ContextGraph"]</div>
            <div><span className="text-[var(--text-muted)]">"goals":</span> "Deploy multi-user API endpoint"</div>
          </div>
        )
      case 1:
        return (
          <div className="flex flex-col gap-3 w-full max-w-[340px] font-mono text-[11px] bg-[#0c0c0c] border border-[var(--border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] border-b border-[var(--border)] pb-2 mb-1">
              <Terminal size={12} className="text-[var(--accent)]" />
              <span>mcp_config.json</span>
            </div>
            <div className="text-[var(--text-secondary)] whitespace-pre overflow-x-auto">
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
              <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--text-secondary)]">
                <Shield size={16} />
              </div>
              <div className="h-[2px] w-8 bg-[var(--accent)] relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full bg-[var(--accent)] animate-[ping_1.5s_infinite]" />
              </div>
              {/* Newly appended node */}
              <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--accent)] text-[var(--accent)] shadow-[var(--shadow-accent)] animate-pulse">
                <Network size={16} />
              </div>
            </div>
            <div className="text-[10px] font-mono text-[var(--accent)] font-semibold mt-2">
              New node appended: /projects/taskflow
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <section ref={container} className="relative py-[var(--space-24)]">
      <div className="section-divider absolute left-0 right-0 top-0" />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        {/* Section Header */}
        <div className="hiw-header mb-[var(--space-16)]">
          <h2 className="text-display-lg text-[var(--text-primary)] font-bold">
            Three steps to connected context
          </h2>
        </div>

        {/* 2-Column Grid */}
        <div className="hiw-grid grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Vertical timeline steppers */}
          <div className="lg:col-span-5 flex flex-col gap-3 relative">
            {/* Vertical connecting timeline line */}
            <div className="absolute left-[36px] top-6 bottom-6 w-[1px] bg-gradient-to-b from-[var(--border)] via-[var(--border-strong)] to-[var(--border)] z-0 hidden sm:block pointer-events-none" />

            {STEPS.map((step, i) => {
              const isActive = activeStep === i
              return (
                <div
                  key={i}
                  onMouseEnter={() => setActiveStep(i)}
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    "group relative z-10 flex flex-row items-start p-[var(--space-5)] rounded-[var(--radius-lg)] border transition-[background-color,border-color,box-shadow] duration-200 ease-out cursor-pointer text-left",
                    isActive
                      ? "bg-[rgba(255,255,255,0.02)] border-[var(--border-strong)] shadow-[var(--shadow-sm)]"
                      : "bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.01)]"
                  )}
                >
                  {/* Step Number Badge */}
                  <div className={cn(
                    "mr-[var(--space-4)] flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border text-[12px] font-bold transition-[color,background-color,border-color] duration-200 ease-out",
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
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
                      "mt-1 text-body-sm transition-colors duration-200",
                      isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Visual companion card */}
          <div className="lg:col-span-7 flex items-center justify-center p-[var(--space-8)] bg-gradient-to-br from-[var(--card)] to-[rgba(8,8,8,0.7)] border border-[var(--border)] rounded-[var(--radius-xl)] [box-shadow:var(--shadow-inset)] min-h-[290px] relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
              backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
            
            <div className="transition-[opacity,transform] duration-300 ease-out w-full flex items-center justify-center relative z-10">
              {renderVisualCompanion(activeStep)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
