'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('cg-theme') as 'dark' | 'light' | null
    if (stored) {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
      const defaultTheme = prefersLight ? 'light' : 'dark'
      setTheme(defaultTheme)
      document.documentElement.setAttribute('data-theme', defaultTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('cg-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div className="cg-topbar flex h-[56px] items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-5 max-sm:h-[52px]">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-[6px] w-[6px] rounded-full bg-[var(--accent)]" />
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">
            All contexts
          </span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={toggleTheme}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]",
              "transition-[background-color,color] duration-100",
              "max-sm:hidden"
            )}
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        )}

        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            "border border-[var(--accent)] bg-[var(--accent-muted)]",
            "text-[12px] font-semibold text-[var(--accent)]",
            "transition-opacity hover:opacity-90"
          )}
        >
          PJ
        </button>
      </div>
    </div>
  )
}
