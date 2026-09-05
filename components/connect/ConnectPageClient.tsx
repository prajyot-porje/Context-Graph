'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import './driver-theme.css'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { Toast } from '@/components/ui/Toast'

interface ConnectPageClientProps {
  keyPrefix: string
  appUrl: string
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'
type ConnectorId = 'claude-web' | 'claude-desktop' | 'chatgpt' | 'codex'

// ─── Thin-line SVG icons (strokeWidth 1.5, no banned Lucide) ──────────────────

function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconCopy({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconLoader({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function IconSignal({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function IconCompass({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function IconWarning({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ─── Minimal copy-button for code blocks ──────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // silently fail
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy snippet"
      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-[color,background-color] duration-150 ease-out hover:bg-white/[0.06] hover:text-[var(--text-secondary)] active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
    >
      {copied
        ? <IconCheck size={13} />
        : <IconCopy size={13} />
      }
    </button>
  )
}

// ─── Refined code block — no horizontal scrollbar ─────────────────────────────

function CodeSnippet({ code, label }: { code: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--code-surface,#0d0d0d)] overflow-hidden">
      {/* tab bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </span>
        <CopyButton text={code} />
      </div>
      {/* code area — overflow-x-auto is scoped inside, no bleedthrough */}
      <div className="overflow-x-auto">
        <pre className="p-4 min-w-0">
          <code
            className="text-[12px] leading-[1.65] text-[var(--text-primary)] block whitespace-pre-wrap break-words"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ConnectPageClient({ keyPrefix, appUrl }: ConnectPageClientProps) {
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()

  const [activeTab, setActiveTab] = useState<ConnectorId>('claude-web')
  const [testStatuses, setTestStatuses] = useState<Record<ConnectorId, TestStatus>>({
    'claude-web': 'idle',
    'claude-desktop': 'idle',
    chatgpt: 'idle',
    codex: 'idle',
  })
  const [nodeCount, setNodeCount] = useState<number | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [freshKey, setFreshKey] = useState<string | null>(null)
  const copyKeyTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Panel crossfade state
  const [panelVisible, setPanelVisible] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const driverRef = useRef<Driver | null>(null)
  const hasAutoRunTour = useRef(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('cg-new-api-key')
    if (stored) {
      setFreshKey(stored)
      sessionStorage.removeItem('cg-new-api-key')
    }
  }, [])

  useEffect(() => () => {
    if (copyKeyTimerRef.current) clearTimeout(copyKeyTimerRef.current)
    driverRef.current?.destroy()
  }, [])

  const runTour = useCallback(() => {
    driverRef.current?.destroy()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    driverRef.current = driver({
      animate: !reducedMotion,
      showProgress: true,
      popoverClass: 'cg-tour-popover',
      overlayOpacity: 0.7,
      steps: [
        {
          element: '[data-tour="api-key"]',
          popover: { title: 'Your personal API key', description: 'This is what lets any MCP-compatible AI read and update your context graph. Copy it now — it will not be shown again.' },
        },
        {
          element: '[data-tour="client-tabs"]',
          popover: { title: 'Pick your AI client', description: 'Claude, ChatGPT, and Codex/Cursor each need a slightly different setup — pick the one you actually use.' },
        },
        {
          element: '[data-tour="code-snippet"]',
          popover: { title: 'Copy this into your client', description: 'Paste this into the config location shown in the steps above.' },
        },
        {
          element: '[data-tour="test-connection"]',
          popover: { title: 'Test the connection', description: 'Once you’ve connected, run this to confirm your client can actually reach your graph.' },
        },
      ],
    })
    driverRef.current.drive()
  }, [])

  useEffect(() => {
    if (freshKey && !hasAutoRunTour.current) {
      hasAutoRunTour.current = true
      const timer = setTimeout(runTour, 400)
      return () => clearTimeout(timer)
    }
  }, [freshKey, runTour])

  const handleCopyKey = async () => {
    const textToCopy = freshKey || `${keyPrefix}••••••••`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedKey(true)
      showToast({ message: 'API key copied to clipboard', type: 'success' })
      if (copyKeyTimerRef.current) clearTimeout(copyKeyTimerRef.current)
      copyKeyTimerRef.current = setTimeout(() => setCopiedKey(false), 2000)
    } catch {
      // silently fail
    }
  }

  const handleTabChange = (id: ConnectorId) => {
    if (id === activeTab) return
    // Emil blur crossfade trick — fade out, swap, fade in
    setPanelVisible(false)
    setTimeout(() => {
      setActiveTab(id)
      setPanelVisible(true)
    }, 120)
  }

  const handleTestConnection = async (id: ConnectorId) => {
    setTestStatuses(prev => ({ ...prev, [id]: 'testing' }))
    try {
      const res = await fetch('/api/context/preview?scope=me')
      if (res.ok) {
        const data = await res.json()
        setNodeCount(data.nodeCount)
        setTestStatuses(prev => ({ ...prev, [id]: 'success' }))
        showToast({ message: 'Connection verified successfully', type: 'success' })
      } else {
        setTestStatuses(prev => ({ ...prev, [id]: 'error' }))
        showToast({ message: 'Connection check failed. Verify your session.', type: 'error' })
      }
    } catch {
      setTestStatuses(prev => ({ ...prev, [id]: 'error' }))
      showToast({ message: 'Network error during connection check.', type: 'error' })
    }
  }

  const displayKey = freshKey ?? `${keyPrefix}••••••••`

  // ─── Connector data ────────────────────────────────────────────────────────

  const connectors: {
    id: ConnectorId
    label: string
    tagline: string
    steps: string[]
    codeLabel: string
    code: string
  }[] = [
    {
      id: 'claude-web',
      label: 'Claude Web',
      tagline: 'Connect Claude.ai via Custom MCP Server.',
      steps: [
        'Open Claude.ai and go to Settings (bottom-left user menu).',
        'Navigate to Developer settings.',
        'Click "Add MCP Server" and paste the URL below.',
      ],
      codeLabel: 'Remote MCP URL',
      code: `${appUrl}/api/mcp?key=${displayKey}`,
    },
    {
      id: 'claude-desktop',
      label: 'Claude Desktop',
      tagline: 'Access context during local coding sessions.',
      steps: [
        'Open the Claude Desktop config file in your editor.',
        'Mac path: ~/Library/Application Support/Claude/claude_desktop_config.json',
        'Windows path: %APPDATA%\\Claude\\claude_desktop_config.json',
        'Merge the JSON snippet below into the file, then restart Claude.',
      ],
      codeLabel: 'claude_desktop_config.json',
      code: JSON.stringify(
        {
          mcpServers: {
            'context-graph': {
              command: 'npx',
              args: [
                '-y',
                '@modelcontextprotocol/server-http-sse',
                '--url',
                `${appUrl}/api/mcp?key=${displayKey}`,
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
      label: 'ChatGPT Plus',
      tagline: 'Pull context into ChatGPT on demand via MCP.',
      steps: [
        'Open ChatGPT and go to Custom GPTs or Settings.',
        'Add a new MCP endpoint integration.',
        'Paste the URL below and save.',
      ],
      codeLabel: 'ChatGPT MCP Server URL',
      code: `${appUrl}/api/mcp?key=${displayKey}`,
    },
    {
      id: 'codex',
      label: 'Codex / Cursor',
      tagline: 'Inject context into editor sessions via HTTP.',
      steps: [
        'Open editor settings and find MCP integrations.',
        'Add a new Streamable HTTP server named "context-graph".',
        'Paste the configuration below and save.',
      ],
      codeLabel: 'Editor Configuration',
      code: `Name: context-graph\nURL: ${appUrl}/api/mcp\nHeader: x-api-key: ${displayKey}`,
    },
  ]

  const activeConnector = connectors.find(c => c.id === activeTab)!
  const activeStatus = testStatuses[activeTab]

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] font-sans relative overflow-x-hidden">

      {/* Subtle top radial highlight — atmospheric depth */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* ── Page content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-[720px] px-5 py-16 sm:px-8 sm:py-24">

        {/* ── Section 1: Header ─────────────────────────────────────────── */}
        <header className="connect-section mb-12 sm:mb-16">

          {/* Eyebrow badge — accent used here (one per viewport, minimal surface) */}
          <div className="mb-5 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] border border-[rgba(179,236,19,0.18)] bg-[var(--accent-muted)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent)]"
            >
              {/* Dot pulse */}
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              </span>
              Setup Guide
            </span>
          </div>

          <h1
            className="mb-4 text-[40px] leading-[1.0] tracking-[-0.03em] sm:text-[52px]"
            style={{ fontFamily: "var(--font-display, 'Bricolage Grotesque', sans-serif)", fontWeight: 700 }}
          >
            Connect Your AI
          </h1>

          <p className="max-w-[480px] text-[15px] leading-[1.65] text-[var(--text-secondary)]">
            Configure your AI clients below. Each one will have persistent access to your personal context graph.
          </p>
        </header>

        {/* ── Section 2: API Key Card ────────────────────────────────────── */}
        <section className="connect-section connect-section--2 mb-8">

          {/* Double-bezel card */}
          <div data-tour="api-key" className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-[5px] shadow-[var(--shadow-md)]">
            <div
              className="rounded-[calc(var(--radius-xl)-5px)] p-5 sm:p-6"
              style={{
                background: 'linear-gradient(180deg, var(--card-raised) 0%, var(--card) 100%)',
                boxShadow: 'var(--shadow-inset)',
              }}
            >

              {freshKey ? (
                /* ── Fresh key warning ── */
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.06)] px-4 py-3">
                    <span className="mt-0.5 shrink-0 text-[var(--error)]">
                      <IconWarning size={14} />
                    </span>
                    <p className="text-[12px] leading-[1.55] text-[var(--error)] font-medium">
                      Copy your API key now — it will not be shown again after you leave this page.
                    </p>
                  </div>

                  <div>
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Your New API Key
                    </span>
                    {/* Key value — selectable */}
                    <div
                      className="select-all rounded-[var(--radius-md)] border border-[var(--border)] bg-[#050505] px-4 py-3 cursor-text"
                    >
                      <code
                        className="block break-all text-[12.5px] leading-[1.55] text-[var(--text-primary)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {freshKey}
                      </code>
                    </div>
                  </div>

                  {/* Copy key — accent button (one per viewport, justified) */}
                  <button
                    onClick={handleCopyKey}
                    className="connect-key-btn flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-[13px] font-semibold text-[var(--on-accent)] transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                  >
                    {copiedKey ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    {copiedKey ? 'Copied to clipboard' : 'Copy API Key'}
                  </button>
                </div>
              ) : (
                /* ── Masked key (returning user) ── */
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      API Key
                    </span>
                    <div className="flex min-w-0 items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="text-[14px] font-medium text-[var(--text-primary)]">
                        {keyPrefix}
                      </span>
                      <span className="text-[14px] text-[var(--text-muted)] tracking-widest">
                        ••••••••
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-[1.5]">
                      Full key hidden for security.{' '}
                      <button
                        onClick={() => router.push('/settings')}
                        className="text-[var(--text-secondary)] underline underline-offset-2 decoration-[var(--border-strong)] hover:text-[var(--text-primary)] hover:decoration-[var(--text-secondary)] transition-[color] duration-150 cursor-pointer focus-visible:outline-none"
                      >
                        Regenerate in Settings
                      </button>
                    </p>
                  </div>

                  {/* Copy prefix — secondary (neutral, no accent) */}
                  <button
                    onClick={handleCopyKey}
                    className="flex h-9 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent px-4 text-[12px] font-medium text-[var(--text-secondary)] transition-[background-color,color,border-color,transform] duration-150 ease-out hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                  >
                    {copiedKey ? <IconCheck size={12} /> : <IconCopy size={12} />}
                    {copiedKey ? 'Copied' : 'Copy Prefix'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 3: Connector Tabs + Panel ─────────────────────────── */}
        <section className="connect-section connect-section--3">

          {/* Tab row */}
          <div
            data-tour="client-tabs"
            className="mb-6 flex gap-1 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-1"
            role="tablist"
            aria-label="AI client connectors"
          >
            {connectors.map(c => {
              const isActive = c.id === activeTab
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${c.id}`}
                  onClick={() => handleTabChange(c.id)}
                  className={[
                    'relative flex-1 min-w-[80px] rounded-[var(--radius-md)] px-4 py-2.5 text-[12.5px] font-medium whitespace-nowrap',
                    'transition-[background-color,color,box-shadow] duration-200 cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
                    isActive
                      ? 'bg-[var(--card-raised)] text-[var(--text-primary)] shadow-[var(--shadow-sm),var(--shadow-inset)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]',
                  ].join(' ')}
                >
                  {/* Active tab: accent bottom underline (2px, restrained) */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-[var(--accent)]"
                      aria-hidden="true"
                    />
                  )}
                  {c.label}

                  {/* Status dot for verified tabs */}
                  {testStatuses[c.id] === 'success' && (
                    <span
                      className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)] align-middle"
                      aria-label="verified"
                    />
                  )}
                  {testStatuses[c.id] === 'error' && (
                    <span
                      className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--error)] align-middle"
                      aria-label="error"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Single connector panel — crossfades on tab change */}
          <div
            ref={panelRef}
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={activeTab}
            className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-[5px] shadow-[var(--shadow-md)]"
            style={{
              opacity: panelVisible ? 1 : 0,
              filter: panelVisible ? 'blur(0px)' : 'blur(3px)',
              transform: panelVisible ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 140ms ease-out, filter 120ms ease-out, transform 140ms ease-out',
            }}
          >
            <div
              className="rounded-[calc(var(--radius-xl)-5px)] p-6 sm:p-8"
              style={{
                background: 'linear-gradient(180deg, var(--card-raised) 0%, var(--card) 100%)',
                boxShadow: 'var(--shadow-inset)',
              }}
            >
              {/* Panel header */}
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2
                    className="mb-1 text-[18px] font-semibold leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]"
                  >
                    {activeConnector.label}
                  </h2>
                  <p className="text-[13px] leading-[1.55] text-[var(--text-secondary)]">
                    {activeConnector.tagline}
                  </p>
                </div>

                {/* Status badge — neutral, small */}
                {activeStatus === 'success' && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-[var(--radius-full)] border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                    Verified
                  </span>
                )}
                {activeStatus === 'error' && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-[var(--radius-full)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--error)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--error)]" />
                    Offline
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="mb-6 h-px bg-[var(--border)]" />

              {/* Steps — readable body text, not monospace */}
              <div className="mb-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Steps
                </p>
                <ol className="flex flex-col gap-3">
                  {activeConnector.steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3"
                    >
                      {/* Step number */}
                      <span
                        className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[10px] font-semibold text-[var(--text-muted)]"
                        style={{ background: 'var(--surface)' }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-[13.5px] leading-[1.6] text-[var(--text-secondary)]">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Code snippet */}
              <div data-tour="code-snippet" className="mb-6">
                <CodeSnippet
                  code={activeConnector.code}
                  label={activeConnector.codeLabel}
                />
              </div>

              {/* Test Connection — secondary variant (neutral, no accent) */}
              <button
                data-tour="test-connection"
                disabled={activeStatus === 'testing'}
                onClick={() => handleTestConnection(activeTab)}
                className={[
                  'flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)]',
                  'border text-[13px] font-medium',
                  'transition-[background-color,color,border-color,transform] duration-150 ease-out',
                  'active:scale-[0.97] cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
                  'disabled:pointer-events-none disabled:opacity-50',
                  activeStatus === 'success'
                    ? 'border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.04)] text-[var(--success)] cursor-default'
                    : 'border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {activeStatus === 'testing' ? (
                  <>
                    <IconLoader size={14} />
                    Verifying…
                  </>
                ) : activeStatus === 'success' ? (
                  <>
                    <IconCheck size={14} />
                    Verified
                    {nodeCount !== null && (
                      <span className="ml-1 text-[11px] font-normal text-[var(--success)] opacity-80">
                        · {nodeCount} nodes
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <IconSignal size={14} />
                    Test Connection
                  </>
                )}
              </button>

            </div>
          </div>
        </section>

        {/* ── Section 4: Footer CTAs ─────────────────────────────────────── */}
        <footer className="connect-section connect-section--4 mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-8 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-[12px] text-[var(--text-muted)] leading-[1.5]">
            Configure more clients anytime from the dashboard.
          </p>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              onClick={runTour}
              className="h-10 px-4 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] active:scale-[0.97] flex items-center gap-1.5"
            >
              <IconCompass size={13} /> Take a tour
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="h-10 px-4 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] active:scale-[0.97]"
            >
              Skip for now
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard')}
              className="h-10 px-5 text-[13px] font-semibold active:scale-[0.97] flex items-center gap-2"
            >
              Go to Dashboard
              <IconArrowRight size={13} />
            </Button>
          </div>
        </footer>

      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* ── Page entrance animations ────────────────────────────────────── */}
      <style>{`
        @keyframes cg-reveal {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .connect-section {
          animation: cg-reveal 0.55s cubic-bezier(0.23, 1, 0.32, 1) both;
          animation-delay: 0ms;
        }
        .connect-section--2 {
          animation-delay: 80ms;
        }
        .connect-section--3 {
          animation-delay: 160ms;
        }
        .connect-section--4 {
          animation-delay: 220ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .connect-section {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
