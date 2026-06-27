'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { authClient } from '@/lib/auth-client'

const GraphPreview = dynamic(() => import('./GraphPreview'), { ssr: false })

const FINALIZE_STEPS = [
  'Analyzing conversation history...',
  'Generating graph structure via AI...',
  'Structuring parent scopes and nodes...',
  'Writing context nodes to database...',
  'Generating secure API keys...',
  'Finalizing onboarding...',
]

const display = (content: string) => content.replace('[GRAPH_READY]', '').trim()

const renderMessageContent = (text: string) => {
  let cleanText = text.replace('[GRAPH_READY]', '').replace('[CHOOSE_PATH]', '').trim();

  // If this is the paths choice message, strip the raw text explaining Path A & B
  // since the UI renders visual cards instead.
  if (text.includes('[CHOOSE_PATH]')) {
    const pathAIndex = cleanText.search(/Path\s*A/i);
    if (pathAIndex !== -1) {
      cleanText = cleanText.substring(0, pathAIndex).trim();
      // Remove trailing choice header if present
      cleanText = cleanText.replace(/Choose\s+a\s+path\s+to\s+get\s+started:?$/i, '').trim();
    }
  }

  const parts = cleanText.split(/```/g);
  
  return parts.map((part, index) => {
    // Code block
    if (index % 2 === 1) {
      const lines = part.split('\n');
      const firstLine = lines[0].trim();
      const isLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
      const code = isLang ? lines.slice(1).join('\n') : part;

      return (
        <pre key={index} style={{
          background: 'var(--code-surface)',
          color: 'var(--code-text)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '13px',
          overflowX: 'auto',
          margin: '8px 0',
          border: '1px solid var(--border)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          <code>{code.trim()}</code>
        </pre>
      );
    }

    // Regular text (with bold support)
    const lines = part.split('\n');
    return (
      <span key={index}>
        {lines.map((line, lineIdx) => {
          const boldParts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <span key={lineIdx} style={{ display: 'block', minHeight: lineIdx > 0 ? '6px' : '0' }}>
              {boldParts.map((bPart, bIdx) => {
                if (bIdx % 2 === 1) {
                  return <strong key={bIdx} style={{ color: 'var(--accent)', fontWeight: 600 }}>{bPart}</strong>;
                }
                return bPart;
              })}
            </span>
          );
        })}
      </span>
    );
  });
};

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChoiceBubbleProps {
  selectedPath: 'none' | 'import' | 'manual'
  setSelectedPath: (path: 'none' | 'import' | 'manual') => void
  handleSendMessageText: (text: string) => void
}

function ChoiceBubble({ selectedPath, setSelectedPath, handleSendMessageText }: ChoiceBubbleProps) {
  const [activeTab, setActiveTab] = useState<'chatgpt' | 'claude'>('chatgpt')
  const [copied, setCopied] = useState(false)
  const [chatGptMemory, setChatGptMemory] = useState('')
  const [claudeMemory, setClaudeMemory] = useState('')

  const promptText = `Export a structured summary of what you know about me: my name, current role, primary tech stack/expertise, active projects (name + description), and goals. Output it as clean markdown.`

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePasteSubmit = () => {
    let finalPayload = ''
    if (chatGptMemory.trim() && claudeMemory.trim()) {
      finalPayload = `Here is my imported AI memory from both ChatGPT and Claude:\n\n### ChatGPT Memory\n${chatGptMemory.trim()}\n\n### Claude Memory\n${claudeMemory.trim()}`
    } else if (chatGptMemory.trim()) {
      finalPayload = `Here is my imported AI memory from ChatGPT:\n\n${chatGptMemory.trim()}`
    } else if (claudeMemory.trim()) {
      finalPayload = `Here is my imported AI memory from Claude:\n\n${claudeMemory.trim()}`
    } else {
      return
    }

    handleSendMessageText(finalPayload)
    setSelectedPath('manual')
  }

  const hasChatGptValue = chatGptMemory.trim().length > 0
  const hasClaudeValue = claudeMemory.trim().length > 0
  const hasAnyValue = hasChatGptValue || hasClaudeValue

  let submitButtonText = 'Submit Memory'
  if (hasChatGptValue && hasClaudeValue) {
    submitButtonText = 'Submit ChatGPT & Claude Memories'
  } else if (hasChatGptValue) {
    submitButtonText = 'Submit ChatGPT Memory'
  } else if (hasClaudeValue) {
    submitButtonText = 'Submit Claude Memory'
  }

  if (selectedPath === 'none') {
    return (
      <div className="flex flex-col gap-4 mt-3 w-full animate-fade-in">
        <p className="text-[var(--text-primary)] text-[13.5px] font-sans">
          Choose a path to get started:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A: Import */}
          <button
            onClick={() => setSelectedPath('import')}
            type="button"
            className="flex flex-col items-start text-left p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] [box-shadow:var(--shadow-sm),var(--shadow-inset)] cursor-pointer hover:border-[var(--accent)] hover:[box-shadow:var(--shadow-accent)] hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚡</span>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)] font-sans">Import AI Memory</h3>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed font-sans">
              Import existing memory from ChatGPT or Claude to build your graph instantly. Recommended if you already use AI.
            </p>
          </button>

          {/* Card B: Manual */}
          <button
            onClick={() => {
              setSelectedPath('manual')
              handleSendMessageText("I'd like to build my graph manually.")
            }}
            type="button"
            className="flex flex-col items-start text-left p-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] [box-shadow:var(--shadow-sm),var(--shadow-inset)] cursor-pointer hover:border-[var(--accent)] hover:[box-shadow:var(--shadow-accent)] hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💬</span>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)] font-sans">Build Manually</h3>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed font-sans">
              Have a quick 2-minute chat with the onboarding assistant to gather your details step-by-step.
            </p>
          </button>
        </div>
      </div>
    )
  }

  if (selectedPath === 'import') {
    return (
      <div className="flex flex-col gap-4 mt-3 w-full p-6 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface)] [box-shadow:var(--shadow-md),var(--shadow-inset)] animate-fade-in">
        <div className="flex justify-between items-center">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)] font-sans">Import from ChatGPT or Claude</h3>
          <button
            onClick={() => setSelectedPath('none')}
            type="button"
            className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex gap-2 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('chatgpt')}
            type="button"
            className={`min-h-11 px-4 text-[12px] font-semibold cursor-pointer transition-colors duration-150 border-b-2 flex items-center gap-2 ${
              activeTab === 'chatgpt'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>ChatGPT</span>
            {hasChatGptValue && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" title="Memory pasted" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('claude')}
            type="button"
            className={`min-h-11 px-4 text-[12px] font-semibold cursor-pointer transition-colors duration-150 border-b-2 flex items-center gap-2 ${
              activeTab === 'claude'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Claude</span>
            {hasClaudeValue && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" title="Memory pasted" />
            )}
          </button>
        </div>

        {/* Step-by-step UI */}
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] font-semibold text-[var(--text-primary)] font-sans">Follow these steps:</p>
          <div className="flex flex-col gap-3 border-l border-[var(--border-strong)] pl-4 ml-2">
            {activeTab === 'chatgpt' ? (
              <>
                <div className="relative">
                  <span className="absolute -left-[25px] top-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--card-raised)] border border-[var(--border-strong)] text-[10px] font-bold text-[var(--accent)]">
                    1
                  </span>
                  <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-sans">
                    Open ChatGPT. In the bottom-left or top-right corner, click on your profile/name.
                  </p>
                </div>
                <div className="relative mt-1">
                  <span className="absolute -left-[25px] top-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--card-raised)] border border-[var(--border-strong)] text-[10px] font-bold text-[var(--accent)]">
                    2
                  </span>
                  <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-sans">
                    Go to <strong className="text-[var(--text-primary)] font-semibold">Settings</strong> → <strong className="text-[var(--text-primary)] font-semibold">Personalization</strong> → <strong className="text-[var(--text-primary)] font-semibold">Manage Memory</strong>.
                  </p>
                </div>
                <div className="relative mt-1">
                  <span className="absolute -left-[25px] top-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--card-raised)] border border-[var(--border-strong)] text-[10px] font-bold text-[var(--accent)]">
                    3
                  </span>
                  <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-sans">
                    Read and copy your memory profile summary. If it's empty, copy the prompt below and ask ChatGPT to summarize you.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <span className="absolute -left-[25px] top-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--card-raised)] border border-[var(--border-strong)] text-[10px] font-bold text-[var(--accent)]">
                    1
                  </span>
                  <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-sans">
                    Open Claude. In the bottom-left corner, click your profile picture/name.
                  </p>
                </div>
                <div className="relative mt-1">
                  <span className="absolute -left-[25px] top-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--card-raised)] border border-[var(--border-strong)] text-[10px] font-bold text-[var(--accent)]">
                    2
                  </span>
                  <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-sans">
                    Go to <strong className="text-[var(--text-primary)] font-semibold">Settings</strong> → <strong className="text-[var(--text-primary)] font-semibold">Custom Instructions</strong>.
                  </p>
                </div>
                <div className="relative mt-1">
                  <span className="absolute -left-[25px] top-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[var(--card-raised)] border border-[var(--border-strong)] text-[10px] font-bold text-[var(--accent)]">
                    3
                  </span>
                  <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-sans">
                    Copy your custom instructions. If you don't use them, copy the prompt below and ask Claude to describe your profile.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Copy Prompt Card */}
        <div className="flex flex-col gap-2 p-4 rounded-[var(--radius-md)] bg-[var(--code-surface)] border border-[var(--border)] [box-shadow:var(--shadow-inset)]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Export Prompt</span>
            <button
              onClick={handleCopy}
              type="button"
              className="text-[11px] font-medium cursor-pointer transition-colors duration-150 text-[var(--text-primary)] bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] px-2.5 py-1 rounded-[var(--radius-xs)] border border-[var(--border)]"
            >
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
          <p className="text-[12px] font-mono text-[var(--text-secondary)] leading-relaxed select-all">
            {promptText}
          </p>
        </div>

        {/* Paste Area */}
        <div className="flex flex-col gap-2">
          {activeTab === 'chatgpt' ? (
            <textarea
              key="chatgpt-textarea"
              value={chatGptMemory}
              onChange={e => setChatGptMemory(e.target.value)}
              placeholder="Paste your ChatGPT memory details here..."
              className="w-full min-h-[120px] p-3 rounded-[var(--radius-md)] bg-[var(--card)] border border-[var(--border)] text-[var(--text-primary)] text-[13px] font-sans placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:[box-shadow:var(--shadow-accent)] transition-[border-color,box-shadow] duration-150 resize-y"
            />
          ) : (
            <textarea
              key="claude-textarea"
              value={claudeMemory}
              onChange={e => setClaudeMemory(e.target.value)}
              placeholder="Paste your Claude custom instructions or memory details here..."
              className="w-full min-h-[120px] p-3 rounded-[var(--radius-md)] bg-[var(--card)] border border-[var(--border)] text-[var(--text-primary)] text-[13px] font-sans placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:[box-shadow:var(--shadow-accent)] transition-[border-color,box-shadow] duration-150 resize-y"
            />
          )}
          
          <button
            onClick={handlePasteSubmit}
            disabled={!hasAnyValue}
            type="button"
            className={`min-h-11 w-full rounded-[var(--radius-md)] text-[13.5px] font-bold cursor-pointer transition-[background-color,color] duration-150 text-center flex items-center justify-center ${
              hasAnyValue
                ? 'bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-soft)]'
                : 'bg-[var(--card-raised)] text-[var(--text-disabled)] cursor-not-allowed border border-[var(--border)]'
            }`}
          >
            {submitButtonText}
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default function ConversationalOnboarding() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'll ask you a few quick questions to build your context graph. What's your name and what do you do?"
    }
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
  const router = useRouter()
  const isCallingAI = useRef(false)

  const callAI = useCallback(async (history: Message[]) => {
    isCallingAI.current = true
    setIsStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    
    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: history.map(m => ({
            role: m.role,
            content: display(m.content)
          }))
        })
      })
      
      if (!res.ok || !res.body) throw new Error('Stream failed')
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: full }
          return updated
        })
      }
      
      if (full.includes('[GRAPH_READY]')) {
        setIsReady(true)
      }
      
    } catch (err) {
      console.error('Streaming error:', err)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I had trouble connecting. Please try sending your message again.'
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      isCallingAI.current = false
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [])

  const handleSendMessageText = useCallback((text: string) => {
    if (isStreaming || isFinalizing || isCallingAI.current) return
    const userMsg: Message = { role: 'user', content: text }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    callAI(newHistory)
  }, [messages, isStreaming, isFinalizing, callAI])

  const userMessages = messages.filter(m => m.role === 'user')
  const userText = userMessages.map(m => m.content).join(' ')

  const autoScroll = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    autoScroll()
  }, [messages, autoScroll])

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming || isFinalizing || isCallingAI.current) return
    const userMsg: Message = { role: 'user', content: text }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    callAI(newHistory)
  }

  async function handleFinalize() {
    setIsFinalizing(true)
    setFinalizeStep(0)
    setFinalizeError(null)

    // Start timer for simulated steps
    const intervals = [2500, 3500, 3000, 2500, 2000] // duration for each step in ms
    let current = 0
    let timer: NodeJS.Timeout | undefined = undefined

    const nextStep = () => {
      if (current < intervals.length) {
        timer = setTimeout(() => {
          current++
          setFinalizeStep(current)
          nextStep()
        }, intervals[current])
      }
    }
    nextStep()

    try {
      const res = await fetch('/api/onboarding/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages.map(m => ({ role: m.role, content: display(m.content) }))
        })
      })
      if (!res.ok) throw new Error('Graph generation failed. Please try again.')
      const data = await res.json()
      
      if (data.apiKey) {
        sessionStorage.setItem('cg-new-api-key', data.apiKey)
      }
      
      // Force Better Auth to update session cookies so the middleware sees onboarding_done = true
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
    <div className="cg-onboarding-grid" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 380px',
      width: '100%',
      minHeight: '100vh',
    }}>

      {/* ——— LEFT: Chat ——— */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '40px 48px',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        
        {/* Logo */}
        <div style={{ marginBottom: '36px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "var(--font-display-fallback)" }}>
            Context<span style={{ color: 'var(--accent)' }}>Graph</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          fontFamily: "var(--font-display-fallback)",
          marginBottom: '4px',
          color: 'var(--text-primary)'
        }}>
          Build your context graph
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '28px',
          fontFamily: 'var(--font-geist-sans)',
          lineHeight: '1.6',
        }}>
          Answer a few quick questions. We&apos;ll generate your personal AI context graph.
        </p>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '20px',
          paddingRight: '4px',
        }} data-lenis-prevent="true">
          {messages.map((msg, i) => {
            const isLatest = i === messages.length - 1
            const hasChoosePath = msg.content.includes('[CHOOSE_PATH]') || (i === 2 && msg.role === 'assistant' && messages.length === 3)
            
            const isUser = msg.role === 'user'
            const isMemoryImport = isUser && msg.content.startsWith('Here is my imported AI memory')
            const isLongUserMsg = isUser && !isMemoryImport && msg.content.length > 400
            const isExpanded = !!expandedMessages[i]

            const cleanText = msg.content.replace('[GRAPH_READY]', '').replace('[CHOOSE_PATH]', '').trim()
            const hasActualContent = cleanText.length > 0
            const isFallbackAssistantMsg = msg.role === 'assistant' && !hasActualContent && !isStreaming
            const shouldRenderBubble = hasActualContent || isStreaming || isFallbackAssistantMsg

            return (
              <div key={i} className="flex flex-col gap-2">
                <div style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {isMemoryImport ? (
                    // Special Memory Import Slab Card
                    <div style={{
                      maxWidth: '80%',
                      padding: '16px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--card)',
                      border: '1px solid var(--border-strong)',
                      boxShadow: 'var(--shadow-sm), var(--shadow-inset)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-geist-sans)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--accent)', fontSize: '16px' }}>⚡</span>
                          <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Imported AI Memory</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {msg.content.includes('ChatGPT Memory') && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--accent-muted)',
                              color: 'var(--accent)',
                              fontWeight: 500,
                            }}>
                              ChatGPT
                            </span>
                          )}
                          {msg.content.includes('Claude Memory') && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--accent-muted)',
                              color: 'var(--accent)',
                              fontWeight: 500,
                            }}>
                              Claude
                            </span>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{
                          borderTop: '1px solid var(--border)',
                          paddingTop: '12px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'var(--font-geist-mono), monospace',
                        }}>
                          {msg.content}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedMessages(prev => ({ ...prev, [i]: !prev[i] }))}
                        type="button"
                        style={{
                          alignSelf: 'flex-start',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--accent)',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? 'Hide Raw Details ↑' : 'Show Raw Details ↓'}
                      </button>
                    </div>
                  ) : isLongUserMsg ? (
                    // Truncated General Long User Message
                    <div style={{
                      maxWidth: '80%',
                      padding: '11px 16px',
                      borderRadius: '16px 16px 4px 16px',
                      background: 'var(--accent)',
                      color: 'var(--on-accent)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      fontFamily: 'var(--font-geist-sans)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {isExpanded ? msg.content : msg.content.substring(0, 200) + '...'}
                      </div>
                      <button
                        onClick={() => setExpandedMessages(prev => ({ ...prev, [i]: !prev[i] }))}
                        type="button"
                        style={{
                          alignSelf: 'flex-start',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--on-accent)',
                          opacity: 0.85,
                          textDecoration: 'underline',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    </div>
                  ) : shouldRenderBubble ? (
                    // Default Message Bubble (User / Assistant)
                    <div style={{
                      maxWidth: '80%',
                      padding: '11px 16px',
                      borderRadius: msg.role === 'user'
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'var(--accent)' : 'var(--card)',
                      color: msg.role === 'user' ? 'var(--on-accent)' : 'var(--text-primary)',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      fontFamily: 'var(--font-geist-sans)',
                      border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                      boxShadow: msg.role === 'assistant' ? 'var(--shadow-sm), var(--shadow-inset)' : 'none',
                    }}>
                      {msg.content === '' && isStreaming ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '20px' }}>
                          <span className="cg-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
                          <span className="cg-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animationDelay: '0.2s' }} />
                          <span className="cg-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animationDelay: '0.4s' }} />
                        </div>
                      ) : (
                        <>
                          {renderMessageContent(isFallbackAssistantMsg ? "I have successfully analyzed your information. Click 'Build my graph' below to generate your personalized context graph." : msg.content)}
                          {isStreaming && isLatest && msg.role === 'assistant' && msg.content !== '' && (
                            <span style={{
                              display: 'inline-block',
                              width: '2px',
                              height: '13px',
                              background: 'var(--accent)',
                              marginLeft: '3px',
                              verticalAlign: 'text-bottom',
                              animation: 'cg-blink 1s step-end infinite',
                            }} />
                          )}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
                {/* Render visual choices outside the bubble if it is the active path selection step */}
                {hasChoosePath && isLatest && !isStreaming && (
                  <ChoiceBubble
                    selectedPath={selectedPath}
                    setSelectedPath={setSelectedPath}
                    handleSendMessageText={handleSendMessageText}
                  />
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Build graph button */}
        {isReady && (
          <div style={{ marginBottom: '14px' }}>
            <button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="cg-btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                background: isFinalizing ? 'var(--card-raised)' : 'var(--accent)',
                color: isFinalizing ? 'var(--text-secondary)' : 'var(--on-accent)',
                border: isFinalizing ? '1px solid var(--border)' : 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isFinalizing ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-geist-sans)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isFinalizing ? (
                <>
                  <Loader2 size={16} className="cg-spin text-[var(--accent)]" />
                  Building your graph...
                </>
              ) : (
                'Build my graph →'
              )}
            </button>
            {!isFinalizing && (
              <p style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginTop: '6px',
                textAlign: 'center',
                fontFamily: 'var(--font-geist-sans)',
                lineHeight: '1.6',
              }}>
                Or keep chatting to add more context first
              </p>
            )}
          </div>
        )}
        
        {finalizeError && (
          <p style={{
            fontSize: '12px',
            color: 'var(--error)',
            marginBottom: '10px',
            fontFamily: 'var(--font-geist-sans)',
            lineHeight: '1.6',
          }}>
            {finalizeError}
          </p>
        )}

        {/* Input row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={isStreaming ? 'Waiting...' : 'Type your answer...'}
            disabled={isStreaming || isFinalizing}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              background: 'var(--card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'var(--font-geist-sans)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || isFinalizing}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: (input.trim() && !isStreaming) ? 'var(--accent)' : 'var(--card)',
              cursor: (input.trim() && !isStreaming) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
          >
            {isStreaming ? (
              <Loader2 size={16} className="cg-spin text-[var(--text-secondary)]" />
            ) : (
              <Send size={16} className={input.trim() && !isStreaming ? 'text-[var(--on-accent)]' : 'text-[var(--text-muted)]'} />
            )}
          </button>
        </div>
      </div>

      {/* ——— RIGHT: Graph preview ——— */}
      <div className="cg-onboarding-preview" style={{
        padding: '40px 28px',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <GraphPreview
          messageCount={userMessages.length}
          userText={userText}
        />
      </div>

      {isFinalizing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 8, 8, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            background: 'linear-gradient(to bottom, var(--card-raised), var(--card))',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg), var(--shadow-inset)',
            width: '100%',
            maxWidth: '440px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            fontFamily: 'var(--font-geist, sans-serif)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Loader2 size={20} className="cg-spin text-[var(--accent)]" />
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}>
                Building Your Graph
              </h2>
            </div>
            
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              margin: 0,
            }}>
              Please wait while our models structure your conversation history into a personal knowledge graph and secure your API keys.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderTop: '1px solid var(--border)',
              paddingTop: '20px',
            }}>
              {FINALIZE_STEPS.map((step, idx) => {
                const isCompleted = finalizeStep > idx
                const isCurrent = finalizeStep === idx
                
                return (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    fontSize: '13px',
                    color: isCompleted ? 'var(--text-primary)' : isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 600 : 400,
                    transition: 'color 0.25s ease',
                  }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isCompleted ? 'none' : isCurrent ? '1.5px solid var(--accent)' : '1.5px solid var(--text-disabled)',
                      background: isCompleted ? 'var(--accent)' : 'none',
                      color: isCompleted ? '#000' : 'inherit',
                      fontSize: '9px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {isCompleted ? '✓' : ''}
                    </span>
                    <span style={{ opacity: isCompleted ? 0.7 : 1 }}>{step}</span>
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
