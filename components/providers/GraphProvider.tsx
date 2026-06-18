'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ContextNode, ContextEdge } from '@/types'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/auth-client'

interface GraphContextType {
  nodes: ContextNode[]
  setNodes: React.Dispatch<React.SetStateAction<ContextNode[]>>
  edges: ContextEdge[]
  setEdges: React.Dispatch<React.SetStateAction<ContextEdge[]>>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  refreshNodes: () => Promise<void>
  addNodeOpen: boolean
  setAddNodeOpen: (open: boolean) => void
}

const GraphContext = createContext<GraphContextType | undefined>(undefined)

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<ContextNode[]>([])
  const [edges, setEdges] = useState<ContextEdge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [addNodeOpen, setAddNodeOpen] = useState(false)
  
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [supabaseClient] = useState(() => createBrowserSupabaseClient())

  const refreshNodes = useCallback(async () => {
    setIsLoading(true)
    try {
      const r = await fetch('/api/context')
      if (!r.ok) {
        throw new Error(`API returned ${r.status}`)
      }
      const data = await r.json()
      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    } catch (err) {
      console.error('Failed to load nodes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshNodes()
  }, [refreshNodes])

  useEffect(() => {
    if (!userId) return

    const channel = supabaseClient
      .channel('dashboard-realtime-nodes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'context_nodes',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNodes(prev =>
            prev.map(n =>
              n.id === payload.new.id ? { ...n, ...payload.new as ContextNode } : n
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'context_nodes',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNodes(prev => {
            if (prev.some(n => n.id === payload.new.id)) return prev
            return [...prev, payload.new as ContextNode]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'context_nodes',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNodes(prev => prev.filter(n => n.id !== payload.old.id))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'context_edges',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setEdges(prev => {
            if (prev.some(e => e.id === payload.new.id)) return prev
            return [...prev, payload.new as ContextEdge]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'context_edges',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setEdges(prev => prev.filter(e => e.id !== payload.old.id))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✓ Real-time dashboard nodes and edges connected')
        }
      })

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }, [userId, supabaseClient])

  return (
    <GraphContext.Provider
      value={{
        nodes,
        setNodes,
        edges,
        setEdges,
        isLoading,
        setIsLoading,
        selectedNodeId,
        setSelectedNodeId,
        refreshNodes,
        addNodeOpen,
        setAddNodeOpen,
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
