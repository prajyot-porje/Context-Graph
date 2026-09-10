'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import {
  Check,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react'

interface Step {
  number: string
  title: string
  subtitle: string
  description: string
  badge: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Structure your foundation',
    subtitle: 'Define role, stack, and conventions',
    description:
      'Answer a few quick questions or paste your existing guidelines. ContextGraph structures your identity, tech stack, and architectural rules into an organized semantic graph.',
    badge: 'Step 1: Setup',
  },
  {
    number: '02',
    title: 'Plug into any AI tool',
    subtitle: 'Universal Model Context Protocol',
    description:
      'Connect Claude, Cursor, Windsurf, or Codex CLI in seconds. One unified API key connects all your assistants to your single source of truth.',
    badge: 'Step 2: Connect',
  },
  {
    number: '03',
    title: 'Code without repeating yourself',
    subtitle: 'Zero-prompt context injection & evolution',
    description:
      'Assistants automatically query relevant nodes on prompt 1. When you make architecture decisions, type /save to persist updates to your graph in real time.',
    badge: 'Step 3: Build',
  },
]

export function HowItWorks() {
  const containerRef = useRef<HTMLElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [testingPing, setTestingPing] = useState(false)
  const [pingVerified, setPingVerified] = useState(false)

  const handleTestPing = () => {
    setTestingPing(true)
    setTimeout(() => {
      setTestingPing(false)
      setPingVerified(true)
      setTimeout(() => setPingVerified(false), 3000)
    }, 600)
  }

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.hiw-header, .hiw-card', { opacity: 1, y: 0 })
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

      gsap.from('.hiw-card', {
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

  const renderVisualCompanion = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="flex flex-col w-full text-left gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[var(--text-primary)]">User Context Blueprint</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Scope: @identity/root</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] border border-[rgba(179,236,19,0.2)] text-[9px] font-mono font-bold uppercase">
                Graph Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-left">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">Primary Role</div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">Lead Architect</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Full-Stack Web &amp; AI</div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-left">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">Active Repository</div>
                <div className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">TaskFlow SaaS</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Production Branch</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-2 text-left font-mono text-[11px]">
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Engineered Rules Injected:</div>
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <span className="text-[var(--accent)] font-bold">✓</span>
                <span>Next.js 15 App Router · TypeScript Strict</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <span className="text-[var(--accent)] font-bold">✓</span>
                <span>Programmatic tenant auth via Better Auth</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <span className="text-[var(--accent)] font-bold">✓</span>
                <span>Tailwind v4 tokens only (no hardcoded hex)</span>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="flex flex-col w-full text-left gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[var(--text-primary)]">Cross-AI Connection Hub</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Universal Model Context Protocol (MCP v1.0)</div>
                </div>
              </div>

              {/* Interactive Test Ping Button */}
              <button
                onClick={handleTestPing}
                disabled={testingPing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)] transition-[border-color,background-color,color] duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3 h-3 text-[var(--accent)]', testingPing && 'animate-spin')} />
                <span>{pingVerified ? 'Verified (4ms)' : testingPing ? 'Pinging...' : 'Verify Link'}</span>
              </button>
            </div>

            {/* Connected Clients Matrix */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>⚡</span> Cursor IDE
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] mt-2">@stack/nextjs · @rules/tokens</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>🔮</span> Claude Code
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] mt-2">@identity/architect · @rules/auth</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>⚙️</span> Codex CLI
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] mt-2">@stack/supabase · @db/schema</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>💬</span> ChatGPT Web
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] mt-2">@identity/lead · @projects/active</span>
              </div>
            </div>

            {/* Explanatory summary */}
            <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-left flex items-start gap-2.5">
              <span className="text-[var(--accent)] font-bold text-[13px] mt-0.5">●</span>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                One personal API key securely connects every tool. Context updates propagate across all clients in real time without manual copy-pasting.
              </p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="flex flex-col w-full text-left gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-[var(--text-primary)]">Live Context Injection</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Prompt augmentation at runtime</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] border border-[rgba(179,236,19,0.2)] text-[9px] font-mono font-bold uppercase">
                1 Turn Answer
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-left">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Incoming User Prompt:</div>
              <div className="text-[13px] text-[var(--text-primary)] font-medium">
                &ldquo;Write the server action to update user billing plan.&rdquo;
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-2 text-left">
              <div className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-ping" />
                Context Injected Instantly:
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                → Scoped to <span className="text-[var(--text-primary)] font-semibold">@rules/session-auth</span> (uses requireSessionUser)
                <br />
                → Linked with <span className="text-[var(--text-primary)] font-semibold">@stack/supabase</span> (filters by user_id, no raw SQL)
                <br />
                → Returns typed action state without 3 turns of back-and-forth questioning.
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[var(--text-secondary)]">
              <span>Saved conversation turns: <strong className="text-[var(--accent)] font-semibold">3-4 turns</strong></span>
              <span>Latency added: <strong className="text-[var(--text-primary)] font-semibold">0ms</strong></span>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section id="how-it-works" ref={containerRef} className="relative py-28 bg-[var(--bg)] border-t border-[var(--border)]">
      <div className="mx-auto max-w-[1200px] px-[var(--space-6)] relative z-10">
        {/* Section Header */}
        <div className="hiw-header mb-16 text-left">
          <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] w-max px-3.5 py-1 shadow-[var(--shadow-xs)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.12em] uppercase">
              Workflow Protocol
            </span>
          </div>

          <h2 className="text-display-lg text-[var(--text-primary)] font-bold uppercase tracking-tight">
            Connected context in three steps.
          </h2>

          <p className="mt-[var(--space-4)] max-w-[56ch] text-body-md text-[var(--text-secondary)] leading-relaxed">
            From zero to cross-AI memory in under two minutes. Designed to get out of your way and let you build.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="hiw-card grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Interactive Steppers */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 relative">
            {STEPS.map((step, i) => {
              const isActive = activeStep === i
              return (
                <div
                  key={i}
                  onMouseEnter={() => setActiveStep(i)}
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    'group relative z-10 flex flex-row items-start p-5 sm:p-6 rounded-[20px] border transition-[background-color,border-color,box-shadow] duration-200 ease-out cursor-pointer text-left',
                    isActive
                      ? 'bg-[var(--card)] border-[var(--border-strong)] shadow-[var(--shadow-sm)]'
                      : 'bg-transparent border-transparent hover:bg-[var(--surface)]/50 hover:border-[var(--border)]'
                  )}
                >
                  {/* Step Number Badge */}
                  <div
                    className={cn(
                      'mr-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border text-[12px] font-bold transition-[border-color,background-color,color,box-shadow] duration-200 ease-out',
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_0_12px_rgba(179,236,19,0.3)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] group-hover:border-[var(--border-strong)] group-hover:text-[var(--text-primary)]'
                    )}
                  >
                    {step.number}
                  </div>

                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={cn(
                          'text-heading-sm font-bold transition-colors duration-200 uppercase tracking-tight',
                          isActive
                            ? 'text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                        )}
                      >
                        {step.title}
                      </h3>
                      <span className="text-[9px] font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        {step.badge}
                      </span>
                    </div>

                    <div className="text-[12px] font-medium text-[var(--text-secondary)] mb-2">
                      {step.subtitle}
                    </div>

                    <p
                      className={cn(
                        'text-body-sm leading-relaxed transition-colors duration-200',
                        isActive ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Live Context Interface Companion */}
          <div className="lg:col-span-7 rounded-[2rem] p-1.5 bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div
              className="rounded-[calc(2rem-6px)] p-6 sm:p-8 flex flex-col min-h-[400px] justify-center overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {renderVisualCompanion()}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
