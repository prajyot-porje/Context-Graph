'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGraph } from '@/components/providers/GraphProvider'
import { gsap } from '@/lib/gsap'

interface Props {
  isOpen: boolean
  onClose: () => void
}

// Premium loading skeleton shimmer bars
const Skeleton = () => (
  <div className="space-y-3 animate-pulse py-2">
    <div className="h-4 bg-[var(--border-strong)] rounded w-3/4 opacity-60" />
    <div className="h-4 bg-[var(--border-strong)] rounded w-5/6 opacity-40" />
    <div className="h-4 bg-[var(--border-strong)] rounded w-2/3 opacity-30" />
    <div className="h-4 bg-[var(--border-strong)] rounded w-1/2 opacity-20" />
    <div className="h-4 bg-[var(--border-strong)] rounded w-4/5 opacity-10" />
  </div>
)

export function ContextPreviewModal({ isOpen, onClose }: Props) {
  const { nodes } = useGraph()
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(isOpen)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [selectedScope, setSelectedScope] = useState('me')
  const [assembledData, setAssembledData] = useState<{ assembled: string; tokenEstimate: number; nodeCount: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Track document theme
  useEffect(() => {
    const getTheme = () => (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
    setTheme(getTheme())
    const handleThemeChange = () => setTheme(getTheme())
    window.addEventListener('cg-theme-change', handleThemeChange)
    return () => window.removeEventListener('cg-theme-change', handleThemeChange)
  }, [])

  // Derive available scopes from nodes dynamically
  const scopes = useMemo(() => {
    const unique = new Set<string>()
    nodes.forEach(n => {
      if (n.scope) unique.add(n.scope)
    })
    const list = Array.from(unique)
    // Put 'me' first if present
    if (list.includes('me')) {
      return ['me', ...list.filter(s => s !== 'me')]
    }
    return list
  }, [nodes])

  // Sync open state to mounted
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    }
  }, [isOpen])

  // Play entrance animation when mounted
  useEffect(() => {
    if (mounted && isOpen) {
      // Backdrop fade in (0 -> 1, 200ms)
      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      )
      // Modal slide up (y: 20 -> 0, 300ms, cg-out)
      gsap.fromTo(modalRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'cg-out' }
      )
    }
  }, [mounted, isOpen])

  // Fetch assembled preview text
  useEffect(() => {
    if (!isOpen) return

    const fetchPreview = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/context/preview?scope=${encodeURIComponent(selectedScope)}`)
        if (res.ok) {
          const data = await res.json()
          setAssembledData(data)
        }
      } catch (err) {
        console.error('Failed to fetch preview:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [selectedScope, isOpen])

  // Default selected scope if the list updates
  useEffect(() => {
    if (scopes.length > 0 && !scopes.includes(selectedScope)) {
      setSelectedScope(scopes[0])
    }
  }, [scopes, selectedScope])

  // Play exit animation and then notify parent
  const handleClose = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setMounted(false)
        onClose()
      }
    })
    tl.to(modalRef.current, { y: 20, opacity: 0, duration: 0.25, ease: 'cg-in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0.05)
  }

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
  }, [isOpen])

  // Clipboard copy
  const handleCopy = async () => {
    if (!assembledData?.assembled) return
    try {
      await navigator.clipboard.writeText(assembledData.assembled)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (!mounted) return null



  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 backdrop-blur-[2px]"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
      }}
      onClick={handleClose}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-[680px] rounded-[12px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-xl)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-heading-md font-semibold text-[var(--text-primary)]">
            Context Preview
          </h2>
          <button 
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scope Selector Row */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--card-raised)]/20">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2.5">
            Select Scope
          </div>
          <div className="flex flex-wrap gap-2">
            {scopes.length === 0 ? (
              <div className="text-[12px] text-[var(--text-muted)] italic">No scopes available.</div>
            ) : (
              scopes.map((s) => {
                const isSelected = selectedScope === s
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedScope(s)}
                    className={cn(
                      "px-3.5 py-1 text-[12px] font-medium rounded-full transition-all duration-150 cursor-pointer border border-transparent",
                      isSelected
                        ? "bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]/30"
                        : "bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/[0.05] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                    )}
                  >
                    {s}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Body (Scrollable Pre block) */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[220px]">
          {loading ? (
            <Skeleton />
          ) : (
            <pre 
              className="font-mono text-[12px] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap select-text text-[var(--text-primary)] border border-[var(--border)]"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--bg)' : '#f4f4f4',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {assembledData?.assembled || 'No context assembled for this scope.'}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-[4px] sticky bottom-0">
          <div className="text-[12px] text-[var(--text-secondary)] font-medium">
            ~{assembledData?.tokenEstimate || 0} tokens • {assembledData?.nodeCount || 0} nodes assembled
          </div>
          
          <button
            onClick={handleCopy}
            disabled={!assembledData?.assembled || loading}
            className={cn(
              "flex items-center gap-1.5 px-4 h-9 rounded-[var(--radius-md)] text-[13px] font-medium border border-[var(--border-strong)] transition-all duration-150 cursor-pointer",
              copied
                ? "border-[var(--success)] text-[var(--success)] bg-[var(--success)]/5"
                : "text-[var(--text-primary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied ✓</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
