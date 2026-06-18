'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { X, Pencil, Trash2, Loader2, Calendar, Hash, Network, Plus, Check } from 'lucide-react'
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

  // Full form edit states
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

  // Compute node depth tier
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

  // Reset states when node changes
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

  // Fetch entries for selected node
  useEffect(() => {
    setIsLoadingEntries(true)
    fetch(`/api/context/${node.id}/entries`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || [])
        setIsLoadingEntries(false)
        setPanelLoading(false)
      })
      .catch((err) => {
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'context_entries',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new.node_id === node.id) {
            setEntries(prev => {
              if (prev.some(e => e.id === payload.new.id)) return prev
              return [payload.new as ContextEntry, ...prev]
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✓ Real-time dashboard entries connected')
        }
      })

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [node.id, userId, supabaseClient])

  // Mount/Unmount Animations
  useEffect(() => {
    if (!panelRef.current) return

    if (isClosing) {
      if (prefersReducedMotion()) {
        onClosed?.()
        return
      }
      gsap.to(panelRef.current, {
        x: 400,
        opacity: 0,
        duration: 0.22,
        ease: 'cg-in',
        onComplete: () => onClosed?.()
      })
    } else {
      if (prefersReducedMotion()) {
        gsap.set(panelRef.current, { x: 0, opacity: 1 })
      } else {
        gsap.fromTo(panelRef.current,
          { x: 400, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, ease: 'cg-spring' }
        )
      }
    }
  }, [isClosing, onClosed])

  // Entries Animation
  useEffect(() => {
    if (isClosing) return

    if (prefersReducedMotion()) {
      gsap.set('.timeline-item', { opacity: 1, x: 0 })
      return
    }

    if (!isLoadingEntries) {
      gsap.fromTo('.timeline-item',
        { opacity: 0, x: 10 },
        { opacity: 1, x: 0, duration: 0.25, ease: 'cg-out', stagger: 0.04, delay: 0.15 }
      )
    }
  }, [node.id, isClosing, isLoadingEntries])

  const handleSave = async () => {
    if (!editTitle.trim()) return
    if (!editScope.trim()) return

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
        body: JSON.stringify(updates)
      })

      if (res.ok) {
        onNodeUpdate(node.id, updates)
        setIsEditing(false)
      } else {
        console.error('Failed to save context updates')
      }
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
      const res = await fetch(`/api/context/${node.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        onNodeDelete(node.id)
      } else {
        console.error('Failed to delete node')
      }
    } catch (err) {
      console.error('Failed to delete node:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const getRelativeTime = (dateStr: string) => {
    if (!now) return 'Calculating...'
    const diffMs = now - new Date(dateStr).getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffSecs < 60) return 'Just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
  }

  return (
    <div
      ref={panelRef}
      className="cg-detail-panel relative flex h-full w-[380px] sm:w-[400px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-[16px] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-xl)' }}
    >
      {panelLoading ? (
        <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <Skeleton height={22} width="58%" />
          <Skeleton height={11} width="38%" />
          <div style={{ height:'1px', background:'var(--border)' }} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              <Skeleton height={10} width="50%" />
              <Skeleton height={26} width="40%" />
              <Skeleton height={3} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              <Skeleton height={10} width="55%" />
              <Skeleton height={16} width="65%" />
              <Skeleton height={11} width="40%" />
            </div>
          </div>
          <div style={{ height:'1px', background:'var(--border)' }} />
          <Skeleton height={10} width="30%" />
          <Skeleton height={90} />
          <div style={{ height:'1px', background:'var(--border)' }} />
          <Skeleton height={10} width="35%" />
          <Skeleton height={60} />
          <Skeleton height={50} />
        </div>
      ) : (
        <>
      {/* SECTION 1 — HEADER (fixed) */}
      <div 
        className="shrink-0 border-b border-[var(--border)]"
        style={{ padding: '20px 20px 14px 20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 
            className="font-sans text-[18px] font-bold leading-tight text-[var(--text-primary)] max-w-[280px] truncate"
            title={node.title}
          >
            {node.title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-full p-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.05]"
            style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }}
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
          </Button>
        </div>

        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <div 
            style={{
              background: 'var(--card-raised)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '2px 10px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              {node.scope}
            </span>
          </div>
          {node.tags && node.tags.map(tag => (
            <div 
              key={tag}
              style={{
                background: 'var(--card-raised)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '2px 10px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 — METADATA STRIP (fixed) */}
      <div 
        className="shrink-0 border-b border-[var(--border)]"
        style={{
          padding: '14px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0px'
        }}
      >
        {/* Left cell — RELEVANCE */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span 
            style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            RELEVANCE
          </span>
          <span 
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: node.relevance >= 0.7 ? '#b3ec13' : node.relevance >= 0.4 ? '#f59e0b' : 'var(--text-muted)',
              marginTop: '2px',
              lineHeight: 1
            }}
          >
            {Math.round(node.relevance * 100)}%
          </span>
          <div 
            style={{
              width: '100%',
              height: '3px',
              borderRadius: '2px',
              marginTop: '6px',
              background: 'var(--border)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${node.relevance * 100}%`,
                background: node.relevance >= 0.7 ? '#b3ec13' : node.relevance >= 0.4 ? '#f59e0b' : 'var(--text-muted)',
                borderRadius: '2px',
                transition: 'width 0.6s ease'
              }}
            />
          </div>
        </div>

        {/* Right cell — LAST UPDATED */}
        <div 
          style={{
            borderLeft: '1px solid var(--border)',
            paddingLeft: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <span 
            style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            LAST UPDATED
          </span>
          <span 
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginTop: '2px',
              lineHeight: 1.2
            }}
          >
            {formatDate(node.last_updated)}
          </span>
          <span 
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}
          >
            {getRelativeTime(node.last_updated)}
          </span>
        </div>
      </div>

      {/* SCROLL AREA (Sections 3 & 4) */}
      <div 
        className="flex-1 overflow-y-auto"
        data-lenis-prevent="true"
      >
        {/* SECTION 3 — CONTEXT */}
        <div 
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span 
              style={{
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)'
              }}
            >
              CONTEXT
            </span>
            {isEditing ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  fontSize: '12px',
                  color: 'var(--accent)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer'
                }}
                className="hover:underline"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  fontSize: '12px',
                  color: 'var(--accent)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer'
                }}
                className="hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          <div style={{ marginTop: '10px' }}>
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={isSaving}
                style={{
                  width: '100%',
                  minHeight: '140px',
                  fontSize: '13px',
                  lineHeight: '1.65',
                  background: 'var(--bg)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  resize: 'vertical',
                  outline: 'none',
                  color: 'var(--text-primary)'
                }}
                className="focus:border-[var(--accent)]"
              />
            ) : (
              <p 
                style={{
                  fontSize: '13px',
                  lineHeight: '1.65',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {node.content || <span className="italic text-[var(--text-muted)]">No context content provided. Edit node to add details.</span>}
              </p>
            )}
          </div>
        </div>

        {/* SECTION 4 — DECISIONS LOG */}
        <div 
          style={{
            padding: '16px 20px 24px 20px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <span 
            style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)'
            }}
          >
            DECISIONS LOG
          </span>

          <div style={{ marginTop: '16px' }}>
            {isLoadingEntries ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                Loading decisions feed...
              </div>
            ) : entries.length === 0 ? (
              <div style={{ padding:'20px 0', textAlign:'center' }}>
                <p style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-geist, sans-serif)', lineHeight:1.7 }}>
                  No decisions saved yet.<br/>
                  <span style={{ fontFamily:'var(--font-mono, monospace)', fontSize:'11px' }}>/save</span>
                  {' '}at the end of any AI session to log progress here.
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '20px' }} className="timeline-container">
                {/* Vertical Line */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '7px',
                    top: '4px',
                    bottom: '4px',
                    width: '1px',
                    background: 'var(--border)'
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {entries.map((entry) => {
                    const dotColor = entry.score >= 0.8 ? '#b3ec13' : entry.score >= 0.5 ? '#f59e0b' : 'var(--text-muted)'
                    return (
                      <div key={entry.id} style={{ position: 'relative' }} className="timeline-item opacity-0">
                        {/* Timeline dot */}
                        <div 
                          style={{
                            position: 'absolute',
                            left: '-20px',
                            marginTop: '4px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: dotColor
                          }}
                        />
                        
                        {/* Entry text */}
                        <p 
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5
                          }}
                        >
                          {entry.entry_text}
                        </p>

                        {/* Meta row */}
                        <div 
                          style={{
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            marginTop: '4px'
                          }}
                        >
                          {formatDate(entry.created_at)} · Score: {entry.score.toFixed(2)}
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

      {/* SECTION 5 — STICKY FOOTER */}
      <div 
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'var(--card)',
          borderTop: '1px solid var(--border)',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        className="shrink-0"
      >
        {isConfirmingDelete ? (
          <>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              Delete this node?
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-[12px]"
                disabled={isDeleting}
                onClick={() => setIsConfirmingDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="h-8 px-3 text-[12px] bg-[#ef4444] text-white hover:bg-[#ef4444]/90 border-none rounded-[6px]"
                disabled={isDeleting}
                onClick={handleDeleteNode}
              >
                {isDeleting ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Confirm Delete'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              style={{
                fontSize: '12px',
                color: '#ef4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              className="hover:opacity-85"
              onClick={() => setIsConfirmingDelete(true)}
            >
              <Trash2 size={13} style={{ width: '13px', height: '13px' }} />
              Delete
            </button>

            {isEditing && (
              <Button
                variant="accent"
                size="sm"
                className="h-8 px-4 text-[12px] font-medium"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Save'}
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

