# ContextGraph Component Patterns

## Rules Before Building Any Component
1. Read `DESIGN.md` for tokens, spacing, and interaction rules.
2. Use CSS custom properties for all colors, shadows, radii, and special surfaces.
3. Keep spacing on the 4px grid.
4. Give every interactive element default, hover, focus-visible, active, and disabled states.
5. Keep minimum interactive hit targets at 44x44px.
6. Make dark and light mode work through `data-theme`.
7. If a component needs a special visual surface, add a named token in the theme layer first.

## Component File Structure
```tsx
'use client' // only when needed

import { cn } from '@/lib/utils'

interface ComponentNameProps {
  // explicit typed props
}

export function ComponentName(props: ComponentNameProps) {
  return <div />
}
```

## Button Component Pattern
```tsx
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--text-primary)] text-[var(--bg)] hover:opacity-90',
  secondary: 'border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--card)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  accent: 'bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-soft)]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-[12px]',
  md: 'min-h-11 px-5 text-[14px]',
  lg: 'min-h-11 px-6 text-[14px]',
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
        'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium',
        'transition-[background-color,color,border-color,box-shadow,opacity] duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
```

## Card Component Pattern
```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  elevated?: boolean
}

export function Card({ children, className, elevated = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border)] p-6',
        'bg-[linear-gradient(to_bottom,var(--card-raised),var(--card))]',
        '[box-shadow:var(--shadow-sm),var(--shadow-inset)]',
        elevated && [
          'transition-[border-color,box-shadow] duration-200',
          'hover:border-[var(--border-strong)]',
          'hover:[box-shadow:var(--shadow-md),var(--shadow-inset)]',
        ],
        className
      )}
    >
      {children}
    </div>
  )
}
```

## Input Component Pattern
```tsx
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
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

      <input
        id={id}
        className={cn(
          'h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] px-4',
          'bg-[var(--surface)] text-[15px] text-[var(--text-primary)]',
          'placeholder:text-[var(--text-muted)]',
          'transition-[border-color,box-shadow] duration-150',
          'focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:[box-shadow:var(--shadow-accent)]',
          error && 'border-[var(--error)]',
          className
        )}
        {...props}
      />

      {error ? <p className="text-[13px] text-[var(--error)]">{error}</p> : null}
    </div>
  )
}
```

## Graph Node Component Pattern
For graph nodes, prefer semantic classes over raw per-node color values inside JSX.

```tsx
import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import { cn } from '@/lib/utils'

interface ContextNodeData {
  scope: string
  title: string
  relevance: number
  depth: 0 | 1 | 2
}

export function ContextNode({ data, selected }: NodeProps<ContextNodeData>) {
  return (
    <div
      data-node-root={data.depth === 0}
      data-node-depth={data.depth}
      className={cn(
        'context-node min-w-[120px] rounded-[var(--radius-lg)] border px-4 py-3',
        'transition-[border-color,box-shadow] duration-200',
        data.depth === 0 && 'context-node--root',
        data.depth === 1 && 'context-node--branch',
        data.depth === 2 && 'context-node--leaf',
        selected && 'context-node--selected'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-[var(--border-strong)]" />

      <p className="text-[13px] font-semibold text-[var(--text-primary)]">
        {data.title}
      </p>

      <div className="mt-2 h-1 w-full rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${data.relevance * 100}%` }}
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[var(--border-strong)]" />
    </div>
  )
}
```

Add the visual values for `.context-node--root`, `.context-node--branch`,
`.context-node--leaf`, and `.context-node--selected` in the theme layer or a
co-located stylesheet so the JSX stays token-driven.

## Navigation Bar Pattern
If a component needs translucent chrome, promote it to tokens first. Example:
- `--nav-backdrop`
- `--nav-backdrop-light`

```tsx
export function NavBar() {
  return (
    <nav
      className={cn(
        'sticky top-0 z-[300] h-[60px]',
        'flex items-center justify-between px-6',
        'border-b border-[var(--border)]',
        'bg-[var(--nav-backdrop)] backdrop-blur-[20px] saturate-[180%]'
      )}
    >
      <Logo />
      <NavLinks />
      <NavActions />
    </nav>
  )
}
```

## Code Block Pattern
Special surfaces should use named tokens such as `--code-surface` and
`--code-text`, not raw color literals in components.

```tsx
interface CodeBlockProps {
  code: string
  language?: string
  showCopy?: boolean
}

export function CodeBlock({
  code,
  language = 'json',
  showCopy = true,
}: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--code-surface)]">
      {language ? (
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {language}
          </span>
          {showCopy ? <CopyButton text={code} /> : null}
        </div>
      ) : null}

      <pre className="overflow-x-auto p-5">
        <code className="font-mono text-[13px] leading-[1.6] text-[var(--code-text)]">
          {code}
        </code>
      </pre>
    </div>
  )
}
```

## Badge Pattern
Prefer semantic badge tokens over inline rgba values. For example:
- `--badge-default-bg`
- `--badge-success-bg`
- `--badge-warning-bg`
- `--badge-error-bg`

```tsx
type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error'

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: BadgeVariant
}) {
  const variants = {
    default: 'bg-[var(--badge-default-bg)] text-[var(--text-secondary)]',
    accent: 'bg-[var(--accent-muted)] text-[var(--accent)]',
    success: 'bg-[var(--badge-success-bg)] text-[var(--success)]',
    warning: 'bg-[var(--badge-warning-bg)] text-[var(--warning)]',
    error: 'bg-[var(--badge-error-bg)] text-[var(--error)]',
  }

  return (
    <span className={cn('inline-flex items-center rounded-[var(--radius-full)] px-3 py-1 text-[13px]', variants[variant])}>
      {children}
    </span>
  )
}
```

## Section Label Pattern
```tsx
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
      {children}
    </p>
  )
}
```

## `cn()` Utility
Ensure this exists at `/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
