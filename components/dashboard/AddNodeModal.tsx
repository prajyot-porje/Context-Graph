'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { X, Loader2 } from 'lucide-react'
import type { ContextNode } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: (node: ContextNode) => void
  existingNodes: ContextNode[]
}

export function AddNodeModal({ isOpen, onClose, onCreated, existingNodes }: Props) {
  const [mounted, setMounted] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [parentScope, setParentScope] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scope auto-generation (computed from title + parentScope, no state needed)
  function slugify(str: string) {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const generatedScope = title
    ? parentScope
      ? `${parentScope}/${slugify(title)}`
      : slugify(title)
    : ''

  // Sync open state to mounted
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setTitle('')
      setParentScope('')
      setContent('')
      setTagsInput('')
      setError(null)
    }
  }, [isOpen])

  // Play entrance animation when mounted
  useGSAP(() => {
    if (mounted && isOpen) {
      if (prefersReducedMotion()) {
        gsap.set(backdropRef.current, { opacity: 1 })
        gsap.set(modalRef.current, { y: 0, opacity: 1 })
        return
      }
      // Backdrop fade in
      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      )
      // Modal slide up
      gsap.fromTo(modalRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'cg-out' }
      )
    }
  }, [mounted, isOpen])

  // Play exit animation and then notify parent
  const handleClose = useCallback(() => {
    if (prefersReducedMotion()) {
      setMounted(false)
      onClose()
      return
    }
    const tl = gsap.timeline({
      onComplete: () => {
        setMounted(false)
        onClose()
      }
    })
    tl.to(modalRef.current, { y: 20, opacity: 0, duration: 0.25, ease: 'cg-in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0.05)
  }, [onClose])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          scope: generatedScope,
          content: content.trim(),
          tags,
          parent_scope: parentScope || null,
          relevance: 0.8,
        })
      })

      if (!res.ok) {
        const text = await res.text()
        let parsedErr = 'Failed to create node.'
        try {
          const json = JSON.parse(text)
          parsedErr = json.error || parsedErr
        } catch {
          parsedErr = text || parsedErr
        }
        throw new Error(parsedErr)
      }

      const responseJson = await res.json()
      // The API response might wrap the node in a `{ node: ContextNode }` object or return it directly
      const newNode: ContextNode = responseJson.node || responseJson
      
      onCreated(newNode)
      handleClose()
      // reset
      setTitle('')
      setParentScope('')
      setContent('')
      setTagsInput('')
      setError(null)
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err.message || 'Failed to create node.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) return null

  // Inputs, select, and textarea consistent style rules
  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--border-strong, rgba(255, 255, 255, 0.14))',
    borderRadius: '6px',
    background: 'var(--bg, #080808)',
    color: 'var(--text-primary, #F0F0F0)',
    fontSize: '13px',
    fontFamily: 'var(--font-geist, sans-serif)',
    outline: 'none',
    transition: 'border-color 150ms ease',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-secondary, #888888)',
    marginBottom: '6px',
  }

  return (
    <div
      ref={backdropRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          borderRadius: '14px',
          border: '1px solid var(--border-strong, rgba(255, 255, 255, 0.14))',
          background: 'linear-gradient(180deg, var(--card-raised, #202020) 0%, var(--card, #181818) 100%)',
          padding: '24px',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))', paddingBottom: '14px' }}>
          <h3 style={{
            margin: 0,
            fontFamily: "var(--font-display, 'rb-freigeist-neue', 'Bricolage Grotesque', sans-serif)",
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary, #F0F0F0)',
          }}>
            Add Context Node
          </h3>
          <button
            onClick={handleClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #484848)',
              cursor: 'pointer',
              transition: 'color 100ms ease, background-color 100ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. ContextGraph"
              required
              autoFocus
              disabled={isSubmitting}
              style={fieldStyle}
              onFocus={e => e.target.style.borderColor = '#b3ec13'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
            
            {/* Scope preview */}
            <p style={{ fontSize: '11px', color: 'var(--text-muted, #484848)', marginTop: '6px', marginBottom: 0 }}>
              Scope: <code style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border)' }}>{generatedScope || '—'}</code>
            </p>
          </div>

          {/* Parent node */}
          <div>
            <label style={labelStyle}>Parent node (optional)</label>
            <select
              value={parentScope}
              onChange={e => setParentScope(e.target.value)}
              disabled={isSubmitting}
              style={{ ...fieldStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#b3ec13'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            >
              <option value="">No parent (root node)</option>
              {existingNodes.map(n => (
                <option key={n.id} value={n.scope}>
                  {n.title} ({n.scope})
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label style={labelStyle}>Context content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe this context in detail. The more you write, the better your AI understands it."
              required
              disabled={isSubmitting}
              style={{ ...fieldStyle, minHeight: '120px', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#b3ec13'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="nextjs, typescript, saas"
              disabled={isSubmitting}
              style={fieldStyle}
              onFocus={e => e.target.style.borderColor = '#b3ec13'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ color: 'var(--error, #EF4444)', fontSize: '13px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'end', gap: '12px', borderTop: '1px solid var(--border, rgba(255,255,255,0.07))', paddingTop: '16px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #888888)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '10px',
                transition: 'color 100ms ease, background-color 100ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'var(--accent, #b3ec13)',
                color: 'var(--on-accent, #000000)',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                padding: '10px 20px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'opacity 100ms ease',
              }}
              onMouseEnter={e => {
                if (!isSubmitting) e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={e => {
                if (!isSubmitting) e.currentTarget.style.opacity = '1'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Node'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
