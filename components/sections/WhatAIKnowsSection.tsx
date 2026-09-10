'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const PROMPTS = [
  {
    user: "Why is my Next.js server action throwing a 401 Unauthorized error?",
    blind: "Which authentication library are you using (NextAuth, Supabase Auth, Clerk, Auth0)? Are you using Pages or App Router? Please share your middleware and session helper code.",
    aware: "In your Next.js App Router setup, your server action calls `requireSessionUser()`, but your client invocation didn't pass the Better Auth session cookie. Here is the fix for your `auth-client.ts` caller.",
    awareTags: ["Better Auth", "App Router", "requireSessionUser()"],
    blindResult: "3+ turns wasted explaining setup",
    awareResult: "Solved in 1 turn with exact file fix"
  },
  {
    user: "Add an API endpoint to export project metrics as CSV.",
    blind: "What database or ORM are you using (Prisma, Drizzle, TypeORM, raw SQL)? What does your projects schema look like? Where are user sessions stored?",
    aware: "Created `/api/projects/export/route.ts` using your typed helper in `lib/db.ts` and `requireSessionUser()`. It queries your Supabase Postgres `projects` table filtered by `user_id` and streams RFC-4180 CSV.",
    awareTags: ["Supabase Postgres", "lib/db.ts", "Tenant isolation"],
    blindResult: "2+ turns explaining database schema",
    awareResult: "Production API route generated instantly"
  },
  {
    user: "Build a modal component for inviting team members.",
    blind: "What UI library or design system do you use? Tailwind, MUI, styled-components? Do you support dark mode? What button corner radius and colors do you follow?",
    aware: "Here is `InviteMemberModal.tsx` styled with your Tailwind v4 design tokens from DESIGN.md. Uses Geist typography, `--radius-md` (10px) buttons with scale-active feedback, and automatically toggles via `data-theme`.",
    awareTags: ["DESIGN.md tokens", "Tailwind v4", "Geist Sans", "data-theme"],
    blindResult: "3+ turns of visual alignment",
    awareResult: "100% design-system compliant on turn 1"
  }
]

export default function WhatAIKnowsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [promptText, setPromptText] = useState('')
  const [stage, setStage] = useState<'typing-prompt' | 'thinking' | 'streaming' | 'completed'>('typing-prompt')
  
  const [userBubbleText, setUserBubbleText] = useState('')
  const [blindResponseText, setBlindResponseText] = useState('')
  const [awareResponseText, setAwareResponseText] = useState('')
  const [visibleTagsCount, setVisibleTagsCount] = useState(0)
  const [prefersReduced, setPrefersReduced] = useState(false)

  // Track prefers-reduced-motion
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(media.matches)
    const listener = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  // Animation and typing cycle
  useEffect(() => {
    const activePrompt = PROMPTS[currentPromptIndex]

    if (prefersReduced) {
      setPromptText(activePrompt.user)
      setUserBubbleText(activePrompt.user)
      setBlindResponseText(activePrompt.blind)
      setAwareResponseText(activePrompt.aware)
      setVisibleTagsCount(activePrompt.awareTags.length)
      setStage('completed')
      
      const timer = setTimeout(() => {
        setCurrentPromptIndex((prev) => (prev + 1) % PROMPTS.length)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
    
    // Stage 1: Typing prompt
    if (stage === 'typing-prompt') {
      let charIndex = 0
      const promptTimer = setInterval(() => {
        setPromptText(activePrompt.user.slice(0, charIndex + 1))
        charIndex++
        if (charIndex >= activePrompt.user.length) {
          clearInterval(promptTimer)
          setTimeout(() => {
            setUserBubbleText(activePrompt.user)
            setStage('thinking')
          }, 500)
        }
      }, 25)
      return () => clearInterval(promptTimer)
    }
    
    // Stage 2: Thinking (show typing indicator)
    if (stage === 'thinking') {
      const thinkingTimer = setTimeout(() => {
        setStage('streaming')
      }, 1200)
      return () => clearTimeout(thinkingTimer)
    }
    
    // Stage 3: Streaming responses
    if (stage === 'streaming') {
      let awareIndex = 0
      let blindIndex = 0
      const totalAwareLength = activePrompt.aware.length
      const totalBlindLength = activePrompt.blind.length
      
      const streamTimer = setInterval(() => {
        let isDone = true
        
        if (blindIndex < totalBlindLength) {
          blindIndex += Math.min(2, totalBlindLength - blindIndex)
          setBlindResponseText(activePrompt.blind.slice(0, blindIndex))
          isDone = false
        }
        
        if (awareIndex < totalAwareLength) {
          awareIndex += Math.min(3, totalAwareLength - awareIndex)
          setAwareResponseText(activePrompt.aware.slice(0, awareIndex))
          
          const progress = awareIndex / totalAwareLength
          const tagsCount = Math.floor(progress * (activePrompt.awareTags.length + 1))
          setVisibleTagsCount(Math.min(tagsCount, activePrompt.awareTags.length))
          
          isDone = false
        }
        
        if (isDone) {
          clearInterval(streamTimer)
          setStage('completed')
        }
      }, 20)
      return () => clearInterval(streamTimer)
    }
    
    // Stage 4: Completed
    if (stage === 'completed') {
      const holdTimer = setTimeout(() => {
        setPromptText('')
        setUserBubbleText('')
        setBlindResponseText('')
        setAwareResponseText('')
        setVisibleTagsCount(0)
        setStage('typing-prompt')
        setCurrentPromptIndex((prev) => (prev + 1) % PROMPTS.length)
      }, 12000)
      return () => clearTimeout(holdTimer)
    }
  }, [currentPromptIndex, stage, prefersReduced])

  // GSAP Entrance
  useGSAP(() => {
    if (!sectionRef.current || prefersReduced) return
    
    gsap.fromTo(
      sectionRef.current.querySelectorAll('.animate-in'),
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'cg-out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        }
      }
    )
  }, [prefersReduced])

  // Format Helper for streamed markdown text
  const formatStreamedText = (text: string) => {
    let processed = text
    const boldCount = (processed.match(/\*\*/g) || []).length
    if (boldCount % 2 !== 0) {
      processed += '**'
    }
    const codeCount = (processed.match(/`/g) || []).length
    if (codeCount % 2 !== 0) {
      processed += '`'
    }

    const parts = processed.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-[var(--text-primary)]">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  return (
    <section
      id="benchmarks"
      ref={sectionRef}
      className="relative py-28 bg-[var(--bg)] border-y border-[var(--border)] overflow-hidden"
    >
      <div className="mx-auto max-w-[1200px] px-[var(--space-6)] relative z-10">
        {/* Header */}
        <div className="animate-in mb-16 text-center max-w-[700px] mx-auto flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] w-max px-3.5 py-1 shadow-[var(--shadow-xs)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="text-label text-[10px] text-[var(--text-secondary)] font-semibold tracking-[0.12em] uppercase">
              AI Efficiency Benchmarks
            </span>
          </div>

          <h2 className="text-display-lg text-[var(--text-primary)] font-bold uppercase tracking-tight mb-4">
            Context comparison simulator.
          </h2>

          <p className="text-body-md text-[var(--text-secondary)] leading-relaxed max-w-[60ch]">
            Generic AI models have no memory of your conventions. Watch how ContextGraph eliminates repetitive alignment cycles, delivering accurate, production-ready code on turn 1.
          </p>
        </div>

        {/* Dynamic Typing Prompt Box */}
        <div className="animate-in mb-10 max-w-[800px] mx-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] flex items-center gap-3 relative">
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
          </div>
          <div className="flex-1 text-left text-body-sm text-[var(--text-primary)] font-mono font-medium min-h-[24px] flex items-center overflow-hidden z-10">
            <span className="line-clamp-2">{promptText}</span>
            {stage === 'typing-prompt' && (
              <span className="w-1.5 h-4 ml-1 bg-[var(--accent)] inline-block shrink-0 animate-pulse" />
            )}
          </div>
        </div>

        {/* Dual-Pane Comparison Simulator */}
        <div className="animate-in grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: WITHOUT CONTEXTGRAPH (The Blind AI) */}
          <div className="rounded-[2rem] p-1.5 bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex transition-[border-color,box-shadow] duration-300">
            <div
              className="w-full rounded-[calc(2rem-6px)] p-6 md:p-8 flex flex-col justify-between text-left relative overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[var(--border)] mb-6 shrink-0 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--error)] opacity-70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] opacity-70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] opacity-70" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] font-bold tracking-wider uppercase">
                    Standard AI
                  </span>
                  <div className="flex items-center gap-1 text-[var(--error)] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-2 py-0.5 rounded-full">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Zero Memory</span>
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 flex flex-col gap-5 min-h-[260px] justify-start mb-6 z-10">
                {/* User Prompt bubble */}
                {userBubbleText && (
                  <div className="flex flex-col gap-1 items-end max-w-[85%] ml-auto cg-fade-in">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Prompt</p>
                      <p className="text-[var(--text-primary)] font-medium text-body-sm leading-snug">
                        &ldquo;{userBubbleText}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Assistant Response bubble */}
                {stage === 'thinking' && (
                  <div className="flex flex-col gap-1 items-start max-w-[85%] cg-fade-in">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Response</p>
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] opacity-50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] opacity-50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] opacity-50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {(stage === 'streaming' || stage === 'completed') && (blindResponseText) && (
                  <div className="flex flex-col gap-1 items-start max-w-[88%] cg-fade-in">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1.5">Response (Needs Clarification)</p>
                      <p className="text-[var(--text-secondary)] text-body-sm leading-relaxed italic">
                        &ldquo;{formatStreamedText(blindResponseText)}&rdquo;
                        {stage === 'streaming' && blindResponseText.length < PROMPTS[currentPromptIndex].blind.length && (
                          <span className="w-1 h-3.5 ml-0.5 bg-[var(--text-muted)] inline-block animate-pulse align-middle" />
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Result Banner */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 z-10">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Outcome
                </span>
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--error)] transition-opacity duration-300",
                  stage === 'completed' ? "opacity-100" : "opacity-0"
                )}>
                  {PROMPTS[currentPromptIndex].blindResult}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: WITH CONTEXTGRAPH (Context-Aware AI) - Clean, no green bubble */}
          <div className="rounded-[2rem] p-1.5 bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex transition-[border-color,box-shadow] duration-300">
            <div
              className="w-full rounded-[calc(2rem-6px)] p-6 md:p-8 flex flex-col justify-between text-left relative overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[var(--border)] mb-6 shrink-0 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--error)] opacity-70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] opacity-70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] opacity-70" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[var(--text-primary)] font-bold tracking-wider uppercase">
                    With ContextGraph
                  </span>
                  <div className="flex items-center gap-1.5 text-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full border border-[rgba(179,236,19,0.2)]">
                    <span className="relative flex h-1 w-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1 w-1 bg-[var(--accent)]"></span>
                    </span>
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Synced</span>
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 flex flex-col gap-5 min-h-[260px] justify-start mb-6 z-10">
                {/* User Prompt bubble */}
                {userBubbleText && (
                  <div className="flex flex-col gap-1 items-end max-w-[85%] ml-auto cg-fade-in">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Prompt</p>
                      <p className="text-[var(--text-primary)] font-medium text-body-sm leading-snug">
                        &ldquo;{userBubbleText}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Assistant Thinking bubble */}
                {stage === 'thinking' && (
                  <div className="flex flex-col gap-1 items-start max-w-[85%] cg-fade-in">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Resolving Context Graph...</p>
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {(stage === 'streaming' || stage === 'completed') && (awareResponseText) && (
                  <div className="flex flex-col gap-2.5 items-start max-w-[90%] cg-fade-in">
                    {/* Very Small Context Injected Badges */}
                    {visibleTagsCount > 0 && (
                      <div className="flex flex-wrap gap-1 max-w-full">
                        {PROMPTS[currentPromptIndex].awareTags.slice(0, visibleTagsCount).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] cg-scale-in"
                          >
                            + {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Chat bubble - Clean neutral container, NO green bubble */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1.5">
                        Response (1-Turn Exact)
                      </p>
                      <p className="text-[var(--text-primary)] text-body-sm leading-relaxed">
                        &ldquo;{formatStreamedText(awareResponseText)}&rdquo;
                        {stage === 'streaming' && awareResponseText.length < PROMPTS[currentPromptIndex].aware.length && (
                          <span className="w-1 h-3.5 ml-0.5 bg-[var(--accent)] inline-block animate-pulse align-middle" />
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Result Banner */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 z-10">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Outcome
                </span>
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--accent)] transition-opacity duration-300",
                  stage === 'completed' ? "opacity-100" : "opacity-0"
                )}>
                  {PROMPTS[currentPromptIndex].awareResult}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
