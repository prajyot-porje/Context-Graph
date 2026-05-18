import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--text-primary)] text-[var(--bg)]',
    'hover:opacity-90 active:opacity-80',
    'shadow-[var(--shadow-xs)]',
    'hover:shadow-[var(--shadow-sm)]',
  ].join(' '),
  secondary: [
    'border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)]',
    'hover:border-[rgba(255,255,255,0.28)] hover:bg-[rgba(255,255,255,0.04)]',
    'active:bg-[var(--card-raised)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-secondary)]',
    'hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]',
    'active:bg-[var(--card-raised)]',
  ].join(' '),
  accent: [
    'bg-[var(--accent)] text-[var(--on-accent)]',
    'hover:bg-[var(--accent-soft)] active:opacity-90',
    'shadow-[0_0_0_1px_rgba(179,236,19,0.2)]',
    'hover:shadow-[0_0_16px_rgba(179,236,19,0.15),0_0_0_1px_rgba(179,236,19,0.3)]',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-[var(--space-4)] text-[12px]',
  md: 'min-h-[44px] px-[var(--space-5)] text-[14px]',
  lg: 'min-h-[44px] px-[var(--space-6)] text-[14px]',
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
        'inline-flex items-center justify-center gap-[var(--space-2)]',
        'rounded-[var(--radius-md)] font-medium',
        'cursor-pointer select-none whitespace-nowrap',
        'transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-100 ease-out',
        (variant === 'primary' || variant === 'accent') && 'hover:-translate-y-[1px] active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        'disabled:pointer-events-none disabled:opacity-40',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}
