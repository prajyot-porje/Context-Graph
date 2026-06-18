'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/gsap'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { ContextNode } from '@/types'

interface CreateNodeDialogProps {
  isOpen: boolean
  onClose: () => void
  onNodeCreated: (node: ContextNode) => void
  existingNodes: ContextNode[]
}

export function CreateNodeDialog({
  isOpen,
  onClose,
  onNodeCreated,
  existingNodes,
}: CreateNodeDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [scope, setScope] = useState('')
  const [isScopeEdited, setIsScopeEdited] = useState(false)
  const [parentScope, setParentScope] = useState<string>('')
  const [content, setContent] = useState('')
  
  // Tag input state
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-slugify title to scope if user has not manually edited scope
  useEffect(() => {
    if (!isScopeEdited) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .replace(/\s+/g, '-') // spaces to dashes
        .replace(/-+/g, '-') // collapse consecutive dashes
        .trim()
      setScope(slug)
    }
  }, [title, isScopeEdited])

  // Handle Mount / Unmount animations
  useEffect(() => {
    if (!isOpen) return

    // Reset form states
    setTitle('')
    setScope('')
    setIsScopeEdited(false)
    setParentScope('')
    setContent('')
    setTags([])
    setError(null)

    if (prefersReducedMotion()) {
      gsap.set(overlayRef.current, { opacity: 1 })
      gsap.set(modalRef.current, { y: 0, opacity: 1, scale: 1 })
      return
    }

    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: 'cg-out' }
    )

    gsap.fromTo(modalRef.current,
      { y: -30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'cg-spring', delay: 0.05 }
    )
  }, [isOpen])

  const handleClose = () => {
    if (prefersReducedMotion()) {
      onClose()
      return
    }

    gsap.to(modalRef.current, {
      y: -20,
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: 'cg-in',
    })

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'cg-in',
      onComplete: onClose,
    })
  }

  // Handle Tags Chip Input
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const addTag = () => {
    const cleanTag = tagInput.trim().toLowerCase().replace(/,/g, '')
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!scope.trim()) {
      setError('Scope identifier is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          scope: scope.trim().toLowerCase(),
          parent_scope: parentScope || null,
          content: content.trim(),
          tags,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create context node')
      }

      const { node } = await res.json()
      onNodeCreated(node)
      handleClose()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while creating node'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[500] flex items-start justify-center bg-black/60 backdrop-blur-[6px] px-4 pt-[10vh] overflow-y-auto pb-10"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[520px] rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-6 shadow-[var(--shadow-xl)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-5">
          <div>
            <h3 className="font-['rb-freigeist-neue','Bricolage_Grotesque',sans-serif] text-[20px] font-bold tracking-tight text-[var(--text-primary)]">
              Create Context Node
            </h3>
            <p className="text-body-sm text-[var(--text-secondary)] mt-0.5">
              Add a new logical unit to your portable memory graph.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-[var(--radius-md)] border border-[var(--error)]/30 bg-[rgba(239,68,68,0.07)] p-3 text-[13px] text-[var(--error)]">
              {error}
            </div>
          )}

          {/* Title */}
          <Input
            id="node-title"
            label="Title"
            placeholder="e.g. Current stack, Identity, My Project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            disabled={isLoading}
          />

          {/* Scope */}
          <div className="flex flex-col gap-2">
            <Input
              id="node-scope"
              label="Scope (slug identifier)"
              placeholder="e.g. me, skills, project-alpha"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value)
                setIsScopeEdited(true)
              }}
              required
              disabled={isLoading}
              className="font-mono text-[13px]"
            />
            <span className="text-[11px] text-[var(--text-muted)] mt-[-4px]">
              This matches the scope name used by AI MCP prompts. Alpha-numeric & hyphens only.
            </span>
          </div>

          {/* Parent Scope Selector */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="node-parent"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]"
            >
              Parent Scope (Connection)
            </label>
            <select
              id="node-parent"
              value={parentScope}
              onChange={(e) => setParentScope(e.target.value)}
              disabled={isLoading}
              className="h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border)] px-4 bg-[var(--surface)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
            >
              <option value="">None (Root Tier / ME)</option>
              {existingNodes
                .filter(n => n.scope !== 'me') // typical root
                .map((n) => (
                  <option key={n.id} value={n.scope}>
                    {n.title} ({n.scope})
                  </option>
                ))}
            </select>
            <span className="text-[11px] text-[var(--text-muted)]">
              Connect this node hierarchically. Connects to `me` as fallback if left empty.
            </span>
          </div>

          {/* Content Description */}
          <Textarea
            id="node-content"
            label="Initial Context Content"
            placeholder="State your details, tools, preferences or records for this scope..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            disabled={isLoading}
          />

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  id="node-tags"
                  label="Tags"
                  placeholder="Type a tag and press Enter or comma"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addTag}
                disabled={isLoading}
                className="h-[44px] min-h-[44px] px-4"
              >
                <Plus size={16} />
              </Button>
            </div>

            {/* Render Chip Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-muted)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--accent)]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-[var(--accent)] hover:text-white transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={isLoading}
              className="h-10 px-5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Creating...
                </>
              ) : (
                'Create Node'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
