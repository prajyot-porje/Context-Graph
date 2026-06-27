'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { useToast } from '@/hooks/useToast'
import { Toast } from '@/components/ui/Toast'

interface ConnectPageClientProps {
  keyPrefix: string
  appUrl: string
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export function ConnectPageClient({ keyPrefix, appUrl }: ConnectPageClientProps) {
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  
  const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>({
    claude: 'idle',
    desktop: 'idle',
    chatgpt: 'idle',
    codex: 'idle',
  })
  
  const [nodeCount, setNodeCount] = useState<number | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [freshKey, setFreshKey] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = sessionStorage.getItem('cg-new-api-key')
    if (stored) {
      setFreshKey(stored)
      sessionStorage.removeItem('cg-new-api-key')
    }
  }, [])

  const handleCopyMaskedKey = async () => {
    try {
      await navigator.clipboard.writeText(`${keyPrefix}••••••••`)
      setCopiedKey(true)
      showToast({ message: 'Key prefix copied!', type: 'success' })
      setTimeout(() => setCopiedKey(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleTestConnection = async (id: string) => {
    setTestStatuses(prev => ({ ...prev, [id]: 'testing' }))
    try {
      const res = await fetch('/api/context/preview?scope=me')
      if (res.ok) {
        const data = await res.json()
        setNodeCount(data.nodeCount)
        setTestStatuses(prev => ({ ...prev, [id]: 'success' }))
        showToast({ message: 'Connection verified successfully!', type: 'success' })
      } else {
        setTestStatuses(prev => ({ ...prev, [id]: 'error' }))
        showToast({ message: 'Failed to verify connection. Check your session.', type: 'error' })
      }
    } catch (err) {
      console.error('Test connection error:', err)
      setTestStatuses(prev => ({ ...prev, [id]: 'error' }))
      showToast({ message: 'Error checking connection status.', type: 'error' })
    }
  }

  const keyValue = freshKey || `${keyPrefix}••••••••`

  // Custom precise thin-line SVG icons
  const SparkleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )

  const LaptopIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="2" y1="20" x2="22" y2="20" />
      <line x1="12" y1="17" x2="12" y2="20" />
    </svg>
  )

  const TerminalIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )

  const FlowIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
      <path d="M12 6a6 6 0 0 1 6 6c0 3.314-2.686 6-6 6s-6-2.686-6-6a6 6 0 0 1 6-6z" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  )

  const connectors = [
    {
      id: 'claude',
      name: 'Claude.ai (Web)',
      icon: SparkleIcon,
      description: 'Connect Claude.ai web client directly to your context graph via Custom MCP Servers.',
      steps: [
        '1. Open Claude.ai settings (bottom left user profile).',
        '2. Navigate to Developer settings.',
        '3. Click "Add MCP Server" and fill in the details below.',
      ],
      title: 'Remote MCP URL',
      code: `${appUrl}/api/mcp?key=${keyValue}`,
    },
    {
      id: 'desktop',
      name: 'Claude Desktop',
      icon: LaptopIcon,
      description: 'Configure your local Claude Desktop app to access context during local coding sessions.',
      steps: [
        '1. Open the Claude Desktop config file in your system editor.',
        '   • Mac: ~/Library/Application Support/Claude/claude_desktop_config.json',
        '   • Windows: %APPDATA%\\Claude\\claude_desktop_config.json',
        '2. Merge the configuration snippet below into the file.',
      ],
      title: 'claude_desktop_config.json snippet',
      code: JSON.stringify(
        {
          mcpServers: {
            'context-graph': {
              command: 'npx',
              args: [
                '-y',
                '@modelcontextprotocol/server-http-sse',
                '--url',
                `${appUrl}/api/mcp?key=${keyValue}`,
              ],
            },
          },
        },
        null,
        2
      ),
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT Plus (Web)',
      icon: FlowIcon,
      description: 'Allow ChatGPT web interface to pull relevant identity and project contexts on demand.',
      steps: [
        '1. Go to ChatGPT Custom GPTs or Settings.',
        '2. Add a new action / MCP endpoint integration.',
        '3. Paste the URL snippet below to connect.',
      ],
      title: 'ChatGPT MCP Server URL',
      code: `${appUrl}/api/mcp?key=${keyValue}`,
    },
    {
      id: 'codex',
      name: 'Codex / Cursor',
      icon: TerminalIcon,
      description: 'Integrate Codex or Cursor editors directly using standard HTTP headers.',
      steps: [
        '1. Open your editor settings and find MCP integrations.',
        '2. Add a new Streamable HTTP server called "context-graph".',
        '3. Provide the URL and the header parameter below.',
      ],
      title: 'Codex Configuration',
      code: `Name: context-graph
URL: ${appUrl}/api/mcp
Header: x-api-key: ${keyValue}`,
    },
  ]

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans select-none overflow-y-auto relative">
      
      {/* Background Radial Mono-Gradient Highlight */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
          zIndex: 0
        }}
      />

      <div className="mx-auto max-w-[1200px] px-6 py-12 md:py-24 relative z-10">
        
        {/* Editorial Split Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr] gap-12 lg:gap-16 items-start">
          
          {/* LEFT SIDE: Sticky Details & Key Info */}
          <div className="flex flex-col gap-8 md:sticky md:top-12">
            
            <div className="flex flex-col gap-4">
              <span className="w-max inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-full)] bg-[var(--accent-muted)] border border-[rgba(179,236,19,0.15)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Setup Guide
              </span>
              
              <h1 
                className="font-bold leading-none tracking-[-0.03em] text-[36px] lg:text-[44px]"
                style={{ fontFamily: "'rb-freigeist-neue', 'Bricolage Grotesque', sans-serif" }}
              >
                Connect AI<br />Assistants
              </h1>
              
              <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] font-medium max-w-[320px] mt-1">
                Power your AI models with your personal context engine. Configure the clients below to secure persistent recall.
              </p>
            </div>

            {/* API KEY DOUBLE-BEZEL CARD */}
            <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-1.5 shadow-sm shadow-[var(--shadow-inset)] w-full">
              <div className="rounded-[10px] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-5 flex flex-col gap-4">
                {freshKey ? (
                  <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Your New API Key</span>
                      <p className="text-[11px] text-[var(--error)] leading-normal font-semibold">
                        ⚠ Copy your key now — it will not be shown again
                      </p>
                    </div>
                    
                    <div className="rounded-lg bg-[#050505] border border-[var(--border)] p-3 select-all">
                      <code className="font-mono text-[12px] text-[var(--text-primary)] break-all block" style={{ fontFamily: 'var(--font-mono)' }}>
                        {freshKey}
                      </code>
                    </div>

                    <button 
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(freshKey)
                          setCopiedKey(true)
                          showToast({ message: 'API key copied!', type: 'success' })
                          setTimeout(() => setCopiedKey(false), 2000)
                        } catch (err) {
                          console.error('Failed to copy', err)
                        }
                      }}
                      className="w-full h-11 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--on-accent)] font-semibold text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-transform duration-100 hover:opacity-90 active:scale-[0.97]"
                    >
                      {copiedKey ? <Check size={14} /> : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                      {copiedKey ? 'Copied' : 'Copy API Key'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">API Key Prefix</span>
                      <div className="flex items-center gap-1.5 font-mono text-[15px] font-medium text-[var(--text-primary)] select-all break-all" style={{ fontFamily: 'var(--font-mono)' }}>
                        <span>{keyPrefix}</span>
                        <span className="text-[var(--text-muted)]">••••••••</span>
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      Masked preview. The full key was shown on creation. You can regenerate keys in{' '}
                      <button onClick={() => router.push('/settings')} className="text-[var(--accent)] hover:underline font-semibold focus-visible:outline-none cursor-pointer">Settings</button>.
                    </p>

                    <Button
                      variant="secondary"
                      onClick={handleCopyMaskedKey}
                      className="w-full h-11 flex items-center justify-center gap-2 font-medium text-[13px] active:scale-[0.97]"
                    >
                      {copiedKey ? <Check size={14} className="text-[var(--success)]" /> : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                      {copiedKey ? 'Copied Prefix' : 'Copy Prefix'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* STICKY FOOTER ACTIONS */}
            <div className="flex flex-col gap-3.5 border-t border-[var(--border)] pt-6 mt-2">
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard')}
                className="w-full h-11 font-semibold flex items-center justify-center gap-2 active:scale-[0.97]"
              >
                Go to Dashboard
                <ArrowRight size={14} />
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="w-full h-11 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold active:scale-[0.97]"
              >
                Configure Later
              </Button>
            </div>

          </div>

          {/* RIGHT SIDE: Connectors Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {connectors.map((c, index) => {
              const ConnectorIcon = c.icon
              const status = testStatuses[c.id]
              
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border border-[var(--border)] bg-black/10 p-1.5 transition-all duration-500 hover:border-[var(--border-strong)] flex flex-col justify-between ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 80}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                >
                  <div className="rounded-[10px] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-5 flex flex-col gap-4 flex-1 justify-between">
                    
                    <div className="flex flex-col gap-4">
                      {/* Connector Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white/5 border border-[var(--border)] text-[var(--accent)] flex items-center justify-center">
                            <ConnectorIcon />
                          </div>
                          <h3 className="font-semibold text-[15px] text-[var(--text-primary)] tracking-tight">
                            {c.name}
                          </h3>
                        </div>

                        {/* Connection status tag utilizing desaturated pastel colors */}
                        {status === 'success' && (
                          <span className="px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.18)] text-[9px] font-semibold uppercase tracking-[0.05em] text-[var(--success)]">
                            Active
                          </span>
                        )}
                        {status === 'error' && (
                          <span className="px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.18)] text-[9px] font-semibold uppercase tracking-[0.05em] text-[var(--error)]">
                            Offline
                          </span>
                        )}
                        {status === 'testing' && (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-[var(--border)] text-[9px] font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)] flex items-center gap-1">
                            <Loader2 size={8} className="animate-spin text-[var(--accent)]" />
                            Testing
                          </span>
                        )}
                      </div>

                      <p className="text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
                        {c.description}
                      </p>

                      {/* Monospace configuration walkthrough steps */}
                      <div className="bg-[#050505] border border-[var(--border)] rounded-lg p-4 font-mono text-[11px] leading-relaxed text-[var(--text-secondary)] space-y-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
                        {c.steps.map((step, idx) => (
                          <div key={idx} className="whitespace-pre-wrap">
                            {step}
                          </div>
                        ))}
                      </div>

                      {/* Code block */}
                      <div className="mt-1">
                        <CodeBlock code={c.code} title={c.title} />
                      </div>
                    </div>

                    {/* Test Connection Button with active scale feedback */}
                    <div className="pt-2">
                      <Button
                        variant={status === 'success' ? 'secondary' : 'accent'}
                        disabled={status === 'testing' || status === 'success'}
                        onClick={() => handleTestConnection(c.id)}
                        className={`w-full h-11 font-medium text-[13px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 ${
                          status === 'success' 
                            ? 'border-[rgba(34,197,94,0.3)] text-[var(--success)] bg-[rgba(34,197,94,0.02)] cursor-default' 
                            : ''
                        }`}
                      >
                        {status === 'testing' ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-[var(--on-accent)]" />
                            Verifying endpoint...
                          </>
                        ) : status === 'success' ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Connection verified ({nodeCount !== null ? `${nodeCount} nodes` : 'Active'})
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                            Test Connection
                          </>
                        )}
                      </Button>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>

        </div>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
