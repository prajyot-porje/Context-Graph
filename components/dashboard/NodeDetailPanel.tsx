'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { ContextNode, ContextEntry } from '@/types'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGraph } from '@/components/providers/GraphProvider'
import { computeDepths } from '@/lib/graph-utils'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/auth-client'

// ── Inline thin-line SVGs (no Lucide) ─────────────────────────────────────────

function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconPencil({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconTrash({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function IconLoader({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function IconCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconPlus({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface NodeDetailPanelProps {
  node: ContextNode
  isClosing?: boolean
  onClose: () => void
  onClosed?: () => void
  onNodeUpdate: (id: string, updates: Partial<ContextNode>) => void
  onNodeDelete: (id: string) => void
}

export function NodeDetailPanel({
  node,
  isClosing,
  onClose,
  onClosed,
  onNodeUpdate,
  onNodeDelete,
}: NodeDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  const { nodes } = useGraph()
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [supabaseClient] = useState(() => createBrowserSupabaseClient())

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editTitle, setEditTitle] = useState(node.title)
  const [editScope, setEditScope] = useState(node.scope)
  const [editParentScope, setEditParentScope] = useState(node.parent_scope || '')
  const [editContent, setEditContent] = useState(node.content)
  const [editTags, setEditTags] = useState<string[]>(node.tags || [])
  const [newTagInput, setNewTagInput] = useState('')

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [entries, setEntries] = useState<ContextEntry[]>([])
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)
  const [panelLoading, setPanelLoading] = useState(false)
  const [now, setNow] = useState<number | null>(null)

  const nodeDepth = useMemo(() => {
    const withDepths = computeDepths(nodes)
    const matched = withDepths.find(n => n.id === node.id)
    return matched ? matched.depth : 0
  }, [nodes, node.id])

  const nodeTierName = useMemo(() => {
    if (nodeDepth === 0) return 'Root Context'
    if (nodeDepth === 1) return 'Agency Scope'
    return 'Project Scope'
  }, [nodeDepth])

  // Reset on node change
  useEffect(() => {
    setPanelLoading(true)
    setIsEditing(false)
    setEditTitle(node.title)
    setEditScope(node.scope)
    setEditParentScope(node.parent_scope || '')
    setEditContent(node.content)
    setEditTags(node.tags || [])
    setNewTagInput('')
    setIsConfirmingDelete(false)
    setNow(Date.now())
  }, [node])

  // Fetch entries
  useEffect(() => {
    setIsLoadingEntries(true)
    fetch(`/api/context/${node.id}/entries`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries || [])
        setIsLoadingEntries(false)
        setPanelLoading(false)
      })
      .catch(err => {
        console.error('Failed to load entries:', err)
        setIsLoadingEntries(false)
        setPanelLoading(false)
      })
  }, [node.id])

  // Real-time entries subscription
  useEffect(() => {
    if (!userId) return
    const channel = supabaseClient
      .channel(`dashboard-realtime-entries-${node.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'context_entries',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new.node_id === node.id) {
          setEntries(prev => {
            if (prev.some(e => e.id === payload.new.id)) return prev
            return [payload.new as ContextEntry, ...prev]
          })
        }
      })
      .subscribe()

    return () => { supabaseClient.removeChannel(channel) }
  }, [node.id, userId, supabaseClient])

  // Panel slide animation
  useEffect(() => {
    if (!panelRef.current) return
    if (isClosing) {
      if (prefersReducedMotion()) { onClosed?.(); return }
      gsap.to(panelRef.current, { x: 400, opacity: 0, duration: 0.22, ease: 'cg-in', onComplete: () => onClosed?.() })
    } else {
      if (prefersReducedMotion()) {
        gsap.set(panelRef.current, { x: 0, opacity: 1 })
      } else {
        gsap.fromTo(panelRef.current, { x: 400, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'cg-spring' })
      }
    }
  }, [isClosing, onClosed])

  // Entries stagger animation
  useEffect(() => {
    if (isClosing || isLoadingEntries || !panelRef.current) return
    if (prefersReducedMotion()) {
      gsap.set(gsap.utils.toArray('.timeline-item', panelRef.current), { opacity: 1, x: 0 })
      return
    }
    const raf = requestAnimationFrame(() => {
      if (!panelRef.current) return
      const items = gsap.utils.toArray<Element>('.timeline-item', panelRef.current)
      if (items.length === 0) return
      gsap.fromTo(items, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.25, ease: 'cg-out', stagger: 0.04, delay: 0.1 })
    })
    return () => cancelAnimationFrame(raf)
  }, [node.id, isClosing, isLoadingEntries])

  const handleSave = async () => {
    if (!editTitle.trim() || !editScope.trim()) return
    setIsSaving(true)
    try {
      const updates = {
        title: editTitle.trim(),
        scope: editScope.trim().toLowerCase(),
        parent_scope: editParentScope || null,
        content: editContent.trim(),
        tags: editTags,
      }
      const res = await fetch(`/api/context/${node.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) { onNodeUpdate(node.id, updates); setIsEditing(false) }
      else console.error('Failed to save context updates')
    } catch (err) {
      console.error('Failed to save node:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditTitle(node.title)
    setEditScope(node.scope)
    setEditParentScope(node.parent_scope || '')
    setEditContent(node.content)
    setEditTags(node.tags || [])
    setNewTagInput('')
    setIsEditing(false)
  }

  const handleDeleteNode = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/context/${node.id}`, { method: 'DELETE' })
      if (res.ok) onNodeDelete(node.id)
      else console.error('Failed to delete node')
    } catch (err) {
      console.error('Failed to delete node:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return dateStr }
  }

  const getRelativeTime = (dateStr: string) => {
    if (!now) return ''
    const diffMs = now - new Date(dateStr).getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffMonths = Math.floor(diffDays / 30)
    if (diffSecs < 60) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    return `${diffMonths}mo ago`
  }

  // Relevance color — token-based
  const relevanceColor =
    node.relevance >= 0.7 ? 'var(--accent)' :
    node.relevance >= 0.4 ? 'var(--warning)' :
    'var(--text-muted)'

  return (
    <div
      ref={panelRef}
      className="cg-detail-panel relative flex h-full w-[360px] sm:w-[380px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-xl)' }}
    >
      {panelLoading ? (
        <div className="p-5 flex flex-col gap-3.5">
          <Skeleton height={20} width="55%" />
          <Skeleton height={10} width="35%" />
          <div style={{ height: '1px', background: 'var(--border)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton height={9} width="45%" />
              <Skeleton height={24} width="38%" />
              <Skeleton height={3} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton height={9} width="50%" />
              <Skeleton height={14} width="60%" />
              <Skeleton height={10} width="38%" />
            </div>
          </div>
          <div style={{ height: '1px', background: 'var(--border)' }} />
          <Skeleton height={9} width="28%" />
          <Skeleton height={80} />
          <div style={{ height: '1px', background: 'var(--border)' }} />
          <Skeleton height={9} width="32%" />
          <Skeleton height={55} />
          <Skeleton height={45} />
        </div>
      ) : (
        <>
          {/* ── HEADER ── */}
          <div className="shrink-0 border-b border-[var(--border)] px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-[var(--text-primary)] truncate" title={node.title}>
                  {node.title}
                </h2>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.07em] text-[var(--text-muted)]">
                  {nodeTierName}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-[background-color,color] duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-primary)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              >
                <IconX size={14} />
              </button>
            </div>

            {/* Scope + tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                {node.scope}
              </span>
              {node.tags && node.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ── METADATA STRIP ── */}
          <div className="shrink-0 grid grid-cols-2 border-b border-[var(--border)]">
            {/* Relevance */}
            <div className="flex flex-col justify-center px-5 py-4">
              <span className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[var(--text-muted)]">
                Relevance
              </span>
              <span
                className="mt-1 text-[22px] font-bold leading-none tracking-tight"
                style={{ color: relevanceColor }}
              >
                {Math.round(node.relevance * 100)}%
              </span>
              {/* Thin bar */}
              <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${node.relevance * 100}%`,
                    background: relevanceColor,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Last updated */}
            <div className="flex flex-col justify-center border-l border-[var(--border)] px-5 py-4">
              <span className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[var(--text-muted)]">
                Last Updated
              </span>
              <span className="mt-1 text-[13px] font-medium leading-snug text-[var(--text-primary)]">
                {formatDate(node.last_updated)}
              </span>
              <span className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                {getRelativeTime(node.last_updated)}
              </span>
            </div>
          </div>

          {/* ── SCROLLABLE AREA ── */}
          <div className="flex-1 overflow-y-auto" data-lenis-prevent="true">

            {/* Context section */}
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[var(--text-muted)]">
                  Context
                </span>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[11px] text-[var(--text-muted)] underline underline-offset-2 decoration-[var(--border-strong)] hover:text-[var(--text-secondary)] hover:decoration-[var(--text-muted)] transition-[color] duration-100 cursor-pointer focus-visible:outline-none"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-[color] duration-100 cursor-pointer focus-visible:outline-none"
                  >
                    <IconPencil size={11} />
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Title</label>
                    <Input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      disabled={isSaving}
                      placeholder="Node title"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Scope</label>
                    <Input
                      value={editScope}
                      onChange={e => setEditScope(e.target.value)}
                      disabled={isSaving}
                      placeholder="e.g. me, agency, agency/project"
                      className="font-mono text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Content</label>
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      disabled={isSaving}
                      rows={5}
                      placeholder="Context content..."
                    />
                  </div>
                  {/* Tags */}
                  <div>
                    <label className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editTags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                        >
                          {tag}
                          <button
                            onClick={() => setEditTags(prev => prev.filter(t => t !== tag))}
                            className="text-[var(--text-muted)] hover:text-[var(--error)] transition-[color] duration-100 cursor-pointer focus-visible:outline-none"
                          >
                            <IconX size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newTagInput.trim()) {
                            e.preventDefault()
                            const tag = newTagInput.trim().toLowerCase()
                            if (!editTags.includes(tag)) setEditTags(prev => [...prev, tag])
                            setNewTagInput('')
                          }
                        }}
                        placeholder="Add tag + Enter"
                        disabled={isSaving}
                        className="text-[12px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const tag = newTagInput.trim().toLowerCase()
                          if (tag && !editTags.includes(tag)) setEditTags(prev => [...prev, tag])
                          setNewTagInput('')
                        }}
                        className="flex h-[44px] w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                      >
                        <IconPlus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] leading-[1.65] text-[var(--text-secondary)] whitespace-pre-wrap">
                  {node.content || (
                    <span className="italic text-[var(--text-muted)]">
                      No context content. Click Edit to add details.
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Decisions Log section */}
            <div className="px-5 py-4 pb-8">
              <span className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[var(--text-muted)]">
                Decisions Log
              </span>

              <div className="mt-4">
                {isLoadingEntries ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton height={40} />
                    <Skeleton height={40} width="90%" />
                    <Skeleton height={40} width="80%" />
                  </div>
                ) : entries.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-[12px] text-[var(--text-muted)] leading-[1.7]">
                      No decisions saved yet.<br />
                      Use{' '}
                      <code className="font-mono text-[11px] text-[var(--text-secondary)]">/save</code>
                      {' '}at the end of an AI session.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-5">
                    {/* Timeline line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '7px',
                        top: '6px',
                        bottom: '6px',
                        width: '1px',
                        background: 'var(--border)',
                      }}
                    />
                    <div className="flex flex-col gap-4">
                      {entries.map(entry => {
                        const dotColor =
                          entry.score >= 0.8 ? 'var(--accent)' :
                          entry.score >= 0.5 ? 'var(--warning)' :
                          'var(--text-muted)'
                        return (
                          <div key={entry.id} className="relative timeline-item opacity-0">
                            {/* Dot */}
                            <div style={{
                              position: 'absolute',
                              left: '-20px',
                              top: '5px',
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: dotColor,
                              boxShadow: entry.score >= 0.8 ? '0 0 6px rgba(179,236,19,0.25)' : 'none',
                            }} />
                            <p className="text-[12.5px] leading-[1.6] text-[var(--text-secondary)]">
                              {entry.entry_text}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                              <span>{formatDate(entry.created_at)}</span>
                              <span>·</span>
                              <span>score {entry.score.toFixed(2)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── STICKY FOOTER ── */}
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3 flex items-center justify-between">
            {isConfirmingDelete ? (
              <>
                <span className="text-[12px] text-[var(--text-secondary)]">
                  Delete this node?
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-[12px]"
                    disabled={isDeleting}
                    onClick={() => setIsConfirmingDelete(false)}
                  >
                    Cancel
                  </Button>
                  <button
                    className="flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--error)] px-3 text-[12px] font-medium text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--error)]"
                    disabled={isDeleting}
                    onClick={handleDeleteNode}
                  >
                    {isDeleting ? <IconLoader size={12} /> : 'Confirm Delete'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--error)] transition-[color] duration-150 cursor-pointer focus-visible:outline-none"
                >
                  <IconTrash size={12} />
                  Delete
                </button>

                {isEditing && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-8 px-4 text-[12px] font-medium active:scale-[0.97]"
                    disabled={isSaving}
                    onClick={handleSave}
                  >
                    {isSaving ? <IconLoader size={12} /> : 'Save'}
                  </Button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
