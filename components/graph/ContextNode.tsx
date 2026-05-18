'use client'

import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import { cn } from '@/lib/utils'
import type { ContextNodeData } from '@/lib/graph-utils'

export function ContextNode({ data, selected }: NodeProps<ContextNodeData>) {
  const isRoot = data.depth === 0
  const isBranch = data.depth === 1
  const isLeaf = data.depth === 2

  return (
    <div
      data-node-root={isRoot ? 'true' : undefined}
      data-node-depth={data.depth}
      className={cn(
        'cursor-pointer rounded-[var(--radius-lg)]',
        'transition-[border-color,box-shadow] duration-150',
        // ---- Root (ME) node ----
        isRoot && [
          'min-w-[140px] border px-[18px] py-[14px]',
          'border-[var(--border-strong)]',
          'bg-[linear-gradient(180deg,var(--surface)_0%,var(--card-raised)_100%)]',
          'shadow-[var(--shadow-md),var(--shadow-inset)]',
        ],
        // ---- Branch (depth 1) ----
        isBranch && [
          'min-w-[120px] border px-[16px] py-[12px]',
          'border-[var(--border)]',
          'bg-[linear-gradient(180deg,var(--card-raised)_0%,var(--card)_100%)]',
          'shadow-[var(--shadow-sm),var(--shadow-inset)]',
        ],
        // ---- Leaf (depth 2) ----
        isLeaf && [
          'min-w-[100px] border px-[16px] py-[12px]',
          'border-[rgba(255,255,255,0.07)]',
          'bg-[linear-gradient(180deg,var(--card-raised)_0%,var(--card)_100%)]',
          'shadow-[var(--shadow-xs)]',
        ],
        // ---- Selected state ----
        selected && '!border-[var(--accent)] !shadow-[var(--shadow-accent),var(--shadow-md)]'
      )}
    >
      {/* Target handle (top) — hidden visually */}
      <Handle
        type="target"
        position={Position.Top}
        className="!opacity-0 !w-2 !h-2"
      />

      {/* Title */}
      <p
        className={cn(
          isRoot && 'font-display text-[16px] font-bold text-[var(--text-primary)]',
          isBranch && 'font-sans text-[13px] font-semibold text-[var(--text-primary)]',
          isLeaf && 'font-sans text-[12px] font-normal text-[var(--text-secondary)]'
        )}
      >
        {data.title}
      </p>

      {/* Scope label */}
      <p className="mt-[4px] font-sans text-[10px] text-[var(--text-muted)]">
        {data.scope}
      </p>

      {/* Relevance bar */}
      <div className="mt-[8px] h-[3px] w-full rounded-full bg-[var(--border-strong)]">
        <div
          className="h-[3px] rounded-full bg-[var(--accent)]"
          style={{ width: `${data.relevance * 100}%` }}
        />
      </div>

      {/* Source handle (bottom) — hidden visually */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !w-2 !h-2"
      />
    </div>
  )
}
