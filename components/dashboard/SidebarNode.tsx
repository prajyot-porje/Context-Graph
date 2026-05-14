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
        "cg-sidebar-node flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] py-2 pr-[10px]",
        "transition-[background-color,color] duration-150",
        isSelected
          ? "border-l-2 border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]"
          : "border-l-2 border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-white/5"
      )}
      style={{
        paddingLeft: `${8 + node.depth * 16}px`, // Adjusted base padding to 8px since there's a 2px border
      }}
    >
      <div
        className={cn(
          "shrink-0 rounded-full",
          isMe && "h-2 w-2 bg-[var(--accent)]",
          isAgency && "h-[6px] w-[6px] bg-[var(--text-secondary)]",
          isProject && "h-1 w-1 bg-[var(--text-muted)]"
        )}
      />
      <span className="text-[13px] font-medium">{node.title}</span>
    </div>
  )
}
