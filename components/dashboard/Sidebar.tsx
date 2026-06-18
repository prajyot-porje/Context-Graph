'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Settings, Search, X, Activity, ChevronRight, ChevronDown, User, Briefcase, Box, Circle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarNode } from './SidebarNode'
import { useGraph } from '@/components/providers/GraphProvider'
import { computeDepths, sortNodesHierarchically, buildNodeTree, TreeNode } from '@/lib/graph-utils'
import { AddNodeModal } from './AddNodeModal'
import { Skeleton } from '@/components/ui/Skeleton'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  mobileSidebarOpen?: boolean
  setMobileSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export function Sidebar({
  isOpen,
  onClose,
  selectedNodeId,
  onSelectNode,
  mobileSidebarOpen = false,
  setMobileSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname()
  const { nodes, setNodes, isLoading, addNodeOpen, setAddNodeOpen } = useGraph()
  const [searchQuery, setSearchQuery] = useState('')
  const [nodesLoading, setNodesLoading] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      setNodesLoading(false)
    }
  }, [isLoading])

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('cg-sidebar-collapsed')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  const toggleCollapsed = (nodeId: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      localStorage.setItem('cg-sidebar-collapsed', JSON.stringify([...next]))
      return next
    })
  }

  function renderTreeNode(treeNode: TreeNode): React.ReactNode {
    const { node, children, depth } = treeNode
    const hasChildren = children.length > 0
    const isCollapsed = collapsedIds.has(node.id)
    const isSelected = selectedNodeId === node.id

    // Relevance dot color
    const dotColor =
      node.relevance >= 0.7 ? '#b3ec13' :
      node.relevance >= 0.4 ? '#f59e0b' : '#666666'

    // Node icon based on scope
    let Icon = Circle
    if (node.scope === 'me') Icon = User
    else if (node.scope === 'agency' || node.scope.startsWith('agency/')) Icon = Briefcase
    else Icon = Box

    return (
      <div key={node.id}>
        {/* Node row */}
        <div
          onClick={() => {
            onSelectNode(node.id)
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              onClose()
              setMobileSidebarOpen?.(false)
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '34px',
            paddingLeft: `${12 + depth * 16}px`,
            paddingRight: '10px',
            cursor: 'pointer',
            borderRadius: '6px',
            marginBottom: '1px',
            position: 'relative',
            background: isSelected
              ? 'rgba(179,236,19,0.10)'
              : 'transparent',
            borderLeft: isSelected
              ? '2px solid #b3ec13'
              : '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          {/* Connector line for depth > 0 */}
          {depth > 0 && (
            <div style={{
              position: 'absolute',
              left: `${12 + (depth - 1) * 16 + 7}px`,
              top: 0,
              bottom: '50%',
              width: '1px',
              background: 'var(--border, rgba(255,255,255,0.07))',
              pointerEvents: 'none',
            }} />
          )}

          {/* Chevron or spacer */}
          {hasChildren ? (
            <span
              onClick={(e) => { e.stopPropagation(); toggleCollapsed(node.id) }}
              style={{ display:'flex', alignItems:'center', marginRight:'4px', color:'var(--text-secondary, #888888)', flexShrink:0 }}
            >
              {isCollapsed
                ? <ChevronRight size={12} />
                : <ChevronDown size={12} />}
            </span>
          ) : (
            <span style={{ width:'16px', flexShrink:0 }} />
          )}

          {/* Icon */}
          <Icon size={12} style={{ marginRight:'7px', flexShrink:0, color: isSelected ? '#b3ec13' : 'var(--text-secondary, #888888)' }} />

          {/* Title */}
          <span style={{
            fontSize: '13px',
            color: isSelected ? '#b3ec13' : 'var(--text-primary, #F0F0F0)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {node.title}
          </span>

          {/* Relevance dot */}
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            marginLeft: '8px',
          }} />
        </div>

        {/* Children (if not collapsed) */}
        {hasChildren && !isCollapsed && (
          <div>
            {children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    )
  }

  // Calculate stats for the HUD
  const stats = useMemo(() => {
    if (!nodes.length) return { count: 0, avgRelevance: 0, projectsCount: 0 }
    
    const count = nodes.length
    const sumRelevance = nodes.reduce((sum, n) => sum + (n.relevance || 0), 0)
    const avgRelevance = Math.round((sumRelevance / count) * 100)
    
    // Count project scopes (depth = 2)
    const withDepths = computeDepths(nodes)
    const projectsCount = withDepths.filter(n => n.depth >= 2).length

    return { count, avgRelevance, projectsCount }
  }, [nodes])

  // Compute depths and sort them hierarchically
  const sortedNodes = useMemo(() => {
    return sortNodesHierarchically(computeDepths(nodes))
  }, [nodes])

  // Context Health Score Calculation
  const health = useMemo(() => {
    if (nodes.length === 0) {
      return { score: 0, color: '#888888', helperText: 'Add more nodes to improve' }
    }
    
    const nodeCountScore = Math.min(nodes.length / 10, 1.0)
    const sumRelevance = nodes.reduce((sum, n) => sum + (n.relevance || 0), 0)
    const avgRelevance = sumRelevance / nodes.length
    
    const sumContentLen = nodes.reduce((sum, n) => sum + (n.content?.length || 0), 0)
    const avgContentLen = sumContentLen / nodes.length
    const contentScore = Math.min(avgContentLen / 500, 1.0)
    
    const score = Math.round((nodeCountScore * 0.3 + avgRelevance * 0.5 + contentScore * 0.2) * 100)
    
    const color = score >= 70
      ? '#b3ec13'
      : score >= 40
        ? '#f59e0b'
        : '#888888'
        
      const helperText = score < 50
        ? 'Add more nodes to improve'
        : score < 80
          ? 'Good — keep updating with /save'
          : 'Context is strong'

    return { score, color, helperText }
  }, [nodes])

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return sortedNodes

    return sortedNodes.filter(
      (node) =>
        node.title.toLowerCase().includes(query) ||
        node.scope.toLowerCase().includes(query) ||
        (node.tags && node.tags.some((t) => t.toLowerCase().includes(query)))
    )
  }, [sortedNodes, searchQuery])

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={cn(
          "fixed inset-0 z-[390] bg-black/60 backdrop-blur-[4px] lg:hidden transition-opacity duration-300",
          isOpen || mobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => {
          onClose()
          setMobileSidebarOpen?.(false)
        }}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "cg-sidebar cg-dashboard-sidebar flex h-full w-[260px] flex-col border-r border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-[12px]",
          mobileSidebarOpen && "mobile-open",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[400]",
          "transition-transform duration-300 ease-in-out [box-shadow:var(--shadow-xs)]"
        )}
        style={
          !isOpen && !mobileSidebarOpen
            ? { transform: 'translateX(-100%)' }
            : { transform: 'translateX(0)' }
        }
      >
        {/* Desktop — always visible */}
        <style>{`
          @media (min-width: 1024px) {
            .cg-sidebar { transform: translateX(0) !important; }
          }
        `}</style>

        {/* HUD Statistics Card */}
        <div className="p-4 pb-2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-3 shadow-[var(--shadow-sm)] [box-shadow:var(--shadow-inset)]">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">
              <Activity size={10} className="text-[var(--accent)]" />
              <span>Context HUD</span>
            </div>
            <div className="grid grid-cols-3 gap-1 divide-x divide-[var(--border)] text-center">
              <div>
                <p className="text-[14px] font-bold text-[var(--text-primary)] font-display">{stats.count}</p>
                <p className="text-[9px] text-[var(--text-secondary)] uppercase">Nodes</p>
              </div>
              <div className="pl-1">
                <p className="text-[14px] font-bold text-[var(--text-primary)] font-display">{stats.avgRelevance}%</p>
                <p className="text-[9px] text-[var(--text-secondary)] uppercase">Relevance</p>
              </div>
              <div className="pl-1">
                <p className="text-[14px] font-bold text-[var(--text-primary)] font-display">{stats.projectsCount}</p>
                <p className="text-[9px] text-[var(--text-secondary)] uppercase">Projects</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-4 py-2">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[36px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] pl-9 pr-8 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Node Tree */}
        <div className="flex-1 overflow-y-auto px-2 py-2" data-lenis-prevent="true">
          <div className="mb-[var(--space-1)] px-[var(--space-2)] py-[var(--space-1)] text-label text-[var(--text-muted)] text-[10px] flex items-center justify-between">
            <span>Graph Nodes</span>
            {searchQuery && <span className="text-[9px] lowercase text-[var(--text-muted)] font-normal">({filteredNodes.length} matches)</span>}
          </div>

          {/* Context Health Section */}
          <div className="mx-2 mb-3 mt-1 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] font-semibold">
                Context Health
              </span>
              <span 
                className="text-[20px] font-semibold font-display animate-none" 
                style={{ color: health.color }}
              >
                {health.score}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-1.5 h-[3px] w-full rounded-[2px] bg-[var(--border)] overflow-hidden">
              <div 
                className="h-full rounded-[2px] transition-all duration-300"
                style={{ 
                  width: `${health.score}%`, 
                  backgroundColor: health.color 
                }}
              />
            </div>
            
            {/* Helper Text */}
            <div className="mt-1 text-[10px] text-[var(--text-muted)]">
              {health.helperText}
            </div>
          </div>
          
          <div className="flex flex-col gap-[2px]">
            {nodesLoading ? (
              <div style={{ padding:'8px', display:'flex', flexDirection:'column', gap:'4px' }}>
                <Skeleton height={34} borderRadius={6} />
                <Skeleton height={34} borderRadius={6} width="88%" />
                <Skeleton height={34} borderRadius={6} width="78%" style={{ marginLeft:'16px' }} />
                <Skeleton height={34} borderRadius={6} width="83%" style={{ marginLeft:'16px' }} />
                <Skeleton height={34} borderRadius={6} width="72%" style={{ marginLeft:'32px' }} />
                <Skeleton height={34} borderRadius={6} width="60%" style={{ marginLeft:'32px' }} />
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-[var(--text-muted)]">
                {searchQuery ? 'No matching nodes found' : 'No nodes found. Add your first node.'}
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {buildNodeTree(searchQuery ? filteredNodes : nodes).map(treeNode => renderTreeNode(treeNode))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Section */}
        <div className="mt-auto flex flex-col p-4 pt-2">
          <div
            className="mb-3 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--border-strong), transparent)',
            }}
          />
          
          <button 
            onClick={() => setAddNodeOpen(true)}
            className="flex min-h-[40px] w-full items-center justify-start gap-2.5 rounded-[var(--radius-md)] px-3 text-[var(--text-secondary)] border border-dashed border-[var(--border-strong)] transition-all duration-150 hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Plus size={14} className="shrink-0" />
            <span className="text-[13px] font-medium">Add node</span>
          </button>
          
          <Link
            href="/settings"
            className={cn(
              "flex min-h-[40px] w-full items-center justify-start gap-2.5 rounded-[var(--radius-md)] px-3 mt-2 transition-all duration-150",
              pathname === '/settings'
                ? "bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/30"
                : "text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]"
            )}
          >
            <Settings size={14} className="shrink-0" />
            <span className="text-[13px] font-medium">Settings</span>
          </Link>
        </div>
      </div>

      {/* Creation Modal */}
      <AddNodeModal
        isOpen={addNodeOpen}
        onClose={() => setAddNodeOpen(false)}
        existingNodes={nodes}
        onCreated={(newNode) => {
          setNodes((prev) => [...prev, newNode])
          onSelectNode(newNode.id)
        }}
      />
    </>
  )
}

