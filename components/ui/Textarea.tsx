import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]"
        >
          {label}
        </label>
      ) : null}

      <textarea
        id={id}
        className={cn(
          'w-full rounded-[var(--radius-md)] border border-[var(--border)] p-3 px-4',
          'bg-[var(--surface)] text-[15px] text-[var(--text-primary)]',
          'placeholder:text-[var(--text-muted)]',
          'transition-[border-color,box-shadow] duration-150 ease-out',
          'focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:[box-shadow:var(--shadow-accent)]',
          error && 'border-[var(--error)] focus-visible:border-[var(--error)] focus-visible:[box-shadow:none]',
          className
        )}
        {...props}
      />

      {error ? <p className="text-[13px] text-[var(--error)]">{error}</p> : null}
    </div>
  )
}
