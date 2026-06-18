'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, RotateCcw, Trash2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { useToast } from '@/hooks/useToast'
import { Toast } from '@/components/ui/Toast'

type Tab = 'Claude' | 'Claude Code' | 'ChatGPT' | 'Codex'
const TABS: Tab[] = ['Claude', 'Claude Code', 'ChatGPT', 'Codex']

const getSnippets = (prefix: string) => ({
  Claude: {
    title: 'Remote MCP Server URL',
    code: `https://your-app.vercel.app/api/mcp?key=${prefix}••••••••`
  },
  'Claude Code': {
    title: '~/.claude/claude_desktop_config.json',
    code: `{
  "mcpServers": {
    "context-engine": {
      "url": "https://your-cf-worker.workers.dev/mcp",
      "headers": {
        "x-api-key": "${prefix}••••••••"
      }
    }
  }
}`
  },
  ChatGPT: {
    title: 'MCP Server URL',
    code: `https://your-app.vercel.app/api/mcp?key=${prefix}••••••••`
  },
  Codex: {
    title: 'Codex Desktop — Streamable HTTP',
    code: `Name: context-engine
URL: https://your-cf-worker.workers.dev/mcp
Header: x-api-key: ${prefix}••••••••`
  }
})

type SettingsTab = 'API Key' | 'Account' | 'Danger Zone'
const SETTINGS_TABS: SettingsTab[] = ['API Key', 'Account', 'Danger Zone']

export default function SettingsClient() {
  const { toast, showToast, hideToast } = useToast()

  const [settingsTab, setSettingsTab] = useState<SettingsTab>('API Key')
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('Claude')

  const [showDeleteInput, setShowDeleteInput] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // API Key States
  const [apiKeyInfo, setApiKeyInfo] = useState<{ prefix: string; last_used: string | null } | null>(null)
  const [isLoadingKey, setIsLoadingKey] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [newRawKey, setNewRawKey] = useState<string | null>(null)
  const [copiedNewKey, setCopiedNewKey] = useState(false)
  const [showCloseWarning, setShowCloseWarning] = useState(false)

  // Fetch API key info on mount
  useEffect(() => {
    setIsLoadingKey(true)
    fetch('/api/apikey')
      .then((r) => {
        if (r.ok) return r.json()
        throw new Error('Failed to load key info')
      })
      .then((data) => {
        if (data && data.prefix) {
          setApiKeyInfo(data)
        } else {
          setApiKeyInfo(null)
        }
        setIsLoadingKey(false)
      })
      .catch((err) => {
        console.error(err)
        setIsLoadingKey(false)
      })
  }, [])

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setShowRegenerateConfirm(false)
    try {
      // First revoke existing key
      await fetch('/api/apikey', { method: 'DELETE' })
      
      // Then generate new key
      const res = await fetch('/api/apikey', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setNewRawKey(data.key)
        setCopiedNewKey(false)
        
        // Update local key info state immediately
        setApiKeyInfo({
          prefix: data.prefix,
          last_used: null,
        })
        
        showToast({ message: 'New API key generated', type: 'success' })
      } else {
        showToast({ message: 'Failed to generate new key', type: 'error' })
      }
    } catch (err) {
      console.error(err)
      showToast({ message: 'An error occurred', type: 'error' })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCloseNewKeyModal = () => {
    if (!copiedNewKey) {
      setShowCloseWarning(true)
    } else {
      setNewRawKey(null)
      setShowCloseWarning(false)
    }
  }

  const handleSaveAccount = () => {
    showToast({ message: 'Changes saved', type: 'success' })
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return dateStr
    }
  }

  const activePrefix = apiKeyInfo?.prefix || 'ctx_a3f2'
  const snippets = getSnippets(activePrefix)

  return (
    <div className="w-full h-full overflow-y-auto" data-lenis-prevent="true">
      <div className="mx-auto max-w-[680px] px-6 py-10 relative">
        
        <div className="relative flex flex-col items-start gap-3 lg:block mb-6">
          <div className="lg:absolute lg:-left-[150px] xl:-left-[200px] 2xl:-left-[260px] lg:top-1/2 lg:-translate-y-1/2">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none"
            >
              <ArrowLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
              Back to dashboard
            </Link>
          </div>
          
          <h1 className="font-['rb-freigeist-neue','Bricolage_Grotesque',sans-serif] text-[28px] font-semibold leading-none tracking-[-0.5px] text-[var(--text-primary)]">
            Settings
          </h1>
        </div>

        <div className="mb-8 flex gap-2 border-b border-[var(--border)] pb-2">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab}
              className={cn(
                "px-3 py-1.5 font-sans text-[14px] font-medium transition-colors",
                settingsTab === tab
                  ? "text-[var(--accent)] border-b-2 border-[var(--accent)] -mb-[9px]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              onClick={() => setSettingsTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SECTION 1 — API KEY */}
        {settingsTab === 'API Key' && (
        <section className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-raised)_0%,var(--card)_100%)] p-6 shadow-[var(--shadow-sm),var(--shadow-inset)]">
          <h2 className="mb-1 font-sans text-[16px] font-semibold text-[var(--text-primary)]">API Key</h2>
          <p className="mb-5 font-sans text-[13px] text-[var(--text-secondary)]">
            Use this key to connect any MCP-compatible AI to your context graph.
          </p>

          {isLoadingKey ? (
            <div className="flex items-center justify-center p-6 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--bg)] animate-pulse">
              <Loader2 className="animate-spin h-5 w-5 text-[var(--accent)] mr-2" />
              <span className="text-[13px] text-[var(--text-muted)]">Fetching API key configuration...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5">
              <span className="flex-1 font-mono text-[13px] text-[var(--text-primary)]">
                {apiKeyInfo ? `${apiKeyInfo.prefix}••••••••••••••••••••••••` : 'No API key generated yet'}
              </span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="font-sans text-[13px] font-medium text-[var(--text-primary)]">Regenerate API key</p>
              <p className="mt-0.5 font-sans text-[12px] text-[var(--text-muted)]">This will invalidate your current key immediately.</p>
            </div>
            
            {showRegenerateConfirm ? (
              <div className="flex gap-2">
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="h-8 bg-[var(--warning)] text-black hover:bg-[var(--warning)]/90 px-3"
                  disabled={isRegenerating}
                  onClick={handleRegenerate}
                >
                  {isRegenerating ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : 'Yes, regenerate'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3"
                  disabled={isRegenerating}
                  onClick={() => setShowRegenerateConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 border border-[rgba(245,158,11,0.2)] text-[var(--warning)] hover:bg-[rgba(245,158,11,0.05)] hover:text-[var(--warning)] px-3"
                disabled={isLoadingKey}
                onClick={() => setShowRegenerateConfirm(true)}
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Regenerate
              </Button>
            )}
          </div>

          {!isLoadingKey && (
            <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-3.5">
              <span className="text-[11px] text-[var(--text-muted)]">Last used</span>
              <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                {apiKeyInfo?.last_used ? formatDate(apiKeyInfo.last_used) : 'Never'}
              </span>
            </div>
          )}

          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              CONNECT YOUR AI TOOLS
            </p>
            
            <div className="mb-4 flex flex-wrap gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={cn(
                    "rounded-[var(--radius-md)] px-3.5 py-1.5 font-sans text-[12px] font-medium transition-all duration-150 border",
                    activeTab === tab
                      ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  )}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <CodeBlock 
              title={snippets[activeTab].title}
              code={snippets[activeTab].code}
            />

            <p className="mt-3 text-[12px] text-[var(--warning)] font-medium">
              Replace with your full API key — the complete key was shown once during onboarding.
            </p>
          </div>
        </section>
        )}

        {/* SECTION 2 — ACCOUNT */}
        {settingsTab === 'Account' && (
        <section className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(180deg,var(--card-raised)_0%,var(--card)_100%)] p-6 shadow-[var(--shadow-sm),var(--shadow-inset)]">
          <h2 className="mb-1 font-sans text-[16px] font-semibold text-[var(--text-primary)]">Account</h2>
          <p className="mb-5 font-sans text-[13px] text-[var(--text-secondary)]">
            Update your personal information.
          </p>

          <div className="flex flex-col gap-4">
            <Input label="Full name" defaultValue="Prajyot Porje" />
            <Input label="Email" defaultValue="porjeprajyot@gmail.com" type="email" />
            <Input label="Location" defaultValue="Pune, India" />
          </div>

          <div className="mt-6">
            <Button variant="primary" className="h-9 px-4" onClick={handleSaveAccount}>
              Save changes
            </Button>
          </div>
        </section>
        )}

        {/* SECTION 3 — DANGER ZONE */}
        {settingsTab === 'Danger Zone' && (
        <section className="rounded-[var(--radius-lg)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.04)] p-6">
          <h2 className="mb-1 font-sans text-[16px] font-semibold text-[var(--error)]">Danger Zone</h2>
          <p className="mb-5 font-sans text-[13px] text-[var(--text-secondary)]">
            Permanently delete your account and all context data. This cannot be undone.
          </p>

          {!showDeleteInput ? (
            <Button
              variant="ghost"
              className="h-9 border border-[var(--error)] text-[var(--error)] hover:bg-[rgba(239,68,68,0.05)] px-4"
              onClick={() => setShowDeleteInput(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete account
            </Button>
          ) : (
            <div>
              <p className="mb-2 font-sans text-[13px] text-[var(--text-secondary)]">
                Type DELETE to confirm
              </p>
              <Input
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              <div className="mt-4 flex gap-2">
                <Button
                  variant="primary"
                  className={cn(
                    "h-9 bg-[var(--error)] text-white px-4",
                    deleteConfirmText !== 'DELETE' && "opacity-40 pointer-events-none"
                  )}
                >
                  Permanently delete
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 px-4"
                  onClick={() => {
                    setShowDeleteInput(false)
                    setDeleteConfirmText('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
        )}
        
      </div>

      {/* ONE-TIME API KEY VIEW MODAL */}
      {newRawKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-[500px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl relative flex flex-col gap-5">
            <div>
              <h3 className="font-['rb-freigeist-neue','Bricolage_Grotesque',sans-serif] text-[24px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                Your new API key
              </h3>
              <p className="mt-2 text-[13px] text-[var(--warning)] font-medium leading-relaxed">
                Copy this key now. It will not be shown again.
              </p>
            </div>

            <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-3 font-mono text-[13px] text-[var(--text-primary)]">
              <span className="flex-1 break-all select-all font-mono">
                {newRawKey}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(newRawKey)
                    setCopiedNewKey(true)
                    showToast({ message: 'API key copied to clipboard!', type: 'success' })
                  } catch (err) {
                    console.error('Failed to copy', err)
                  }
                }}
              >
                {copiedNewKey ? <Check className="h-4 w-4 text-[var(--success)]" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <Button
                variant="primary"
                onClick={handleCloseNewKeyModal}
                className="h-9 px-4 font-medium"
              >
                I have copied it
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CLOSE SAFEGUARD WARNING */}
      {showCloseWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-[420px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl flex flex-col gap-4">
            <h4 className="font-['rb-freigeist-neue','Bricolage_Grotesque',sans-serif] text-[18px] font-bold text-[var(--text-primary)]">
              Are you sure you want to close?
            </h4>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              You have not copied your new API key. If you close this window now, you will never be able to view this key again and will have to regenerate a new one.
            </p>
            <div className="flex gap-2 justify-end mt-2">
              <Button
                variant="ghost"
                className="h-9 px-4 text-[var(--error)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.05)]"
                onClick={() => {
                  setNewRawKey(null)
                  setShowCloseWarning(false)
                }}
              >
                Close anyway
              </Button>
              <Button
                variant="primary"
                className="h-9 px-4"
                onClick={() => setShowCloseWarning(false)}
              >
                Go back & copy
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
