'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

function Logo() {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center',
        'font-display text-[18px] font-bold tracking-tight',
        'text-[var(--text-primary)]',
        'transition-opacity duration-100 ease-out hover:opacity-80'
      )}
    >
      Context
      <span className="text-[var(--accent)]">Graph</span>
    </Link>
  )
}

function NavLinks() {
  return (
    <Link
      href="/docs"
      className={cn(
        'inline-flex items-center justify-center',
        'h-[36px] px-[16px]',
        'rounded-[var(--radius-md)]',
        'font-geist text-[14px] font-medium text-[var(--text-secondary)]',
        'bg-transparent',
        'transition-[color,background-color] duration-150 ease-out',
        'hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
      )}
    >
      Docs
    </Link>
  )
}

function NavActions() {
  return (
    <>
      <Link
        href="/login"
        className={cn(
          'hidden sm:inline-flex items-center justify-center',
          'h-[36px] px-[16px]',
          'rounded-[var(--radius-md)]',
          'font-geist text-[14px] font-medium text-[var(--text-primary)]',
          'bg-transparent border border-[var(--border-strong)]',
          'transition-[border-color,background-color] duration-150 ease-out',
          'hover:border-[rgba(255,255,255,0.28)] hover:bg-[rgba(255,255,255,0.04)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
        )}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className={cn(
          'inline-flex items-center justify-center',
          'h-[36px] px-[20px]',
          'rounded-[var(--radius-md)]',
          'font-geist text-[14px] font-semibold',
          'transition-opacity duration-150 ease-out',
          'hover:opacity-90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
        )}
        style={{ color: 'var(--bg)', backgroundColor: 'var(--text-primary)' }}
      >
        Get Started
      </Link>
    </>
  )
}

export function NavBar() {
  return (
    <nav
      className={cn(
        'sticky top-0 z-[300]',
        'flex h-[60px] items-center justify-between',
        'px-[var(--space-6)]',
        'border-b border-[var(--border)]',
        'bg-[var(--nav-backdrop)] backdrop-blur-[20px] saturate-[180%]'
      )}
    >
      <Logo />
      <div className="flex items-center gap-[8px]">
        <NavLinks />
        <NavActions />
      </div>
    </nav>
  )
}
