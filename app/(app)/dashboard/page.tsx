'use client'

import { useState, useEffect } from 'react'
import { ContextGraph } from '@/components/graph/ContextGraph'
import { NodeDetailPanel } from '@/components/dashboard/NodeDetailPanel'
import { mockNodes, type MockNode } from '@/lib/mock-data'

export default function DashboardPage() {
  const [nodes, setNodes] = useState<MockNode[]>(mockNodes)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  
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

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 overflow-hidden relative">
        <ContextGraph
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
