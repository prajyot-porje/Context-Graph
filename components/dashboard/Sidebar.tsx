'use client'

import { Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { mockNodes } from '@/lib/mock-data'
import { SidebarNode } from './SidebarNode'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedNodeId: string
  onSelectNode: (id: string) => void
}

export function Sidebar({ isOpen, onClose, selectedNodeId, onSelectNode }: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={cn(
          "fixed inset-0 z-[390] bg-black/50 lg:hidden transition-opacity duration-300",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "cg-sidebar flex h-full w-[240px] flex-col border-r border-[var(--border)] bg-[var(--surface)] p-[16px_12px]",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[400]",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        {/* Top Section */}
        <div className="flex flex-col">
          <div className="mb-1 p-[8px_8px_8px_8px] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Context Nodes
          </div>
          
          <div className="flex flex-col gap-[2px]">
            {mockNodes.map((node) => (
              <SidebarNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={() => {
                  onSelectNode(node.id)
                  if (window.innerWidth < 1024) onClose()
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto flex flex-col">
          <div className="mb-3 h-px w-full bg-[var(--border)]" />
          
          <button className="flex w-full items-center justify-start gap-2 rounded-[var(--radius-sm)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]">
            <Plus size={14} />
            <span className="text-[13px] font-medium">Add node</span>
          </button>
          
          <Link
            href="/settings"
            className="flex w-full items-center justify-start gap-2 rounded-[var(--radius-sm)] p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
          >
            <Settings size={14} />
            <span className="text-[13px] font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </>
  )
}
