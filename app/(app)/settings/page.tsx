'use client'

import { useState } from 'react'
import { Copy, Check, Eye, EyeOff, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { useToast } from '@/hooks/useToast'
import { Toast } from '@/components/ui/Toast'

type Tab = 'Claude' | 'Claude Code' | 'ChatGPT' | 'Codex'
const TABS: Tab[] = ['Claude', 'Claude Code', 'ChatGPT', 'Codex']

const SNIPPETS: Record<Tab, { title: string; code: string }> = {
  Claude: {
    title: 'claude_desktop_config.json',
    code: `{
  "mcpServers": {
    "context-engine": {
      "url": "https://your-cf-worker.workers.dev/mcp",
      "headers": {
        "x-api-key": "ctx_a3f2xxxx"
      }
    }
  }
}`
  },
  'Claude Code': {
    title: '~/.claude/claude_desktop_config.json',
    code: `{
  "mcpServers": {
    "context-engine": {
      "url": "https://your-cf-worker.workers.dev/mcp",
      "headers": {
        "x-api-key": "ctx_a3f2xxxx"
      }
    }
  }
}`
  },
  ChatGPT: {
    title: 'ChatGPT Desktop MCP Config',
    code: `{
  "mcpServers": {
    "context-engine": {
      "url": "https://your-cf-worker.workers.dev/mcp",
      "headers": {
        "x-api-key": "ctx_a3f2xxxx"
      }
    }
  }
}`
  },
  Codex: {
    title: 'Codex Desktop — Streamable HTTP',
    code: `Name: context-engine
URL: https://your-cf-worker.workers.dev/mcp
Header: x-api-key: ctx_a3f2xxxx`
  }
}

type SettingsTab = 'API Key' | 'Account' | 'Danger Zone'
const SETTINGS_TABS: SettingsTab[] = ['API Key', 'Account', 'Danger Zone']

export default function SettingsPage() {
  const { toast, showToast, hideToast } = useToast()

  const [settingsTab, setSettingsTab] = useState<SettingsTab>('API Key')
  
  const [keyVisible, setKeyVisible] = useState(false)
  const [keyCopied, setKeyCopied] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  
  const [activeTab, setActiveTab] = useState<Tab>('Claude')

  const [showDeleteInput, setShowDeleteInput] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [passwordVisible, setPasswordVisible] = useState(false)

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText('ctx_a3f2xxxxxxxxxfullkeyhere')
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleSaveAccount = () => {
    showToast({ message: 'Changes saved', type: 'success' })
  }

  return (
    <div className="w-full h-full overflow-y-auto" data-lenis-prevent="true">
      <div className="mx-auto max-w-[680px] px-6 py-10">
        
        <h1 className="font-['rb-freigeist-neue','Bricolage_Grotesque',sans-serif] text-[28px] font-semibold leading-none tracking-[-0.5px] text-[var(--text-primary)] mb-6">
          Settings
        </h1>

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

          <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5">
            <span className="flex-1 font-mono text-[13px] text-[var(--text-primary)]">
              {keyVisible ? 'ctx_a3f2xxxxxxxxxfullkeyhere' : 'ctx_a3f2xxxx••••••••••••••••••••'}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]"
                onClick={handleCopyKey}
              >
                {keyCopied ? <Check className="h-4 w-4 text-[var(--success)]" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]"
                onClick={() => setKeyVisible(!keyVisible)}
              >
                {keyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

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
                  onClick={() => setShowRegenerateConfirm(false)}
                >
                  Yes, regenerate
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3"
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
                onClick={() => setShowRegenerateConfirm(true)}
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Regenerate
              </Button>
            )}
          </div>

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
              title={SNIPPETS[activeTab].title}
              code={SNIPPETS[activeTab].code}
            />
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

          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <h3 className="mb-4 font-sans text-[14px] font-semibold text-[var(--text-primary)]">Change password</h3>
            
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Input label="Current password" type={passwordVisible ? 'text' : 'password'} defaultValue="••••••••" />
                <button 
                  className="absolute right-3 top-[34px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Input label="New password" type={passwordVisible ? 'text' : 'password'} />
              </div>
              <div className="relative">
                <Input label="Confirm new password" type={passwordVisible ? 'text' : 'password'} />
              </div>
            </div>

            <div className="mt-4">
              <Button variant="secondary" className="h-9 px-4">
                Update password
              </Button>
            </div>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
