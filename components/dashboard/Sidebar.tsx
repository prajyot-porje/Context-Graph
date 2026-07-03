'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useGraph } from '@/components/providers/GraphProvider'
import { computeDepths, sortNodesHierarchically, buildNodeTree, TreeNode } from '@/lib/graph-utils'
import { AddNodeModal } from './AddNodeModal'
import { Skeleton } from '@/components/ui/Skeleton'
import type { ContextNode } from '@/types'

// ── Inline thin-line SVGs (no Lucide) ─────────────────────────────────────────

function IconPlus({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconSettings({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconChevronRight({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function IconChevronDown({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconUser({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconBriefcase({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function IconBox({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

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

  // Simplified context health — single score, no color bar
  const healthScore = useMemo(() => {
    if (nodes.length === 0) return 0
    const nodeCountScore = Math.min(nodes.length / 10, 1.0)
    const sumRelevance = nodes.reduce((sum, n) => sum + (n.relevance || 0), 0)
    const avgRelevance = sumRelevance / nodes.length
    const sumContentLen = nodes.reduce((sum, n) => sum + (n.content?.length || 0), 0)
    const avgContentLen = sumContentLen / nodes.length
    const contentScore = Math.min(avgContentLen / 500, 1.0)
    return Math.round((nodeCountScore * 0.3 + avgRelevance * 0.5 + contentScore * 0.2) * 100)
  }, [nodes])

  function renderTreeNode(treeNode: TreeNode): React.ReactNode {
    const { node, children, depth } = treeNode
    const hasChildren = children.length > 0
    const isCollapsed = collapsedIds.has(node.id)
    const isSelected = selectedNodeId === node.id

    // Relevance dot — token colors
    const dotColor =
      node.relevance >= 0.7 ? 'var(--accent)' :
      node.relevance >= 0.4 ? 'var(--warning)' : 'var(--text-disabled)'

    // Node icon based on scope
    let NodeIcon = IconBox
    if (node.scope === 'me') NodeIcon = IconUser
    else if (node.scope === 'agency' || node.scope.startsWith('agency/')) NodeIcon = IconBriefcase

    return (
      <div key={node.id}>
        {/* Node row */}
        <div
          className="cg-sidebar-node"
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
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1px',
            position: 'relative',
            // Selected: subtle bg + left accent line
            background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
            borderLeft: isSelected
              ? '2px solid var(--accent)'
              : '2px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.background = 'transparent'
          }}
        >
          {/* Depth connector line */}
          {depth > 0 && (
            <div style={{
              position: 'absolute',
              left: `${12 + (depth - 1) * 16 + 7}px`,
              top: 0,
              bottom: '50%',
              width: '1px',
              background: 'var(--border)',
              pointerEvents: 'none',
            }} />
          )}

          {/* Chevron toggle */}
          {hasChildren ? (
            <span
              onClick={(e) => { e.stopPropagation(); toggleCollapsed(node.id) }}
              style={{ display: 'flex', alignItems: 'center', marginRight: '4px', color: 'var(--text-muted)', flexShrink: 0 }}
            >
              {isCollapsed ? <IconChevronRight size={10} /> : <IconChevronDown size={10} />}
            </span>
          ) : (
            <span style={{ width: '14px', flexShrink: 0 }} />
          )}

          {/* Scope icon */}
          <span style={{ marginRight: '6px', flexShrink: 0, color: isSelected ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
            <NodeIcon size={11} />
          </span>

          {/* Title */}
          <span style={{
            fontSize: '12.5px',
            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: isSelected ? 500 : 400,
          }}>
            {node.title}
          </span>

          {/* Relevance dot */}
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            marginLeft: '8px',
            opacity: 0.8,
          }} />
        </div>

        {/* Children */}
        {hasChildren && !isCollapsed && (
          <div>
            {children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    )
  }

  const sortedNodes = useMemo(() => sortNodesHierarchically(computeDepths(nodes)), [nodes])

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[390] bg-black/50 backdrop-blur-[2px] lg:hidden transition-opacity duration-300",
          isOpen || mobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => {
          onClose()
          setMobileSidebarOpen?.(false)
        }}
      />

      {/* Sidebar panel */}
      <div
        className={cn(
          "cg-sidebar cg-dashboard-sidebar flex h-full w-[240px] flex-col border-r border-[var(--border)] bg-[var(--surface)]",
          mobileSidebarOpen && "mobile-open",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[400]",
          "transition-transform duration-300 ease-in-out",
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

        {/* ── Scrollable node tree ── */}
        <div className="flex-1 overflow-y-auto px-2 py-3" data-lenis-prevent="true">

          {/* Section label + health score */}
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Graph Nodes
            </span>
            {nodes.length > 0 && (
              <span className="text-[9px] text-[var(--text-muted)] tabular-nums">
                {healthScore}% health
              </span>
            )}
          </div>

          {/* Node list */}
          <div className="flex flex-col gap-[1px]">
            {nodesLoading ? (
              <div className="flex flex-col gap-1 px-2 py-1">
                <Skeleton height={32} borderRadius={6} />
                <Skeleton height={32} borderRadius={6} width="88%" />
                <Skeleton height={32} borderRadius={6} width="78%" style={{ marginLeft: '16px' }} />
                <Skeleton height={32} borderRadius={6} width="83%" style={{ marginLeft: '16px' }} />
                <Skeleton height={32} borderRadius={6} width="66%" style={{ marginLeft: '32px' }} />
              </div>
            ) : sortedNodes.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-[12px] text-[var(--text-muted)] leading-[1.6]">
                  No nodes yet.<br />Add your first context node below.
                </p>
              </div>
            ) : (
              <div style={{ padding: '2px 0' }}>
                {buildNodeTree(nodes).map(treeNode => renderTreeNode(treeNode))}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom actions ── */}
        <div className="shrink-0 flex flex-col p-3 gap-1 border-t border-[var(--border)]">

          {/* Add node */}
          <button
            onClick={() => setAddNodeOpen(true)}
            className={cn(
              'flex h-9 w-full items-center justify-start gap-2 rounded-[var(--radius-md)] px-3',
              'border border-[var(--border-strong)] bg-transparent',
              'text-[12.5px] font-medium text-[var(--text-secondary)]',
              'transition-[background-color,border-color,color] duration-150',
              'hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]',
              'cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
            )}
          >
            <IconPlus size={13} />
            <span>Add node</span>
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              'flex h-9 w-full items-center justify-start gap-2 rounded-[var(--radius-md)] px-3',
              'text-[12.5px] font-medium',
              'transition-[background-color,color] duration-150',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
              pathname === '/settings'
                ? 'bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--text-secondary)]',
            )}
          >
            <IconSettings size={13} />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Add Node Modal */}
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
