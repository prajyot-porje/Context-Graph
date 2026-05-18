'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
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
    
    // Dispatch custom event to notify other components (e.g. if multiple theme toggles are visible)
    window.dispatchEvent(new Event('cg-theme-change'))
  }

  // Handle theme changes from other components
  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = (localStorage.getItem('cg-theme') || 'dark') as 'dark' | 'light'
      setTheme(currentTheme)
    }
    window.addEventListener('cg-theme-change', handleThemeChange)
    return () => window.removeEventListener('cg-theme-change', handleThemeChange)
  }, [])

  if (!mounted) {
    return (
      <div className="h-[36px] w-[36px] rounded-[var(--radius-md)] bg-transparent" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-[36px] w-[36px] items-center justify-center',
        'rounded-[var(--radius-md)]',
        'text-[var(--text-secondary)]',
        'bg-transparent',
        'transition-[color,background-color] duration-150 ease-out',
        'hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}

