'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const GraphPreview = dynamic(() => import('./GraphPreview'), { ssr: false })

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ConversationalOnboarding() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const userMessages = messages.filter(m => m.role === 'user')
  const userText = userMessages.map(m => m.content).join(' ')

  const display = (content: string) => content.replace('[GRAPH_READY]', '').trim()

  const autoScroll = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    autoScroll()
  }, [messages, autoScroll])

  const callAI = useCallback(async (history: Message[]) => {
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
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [])

  // Trigger initial message on mount
  useEffect(() => {
    callAI([])
  }, [callAI])

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming || isFinalizing) return
    const userMsg: Message = { role: 'user', content: text }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    callAI(newHistory)
  }

  async function handleFinalize() {
    setIsFinalizing(true)
    setFinalizeError(null)
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
      
      router.push('/connect')
    } catch (err: unknown) {
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
        borderRight: '1px solid var(--border, rgba(255, 255, 255, 0.07))',
        background: 'var(--bg, #080808)',
      }}>
        
        {/* Logo */}
        <div style={{ marginBottom: '36px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "var(--font-display)" }}>
            Context<span style={{ color: '#b3ec13' }}>Graph</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          marginBottom: '4px',
          color: 'var(--text-primary, #F0F0F0)'
        }}>
          Build your context graph
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary, #888888)',
          marginBottom: '28px',
          fontFamily: 'var(--font-geist)',
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
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '11px 16px',
                borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#b3ec13' : 'var(--card, #181818)',
                color: msg.role === 'user' ? '#000' : 'var(--text-primary, #F0F0F0)',
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'var(--font-geist)',
                border: msg.role === 'assistant' ? '1px solid var(--border, rgba(255, 255, 255, 0.07))' : 'none',
              }}>
                {display(msg.content)}
                {isStreaming && i === messages.length - 1 && msg.role === 'assistant' && (
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '13px',
                    background: '#b3ec13',
                    marginLeft: '3px',
                    verticalAlign: 'text-bottom',
                    animation: 'cg-blink 1s step-end infinite',
                  }} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Build graph button */}
        {isReady && !isFinalizing && (
          <div style={{ marginBottom: '14px' }}>
            <button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="cg-btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--accent, #b3ec13)',
                color: 'var(--on-accent, #000)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-geist)',
              }}
            >
              Build my graph →
            </button>
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary, #888888)',
              marginTop: '6px',
              textAlign: 'center',
              fontFamily: 'var(--font-geist)',
              lineHeight: '1.6',
            }}>
              Or keep chatting to add more context first
            </p>
          </div>
        )}
        
        {finalizeError && (
          <p style={{
            fontSize: '12px',
            color: 'var(--error, #ef4444)',
            marginBottom: '10px',
            fontFamily: 'var(--font-geist)',
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
              border: '1px solid var(--border-strong, rgba(255, 255, 255, 0.14))',
              background: 'var(--card, #181818)',
              color: 'var(--text-primary, #F0F0F0)',
              fontSize: '14px',
              fontFamily: 'var(--font-geist)',
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
              border: '1px solid var(--border, rgba(255, 255, 255, 0.07))',
              background: (input.trim() && !isStreaming) ? '#b3ec13' : 'var(--card, #181818)',
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
              <Send size={16} color={input.trim() ? '#000' : 'rgba(255,255,255,0.3)'} />
            )}
          </button>
        </div>
      </div>

      {/* ——— RIGHT: Graph preview ——— */}
      <div className="cg-onboarding-preview" style={{
        padding: '40px 28px',
        background: 'var(--surface, #111111)',
        borderLeft: '1px solid var(--border, rgba(255, 255, 255, 0.07))',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <GraphPreview
          messageCount={userMessages.length}
          userText={userText}
          isFinalizing={isFinalizing}
        />
      </div>

    </div>
  )
}
