'use client'

import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'

const DEMO_SCOPES = [
  { label: 'ME', scope: 'me' },
  { label: 'Dev Studio', scope: 'agency' },
  { label: 'ContextGraph', scope: 'personal/context-graph' },
  { label: 'Skills', scope: 'personal/skills-frontend' },
  { label: 'cResults', scope: 'agency/cresults' },
]

const DEMO_CONTEXT: Record<string, { assembled: string; withContext: string; withoutContext: string }> = {
  'me': {
    assembled: `# ME

**Scope:** me
**Relevance:** 95% | **Last updated:** Jun 14, 2026
**Tags:** developer, student, founder

Prajyot Porje is a 3rd-year B.E. student in AI & ML at PES Modern
College of Engineering, Pune (graduating 2027). Full-stack developer
specializing in Next.js, TypeScript, React, Tailwind CSS, GSAP, and
Supabase. Founder of Dev Studio — a solo web development agency.

Primary goal: land an SDE or Full-Stack role at Google, Meta, Flipkart,
or Razorpay (12 LPA+) in the 2026-27 placement season.

Prefers concise, direct technical communication. Makes independent
architectural decisions confidently without over-deliberating.`,
    withoutContext: `Sure, I'd be help! Could you tell me more about yourself and what you're working on? What's your tech stack, what have you built so far, and what are you trying to accomplish?`,
    withContext: `Got it. Since you're targeting SDE roles at Google, Meta, or Razorpay in the 2026-27 cycle, and you're currently building ContextGraph as your flagship project — what do you want to tackle today? DSA prep, a system design deep-dive for the project, or continuing the build?`,
  },
  'agency': {
    assembled: `# ME

**Scope:** me | **Relevance:** 95%
Prajyot Porje — full-stack developer, Dev Studio founder,
targeting SDE placement 2026-27.

---

# Dev Studio

**Scope:** agency | **Relevance:** 88%
**Tags:** agency, webdev, business

Dev Studio is a solo web development agency founded April 2026 in
Pune, India. Active retainer client: cResults (US-based, WordPress
+ SEO). Commission-based collaborator: Chaitanya. Stack: Next.js,
WordPress, Tailwind CSS, GSAP.`,
    withoutContext: `I can help with your agency work! What kind of agency is it, who are your clients, and what are you working on right now?`,
    withContext: `For the Dev Studio cResults retainer — are you working on this month's SEO audit, a WordPress update, or something new? I know Chaitanya handles some of the execution, so should I frame this for you to delegate or to do yourself?`,
  },
  'personal/context-graph': {
    assembled: `# ME

**Scope:** me | **Relevance:** 95%
Prajyot Porje — full-stack developer, placement 2026-27.

---

# ContextGraph

**Scope:** personal/context-graph | **Relevance:** 98%
**Tags:** nextjs, typescript, saas, mcp

Cross-AI personal context engine. Stack: Next.js 16, TypeScript,
Supabase, Better Auth, react-force-graph-3d, GSAP, OpenRouter.
MCP endpoint: /api/mcp — get_context and save_context tools.
Deployed on Vercel. Build prompts P01-P13 complete.

## Decisions Log
- Jun 14: Migrated 3D graph from React Flow to react-force-graph-3d
- Jun 01: Built MCP endpoint with dual auth (session + SHA-256 key)
- May 19: Implemented Better Auth — chose over Clerk for resume value
- May 10: Switched to OpenRouter model cascade for zero-cost AI`,
    withoutContext: `Happy to help with your SaaS project! What tech stack are you using, what does the product do, and where are you currently stuck?`,
    withContext: `ContextGraph — I can see P01-P13 are complete and the 3D graph is live. You migrated from React Flow to react-force-graph-3d on Jun 14. What's next — the edge table upgrade to support many-to-many node relationships, or something else?`,
  },
  'personal/skills-frontend': {
    assembled: `# ME

**Scope:** me | **Relevance:** 95%
Prajyot Porje — full-stack developer, 2026-27 placement.

---

# Frontend Skills

**Scope:** personal/skills-frontend | **Relevance:** 90%
**Tags:** nextjs, react, typescript, gsap, tailwind

Expert in Next.js 16 (App Router), React 19, TypeScript strict mode,
Tailwind CSS v4, GSAP v3 with ScrollTrigger and custom Bezier easing,
Lenis smooth scroll, react-force-graph-3d, Three.js basics.

Strong design sensibility. Builds design systems, not just components.
Preferred animation approach: GSAP tweens, never CSS keyframes for
entrance animations.`,
    withoutContext: `Sure! What kind of frontend help do you need? What framework and tools are you working with?`,
    withContext: `You're on Next.js 16 App Router with GSAP and Lenis. Since you avoid CSS keyframes for entrances and use cg-out/cg-spring easing — what's the animation or component you're trying to build?`,
  },
  'agency/cresults': {
    assembled: `# ME

**Scope:** me | **Relevance:** 95%
Prajyot Porje — Dev Studio founder, placement 2026-27.

---

# Dev Studio

**Scope:** agency | **Relevance:** 88%
Solo web dev agency, Pune. Active retainer: cResults.

---

# cResults

**Scope:** agency/cresults | **Relevance:** 82%
**Tags:** wordpress, seo, retainer

US client on an active monthly retainer. WordPress website with
on-page SEO optimization. Monthly deliverables: content updates,
SEO audits, performance monitoring.`,
    withoutContext: `I can help with that! Who is this client, what platform is their site on, and what are you trying to do for them?`,
    withContext: `For cResults — US retainer client, WordPress + SEO. Are you working on this month's SEO audit, a performance report, or a content update? I can draft the deliverable directly if you give me the specifics.`,
  },
}

export default function WhatAIKnowsSection() {
  const [activeScope, setActiveScope] = useState('me')
  const [, setPrevScope] = useState('me')

  const contentRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const current = DEMO_CONTEXT[activeScope]

  function handleScopeChange(scope: string) {
    if (scope === activeScope) return
    // Animate out current content, then switch, then animate in
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        y: 8,
        duration: 0.2,
        ease: 'cg-in',
        onComplete: () => {
          setPrevScope(activeScope)
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

  // Section entrance ScrollTrigger animation
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
      style={{
        padding: '100px 0',
        background: 'var(--surface, #111111)',
        borderTop: '1px solid var(--border, rgba(255,255,255,0.07))',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* HEADER */}
        <div className="animate-in" style={{ marginBottom: '48px' }}>
          <p
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#b3ec13',
              marginBottom: '10px',
              fontFamily: 'var(--font-geist)',
              fontWeight: 600,
            }}
          >
            HOW IT WORKS
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              color: 'var(--text-primary, #f0f0f0)',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            See what your AI will know
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary, #888888)',
              maxWidth: '500px',
              lineHeight: 1.6,
            }}
          >
            Pick a context scope and see the exact knowledge your AI receives before you type a single word.
          </p>
        </div>

        {/* MAIN GRID — 2 columns */}
        <div
          className="wak-grid animate-in"
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          
          {/* LEFT — Scope selector */}
          <div
            className="wak-scope-list"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted, #484848)',
                marginBottom: '8px',
                fontFamily: 'var(--font-geist)',
                fontWeight: 600,
              }}
            >
              CONTEXT SCOPE
            </p>
            {DEMO_SCOPES.map(({ label, scope }) => {
              const isActive = scope === activeScope
              return (
                <button
                  key={scope}
                  onClick={() => handleScopeChange(scope)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'var(--font-geist)',
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'rgba(179,236,19,0.12)' : 'transparent',
                    color: isActive ? '#b3ec13' : 'var(--text-secondary, #888888)',
                    borderLeft: isActive ? '2px solid #b3ec13' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* RIGHT — Content panels */}
          <div
            ref={contentRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            
            {/* TOP — Assembled context code block */}
            <div
              style={{
                background: '#0d0d0d',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Code block header bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                  context assembled · {activeScope}
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '16px 20px',
                  fontSize: '11.5px',
                  lineHeight: 1.7,
                  fontFamily: 'var(--font-mono)',
                  color: '#d4d4d4',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {current.assembled}
              </pre>
            </div>

            {/* BOTTOM — Comparison: without vs with */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              
              {/* Without ContextGraph */}
              <div
                style={{
                  background: 'var(--card, #181818)',
                  border: '1px solid var(--border, rgba(255,255,255,0.07))',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: 'var(--shadow-sm), var(--shadow-inset)',
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted, #484848)',
                    marginBottom: '12px',
                    fontWeight: 600,
                  }}
                >
                  WITHOUT CONTEXTGRAPH
                </p>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '8px',
                  }}
                >
                  <p style={{ fontSize: '11px', color: 'var(--text-muted, #484848)', marginBottom: '6px' }}>
                    You:
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary, #888888)', lineHeight: 1.5 }}>
                    Help me with my project.
                  </p>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <p style={{ fontSize: '11px', color: 'var(--text-muted, #484848)', marginBottom: '6px' }}>Claude:</p>
                  <p style={{ fontSize: '12px', color: '#666666', lineHeight: 1.6, fontStyle: 'italic' }}>
                    {current.withoutContext}
                  </p>
                </div>
              </div>

              {/* With ContextGraph */}
              <div
                style={{
                  background: 'rgba(179,236,19,0.04)',
                  border: '1px solid rgba(179,236,19,0.18)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#b3ec13',
                    marginBottom: '12px',
                    fontWeight: 600,
                  }}
                >
                  WITH CONTEXTGRAPH
                </p>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '8px',
                  }}
                >
                  <p style={{ fontSize: '11px', color: 'var(--text-muted, #484848)', marginBottom: '6px' }}>
                    You:
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary, #888888)', lineHeight: 1.5 }}>
                    Help me with my project.
                  </p>
                </div>
                <div
                  style={{
                    background: 'rgba(179,236,19,0.06)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <p style={{ fontSize: '11px', color: 'var(--text-primary)', marginBottom: '6px' }}>Claude:</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary, #888888)', lineHeight: 1.6 }}>
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
