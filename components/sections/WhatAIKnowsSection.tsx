'use client'

import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const DEMO_SCOPES = [
  { label: 'Me', scope: 'me' },
  { label: 'Freelance Studio', scope: 'agency' },
  { label: 'TaskFlow SaaS', scope: 'personal/taskflow' },
  { label: 'Skills', scope: 'personal/skills-frontend' },
  { label: 'AlphaCorp CRM', scope: 'agency/alphacorp' },
]

const DEMO_CONTEXT: Record<string, { assembled: string; withContext: string; withoutContext: string }> = {
  'me': {
    assembled: `# ME

**Scope:** me
**Relevance:** 95% | **Last updated:** Jun 14, 2026
**Tags:** developer, founder, fullstack

Alex Rivera is a full-stack engineer and SaaS founder. Specializes in Next.js, TypeScript, Supabase, and Tailwind CSS. Builder of TaskFlow, a real-time collaborative task manager.

Primary goal: launch TaskFlow SaaS public beta and optimize edge latency for active users.

Prefers structured TypeScript codebases, strict type-safety, and minimal external dependencies.`,
    withoutContext: `Sure, I can help! Could you tell me more about your background, the tech stack you are using, what you have built so far, and what goals you are trying to achieve?`,
    withContext: `Got it. Since you are targeting the TaskFlow SaaS public beta launch and need to optimize edge database query times: would you like to focus on setting up indexing in Supabase or caching queries on Vercel Edge today?`,
  },
  'agency': {
    assembled: `# ME

**Scope:** me | **Relevance:** 95%
Alex Rivera, full-stack engineer and TaskFlow founder.

---

# Freelance Studio

**Scope:** agency | **Relevance:** 88%
**Tags:** agency, webdev, client-work

Freelance development studio handling web projects. Active retainer client: AlphaCorp (custom CRM build). Stack: Next.js, PostgreSQL, Tailwind CSS. Collaborators: Sarah (UI designer).`,
    withoutContext: `I'd love to help with your freelance work! What kind of agency is it, who are your clients, and what are you working on right now?`,
    withContext: `For the AlphaCorp custom CRM retainer: are you working on the contact database synchronization, Sarah's design handoff, or the automated reporting module today?`,
  },
  'personal/taskflow': {
    assembled: `# ME

**Scope:** me | **Relevance:** 95%
Alex Rivera, full-stack engineer and TaskFlow founder.

---

# TaskFlow SaaS

**Scope:** personal/taskflow | **Relevance:** 98%
**Tags:** nextjs, typescript, supabase, websockets

Collaborative task management engine. Stack: Next.js, TS, Supabase, Better Auth, Socket.io, Tailwind CSS. MCP endpoint: /api/mcp for context sync. Deployed on Vercel.

## Decisions Log
- Jun 14: Switched to WebSocket sync for instant task updates
- Jun 01: Configured dual auth with Better Auth and API keys
- May 20: Chose Better Auth over next-auth for database simplicity`,
    withoutContext: `Happy to help with your SaaS project! What tech stack are you using, what does the product do, and where are you currently stuck?`,
    withContext: `TaskFlow SaaS: I see the Socket.io WebSocket sync is live and Better Auth is configured. Since you migrated to WebSockets on Jun 14, what's next: optimizing the real-time presence cursor broadcast, or setting up DB transactions?`,
  },
  'personal/skills-frontend': {
    assembled: `# ME

**Scope:** me | **Relevance:** 95%
Alex Rivera, full-stack engineer and TaskFlow founder.

---

# Frontend Skills

**Scope:** personal/skills-frontend | **Relevance:** 90%
**Tags:** nextjs, react, typescript, tailwind, state-management

Expert in Next.js (App Router), React Server Components, TypeScript, Tailwind CSS, Zustand, Framer Motion, and CSS Grid.

Emphasizes clean typography, proper layout spacing, and WCAG AA accessibility compliance.`,
    withoutContext: `Sure! What kind of frontend help do you need? What framework and tools are you working with?`,
    withContext: `You are using Next.js App Router, Zustand, and Tailwind. Since you focus on clean typography, responsive layouts, and strict type-safety: what frontend component or layout are we designing?`,
  },
  'agency/alphacorp': {
    assembled: `# ME

**Scope:** me | **Relevance:** 95%
Alex Rivera, Dev Studio founder.

---

# Freelance Studio

**Scope:** agency | **Relevance:** 88%
Active retainer: AlphaCorp custom CRM.

---

# AlphaCorp CRM

**Scope:** agency/alphacorp | **Relevance:** 82%
**Tags:** crm, postgresql, dashboards

US enterprise client on custom CRM build. Deliverables: contact management, lead funnel, PostgreSQL schema migrations, and client analytics dashboard.`,
    withoutContext: `I can help with that! Who is this client, what platform is their site on, and what are you trying to do for them?`,
    withContext: `For the AlphaCorp CRM retainer: since you are building custom contact management and database reports, are we writing Postgres queries, building analytics widgets, or preparing a client release today?`,
  },
}

export default function WhatAIKnowsSection() {
  const [activeScope, setActiveScope] = useState('me')
  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const current = DEMO_CONTEXT[activeScope]

  function handleScopeChange(scope: string) {
    if (scope === activeScope) return
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        y: 8,
        duration: 0.2,
        ease: 'cg-in',
        onComplete: () => {
          setActiveScope(scope)
          gsap.fromTo(contentRef.current,
            { opacity: 0, y: -8 },
            { opacity: 1, y: 0, duration: 0.28, ease: 'cg-out' }
          )
        }
      })
    } else {
      setActiveScope(scope)
    }
  }

  useGSAP(() => {
    if (!sectionRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      sectionRef.current.querySelectorAll('.animate-in'),
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'cg-out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        }
      }
    )
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-[var(--space-24)] bg-[var(--surface)] border-y border-[var(--border)]"
    >
      <div className="mx-auto max-w-[1100px] px-[var(--space-6)]">
        
        {/* HEADER */}
        <div className="animate-in mb-[var(--space-12)]">
          <h2 className="text-display-lg text-[var(--text-primary)] font-bold mb-[var(--space-3)]">
            See what your AI will know
          </h2>
          <p className="text-body-md text-[var(--text-secondary)] max-w-[500px] leading-relaxed">
            Pick a context scope and see the exact knowledge your AI receives before you type a single word.
          </p>
        </div>

        {/* MAIN GRID — 2 columns */}
        <div className="wak-grid animate-in grid grid-cols-1 md:grid-cols-[200px_1fr] gap-[var(--space-6)] items-start">
          
          {/* LEFT — Scope selector */}
          <div className="wak-scope-list flex flex-col gap-1">
            <span className="text-label text-[var(--text-muted)] mb-[var(--space-2)] font-semibold tracking-[0.08em] uppercase">
              Context Scope
            </span>
            {DEMO_SCOPES.map(({ label, scope }) => {
              const isActive = scope === activeScope
              return (
                <button
                  key={scope}
                  onClick={() => handleScopeChange(scope)}
                  className={cn(
                    "text-left px-[var(--space-4)] py-[9px] rounded-[var(--radius-sm)] border text-[13px] font-medium transition-[color,background-color,border-color] duration-150 ease-out shrink-0",
                    isActive
                      ? "bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]"
                      : "bg-transparent text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.02)]"
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* RIGHT — Content panels */}
          <div ref={contentRef} className="flex flex-col gap-[var(--space-4)]">
            
            {/* TOP — Assembled context code block */}
            <div className="bg-[var(--code-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)]">
              {/* Code block header bar */}
              <div className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--border)] bg-[rgba(0,0,0,0.1)]">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)] inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)] inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.08)] inline-block" />
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  context assembled · {activeScope}
                </span>
              </div>
              <pre className="m-0 p-[var(--space-5)] text-code-md text-[var(--text-primary)] max-h-[220px] overflow-y-auto whitespace-pre-wrap break-all">
                {current.assembled}
              </pre>
            </div>

            {/* BOTTOM — Comparison: without vs with */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-4)]">
              
              {/* Without ContextGraph */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[var(--space-5)] shadow-[var(--shadow-sm)] shadow-[var(--shadow-inset)]">
                <span className="text-label text-[var(--text-muted)] mb-[var(--space-3)] font-semibold tracking-[0.08em] uppercase block">
                  Without ContextGraph
                </span>
                
                <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--border)] rounded-[var(--radius-md)] p-[var(--space-3)] mb-[var(--space-2)]">
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">You:</p>
                  <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed">
                    Help me with my project.
                  </p>
                </div>
                
                <div className="bg-[rgba(0,0,0,0.15)] border border-[var(--border)] rounded-[var(--radius-md)] p-[var(--space-3)]">
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">Claude:</p>
                  <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed italic">
                    "{current.withoutContext}"
                  </p>
                </div>
              </div>

              {/* With ContextGraph */}
              <div className="bg-[var(--accent-muted)] border border-[rgba(179,236,19,0.25)] rounded-[var(--radius-lg)] p-[var(--space-5)] shadow-[var(--shadow-sm)]">
                <span className="text-label text-[var(--accent)] mb-[var(--space-3)] font-semibold tracking-[0.08em] uppercase block">
                  With ContextGraph
                </span>
                
                <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--border)] rounded-[var(--radius-md)] p-[var(--space-3)] mb-[var(--space-2)]">
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">You:</p>
                  <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed">
                    Help me with my project.
                  </p>
                </div>
                
                <div className="bg-[rgba(179,236,19,0.06)] border border-[rgba(179,236,19,0.15)] rounded-[var(--radius-md)] p-[var(--space-3)]">
                  <p className="text-[10px] font-mono text-[var(--accent)] mb-1 uppercase tracking-wider">Claude:</p>
                  <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed">
                    {current.withContext}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
