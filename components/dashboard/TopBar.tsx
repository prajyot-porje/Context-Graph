'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, Search, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const { data: session } = useSession()

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : '?'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn(
      'cg-topbar sticky top-0 z-[300]',
      'flex h-[60px] items-center justify-between',
      'px-[var(--space-6)]',
      'bg-[var(--nav-backdrop)] backdrop-blur-[20px] saturate-[180%]',
      'border-b border-[var(--border-strong)] [box-shadow:0_1px_12px_rgba(0,0,0,0.3)]',
      'transition-[border-color,box-shadow] duration-200'
    )}>
      <div className="flex items-center gap-[var(--space-4)]">
        <button
          className="flex h-[36px] w-[36px] items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] transition-[background-color,color] duration-100 hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-[var(--space-2)]">
          <div className="h-[6px] w-[6px] rounded-[var(--radius-full)] bg-[var(--accent)]" />
          <span className="text-body-sm font-medium text-[var(--text-secondary)]">
            All contexts
          </span>
        </div>
      </div>

      <div className="flex items-center gap-[var(--space-3)] sm:gap-[var(--space-4)]">
        <button
          className={cn(
            'flex h-[36px] w-[36px] items-center justify-center rounded-[var(--radius-md)]',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]',
            'transition-[background-color,color] duration-100',
            'max-sm:hidden',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]'
          )}
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        <ThemeToggle />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex h-[36px] w-[36px] items-center justify-center rounded-[var(--radius-full)]',
              'border border-[var(--border-strong)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)]',
              'text-[12px] font-semibold text-[var(--text-primary)]',
              '[box-shadow:var(--shadow-xs)]',
              'transition-[border-color,box-shadow] duration-150',
              'hover:border-[var(--accent)] hover:[box-shadow:var(--shadow-accent)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]'
            )}
            aria-label="User menu"
          >
            {userInitials}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-[44px] min-w-[160px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-raised)] p-1 [box-shadow:var(--shadow-lg)]">
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/login')
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:bg-[rgba(255,255,255,0.05)]"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

