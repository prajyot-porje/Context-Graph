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
    document.documentElement.classList.add('theme-transitioning')
    localStorage.setItem('cg-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('cg-theme-change'))

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 300)
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
      <div className="h-11 w-11 rounded-[var(--radius-md)] bg-transparent" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center',
        'rounded-[var(--radius-md)]',
        'text-[var(--text-secondary)]',
        'bg-transparent border border-transparent',
        'transition-[color,background-color,border-color,transform] duration-150 ease-out',
        'hover:text-[var(--text-primary)] hover:bg-[var(--surface)] hover:border-[var(--border)]',
        'active:scale-[0.96]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}

