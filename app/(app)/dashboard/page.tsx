'use client'

import { useState, useEffect } from 'react'
import { ContextGraph } from '@/components/graph/ContextGraph'
import { NodeDetailPanel } from '@/components/dashboard/NodeDetailPanel'
import { Button } from '@/components/ui/Button'
import type { ContextNode } from '@/types'

export default function DashboardPage() {
  const [nodes, setNodes] = useState<ContextNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  
  // Track the actual node to display so it doesn't disappear during exit animation
  const [displayedNodeId, setDisplayedNodeId] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  // Fetch nodes on mount
  useEffect(() => {
    fetch('/api/context')
      .then((r) => r.json())
      .then(({ nodes }) => {
        setNodes(nodes || [])
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load nodes:', err)
        setIsLoading(false)
      })
  }, [])

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

  // Function to initialize first root node
  const handleCreateFirstNode = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'me',
          title: 'ME',
          content: 'Your identity and core context. Update this node to set your primary profile.',
          tags: ['me', 'root'],
          parent_scope: null,
        })
      })
      if (res.ok) {
        const { node } = await res.json()
        setNodes([node])
      }
    } catch (err) {
      console.error('Failed to create root node:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Render Premium Skeleton Loading State
  if (isLoading) {
    return (
      <div className="flex h-full w-full bg-[var(--bg)] p-6 gap-6 overflow-hidden animate-[pulse_1.5s_ease-in-out_infinite]">
        {/* Sidebar Skeleton */}
        <div className="w-[300px] shrink-0 h-full flex flex-col gap-4 opacity-50">
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
          <div className="w-48 h-48 rounded-full border-4 border-dashed border-[var(--border)] opacity-35 animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-24 h-24 rounded-full bg-[var(--border)] opacity-25" />
        </div>
      </div>
    )
  }

  // Render Premium Empty State
  if (nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--bg)] p-8">
        <div className="max-w-[480px] text-center flex flex-col items-center">
          {/* Abstract floating nodes icon */}
          <div className="relative mb-8 w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-5 blur-xl" />
            <div className="w-12 h-12 rounded-full border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-semibold shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]">
              CG
            </div>
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full border border-[var(--text-secondary)] opacity-50" />
            <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full border border-[var(--text-secondary)] opacity-30" />
            <div className="absolute top-6 left-0 w-2.5 h-2.5 rounded-full border border-[var(--accent)] opacity-60 animate-ping" />
          </div>
          
          <h2 className="font-display text-[24px] font-bold tracking-tight text-[var(--text-primary)] mb-3">
            No nodes yet
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-6">
            Your context graph is waiting for its first connection. Add a node via API, MCP, or onboarding to get started.
          </p>
          
          <Button 
            variant="primary" 
            onClick={handleCreateFirstNode}
            className="px-6 py-2.5 text-[14px] font-medium"
          >
            Initialize Context Graph
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 overflow-hidden relative">
        <ContextGraph
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
        />
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
