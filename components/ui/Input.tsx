'use client'
import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const generatedId=useId()
  const inputId=id||generatedId
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]"
        >
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error?`${inputId}-error`:props['aria-describedby']}
        className={cn(
          'h-[44px] w-full rounded-[var(--radius-md)] border border-[var(--border)] px-4',
          'bg-[var(--surface)] text-[15px] text-[var(--text-primary)]',
          'placeholder:text-[var(--text-secondary)]',
          'transition-[border-color,box-shadow] duration-150 ease-out',
          'focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:[box-shadow:var(--shadow-accent)]',
          error && 'border-[var(--error)] focus-visible:border-[var(--error)] focus-visible:[box-shadow:none]',
          className
        )}
        {...props}
      />

      {error ? <p id={`${inputId}-error`} className="text-[13px] text-[var(--error)]">{error}</p> : null}
    </div>
  )
}
