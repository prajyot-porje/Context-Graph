import { cn } from '@/lib/utils'

interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export function Pill({ selected, className, children, ...props }: PillProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-full)] border px-[20px] py-[8px] text-[14px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        selected
          ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]'
          : 'border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
