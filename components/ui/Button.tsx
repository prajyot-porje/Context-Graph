import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/**
 * Design-system Button.
 *
 * All variants use --radius-md (10px). Never pill-shaped.
 * Every size guarantees a minimum 44px hit target (DESIGN.md rule).
 *
 * Hover transitions target specific properties — never `transition: all`.
 */

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--text-primary)] text-[var(--bg)] hover:opacity-90 active:opacity-80',
  secondary:
    'border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--card)] active:bg-[var(--card-raised)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card)] active:bg-[var(--card-raised)]',
  accent:
    'bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-soft)] active:opacity-90',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-4 text-[12px]',
  md: 'min-h-[44px] px-5 text-[14px]',
  lg: 'min-h-[44px] px-6 text-[14px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        /* base */
        'inline-flex items-center justify-center gap-2',
        'rounded-[var(--radius-md)] font-medium',
        'cursor-pointer select-none whitespace-nowrap',
        /* transition — specific properties only */
        'transition-[background-color,color,border-color,box-shadow,opacity] duration-100 ease-out',
        /* focus-visible ring */
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        /* disabled */
        'disabled:pointer-events-none disabled:opacity-40',
        /* variant + size */
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}
