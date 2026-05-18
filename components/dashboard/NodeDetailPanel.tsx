'use client'

import { useRef, useState, useEffect } from 'react'
import { X, Pencil, Trash2 } from 'lucide-react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { MockNode } from '@/lib/mock-data'
import { mockEntries } from '@/lib/mock-entries'

interface NodeDetailPanelProps {
  node: MockNode
  isClosing?: boolean
  onClose: () => void
  onClosed?: () => void
  onNodeUpdate: (id: string, updates: Partial<MockNode>) => void
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
  const barRef = useRef<HTMLDivElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(node.content)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset states when node changes
  useEffect(() => {
    setIsEditing(false)
    setEditContent(node.content)
    setShowDeleteConfirm(false)
  }, [node.id, node.content])

  // Mount/Unmount Animations
  useEffect(() => {
    if (!panelRef.current) return

    if (isClosing) {
      if (prefersReducedMotion()) {
        onClosed?.()
        return
      }
      gsap.to(panelRef.current, {
        x: 320,
        opacity: 0,
        duration: 0.2,
        ease: 'cg-in',
        onComplete: () => onClosed?.()
      })
    } else {
      if (prefersReducedMotion()) {
        gsap.set(panelRef.current, { x: 0, opacity: 1 })
      } else {
        gsap.fromTo(panelRef.current,
          { x: 320, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, ease: 'cg-spring' }
        )
      }
    }
  }, [isClosing, onClosed])

  // Relevance Bar & Entries Animation (Only on mount/change)
  useEffect(() => {
    if (isClosing || !barRef.current) return

    if (prefersReducedMotion()) {
      gsap.set(barRef.current, { width: `${node.relevance * 100}%` })
      gsap.set('.entry-item', { opacity: 1, y: 0 })
      return
    }

    gsap.fromTo(barRef.current,
      { width: '0%' },
      { width: `${node.relevance * 100}%`, duration: 0.8, ease: 'cg-out', delay: 0.3 }
    )

    gsap.fromTo('.entry-item',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.2, ease: 'cg-out', stagger: 0.04, delay: 0.25 }
    )
  }, [node.id, node.relevance, isClosing])

  const handleSave = () => {
    onNodeUpdate(node.id, { content: editContent })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(node.content)
    setIsEditing(false)
  }

  const entries = mockEntries[node.id] || []

  return (
    <div
      ref={panelRef}
      className="relative flex h-full w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)]"
      data-lenis-prevent="true"
    >
      {/* PANEL HEADER */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <h2 className="font-['rb-freigeist-neue','Bricolage_Grotesque',sans-serif] text-[18px] font-bold leading-none tracking-tight text-[var(--text-primary)] max-w-[220px] truncate">
          {node.title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* SCOPE BADGE */}
      <div className="border-b border-[var(--border)] px-5 pb-4">
        <div className="inline-block rounded-full bg-[var(--accent-muted)] px-2.5 py-[3px] font-mono text-[11px] text-[var(--accent)]">
          {node.scope}
        </div>
      </div>

      {/* RELEVANCE SECTION */}
      <div className="border-b border-[var(--border)] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          RELEVANCE SCORE
        </p>
        <p className="mt-1 font-['rb-freigeist-neue','Bricolage_Grotesque',sans-serif] text-[28px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
          {Math.round(node.relevance * 100)}%
        </p>

        <div className="mt-[10px] h-1 w-full rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
          <div
            ref={barRef}
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent)_0%,rgba(179,236,19,0.6)_100%)] w-0"
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">Last updated</span>
          <span className="text-[11px] text-[var(--text-secondary)]">2 days ago</span>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="border-b border-[var(--border)] px-5 py-4 relative group">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            CONTEXT
          </p>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px] px-2"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="mr-1.5 h-3 w-3" />
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 flex flex-col gap-3">
            <textarea
              className="min-h-[100px] w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-colors"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSave} className="h-8">
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-8">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-[13px] leading-[1.6] text-[var(--text-secondary)]">
            {node.content}
          </p>
        )}
      </div>

      {/* DECISIONS LOG SECTION */}
      <div className="px-5 py-4 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-3">
          DECISIONS LOG
        </p>

        <div className="flex flex-col">
          {entries.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No recent decisions.</p>
          ) : (
            entries.map((entry, idx) => {
              const isAccent = entry.score >= 0.8
              const isWarn = entry.score >= 0.6 && entry.score < 0.8
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "entry-item py-2.5 flex flex-col gap-1 opacity-0",
                    idx !== entries.length - 1 && "border-b border-[var(--border)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-[7px] py-[2px] font-sans text-[10px] font-medium leading-none",
                      isAccent && "bg-[var(--accent-muted)] text-[var(--accent)]",
                      isWarn && "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]",
                      !isAccent && !isWarn && "bg-[rgba(255,255,255,0.07)] text-[var(--text-secondary)]"
                    )}>
                      {entry.score.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {entry.created_at}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                    {entry.entry_text}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="sticky bottom-0 mt-auto border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3">
        {showDeleteConfirm ? (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">Remove this node?</p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 bg-[var(--error)] text-white hover:bg-[var(--error)]/90"
                onClick={() => {
                  onNodeDelete(node.id)
                  // The parent handles closing after deletion
                }}
              >
                Yes, delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="md"
            className="w-full justify-center border border-[rgba(239,68,68,0.2)] text-[var(--error)] hover:bg-[rgba(239,68,68,0.05)] hover:text-[var(--error)]"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete node
          </Button>
        )}
      </div>
    </div>
  )
}
