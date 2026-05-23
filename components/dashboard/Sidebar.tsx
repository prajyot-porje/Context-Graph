'use client'

import { Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarNode } from './SidebarNode'
import { useGraph } from '@/components/providers/GraphProvider'
import { computeDepths, sortNodesHierarchically } from '@/lib/graph-utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
}

export function Sidebar({ isOpen, onClose, selectedNodeId, onSelectNode }: SidebarProps) {
  const pathname = usePathname()
  const { nodes, isLoading } = useGraph()

  // Compute depths and sort them hierarchically
  const sortedNodes = sortNodesHierarchically(computeDepths(nodes))

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={cn(
          "fixed inset-0 z-[390] bg-black/50 backdrop-blur-[4px] lg:hidden transition-opacity duration-300",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "cg-sidebar flex h-full w-[240px] flex-col border-r border-[var(--border)] bg-[var(--surface)]",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[400]",
          "transition-transform duration-300 ease-in-out"
        )}
        style={
          !isOpen
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

        {/* Top Section */}
        <div className="flex flex-col p-[var(--space-3)]">
          <div className="mb-[var(--space-1)] px-[var(--space-2)] py-[var(--space-2)] text-label text-[var(--text-muted)]">
            Context Nodes
          </div>
          
          <div className="flex flex-col gap-[2px]">
            {isLoading ? (
              <div className="px-4 py-3 text-[12px] text-[var(--text-muted)] animate-pulse">
                Loading nodes...
              </div>
            ) : sortedNodes.length === 0 ? (
              <div className="px-4 py-3 text-[12px] text-[var(--text-muted)]">
                No nodes found
              </div>
            ) : (
              sortedNodes.map((node) => (
                <SidebarNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={() => {
                    onSelectNode(node.id)
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose()
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto flex flex-col p-[var(--space-3)]">
          <div
            className="mb-[var(--space-3)] h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--border-strong), transparent)',
            }}
          />
          
          <button className="flex min-h-[36px] w-full items-center justify-start gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-2)] text-[var(--text-secondary)] transition-[background-color,color] duration-150 hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]">
            <Plus size={14} />
            <span className="text-body-sm font-medium">Add node</span>
          </button>
          
          <Link
            href="/settings"
            className={cn(
              "flex min-h-[36px] w-full items-center justify-start gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-2)] transition-[background-color,color] duration-150",
              pathname === '/settings'
                ? "bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
            )}
          >
            <Settings size={14} />
            <span className="text-body-sm font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </>
  )
}
