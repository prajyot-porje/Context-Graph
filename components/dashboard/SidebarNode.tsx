import { User, Folder, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarNodeProps {
  node: {
    id: string
    title: string
    depth: number
  }
  isSelected: boolean
  onClick: () => void
}

export function SidebarNode({ node, isSelected, onClick }: SidebarNodeProps) {
  const isMe = node.depth === 0
  const isAgency = node.depth === 1
  const isProject = node.depth === 2

  return (
    <div
      onClick={onClick}
      className={cn(
        "cg-sidebar-node flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] py-2 pr-[10px]",
        "transition-[background-color,color] duration-150",
        isSelected
          ? "border-l-2 border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)]"
          : "border-l-2 border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
      )}
      style={{
        paddingLeft: `${8 + node.depth * 14}px`, // Adjusted base padding
      }}
    >
      <div
        className={cn(
          "shrink-0 flex items-center justify-center",
          isSelected ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
        )}
      >
        {isMe && <User size={14} />}
        {isAgency && <Folder size={14} />}
        {isProject && <FileText size={14} />}
      </div>
      <span className="text-[13px] font-medium">{node.title}</span>
    </div>
  )
}
