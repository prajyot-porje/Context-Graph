import { User, Folder, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarNodeProps {
  node: {
    id: string
    title: string
    depth: number
    relevance?: number
  }
  isSelected: boolean
  onClick: () => void
}

export function SidebarNode({ node, isSelected, onClick }: SidebarNodeProps) {
  const isMe = node.depth === 0
  const isAgency = node.depth === 1
  const isProject = node.depth === 2

  // Determine indicator dot colors from DESIGN.md
  let dotBg = 'bg-[var(--text-secondary)]'
  if (isMe) dotBg = 'bg-[var(--accent)]'
  else if (isAgency) dotBg = 'bg-[var(--text-primary)]'

  return (
    <div className="relative flex items-center w-full">
      {/* Indentation guide line for branches/leaves */}
      {node.depth > 0 && (
        <div 
          className="absolute top-0 bottom-0 border-l border-[var(--border)]"
          style={{
            left: `${8 + (node.depth - 1) * 16 + 5}px`,
          }}
        />
      )}

      <button
        onClick={onClick}
        className={cn(
          "cg-sidebar-node flex-1 flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] py-2 pr-[10px] text-left",
          "transition-[background-color,color,border-color] duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
          isSelected
            ? "border-l border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)] [box-shadow:var(--shadow-inset)]"
            : "border-l border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)] hover:translate-x-[2px]"
        )}
        style={{
          paddingLeft: `${8 + node.depth * 16}px`,
          minHeight: '40px',
        }}
      >
        {/* Concentric node depth circle indicator */}
        <div
          className={cn(
            "shrink-0 flex items-center justify-center w-5 h-5 rounded-full border transition-colors duration-100",
            isSelected 
              ? "border-[var(--accent)] bg-[var(--accent-muted)]" 
              : "border-[var(--border-strong)] bg-white/[0.02]"
          )}
        >
          {isMe && <User size={10} className={isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"} />}
          {isAgency && <Folder size={10} className={isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"} />}
          {isProject && <FileText size={10} className={isSelected ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"} />}
        </div>

        <span className="text-[13px] font-medium truncate flex-1">{node.title}</span>

        {/* Small relevance badge indicator if present */}
        {node.relevance !== undefined && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-60">
            {Math.round(node.relevance * 100)}%
          </span>
        )}
      </button>
    </div>
  )
}

