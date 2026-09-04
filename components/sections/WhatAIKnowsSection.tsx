'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const PROMPTS = [
  {
    user: "Help me write the database schema for the real-time sync module.",
    blind: "Sure! What database technology are you using (Postgres, MongoDB, MySQL)? Also, what framework, language, and real-time protocol (like WebSockets, SSE, Socket.io) are you building this on?",
    aware: "Got it. Since you are building TaskFlow SaaS with Next.js App Router, TypeScript, and Supabase Postgres, and using Socket.io for real-time synchronization as defined in your rules: here is the schema for your task_sync tables, optimized for your active Edge database config.",
    awareTags: ["Supabase Postgres", "Next.js App Router", "Socket.io", "TypeScript"],
    blindResult: "2+ turns wasted explaining setup",
    awareResult: "Immediate, production-ready code in 1 turn"
  },
  {
    user: "Write a React component for the user settings profile card.",
    blind: "I can write that for you. What styling library are you using (Tailwind, CSS modules, styled-components)? Should it support dark mode? And do you have a specific color palette or design system constraints?",
    aware: "Here is your profile card component, styled with Tailwind using your design tokens from DESIGN.md. It uses Geist for typography, matches your radius-md button corners, and includes the scale-active tactile feedback. It automatically toggles based on the HTML data-theme attribute.",
    awareTags: ["Tailwind CSS", "Geist Sans", "DESIGN.md rules", "HTML data-theme"],
    blindResult: "3+ turns of style alignment",
    awareResult: "100% theme-aligned component instantly"
  },
  {
    user: "Implement a JWT authentication helper.",
    blind: "Which authentication framework are you using? Should I write it from scratch using jsonwebtoken, or do you use NextAuth, Auth0, or Supabase Auth? Let me know your folder structure as well.",
    aware: "Since you use Better Auth as the session source of truth, here is the helper that authorizes from the Better Auth session user ID on your API routes, scoping operations automatically. No need for manual JWT signing since Better Auth handles the sessions.",
    awareTags: ["Better Auth", "App Router API", "User Session ID"],
    blindResult: "2+ turns explaining auth stack",
    awareResult: "Secure session helper in 1 turn"
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
      // Statically show completed state and cycle every 10 seconds
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
          // Blind streams slightly slower to simulate latency/round-trips
          blindIndex += Math.min(2, totalBlindLength - blindIndex)
          setBlindResponseText(activePrompt.blind.slice(0, blindIndex))
          isDone = false
        }
        
        if (awareIndex < totalAwareLength) {
          // Aware streams faster representing context-loaded efficiency
          awareIndex += Math.min(3, totalAwareLength - awareIndex)
          setAwareResponseText(activePrompt.aware.slice(0, awareIndex))
          
          // Sync visible tags to typewriter progress
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
      }, 12000) // Hold for 12 seconds for reading
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
    // Automatically close open tags to prevent broken inline styles
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
          <code key={i} className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/5 text-[var(--accent)] font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-[var(--surface)] border-y border-[var(--border)] overflow-hidden"
    >
      {/* Background decoration */}
      <div 
        className="pointer-events-none absolute top-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-white/[0.01] blur-[120px]" 
        aria-hidden="true" 
      />
      
      <div className="mx-auto max-w-[1200px] px-[var(--space-6)]">
        
        {/* Header */}
        <div className="animate-in mb-16 text-center max-w-[700px] mx-auto flex flex-col items-center">
          {/* Eyebrow badge */}
          <div className="mb-4 flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.01] w-max px-3.5 py-1 shadow-[var(--shadow-xs)]">
            <span className="h-1 w-1 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="text-label text-[9px] text-[var(--text-secondary)] font-semibold tracking-[0.12em] uppercase">
              AI Benchmarks
            </span>
          </div>
          <h2 className="text-display-lg text-[var(--text-primary)] font-bold uppercase tracking-tight mb-4">
            Visualizing context transformations.
          </h2>
          <p className="text-body-md text-[var(--text-secondary)] leading-relaxed max-w-[60ch]">
            AI assistants are only as good as the context they receive. See how ContextGraph eliminates blind spots, delivering precise, project-aware assistance on the very first prompt.
          </p>
        </div>

        {/* Dynamic Typing Prompt Box */}
        <div className="animate-in mb-10 max-w-[800px] mx-auto rounded-xl border border-white/5 bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] flex items-center gap-3 relative">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]"></span>
          </div>
          <div className="flex-1 text-left text-body-sm text-[var(--text-primary)] font-mono font-medium min-h-[22px] flex items-center overflow-hidden z-10">
            <span className="line-clamp-2">
              {promptText}
            </span>
            {stage === 'typing-prompt' && (
              <span className="w-1.5 h-3.5 ml-1 bg-[var(--accent)] inline-block shrink-0 animate-pulse" />
            )}
          </div>
        </div>

        {/* Dual-Pane Comparison Simulator */}
        <div className="animate-in grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: WITHOUT CONTEXTGRAPH (The Blind AI) */}
          <div className="rounded-[2rem] p-1.5 bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/5 shadow-[var(--shadow-sm)] flex transition-all duration-300">
            <div className="w-full rounded-[calc(2rem-6px)] bg-[var(--card)] p-6 md:p-8 flex flex-col justify-between text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6 shrink-0 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/60" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[var(--text-secondary)] font-bold tracking-wider uppercase">
                    The Blind AI
                  </span>
                  <div className="flex items-center gap-1 text-red-500/80 bg-red-500/5 px-2 py-0.5 rounded-full border border-red-500/10">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Unsynced</span>
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 flex flex-col gap-6 min-h-[250px] justify-start mb-6 z-10">
                
                {/* User Prompt bubble */}
                {userBubbleText && (
                  <div className="flex flex-col gap-1.5 items-end max-w-[85%] ml-auto cg-fade-in">
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] px-4 py-2.5 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">User Prompt</p>
                      <p className="text-[var(--text-primary)] font-medium text-body-sm leading-snug">
                        "{userBubbleText}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Assistant Response bubble */}
                {stage === 'thinking' && (
                  <div className="flex flex-col gap-1.5 items-start max-w-[85%] cg-fade-in">
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Assistant Response</p>
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] opacity-50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] opacity-50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] opacity-50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {(stage === 'streaming' || stage === 'completed') && (blindResponseText) && (
                  <div className="flex flex-col gap-1.5 items-start max-w-[85%] cg-fade-in">
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3.5 text-left transition-[height] duration-200">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1.5">Assistant Response</p>
                      <p className="text-[var(--text-secondary)] text-body-sm leading-relaxed italic">
                        "{formatStreamedText(blindResponseText)}"
                        {stage === 'streaming' && blindResponseText.length < PROMPTS[currentPromptIndex].blind.length && (
                          <span className="w-1 h-3.5 ml-0.5 bg-[var(--text-muted)] inline-block animate-pulse align-middle" />
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Result Banner */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between shrink-0 z-10">
                <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Result
                </span>
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wider font-bold",
                  stage === 'completed' ? "text-red-500/80 opacity-100 transition-opacity duration-300" : "opacity-0"
                )}>
                  {PROMPTS[currentPromptIndex].blindResult}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: WITH CONTEXTGRAPH (The Context-Aware AI) */}
          <div className={cn(
            "rounded-[2rem] p-1.5 border shadow-[var(--shadow-sm)] flex transition-all duration-500",
            stage === 'streaming' || stage === 'completed'
              ? "border-[rgba(179,236,19,0.18)] bg-gradient-to-b from-[rgba(179,236,19,0.03)] to-transparent"
              : "border-white/5 bg-gradient-to-b from-white/[0.03] to-white/[0.01]"
          )}>
            <div className="w-full rounded-[calc(2rem-6px)] bg-[var(--card)] p-6 md:p-8 flex flex-col justify-between text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6 shrink-0 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/60" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[var(--text-primary)] font-bold tracking-wider uppercase">
                    Context-Aware AI
                  </span>
                  <div className="flex items-center gap-1.5 text-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full border border-[rgba(179,236,19,0.15)]">
                    <span className="relative flex h-1 w-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1 w-1 bg-[var(--accent)]"></span>
                    </span>
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Synced</span>
                  </div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 flex flex-col gap-6 min-h-[250px] justify-start mb-6 z-10">
                
                {/* User Prompt bubble */}
                {userBubbleText && (
                  <div className="flex flex-col gap-1.5 items-end max-w-[85%] ml-auto cg-fade-in">
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] px-4 py-2.5 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">User Prompt</p>
                      <p className="text-[var(--text-primary)] font-medium text-body-sm leading-snug">
                        "{userBubbleText}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Assistant Response bubble */}
                {stage === 'thinking' && (
                  <div className="flex flex-col gap-1.5 items-start max-w-[85%] cg-fade-in">
                    <div className="rounded-xl border border-[rgba(179,236,19,0.15)] bg-[rgba(179,236,19,0.01)] px-4 py-3 text-left">
                      <p className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Retrieving Context...</p>
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {(stage === 'streaming' || stage === 'completed') && (awareResponseText) && (
                  <div className="flex flex-col gap-3.5 items-start max-w-[90%] cg-fade-in">
                    
                    {/* Floating Context Injected Badges */}
                    {visibleTagsCount > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-w-full">
                        {PROMPTS[currentPromptIndex].awareTags.slice(0, visibleTagsCount).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] border border-[rgba(179,236,19,0.12)] rounded-full px-2 py-0.5 tracking-wide font-semibold cg-scale-in"
                          >
                            + Injected: {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Chat bubble */}
                    <div className="rounded-xl border border-[rgba(179,236,19,0.15)] bg-[rgba(179,236,19,0.02)] px-4 py-3.5 text-left transition-[height] duration-200">
                      <p className="text-[8px] font-mono text-[var(--accent)] uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1">
                        Assistant Response (Synced)
                      </p>
                      <p className="text-[var(--text-primary)] text-body-sm leading-relaxed">
                        "{formatStreamedText(awareResponseText)}"
                        {stage === 'streaming' && awareResponseText.length < PROMPTS[currentPromptIndex].aware.length && (
                          <span className="w-1 h-3.5 ml-0.5 bg-[var(--accent)] inline-block animate-pulse align-middle" />
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Result Banner */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between shrink-0 z-10">
                <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Result
                </span>
                <span className={cn(
                  "text-[10px] font-mono uppercase tracking-wider font-bold transition-opacity duration-300",
                  stage === 'completed' ? "text-[var(--accent)] opacity-100" : "opacity-0"
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
