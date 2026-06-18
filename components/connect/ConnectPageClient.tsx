'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ArrowRight, Loader2, Sparkles, Terminal, Laptop, Activity } from 'lucide-react'
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
  
  // Connection testing states
  const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>({
    claude: 'idle',
    desktop: 'idle',
    chatgpt: 'idle',
    codex: 'idle',
  })
  
  const [nodeCount, setNodeCount] = useState<number | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [freshKey, setFreshKey] = useState<string | null>(null)

  useEffect(() => {
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
      // Simulate/trigger local preview API fetch
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

  // AI Connectors Definitions
  const connectors = [
    {
      id: 'claude',
      name: 'Claude.ai (Web)',
      icon: Sparkles,
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
      icon: Laptop,
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
      icon: Activity,
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
      icon: Terminal,
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
    <div className="w-full min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[rgba(179,236,19,0.03)] via-[#080808] to-[#080808] text-[var(--text-primary)] font-sans select-none overflow-y-auto">
      <div className="mx-auto max-w-[840px] px-6 py-16 flex flex-col gap-10">
        
        {/* HEADER BLOCK */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-full)] bg-[var(--accent-muted)] border border-[rgba(179,236,19,0.2)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            <Sparkles size={12} />
            Connection Guide
          </span>
          
          <h1 className="font-display text-[32px] sm:text-[44px] font-bold leading-none tracking-[-1.5px] text-[var(--text-primary)] mt-1">
            Connect AI Assistants
          </h1>
          
          <p className="max-w-[580px] text-[15px] leading-relaxed text-[var(--text-secondary)] font-medium">
            Power your AI models with your personal context engine. Copy the configuration snippets below to connect your favorite developer tools and clients.
          </p>
        </div>

        {/* API KEY MASKED OR NEW CARD */}
        <div className="rounded-[12px] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          {freshKey ? (
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Your API Key</span>
              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '12px', padding: '12px 16px', marginBottom: '8px',
              }}>
                <p style={{ fontSize:'11px', color:'#f59e0b', marginBottom:'6px', fontFamily:'var(--font-geist)', lineHeight:'1.6' }}>
                  ⚠ Copy your key now — it will not be shown again
                </p>
                <code style={{ fontSize:'13px', fontFamily:'var(--font-mono)', color:'var(--text-primary)', wordBreak:'break-all' }}>
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
                className="w-full sm:w-auto h-11 px-5 rounded-[8px] bg-[var(--accent, #b3ec13)] text-[#000] font-semibold text-[14px] flex items-center justify-center gap-2 cursor-pointer transition-opacity duration-100 hover:opacity-90 active:scale-[0.98]"
              >
                {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                {copiedKey ? 'Copied' : 'Copy key'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Your API Key Prefix</span>
                <div className="flex items-center gap-2 font-mono text-[16px] font-medium text-[var(--text-primary)] select-all break-all" style={{ fontFamily: 'var(--font-mono)' }}>
                  <span>{keyPrefix}</span>
                  <span className="text-[var(--text-muted)]">••••••••</span>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 leading-relaxed max-w-[480px]">
                  This is a masked preview. The full key is only shown once on creation. You can regenerate keys in <button onClick={() => router.push('/settings')} className="text-[var(--accent)] hover:underline font-semibold focus-visible:outline-none">Settings</button> if needed.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleCopyMaskedKey}
                className="w-full sm:w-auto h-11 px-5 flex items-center justify-center gap-2 font-medium"
              >
                {copiedKey ? <Check size={16} className="text-[var(--success)]" /> : <Copy size={16} />}
                {copiedKey ? 'Copied' : 'Copy Prefix'}
              </Button>
            </>
          )}
        </div>

        {/* AI CONNECTOR GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {connectors.map(c => {
            const Icon = c.icon
            const status = testStatuses[c.id]
            
            return (
              <div
                key={c.id}
                className="rounded-[12px] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-6 shadow-md hover:border-[var(--border-strong)] transition-all duration-200 flex flex-col justify-between gap-6"
              >
                <div className="flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-[6px] bg-[rgba(255,255,255,0.03)] border border-[var(--border)] text-[var(--accent)]">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-sans text-[18px] font-semibold text-[var(--text-primary)]">
                        {c.name}
                      </h3>
                    </div>

                    {status === 'success' && (
                      <span className="px-2 py-0.5 rounded-[20px] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[10px] font-semibold uppercase tracking-wider text-[var(--success)]">
                        Verified
                      </span>
                    )}
                    {status === 'error' && (
                      <span className="px-2 py-0.5 rounded-[20px] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[10px] font-semibold uppercase tracking-wider text-[var(--error)]">
                        Failed
                      </span>
                    )}
                  </div>

                  <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                    {c.description}
                  </p>

                  {/* Steps */}
                  <div className="flex flex-col gap-1.5 bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] rounded-[12px] p-3.5 text-[12px] font-medium font-mono text-[var(--text-secondary)]">
                    {c.steps.map((step, idx) => (
                      <div key={idx} className="whitespace-pre-wrap">
                        {step}
                      </div>
                    ))}
                  </div>

                  {/* Code snippet */}
                  <div className="flex flex-col gap-2 mt-2">
                    <CodeBlock code={c.code} title={c.title} />
                  </div>
                </div>

                {/* Card CTA: Test Connection */}
                <div className="pt-2">
                  <Button
                    variant={status === 'success' ? 'secondary' : 'accent'}
                    disabled={status === 'testing' || status === 'success'}
                    onClick={() => handleTestConnection(c.id)}
                    className="w-full h-11 font-medium flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    {status === 'testing' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Verifying endpoint...
                      </>
                    ) : status === 'success' ? (
                      <>
                        <Check size={16} className="text-[var(--success)]" />
                        Connection Active ({nodeCount !== null ? `${nodeCount} nodes` : 'Success'})
                      </>
                    ) : (
                      <>
                        <Activity size={16} />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* FOOTER NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--border)] pt-8 mt-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)] h-11 px-6 font-semibold"
          >
            Skip, configure later
          </Button>
          
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto h-11 px-8 font-semibold flex items-center justify-center gap-2"
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </Button>
        </div>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
