'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'
import { Terminal, Network, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIClient {
  id: string
  name: string
  model: string
  logo: React.ReactNode
}

const aiClients: AIClient[] = [
  {
    id: 'claude',
    name: 'Claude AI',
    model: 'claude-3.7-sonnet',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.5">
        <path d="M 4 20 L 9.5 4 L 14.5 4 L 20 20 M 6.5 13 H 17.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    model: 'gpt-4o',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.5">
        <path d="M 12 2 C 6.48 2 2 6.48 2 12 C 2 17.52 6.48 22 12 22 C 17.52 22 22 17.52 22 12 C 22 6.48 17.52 2 12 2 Z M 12 18 C 8.69 18 6 15.31 6 12 C 6 8.69 8.69 6 12 6 C 15.31 6 18 8.69 18 12 C 18 15.31 15.31 18 12 18 Z" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'gemini',
    name: 'Gemini',
    model: 'gemini-1.5-pro',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M 12 2 Q 12 12 22 12 Q 12 12 12 22 Q 12 12 2 12 Q 12 12 12 2 Z" />
      </svg>
    )
  },
  {
    id: 'cursor',
    name: 'Cursor',
    model: 'cursor-pro',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M 7.5 4.5 L 17.5 11.5 L 12.5 12.8 L 11 17.5 Z" />
      </svg>
    )
  },
  {
    id: 'claudecode',
    name: 'Claude Code',
    model: 'claude-code-cli',
    logo: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current" fill="none" strokeWidth="1.5">
        <path d="M 6 8 L 10 12 L 6 16 M 12 16 H 18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
]

export function InteractiveVisualizer() {
  const containerRef = useRef<HTMLElement>(null)
  const [activeClient, setActiveClient] = useState<string>('claude')
  
  const payloadRef = useRef<HTMLDivElement>(null)
  const path1Ref = useRef<SVGPathElement>(null)
  const path2Ref = useRef<SVGPathElement>(null)
  const path3Ref = useRef<SVGPathElement>(null)
  const mcpNodeRef = useRef<HTMLDivElement>(null)

  // Sync animation when client switches
  useEffect(() => {
    if (prefersReducedMotion()) return

    const tl = gsap.timeline()
    tl.fromTo([path1Ref.current, path2Ref.current, path3Ref.current],
      { strokeWidth: 4, opacity: 0.8 },
      { strokeWidth: 1.5, opacity: 0.4, duration: 0.5, ease: 'cg-out', stagger: 0.08 }
    )

    gsap.fromTo(mcpNodeRef.current,
      { scale: 1.08, borderColor: 'var(--border-strong)' },
      { scale: 1, borderColor: 'var(--border)', duration: 0.4, ease: 'cg-spring' }
    )

    if (payloadRef.current) {
      gsap.fromTo(payloadRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'cg-out' }
      )
    }
  }, [activeClient])

  // Section entrance reveal
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.vis-heading, .vis-sub, .vis-console, .vis-feature-badge', { opacity: 1, y: 0 })
        return
      }

      const trigger = {
        trigger: containerRef.current,
        start: 'top 85%',
        once: true,
      }

      gsap.from('.vis-heading', {
        opacity: 0,
        y: 24,
        duration: DUR.normal,
        ease: 'cg-out',
        scrollTrigger: trigger,
      })

      gsap.from('.vis-sub', {
        opacity: 0,
        y: 16,
        duration: DUR.normal,
        ease: 'cg-out',
        delay: 0.1,
        scrollTrigger: trigger,
      })

      gsap.from('.vis-console', {
        opacity: 0,
        y: 32,
        duration: DUR.moderate,
        ease: 'cg-out',
        delay: 0.2,
        scrollTrigger: trigger,
      })

      gsap.from('.vis-feature-badge', {
        opacity: 0,
        y: 16,
        duration: DUR.normal,
        ease: 'cg-out',
        stagger: 0.08,
        delay: 0.35,
        scrollTrigger: trigger,
      })
    },
    { scope: containerRef }
  )

  const renderJSONPayload = (clientId: string) => {
    switch (clientId) {
      case 'claude':
        return (
          <div className="space-y-1 font-mono text-[11px] md:text-[12px] text-[var(--text-secondary)]">
            <div><span className="text-[#88c6ff]">{`{`}</span></div>
            <div className="pl-4"><span className="text-[#ff7b72]">"client"</span>: <span className="text-[#a5d6ff]">"Claude 3.7 Sonnet"</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"mcp_version"</span>: <span className="text-[#a5d6ff]">"2024-11-05"</span>,</div>
            <div className="pl-4">
              <span className="text-[#ff7b72]">"identity"</span>: <span className="text-[#88c6ff]">{`{`}</span>
            </div>
            <div className="pl-8"><span className="text-[#ff7b72]">"role"</span>: <span className="text-[#a5d6ff]">"Lead Architect"</span>,</div>
            <div className="pl-8">
              <span className="text-[#ff7b72]">"stack"</span>: <span className="text-[#88c6ff]">[</span>
              <span className="text-[#a5d6ff]">"Next.js"</span>, <span className="text-[#a5d6ff]">"TS"</span>, <span className="text-[#a5d6ff]">"Supabase"</span>
              <span className="text-[#88c6ff]">]</span>
            </div>
            <div className="pl-4"><span className="text-[#88c6ff]">{`}`}</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"active_task"</span>: <span className="text-[#a5d6ff]">"Refactoring hero section"</span></div>
            <div><span className="text-[#88c6ff]">{`}`}</span></div>
          </div>
        )
      case 'chatgpt':
        return (
          <div className="space-y-1 font-mono text-[11px] md:text-[12px] text-[var(--text-secondary)]">
            <div><span className="text-[#88c6ff]">{`{`}</span></div>
            <div className="pl-4"><span className="text-[#ff7b72]">"client"</span>: <span className="text-[#a5d6ff]">"ChatGPT 4o"</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"scope"</span>: <span className="text-[#a5d6ff]">"global"</span>,</div>
            <div className="pl-4">
              <span className="text-[#ff7b72]">"profile"</span>: <span className="text-[#88c6ff]">{`{`}</span>
            </div>
            <div className="pl-8"><span className="text-[#ff7b72]">"user"</span>: <span className="text-[#a5d6ff]">"Alex Rivera"</span>,</div>
            <div className="pl-8"><span className="text-[#ff7b72]">"company"</span>: <span className="text-[#a5d6ff]">"ContextGraph Inc."</span></div>
            <div className="pl-4"><span className="text-[#88c6ff]">{`}`}</span>,</div>
            <div className="pl-4">
              <span className="text-[#ff7b72]">"preferences"</span>: <span className="text-[#88c6ff]">{`{`}</span>
            </div>
            <div className="pl-8"><span className="text-[#ff7b72]">"editor"</span>: <span className="text-[#a5d6ff]">"VSCode"</span>,</div>
            <div className="pl-8"><span className="text-[#ff7b72]">"ui_theme"</span>: <span className="text-[#a5d6ff]">"Sleek Minimalist"</span></div>
            <div className="pl-4"><span className="text-[#88c6ff]">{`}`}</span></div>
            <div><span className="text-[#88c6ff]">{`}`}</span></div>
          </div>
        )
      case 'gemini':
        return (
          <div className="space-y-1 font-mono text-[11px] md:text-[12px] text-[var(--text-secondary)]">
            <div><span className="text-[#88c6ff]">{`{`}</span></div>
            <div className="pl-4"><span className="text-[#ff7b72]">"client"</span>: <span className="text-[#a5d6ff]">"Gemini 1.5 Pro"</span>,</div>
            <div className="pl-4">
              <span className="text-[#ff7b72]">"agent"</span>: <span className="text-[#88c6ff]">{`{`}</span>
            </div>
            <div className="pl-8"><span className="text-[#ff7b72]">"role"</span>: <span className="text-[#a5d6ff]">"Fullstack Engineer"</span>,</div>
            <div className="pl-8">
              <span className="text-[#ff7b72]">"tools"</span>: <span className="text-[#88c6ff]">[</span>
              <span className="text-[#a5d6ff]">"Supabase PG"</span>, <span className="text-[#a5d6ff]">"React Flow"</span>
              <span className="text-[#88c6ff]">]</span>
            </div>
            <div className="pl-4"><span className="text-[#88c6ff]">{`}`}</span></div>
            <div><span className="text-[#88c6ff]">{`}`}</span></div>
          </div>
        )
      case 'cursor':
        return (
          <div className="space-y-1 font-mono text-[11px] md:text-[12px] text-[var(--text-secondary)]">
            <div><span className="text-[#88c6ff]">{`{`}</span></div>
            <div className="pl-4"><span className="text-[#ff7b72]">"client"</span>: <span className="text-[#a5d6ff]">"Cursor Editor"</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"project"</span>: <span className="text-[#a5d6ff]">"context-graph-app"</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"active_file"</span>: <span className="text-[#a5d6ff]">"/app/page.tsx"</span>,</div>
            <div className="pl-4">
              <span className="text-[#ff7b72]">"context_nodes"</span>: <span className="text-[#88c6ff]">[</span>
            </div>
            <div className="pl-8">
              <span className="text-[#88c6ff]">{`{`}</span> <span className="text-[#ff7b72]">"id"</span>: <span className="text-[#a5d6ff]">"design-tokens"</span>, <span className="text-[#ff7b72]">"rel"</span>: <span className="text-[#79c0ff]">0.95</span> <span className="text-[#88c6ff]">{`}`}</span>,
            </div>
            <div className="pl-8">
              <span className="text-[#88c6ff]">{`{`}</span> <span className="text-[#ff7b72]">"id"</span>: <span className="text-[#a5d6ff]">"auth-patterns"</span>, <span className="text-[#ff7b72]">"rel"</span>: <span className="text-[#79c0ff]">0.88</span> <span className="text-[#88c6ff]">{`}`}</span>
            </div>
            <div className="pl-4"><span className="text-[#88c6ff]">]</span></div>
            <div><span className="text-[#88c6ff]">{`}`}</span></div>
          </div>
        )
      case 'claudecode':
        return (
          <div className="space-y-1 font-mono text-[11px] md:text-[12px] text-[var(--text-secondary)]">
            <div><span className="text-[#88c6ff]">{`{`}</span></div>
            <div className="pl-4"><span className="text-[#ff7b72]">"client"</span>: <span className="text-[#a5d6ff]">"Claude Code CLI"</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"terminal"</span>: <span className="text-[#a5d6ff]">"zsh"</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"working_dir"</span>: <span className="text-[#a5d6ff]">"/alex/projects/cg"</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"last_cmd"</span>: <span className="text-[#a5d6ff]">"git commit -m 'new hero'"</span>,</div>
            <div className="pl-4"><span className="text-[#ff7b72]">"mcp_server"</span>: <span className="text-[#a5d6ff]">"active"</span></div>
            <div><span className="text-[#88c6ff]">{`}`}</span></div>
          </div>
        )
      default:
        return null
    }
  }

  const activeClientData = aiClients.find(c => c.id === activeClient)

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[var(--bg)] px-[var(--space-6)] py-[var(--space-20)]"
    >
      <div className="section-divider absolute left-0 right-0 top-0" />

      {/* Grid Pattern — subtle */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
        {/* Section Header */}
        <div className="mb-[var(--space-12)] text-center">
          <h2 className="vis-heading text-display-xl text-[var(--text-primary)]">
            Seamless cross-AI integration
          </h2>
          <p className="vis-sub mt-[var(--space-4)] max-w-xl text-body-lg text-[var(--text-secondary)] mx-auto">
            Switch between coding assistants and editors. Your context remains synchronized via a lightweight Model Context Protocol server.
          </p>
        </div>

        {/* Live MCP Console Card */}
        <div className="vis-console w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] shadow-[var(--shadow-lg)] shadow-[var(--shadow-inset)] overflow-hidden text-left">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-[var(--space-5)] py-[var(--space-3)] bg-[var(--surface)]">
            <div className="flex items-center gap-[var(--space-2)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
              <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider ml-[var(--space-2)] uppercase">
                mcp-session-console
              </span>
            </div>
            <div className="flex items-center gap-[var(--space-2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
              </span>
              <span className="text-[10px] font-mono text-[var(--success)] font-semibold uppercase tracking-wider">
                Active Session
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)]">
            {/* Left Column: AI Clients List */}
            <div className="lg:col-span-3 p-[var(--space-4)] flex flex-col gap-[var(--space-2)] bg-[rgba(0,0,0,0.12)]">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-[var(--space-1)] block px-[var(--space-2)]">
                AI Clients
              </span>
              <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                {aiClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setActiveClient(client.id)}
                    className={cn(
                      "w-auto lg:w-full text-left px-[var(--space-3)] py-[var(--space-3)] rounded-[var(--radius-md)] flex items-center justify-between transition-[color,background-color,border-color] duration-150 ease-out shrink-0",
                      activeClient === client.id
                        ? "bg-[rgba(255,255,255,0.04)] border border-[var(--border-strong)] text-[var(--text-primary)]"
                        : "border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.02)]"
                    )}
                  >
                    <div className="flex items-center gap-[var(--space-3)]">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        activeClient === client.id ? "bg-[var(--accent)]" : "bg-[rgba(255,255,255,0.2)]"
                      )} />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold tracking-tight">{client.name}</span>
                        <span className="text-[9px] text-[var(--text-muted)] font-mono">{client.model}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Center Column: Live Visualizer */}
            <div className="lg:col-span-4 p-[var(--space-6)] flex flex-col items-center justify-center relative bg-[rgba(0,0,0,0.06)] min-h-[220px]">
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="gradient-to-right" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--text-secondary)" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="gradient-to-left" x1="100%" y1="0%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="var(--text-secondary)" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Flow Paths */}
                  <path ref={path1Ref} d="M 45 75 H 150" stroke="var(--border-strong)" strokeWidth="1.5" />
                  <path d="M 45 75 H 150" stroke="url(#gradient-to-right)" strokeWidth="1.5" strokeDasharray="6 12" className="cg-dash-flow" />

                  <path ref={path2Ref} d="M 150 67 H 255" stroke="var(--border)" strokeWidth="1.5" />
                  <path d="M 150 67 H 255" stroke="url(#gradient-to-right)" strokeWidth="1.5" strokeDasharray="6 12" className="cg-dash-flow" />

                  <path ref={path3Ref} d="M 255 83 H 150" stroke="var(--border)" strokeWidth="1.5" />
                  <path d="M 255 83 H 150" stroke="url(#gradient-to-left)" strokeWidth="1.5" strokeDasharray="6 12" style={{ animationDirection: 'reverse' }} className="cg-dash-flow" />
                </svg>
              </div>

              {/* Overlay Nodes */}
              {/* Left Node: Active Client */}
              <div className="absolute left-[15%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
                  Client
                </span>
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-primary)] shadow-[var(--shadow-sm)] shadow-[var(--shadow-inset)] relative">
                  {activeClientData?.logo}
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]" />
                </div>
              </div>

              {/* Center Node: MCP Host */}
              <div className="absolute left-[50%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
                  Protocol
                </span>
                <div
                  ref={mcpNodeRef}
                  className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shadow-[var(--shadow-sm)] shadow-[var(--shadow-inset)]"
                >
                  <Terminal size={18} />
                </div>
              </div>

              {/* Right Node: Context Graph */}
              <div className="absolute left-[85%] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold tracking-wider text-[var(--accent)] uppercase">
                  Graph
                </span>
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] shadow-[var(--shadow-accent)] shadow-[var(--shadow-sm)] relative">
                  <Network size={20} className="cg-pulse-glow rounded-full" />
                </div>
              </div>
            </div>

            {/* Right Column: Code Payload Inspector */}
            <div className="lg:col-span-5 p-[var(--space-5)] flex flex-col bg-[var(--code-surface)] min-h-[220px]">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-[var(--space-2)] mb-[var(--space-3)]">
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Live Payload Sync
                </span>
                <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                  JSON formatted
                </span>
              </div>
              <div ref={payloadRef} className="flex-1 overflow-y-auto">
                {renderJSONPayload(activeClient)}
              </div>
            </div>
          </div>
        </div>

        {/* Bulleted trust/architecture details */}
        <div className="mt-[var(--space-12)] grid grid-cols-1 md:grid-cols-3 gap-[var(--space-6)] border-t border-[var(--border)] pt-[var(--space-8)] w-full">
          <div className="vis-feature-badge flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Network size={15} className="text-[var(--accent)]" />
              <span className="text-[11px] font-bold tracking-[0.05em] uppercase">Graph Sync</span>
            </div>
            <span className="text-[13px] text-[var(--text-secondary)] text-center md:text-left">
              Bi-directional MCP updates live across all connected clients.
            </span>
          </div>

          <div className="vis-feature-badge flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Terminal size={15} className="text-[var(--accent)]" />
              <span className="text-[11px] font-bold tracking-[0.05em] uppercase">Developer-first</span>
            </div>
            <span className="text-[13px] text-[var(--text-secondary)] text-center md:text-left">
              Strict JSON schemas, open-source protocol, and direct SQL access.
            </span>
          </div>

          <div className="vis-feature-badge flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <ShieldCheck size={15} className="text-[var(--accent)]" />
              <span className="text-[11px] font-bold tracking-[0.05em] uppercase">Self-sovereign</span>
            </div>
            <span className="text-[13px] text-[var(--text-secondary)] text-center md:text-left">
              Your data stays encrypted. You own the keys and the database.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
