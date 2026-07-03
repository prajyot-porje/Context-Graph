'use client'

import { useState, useEffect } from 'react'
import ContextGraph3D from '@/components/graph/ContextGraph3D'
import { NodeDetailPanel } from '@/components/dashboard/NodeDetailPanel'
import { useGraph } from '@/components/providers/GraphProvider'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// ── Inline thin-line SVGs (no Lucide) ─────────────────────────────────────────

function IconMaximize({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

function IconSliders({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const {
    nodes,
    setNodes,
    edges,
    isLoading,
    selectedNodeId,
    setSelectedNodeId,
    setAddNodeOpen,
  } = useGraph()

  const [relevanceThreshold, setRelevanceThreshold] = useState(0.0)
  const [showLabels, setShowLabels] = useState(true)
  const [zoomTrigger, setZoomTrigger] = useState(0)

  const [displayedNodeId, setDisplayedNodeId] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (selectedNodeId) {
      setDisplayedNodeId(selectedNodeId)
      setIsClosing(false)
    } else if (displayedNodeId) {
      setIsClosing(true)
    }
  }, [selectedNodeId, displayedNodeId])

  const displayedNode = displayedNodeId ? nodes.find(n => n.id === displayedNodeId) : null

  const handleNodeClick = (graphNode: { id: string }) => {
    setSelectedNodeId(graphNode.id)
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full bg-[var(--bg)] overflow-hidden">
        {/* Minimal skeleton — just graph area */}
        <div className="flex-1 h-full relative flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-dashed border-[var(--border)] opacity-20 animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-20 h-20 rounded-full bg-[var(--border)] opacity-15" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full cg-dashboard-grid">
      <div className="flex-1 overflow-hidden relative" style={{ height: '100%', minHeight: 0 }}>

        {nodes.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8">
            {/* Graph-like SVG */}
            <svg width="64" height="52" viewBox="0 0 72 56" fill="none" aria-hidden="true">
              <line x1="36" y1="14" x2="12" y2="43" stroke="var(--border-strong)" strokeWidth="1.5" />
              <line x1="36" y1="14" x2="60" y2="43" stroke="var(--border-strong)" strokeWidth="1.5" />
              <circle cx="36" cy="14" r="10" stroke="rgba(179,236,19,0.45)" strokeWidth="1.5" fill="none" />
              <circle cx="12" cy="43" r="8" stroke="var(--border-strong)" strokeWidth="1.5" fill="none" />
              <circle cx="60" cy="43" r="8" stroke="var(--border-strong)" strokeWidth="1.5" fill="none" />
            </svg>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-[var(--text-secondary)]"
                style={{ fontFamily: 'var(--font-display, "Bricolage Grotesque", sans-serif)' }}>
                Your graph is empty
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.65] text-[var(--text-muted)] max-w-[220px]">
                Add your first context node to start building your knowledge graph.
              </p>
            </div>
            <button
              onClick={() => setAddNodeOpen(true)}
              className={cn(
                'flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent px-5',
                'text-[13px] font-medium text-[var(--text-secondary)]',
                'transition-[background-color,border-color,color] duration-150',
                'hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]',
                'cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
              )}
            >
              + Add first node
            </button>
          </div>
        ) : (
          <>
            <ErrorBoundary
              fallback={
                <div className="flex h-full items-center justify-center">
                  <p className="text-[13px] text-[var(--text-muted)]">
                    Graph failed to load.{' '}
                    <button
                      onClick={() => window.location.reload()}
                      className="text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--text-primary)] transition-[color] duration-100 cursor-pointer"
                    >
                      Refresh
                    </button>
                  </p>
                </div>
              }
            >
              <ContextGraph3D
                nodes={nodes}
                edges={edges}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNodeId}
                relevanceFilter={relevanceThreshold}
                showLabels={showLabels}
                zoomTrigger={zoomTrigger}
              />
            </ErrorBoundary>

            {/* ── HUD Controls — bottom-left ── */}
            <div className="absolute bottom-5 left-5 z-20 w-[200px] select-none rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]/90 p-3 shadow-[var(--shadow-md)] backdrop-blur-[10px]">

              {/* Header row */}
              <div className="mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  <IconSliders size={10} />
                  Controls
                </span>
                <button
                  onClick={() => setZoomTrigger(p => p + 1)}
                  title="Fit to view"
                  className="flex h-5 items-center gap-1 rounded-[var(--radius-xs)] border border-[var(--border)] px-1.5 text-[9px] text-[var(--text-muted)] transition-[background-color,color,border-color] duration-100 hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)] cursor-pointer focus-visible:outline-none"
                >
                  <IconMaximize size={9} />
                  Fit
                </button>
              </div>

              <div className="mb-2.5 h-px bg-[var(--border)]" />

              {/* Min Relevance slider */}
              <div className="mb-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.07em] text-[var(--text-muted)]">
                    Min Relevance
                  </span>
                  <span className="font-mono text-[9px] font-semibold text-[var(--text-secondary)]">
                    {Math.round(relevanceThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.1"
                  value={relevanceThreshold}
                  onChange={(e) => setRelevanceThreshold(parseFloat(e.target.value))}
                  className="cg-range-input w-full"
                />
              </div>

              <div className="mb-2.5 h-px bg-[var(--border)]" />

              {/* Labels toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.07em] text-[var(--text-muted)]">
                  Labels
                </span>
                <button
                  onClick={() => setShowLabels(v => !v)}
                  role="switch"
                  aria-checked={showLabels}
                  className={cn(
                    'relative flex h-[18px] w-[32px] cursor-pointer items-center rounded-full border outline-none transition-colors duration-150',
                    showLabels
                      ? 'border-[var(--accent)] bg-[var(--accent)]'
                      : 'border-[var(--border-strong)] bg-transparent',
                  )}
                >
                  <span className={cn(
                    'absolute h-[12px] w-[12px] rounded-full shadow-sm transition-transform duration-150',
                    showLabels
                      ? 'translate-x-[16px] bg-[var(--on-accent)]'
                      : 'translate-x-[2px] bg-[var(--text-muted)]',
                  )} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Node detail panel */}
      {displayedNode && (
        <NodeDetailPanel
          node={displayedNode}
          isClosing={isClosing}
          onClose={() => setSelectedNodeId(null)}
          onClosed={() => {
            setIsClosing(false)
            setDisplayedNodeId(null)
          }}
          onNodeUpdate={(id, updates) => {
            setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
          }}
          onNodeDelete={(id) => {
            setNodes(prev => prev.filter(n => n.id !== id))
            setSelectedNodeId(null)
          }}
        />
      )}
    </div>
  )
}
