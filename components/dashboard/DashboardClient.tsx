'use client'

import { useState, useEffect } from 'react'
import ContextGraph3D from '@/components/graph/ContextGraph3D'
import { NodeDetailPanel } from '@/components/dashboard/NodeDetailPanel'
import { Button } from '@/components/ui/Button'
import { useGraph } from '@/components/providers/GraphProvider'
import { Maximize, Sliders } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

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
  
  // HUD Canvas Control States
  const [relevanceThreshold, setRelevanceThreshold] = useState(0.0)
  const [showLabels, setShowLabels] = useState(true)
  const [zoomTrigger, setZoomTrigger] = useState(0)

  // Track the actual node to display so it doesn't disappear during exit animation
  const [displayedNodeId, setDisplayedNodeId] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  // Sync selectedNodeId to displayedNodeId, but handle closing
  useEffect(() => {
    if (selectedNodeId) {
      setDisplayedNodeId(selectedNodeId)
      setIsClosing(false)
    } else if (displayedNodeId) {
      // User deselected
      setIsClosing(true)
    }
  }, [selectedNodeId, displayedNodeId])

  const displayedNode = displayedNodeId ? nodes.find(n => n.id === displayedNodeId) : null

  // Handle graph node click → map back to ContextNode id
  const handleNodeClick = (graphNode: { id: string }) => {
    setSelectedNodeId(graphNode.id)
  }

  // Render Premium Skeleton Loading State
  if (isLoading) {
    return (
      <div className="flex h-full w-full bg-[var(--bg)] p-6 gap-6 overflow-hidden animate-[pulse_1.5s_ease-in-out_infinite]">
        {/* Sidebar Skeleton */}
        <div className="w-[260px] shrink-0 h-full flex flex-col gap-4 opacity-50">
          <div className="h-12 w-3/4 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-md)]" />
          <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-3">
            <div className="h-4 w-1/2 bg-[var(--border)] rounded" />
            <div className="h-10 w-full bg-[var(--border)] rounded-[var(--radius-sm)] opacity-60" />
            <div className="h-10 w-full bg-[var(--border)] rounded-[var(--radius-sm)] opacity-40" />
            <div className="h-10 w-full bg-[var(--border)] rounded-[var(--radius-sm)] opacity-20" />
          </div>
        </div>
        {/* Graph Area Skeleton */}
        <div className="flex-1 h-full bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] relative overflow-hidden flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-dashed border-[var(--border)] opacity-35 animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-24 h-24 rounded-full bg-[var(--border)] opacity-25" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full cg-dashboard-grid">
      <div
        className="flex-1 overflow-hidden relative"
        style={{ height: '100%', minHeight: 0 }}
      >
        {(nodes.length === 0 && !isLoading) ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '14px', padding: '40px 24px', height: '100%',
          }}>
            <svg width="72" height="56" viewBox="0 0 72 56" fill="none">
              <line x1="36" y1="14" x2="12" y2="43" stroke="var(--border-strong)" strokeWidth="1.5"/>
              <line x1="36" y1="14" x2="60" y2="43" stroke="var(--border-strong)" strokeWidth="1.5"/>
              <circle cx="36" cy="14" r="10" stroke="rgba(179,236,19,0.5)" strokeWidth="1.5" fill="none"/>
              <circle cx="12" cy="43" r="8"  stroke="var(--border-strong)" strokeWidth="1.5" fill="none"/>
              <circle cx="60" cy="43" r="8"  stroke="var(--border-strong)" strokeWidth="1.5" fill="none"/>
            </svg>
            <p style={{ fontSize:'15px', fontWeight:600, color:'var(--text-secondary)', fontFamily: 'var(--font-display, "Bricolage Grotesque", sans-serif)' }}>
              Your graph is empty
            </p>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', textAlign:'center', maxWidth:'240px', lineHeight:1.6, fontFamily:'var(--font-geist, sans-serif)' }}>
              Add your first context node to start building your knowledge graph.
            </p>
            <button
              onClick={() => setAddNodeOpen(true)}
              style={{
                padding:'10px 22px', borderRadius:'8px',
                border:'1px solid var(--border-strong)',
                background:'transparent', color:'var(--text-primary)',
                fontSize:'13px', cursor:'pointer', fontFamily:'var(--font-geist, sans-serif)',
              }}
            >
              + Add first node
            </button>
          </div>
        ) : (
          <>
            <ErrorBoundary
              fallback={
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: 'var(--text-muted-dark)', fontSize: '13px', fontFamily: 'var(--font-geist)' }}>
                    Graph failed to load.{' '}
                    <button
                      onClick={() => window.location.reload()}
                      style={{ color: '#b3ec13', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
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

            {/* Floating Canvas Controls HUD Overlay */}
            <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-3 w-[220px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)]/85 backdrop-blur-[8px] p-3.5 shadow-[var(--shadow-md)] [box-shadow:var(--shadow-inset)] select-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Sliders size={12} className="text-[var(--accent)]" /> HUD Controls
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomTrigger(p => p + 1)}
                  className="h-[28px] min-h-[28px] px-2 text-[11px] border border-white/[0.04] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] flex items-center gap-1"
                  title="Fit viewport"
                >
                  <Maximize size={10} /> Fit
                </Button>
              </div>

              <div className="h-[1px] bg-[var(--border)] w-full" />

              {/* Relevance Threshold Filter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                  <span>MIN RELEVANCE</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">
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
                  className="w-full accent-[var(--accent)] h-1 bg-white/[0.08] rounded-lg cursor-pointer"
                />
              </div>

              <div className="h-[1px] bg-[var(--border)] w-full" />

              {/* Labels Toggle */}
              <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                <span>SHOW LABELS</span>
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={cn(
                    "flex h-[22px] w-[38px] items-center rounded-full p-0.5 transition-colors duration-150 outline-none cursor-pointer",
                    showLabels ? "bg-[var(--accent)]" : "bg-white/[0.08] border border-[var(--border)]"
                  )}
                >
                  <span
                    className={cn(
                      "h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-150",
                      showLabels 
                        ? "translate-x-[16px] bg-[var(--on-accent)]" 
                        : "translate-x-0 bg-[var(--text-secondary)]"
                    )}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
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
            setNodes(prev => prev.map(n => 
              n.id === id ? { ...n, ...updates } : n
            ))
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
