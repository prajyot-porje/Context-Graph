'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ContextNode } from '@/types'

interface GraphContextType {
  nodes: ContextNode[]
  setNodes: React.Dispatch<React.SetStateAction<ContextNode[]>>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  refreshNodes: () => Promise<void>
}

const GraphContext = createContext<GraphContextType | undefined>(undefined)

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<ContextNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const refreshNodes = useCallback(async () => {
    setIsLoading(true)
    try {
      const r = await fetch('/api/context')
      const data = await r.json()
      setNodes(data.nodes || [])
    } catch (err) {
      console.error('Failed to load nodes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshNodes()
  }, [refreshNodes])

  return (
    <GraphContext.Provider
      value={{
        nodes,
        setNodes,
        isLoading,
        setIsLoading,
        selectedNodeId,
        setSelectedNodeId,
        refreshNodes,
      }}
    >
      {children}
    </GraphContext.Provider>
  )
}

export function useGraph() {
  const context = useContext(GraphContext)
  if (context === undefined) {
    throw new Error('useGraph must be used within a GraphProvider')
  }
  return context
}
