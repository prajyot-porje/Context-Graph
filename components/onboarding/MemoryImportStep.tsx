'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { WizardData } from './wizard-types'
import s from './OnboardingWizard.module.css'

interface ParsedMemory {
  name?: string
  role?: string
  location?: string
  skills?: string[]
  stack?: string[]
  projects?: { name: string; description: string; status: string }[]
  goals?: string
  workingStyle?: string
  agencyName?: string
}

const VALID_STATUSES = ['active', 'paused', 'shipped'] as const

function IconArrowLeft({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
}
function IconCopy({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
}
function IconSpinner({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={s.spinner}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
}

const EXPORT_PROMPT = `Export a structured summary of what you know about me: my name, current role, primary tech stack/expertise, active projects (name + description), and goals. Output it as clean markdown.`

interface Props {
  onParsed: (patch: Partial<WizardData>) => void
  onBack: () => void
}

export default function MemoryImportStep({ onParsed, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'chatgpt' | 'claude'>('chatgpt')
  const [chatGptMemory, setChatGptMemory] = useState('')
  const [claudeMemory, setClaudeMemory] = useState('')
  const [copied, setCopied] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState('')

  const handleCopy = () => {
    navigator.clipboard.writeText(EXPORT_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasAny = chatGptMemory.trim().length > 0 || claudeMemory.trim().length > 0

  const handleParse = async () => {
    setIsParsing(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding/parse-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatgpt: chatGptMemory, claude: claudeMemory }),
      })
      const data = (await res.json()) as { parsed?: ParsedMemory; error?: string }
      if (!res.ok) throw new Error(data.error || 'Could not read that memory export')

      const parsed = data.parsed ?? {}
      const patch: Partial<WizardData> = {}
      if (parsed.name) patch.name = parsed.name
      if (parsed.role) patch.role = parsed.role
      if (parsed.location) patch.location = parsed.location
      if (parsed.skills?.length) patch.skills = parsed.skills
      if (parsed.stack?.length) patch.stack = parsed.stack
      if (parsed.goals) patch.goals = parsed.goals
      if (parsed.workingStyle) patch.workingStyle = parsed.workingStyle
      if (parsed.agencyName) { patch.agencyName = parsed.agencyName; patch.hasAgency = true }
      if (parsed.projects?.length) {
        patch.projects = parsed.projects.slice(0, 3).map(p => ({
          name: p.name ?? '',
          description: p.description ?? '',
          status: (VALID_STATUSES as readonly string[]).includes(p.status) ? (p.status as WizardData['projects'][number]['status']) : 'active',
        }))
      }
      onParsed(patch)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — you can still fill this in manually.')
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <div className={s.importPanel} style={{ marginTop: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Import from ChatGPT or Claude</p>
        <button onClick={onBack} type="button" className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
          <IconArrowLeft size={13} /> Back
        </button>
      </div>

      <div className={s.tabStrip}>
        {(['chatgpt', 'claude'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} type="button" className={`${s.tabBtn} ${activeTab === tab ? s.tabBtnActive : ''}`}>
            {tab === 'chatgpt' ? 'ChatGPT' : 'Claude'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '2px solid var(--border-strong)', paddingLeft: '16px', marginLeft: '4px' }}>
        {(activeTab === 'chatgpt' ? [
          'Open ChatGPT, click your profile in the bottom-left.',
          <span key="s2">Go to <b>Settings</b> &rarr; <b>Personalization</b> &rarr; <b>Manage Memory</b>.</span>,
          'Copy your memory summary, or use the export prompt below.',
        ] : [
          'Open Claude, click your profile in the bottom-left.',
          <span key="s2">Go to <b>Settings</b> &rarr; <b>Custom Instructions</b>.</span>,
          'Copy your custom instructions, or use the export prompt below.',
        ]).map((step, idx) => (
          <p key={idx} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.55' }}>{idx + 1}. {step}</p>
        ))}
      </div>

      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--code-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-inset)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Export prompt</span>
          <button onClick={handleCopy} type="button" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: copied ? 'var(--accent)' : 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '3px 8px', cursor: 'pointer' }}>
            <IconCopy size={11} />{copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-secondary)', lineHeight: '1.55' }}>{EXPORT_PROMPT}</p>
      </div>

      {activeTab === 'chatgpt'
        ? <textarea value={chatGptMemory} onChange={e => setChatGptMemory(e.target.value)} placeholder="Paste your ChatGPT memory here…" className={s.importTextarea} />
        : <textarea value={claudeMemory} onChange={e => setClaudeMemory(e.target.value)} placeholder="Paste your Claude memory or custom instructions here…" className={s.importTextarea} />
      }

      {error && <p role="alert" style={{ fontSize: '12.5px', color: 'var(--error)' }}>{error}</p>}

      <Button type="button" variant="accent" className="w-full" disabled={!hasAny || isParsing} onClick={handleParse}>
        {isParsing ? <><IconSpinner /> Reading your memory…</> : 'Parse & continue'}
      </Button>
    </div>
  )
}
