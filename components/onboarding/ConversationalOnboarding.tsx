'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { authClient } from '@/lib/auth-client'
import s from './ConversationalOnboarding.module.css'

const GraphPreview = dynamic(() => import('./GraphPreview'), { ssr: false })

// ─── Constants ───────────────────────────────────────────────────────────────

const FINALIZE_STEPS = [
  'Analyzing conversation history...',
  'Generating graph structure via AI...',
  'Structuring parent scopes and nodes...',
  'Writing context nodes to database...',
  'Generating secure API key...',
  'Finalizing onboarding...',
]

const ONBOARDING_STEPS = [
  { id: 1, label: 'Identity' },
  { id: 2, label: 'Work' },
  { id: 3, label: 'Projects' },
  { id: 4, label: 'Done' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stripTags = (content: string) =>
  content.replace('[GRAPH_READY]', '').replace('[CHOOSE_PATH]', '').trim()

function renderMessageContent(text: string) {
  const clean = stripTags(text)
  const parts = clean.split(/```/g)
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      const lines = part.split('\n')
      const isLang = /^[a-zA-Z0-9_-]+$/.test(lines[0].trim())
      const code = isLang ? lines.slice(1).join('\n') : part
      return (
        <pre key={index} style={{ background: 'var(--code-surface)', color: 'var(--code-text)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '12px', overflowX: 'auto', margin: '8px 0', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <code>{code.trim()}</code>
        </pre>
      )
    }
    return (
      <span key={index}>
        {part.split('\n').map((line, li) => {
          const boldParts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <span key={li} style={{ display: 'block', minHeight: li > 0 ? '6px' : '0' }}>
              {boldParts.map((bp, bi) => bi % 2 === 1 ? <strong key={bi} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{bp}</strong> : bp)}
            </span>
          )
        })}
      </span>
    )
  })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconImport({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v13M12 16l-4-4M12 16l4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
}
function IconChat({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
}
function IconSend({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
}
function IconArrowLeft({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
}
function IconSpinner({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
}
function IconCheck({ size = 10 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
}
function IconCopy({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}
interface ChoiceBubbleProps {
  selectedPath: 'none' | 'import' | 'manual'
  setSelectedPath: (p: 'none' | 'import' | 'manual') => void
  handleSendMessageText: (t: string) => void
}

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepProgress({ messageCount }: { messageCount: number }) {
  const currentStep = Math.min(Math.floor(messageCount / 1.5) + 1, 4)
  return (
    <nav className={s.steps} aria-label="Onboarding progress">
      {ONBOARDING_STEPS.map((step, i) => {
        const isDone = step.id < currentStep
        const isActive = step.id === currentStep
        return (
          <div key={step.id} className={s.step}>
            <div className={`${s.stepDot} ${isDone ? s.stepDotDone : ''} ${isActive ? s.stepDotActive : ''}`} aria-current={isActive ? 'step' : undefined}>
              {isDone ? <IconCheck size={8} /> : step.id}
            </div>
            <span className={`${s.stepLabel} ${isActive ? s.stepLabelActive : ''}`}>{step.label}</span>
            {i < ONBOARDING_STEPS.length - 1 && <div className={s.stepConnector} aria-hidden="true" />}
          </div>
        )
      })}
    </nav>
  )
}

// ─── Choice Bubble ────────────────────────────────────────────────────────────

function ChoiceBubble({ selectedPath, setSelectedPath, handleSendMessageText }: ChoiceBubbleProps) {
  const [activeTab, setActiveTab] = useState<'chatgpt' | 'claude'>('chatgpt')
  const [copied, setCopied] = useState(false)
  const [chatGptMemory, setChatGptMemory] = useState('')
  const [claudeMemory, setClaudeMemory] = useState('')

  const promptText = `Export a structured summary of what you know about me: my name, current role, primary tech stack/expertise, active projects (name + description), and goals. Output it as clean markdown.`
  const handleCopy = () => { navigator.clipboard.writeText(promptText); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const handlePasteSubmit = () => {
    let finalPayload = ''
    if (chatGptMemory.trim() && claudeMemory.trim()) finalPayload = `Here is my imported AI memory from both ChatGPT and Claude:\n\n### ChatGPT Memory\n${chatGptMemory.trim()}\n\n### Claude Memory\n${claudeMemory.trim()}`
    else if (chatGptMemory.trim()) finalPayload = `Here is my imported AI memory from ChatGPT:\n\n${chatGptMemory.trim()}`
    else if (claudeMemory.trim()) finalPayload = `Here is my imported AI memory from Claude:\n\n${claudeMemory.trim()}`
    else return
    handleSendMessageText(finalPayload)
    setSelectedPath('manual')
  }

  const hasCG = chatGptMemory.trim().length > 0
  const hasCL = claudeMemory.trim().length > 0
  const hasAny = hasCG || hasCL
  let submitLabel = 'Submit memory'
  if (hasCG && hasCL) submitLabel = 'Submit ChatGPT & Claude memories'
  else if (hasCG) submitLabel = 'Submit ChatGPT memory'
  else if (hasCL) submitLabel = 'Submit Claude memory'

  if (selectedPath === 'none') {
    return (
      <div style={{ marginTop: '12px', width: '100%' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Choose how to build your graph:</p>
        <div className={s.pathCards}>
          <button onClick={() => setSelectedPath('import')} type="button" className={s.pathCard}>
            <div className={s.pathCardIcon}><IconImport size={15} /></div>
            <p className={s.pathCardTitle}>Import AI memory</p>
            <p className={s.pathCardDesc}>Paste your ChatGPT or Claude memory to build your graph instantly.</p>
          </button>
          <button onClick={() => { setSelectedPath('manual'); handleSendMessageText("I'd like to build my graph manually.") }} type="button" className={s.pathCard}>
            <div className={s.pathCardIcon}><IconChat size={15} /></div>
            <p className={s.pathCardTitle}>Build manually</p>
            <p className={s.pathCardDesc}>Answer a few quick questions step-by-step with the assistant.</p>
          </button>
        </div>
      </div>
    )
  }

  if (selectedPath === 'import') {
    return (
      <div className={s.importPanel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Import from ChatGPT or Claude</p>
          <button onClick={() => setSelectedPath('none')} type="button" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-geist-sans)' }}>
            <IconArrowLeft size={13} /> Back
          </button>
        </div>
        <div className={s.tabStrip}>
          {(['chatgpt', 'claude'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} type="button" className={`${s.tabBtn} ${activeTab === tab ? s.tabBtnActive : ''}`}>
              {tab === 'chatgpt' ? 'ChatGPT' : 'Claude'}
              {((tab === 'chatgpt' && hasCG) || (tab === 'claude' && hasCL)) && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '2px solid var(--border-strong)', paddingLeft: '16px', marginLeft: '4px' }}>
          {(activeTab === 'chatgpt' ? [
            'Open ChatGPT, click your profile in the bottom-left.',
            <span key="s2">Go to <strong style={{ color: 'var(--text-primary)' }}>Settings</strong> &rarr; <strong style={{ color: 'var(--text-primary)' }}>Personalization</strong> &rarr; <strong style={{ color: 'var(--text-primary)' }}>Manage Memory</strong>.</span>,
            'Copy your memory summary, or use the export prompt below.',
          ] : [
            'Open Claude, click your profile in the bottom-left.',
            <span key="s2">Go to <strong style={{ color: 'var(--text-primary)' }}>Settings</strong> &rarr; <strong style={{ color: 'var(--text-primary)' }}>Custom Instructions</strong>.</span>,
            "Copy your custom instructions, or use the export prompt below.",
          ]).map((step, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '-22px', top: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--card-raised)', border: '1px solid var(--border-strong)', fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</span>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.55' }}>{step}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--code-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-inset)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Export prompt</span>
            <button onClick={handleCopy} type="button" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 500, color: copied ? 'var(--accent)' : 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '3px 8px', cursor: 'pointer', fontFamily: 'var(--font-geist-sans)' }}>
              <IconCopy size={11} />{copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--text-secondary)', lineHeight: '1.55', userSelect: 'all' }}>{promptText}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeTab === 'chatgpt'
            ? <textarea key="chatgpt" value={chatGptMemory} onChange={e => setChatGptMemory(e.target.value)} placeholder="Paste your ChatGPT memory here..." className={s.importTextarea} />
            : <textarea key="claude" value={claudeMemory} onChange={e => setClaudeMemory(e.target.value)} placeholder="Paste your Claude memory or custom instructions here..." className={s.importTextarea} />
          }
          <button onClick={handlePasteSubmit} disabled={!hasAny} type="button" className={`${s.buildBtn} ${hasAny ? s.buildBtnReady : s.buildBtnLoading}`}>{submitLabel}</button>
        </div>
      </div>
    )
  }
  return null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConversationalOnboarding() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi there. I'll ask you a few questions to build your personal context graph. Let's start — what's your name and what do you do?" },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeStep, setFinalizeStep] = useState(0)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<'none' | 'import' | 'manual'>('none')
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const finalizePanelRef = useRef<HTMLDivElement>(null)
  const isCallingAI = useRef(false)

  // GSAP entrance
  useGSAP(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = ['.ob-logo', '.ob-steps', '.ob-heading', '.ob-feed', '.ob-input']
    if (prefersReduced) { gsap.set(targets, { opacity: 1, y: 0 }); return }
    gsap.set(targets, { opacity: 0, y: 20 })
    gsap.to(targets, { opacity: 1, y: 0, duration: 0.7, ease: 'cubic-bezier(0.16,1,0.3,1)', stagger: 0.08, delay: 0.05 })
  }, { scope: containerRef })

  // Finalize overlay entrance
  useEffect(() => {
    if (!isFinalizing || !finalizePanelRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(finalizePanelRef.current, { opacity: 0, scale: 0.95, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'cubic-bezier(0.16,1,0.3,1)' })
  }, [isFinalizing])

  const callAI = useCallback(async (history: Message[]) => {
    isCallingAI.current = true
    setIsStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history.map(m => ({ role: m.role, content: stripTags(m.content) })) }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: full }; return u })
      }
      if (full.includes('[GRAPH_READY]')) setIsReady(true)
    } catch (err) {
      console.error('Streaming error:', err)
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: 'Connection issue. Please try again.' }; return u })
    } finally {
      setIsStreaming(false)
      isCallingAI.current = false
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [])

  const handleSendMessageText = useCallback((text: string) => {
    if (isStreaming || isFinalizing || isCallingAI.current) return
    const newHistory = [...messages, { role: 'user' as const, content: text }]
    setMessages(newHistory)
    callAI(newHistory)
  }, [messages, isStreaming, isFinalizing, callAI])

  const userMessages = messages.filter(m => m.role === 'user')
  const userText = userMessages.map(m => m.content).join(' ')

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming || isFinalizing || isCallingAI.current) return
    const newHistory = [...messages, { role: 'user' as const, content: text }]
    setMessages(newHistory)
    setInput('')
    callAI(newHistory)
  }

  async function handleFinalize() {
    setIsFinalizing(true); setFinalizeStep(0); setFinalizeError(null)
    const intervals = [2500, 3500, 3000, 2500, 2000]
    let current = 0; let timer: ReturnType<typeof setTimeout> | undefined
    const nextStep = () => { if (current < intervals.length) { timer = setTimeout(() => { current++; setFinalizeStep(current); nextStep() }, intervals[current]) } }
    nextStep()
    try {
      const res = await fetch('/api/onboarding/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: messages.map(m => ({ role: m.role, content: stripTags(m.content) })) }),
      })
      if (!res.ok) throw new Error('Graph generation failed. Please try again.')
      const data = await res.json()
      if (data.apiKey) sessionStorage.setItem('cg-new-api-key', data.apiKey)
      await authClient.getSession({ query: { disableCookieCache: true } })
      setFinalizeStep(FINALIZE_STEPS.length)
      window.location.href = '/connect'
    } catch (err: unknown) {
      if (timer) clearTimeout(timer)
      const error = err as Error
      setFinalizeError(error.message || 'Something went wrong. Please try again.')
      setIsFinalizing(false)
    }
  }

  return (
    <div className={s.root} ref={containerRef}>

      {/* ══ LEFT — Chat ══ */}
      <section className={s.chat} aria-label="Onboarding conversation">

        {/* Logo */}
        <div className={`${s.logo} ob-logo`}>
          Context<span className={s.logoAccent}>Graph</span>
        </div>

        {/* Step Progress */}
        <div className="ob-steps">
          <StepProgress messageCount={userMessages.length} />
        </div>

        {/* Heading */}
        <div className={`${s.heading} ob-heading`}>
          <h1>Build your context graph</h1>
          <p>Answer a few questions. We&apos;ll generate your personal AI context graph — structured, private, and always yours.</p>
        </div>

        {/* Message Feed */}
        <div className={`${s.feed} ob-feed`} data-lenis-prevent="true" role="log" aria-live="polite">
          {messages.map((msg, i) => {
            const isLatest = i === messages.length - 1
            const hasChoosePath = msg.content.includes('[CHOOSE_PATH]') || (i === 2 && msg.role === 'assistant' && messages.length === 3)
            const isUser = msg.role === 'user'
            const isMemoryImport = isUser && msg.content.startsWith('Here is my imported AI memory')
            const isLongUserMsg = isUser && !isMemoryImport && msg.content.length > 400
            const isExpanded = !!expandedMessages[i]
            const cleanText = stripTags(msg.content)
            const hasActualContent = cleanText.length > 0
            const isFallbackAssistantMsg = msg.role === 'assistant' && !hasActualContent && !isStreaming
            const shouldRenderBubble = hasActualContent || isStreaming || isFallbackAssistantMsg

            return (
              <div key={i}>
                {isMemoryImport ? (
                  <div className={`${s.msgRow} ${s.msgRowUser}`}>
                    <div className={s.memoryCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}><IconImport size={14} /></span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Imported AI memory</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {msg.content.includes('ChatGPT Memory') && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--badge-default-bg)', color: 'var(--text-secondary)', fontWeight: 500, border: '1px solid var(--border)' }}>ChatGPT</span>}
                          {msg.content.includes('Claude Memory') && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--badge-default-bg)', color: 'var(--text-secondary)', fontWeight: 500, border: '1px solid var(--border)' }}>Claude</span>}
                        </div>
                      </div>
                      {isExpanded && <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', maxHeight: '280px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono), monospace', lineHeight: '1.55' }}>{msg.content}</div>}
                      <button onClick={() => setExpandedMessages(prev => ({ ...prev, [i]: !prev[i] }))} type="button" style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)' }}>
                        {isExpanded ? 'Hide details \u2191' : 'Show details \u2193'}
                      </button>
                    </div>
                  </div>
                ) : isLongUserMsg ? (
                  <div className={`${s.msgRow} ${s.msgRowUser}`}>
                    <div className={`${s.bubble} ${s.bubbleUser}`}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{isExpanded ? msg.content : msg.content.substring(0, 220) + '\u2026'}</div>
                      <button onClick={() => setExpandedMessages(prev => ({ ...prev, [i]: !prev[i] }))} type="button" style={{ marginTop: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-geist-sans)' }}>
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    </div>
                  </div>
                ) : shouldRenderBubble ? (
                  <div className={`${s.msgRow} ${msg.role === 'user' ? s.msgRowUser : s.msgRowAssistant}`}>
                    <div className={`${s.bubble} ${msg.role === 'user' ? s.bubbleUser : s.bubbleAssistant}`}>
                      {msg.content === '' && isStreaming ? (
                        <div className={s.thinkingDots} aria-label="Thinking">
                          <div className={s.thinkingDot} />
                          <div className={s.thinkingDot} />
                          <div className={s.thinkingDot} />
                        </div>
                      ) : (
                        <>
                          {renderMessageContent(isFallbackAssistantMsg ? 'Your information has been collected. Click below to generate your graph.' : msg.content)}
                          {isStreaming && isLatest && msg.role === 'assistant' && msg.content !== '' && (
                            <span style={{ display: 'inline-block', width: '2px', height: '13px', background: 'var(--text-muted)', marginLeft: '3px', verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }}>
                              <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : null}

                {hasChoosePath && isLatest && !isStreaming && (
                  <ChoiceBubble selectedPath={selectedPath} setSelectedPath={setSelectedPath} handleSendMessageText={handleSendMessageText} />
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Build CTA */}
        {isReady && (
          <div style={{ marginBottom: '16px' }}>
            <button onClick={handleFinalize} disabled={isFinalizing} type="button" className={`${s.buildBtn} ${isFinalizing ? s.buildBtnLoading : s.buildBtnReady}`}>
              {isFinalizing ? <><IconSpinner size={15} /> Building your graph&hellip;</> : 'Generate my graph \u2192'}
            </button>
            {!isFinalizing && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center', fontFamily: 'var(--font-geist-sans)' }}>Or keep chatting to add more context first</p>}
          </div>
        )}

        {finalizeError && <p role="alert" style={{ fontSize: '13px', color: 'var(--error)', marginBottom: '12px', lineHeight: '1.5', fontFamily: 'var(--font-geist-sans)' }}>{finalizeError}</p>}

        {/* Input */}
        <div className={`${s.inputRow} ob-input`}>
          <input
            ref={inputRef}
            id="cg-onboarding-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={isStreaming ? 'Waiting for response\u2026' : 'Type your answer\u2026'}
            disabled={isStreaming || isFinalizing}
            className={s.input}
            aria-label="Your answer"
            autoComplete="off"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || isFinalizing}
            type="button"
            aria-label="Send message"
            className={`${s.sendBtn} ${input.trim() && !isStreaming && !isFinalizing ? s.sendBtnActive : ''}`}
          >
            {isStreaming ? <IconSpinner size={15} /> : <IconSend size={15} />}
          </button>
        </div>
      </section>

      {/* ══ RIGHT — Graph ══ */}
      <aside className={s.graph} aria-label="Context graph preview">
        <div className={s.graphContent}>
          <GraphPreview messageCount={userMessages.length} userText={userText} />
        </div>
      </aside>

      {/* ══ Finalize overlay ══ */}
      {isFinalizing && (
        <div className={s.finalizeOverlay} role="dialog" aria-modal="true" aria-label="Building your graph">
          <div className={s.finalizeCard} ref={finalizePanelRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--accent)' }}><IconSpinner size={18} /></span>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px', fontFamily: 'var(--font-display-fallback), "Bricolage Grotesque", sans-serif' }}>
                Building your graph
              </h2>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, fontFamily: 'var(--font-geist-sans)' }}>
              Our models are structuring your context into a personal knowledge graph. This takes about 15 seconds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              {FINALIZE_STEPS.map((step, idx) => {
                const isCompleted = finalizeStep > idx
                const isCurrent = finalizeStep === idx
                return (
                  <div key={idx} className={s.finalizeStepRow} style={{ color: isCompleted ? 'var(--text-primary)' : isCurrent ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isCurrent ? 500 : 400 }}>
                    <span className={`${s.finalizeStepIcon} ${isCompleted ? s.finalizeStepDone : isCurrent ? s.finalizeStepActive : s.finalizeStepPending}`}>
                      {isCompleted && <IconCheck size={8} />}
                    </span>
                    <span style={{ opacity: isCompleted ? 0.65 : 1 }}>{step}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
