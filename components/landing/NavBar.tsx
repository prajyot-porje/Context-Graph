'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { signOut, useSession } from '@/lib/auth-client'
import { LogOut } from 'lucide-react'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 transition-opacity duration-150 ease-out hover:opacity-90 shrink-0"
    >
      <div className="relative h-7 w-7 flex items-center justify-center shrink-0 rounded-md bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow-xs)] p-1 transition-[border-color,background-color] duration-150">
        <div className="absolute inset-0 rounded-md bg-[var(--accent)] opacity-[var(--logo-glow-opacity)] blur-sm pointer-events-none" />
        <img
          src="/icons/logo-dark.png"
          alt="ContextGraph Icon"
          className="theme-logo-light h-full w-full object-contain"
        />
        <img
          src="/icons/logo-light.png"
          alt="ContextGraph Icon"
          className="theme-logo-dark h-full w-full object-contain"
        />
      </div>
      <span className="font-display text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
        Context<span className="text-[var(--accent)] font-extrabold">Graph</span>
      </span>
    </Link>
  )
}

const NAV_SECTIONS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Comparison', href: '#benchmarks' },
  { label: 'Docs', href: '/docs' },
]

function NavCenterLinks() {
  return (
    <div className="hidden md:flex items-center gap-1">
      {NAV_SECTIONS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            'inline-flex items-center justify-center',
            'h-8 px-3.5',
            'rounded-[var(--radius-sm)]',
            'text-[13px] font-medium text-[var(--text-secondary)]',
            'bg-transparent',
            'transition-[color,background-color] duration-150 ease-out',
            'hover:text-[var(--text-primary)] hover:bg-[var(--surface)]',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]'
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

function NavActions() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (isPending) {
    return <div className="h-8 w-[70px] animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface)]" />
  }

  if (session) {
    const userInitials = session.user?.name
      ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : '?'

    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className={cn(
            'hidden sm:inline-flex items-center justify-center',
            'h-8 px-3.5',
            'rounded-[var(--radius-sm)]',
            'text-[12px] font-semibold text-[var(--text-primary)]',
            'border border-[var(--border-strong)] bg-transparent',
            'transition-[border-color,background-color,transform] duration-150 ease-out',
            'hover:border-[var(--accent)] hover:bg-[var(--surface)] active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]'
          )}
        >
          Dashboard
        </Link>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              'border border-[var(--border-strong)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)]',
              'text-[11px] font-bold text-[var(--text-primary)]',
              '[box-shadow:var(--shadow-xs)]',
              'transition-[border-color,box-shadow] duration-150',
              'hover:border-[var(--accent)] hover:[box-shadow:var(--shadow-accent)]',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]'
            )}
            aria-label="User menu"
          >
            {userInitials}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-[38px] min-w-[150px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-raised)] p-1 [box-shadow:var(--shadow-lg)] z-[400]">
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/login')
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)] text-left"
              >
                <LogOut size={12} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className={cn(
          'inline-flex items-center justify-center',
          'h-8 px-4',
          'rounded-[var(--radius-sm)]',
          'text-[12px] font-bold',
          'bg-[var(--accent)] text-[var(--accent-fg)] shadow-[var(--shadow-xs)]',
          'transition-[opacity,transform,filter] duration-150 ease-out',
          'hover:opacity-95 hover:brightness-105 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]'
        )}
      >
        Get Started
      </Link>
    </div>
  )
}

export function NavBar() {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.nav-logo, .nav-links, .nav-action, .nav-theme', { opacity: 1, y: 0 })
        return
      }

      const tl = gsap.timeline({ delay: 0.15 })
      tl.from('.nav-logo', {
        opacity: 0,
        x: -6,
        duration: 0.3,
        ease: 'cg-out',
      })
        .from(
          '.nav-links a',
          {
            opacity: 0,
            y: -4,
            duration: 0.2,
            ease: 'cg-out',
            stagger: 0.04,
          },
          0.1
        )
        .from(
          '.nav-action, .nav-theme',
          {
            opacity: 0,
            y: -4,
            duration: 0.2,
            ease: 'cg-out',
            stagger: 0.04,
          },
          0.15
        )
    },
    { scope: navRef }
  )

  return (
    <header
      ref={navRef}
      className={cn(
        'sticky top-0 z-[300] w-full',
        'border-b transition-[border-color,box-shadow,background-color] duration-200 ease-out',
        'bg-[var(--nav-backdrop)] backdrop-blur-xl saturate-[160%]',
        scrolled
          ? 'border-[var(--border-strong)] shadow-[var(--shadow-sm)]'
          : 'border-[var(--border)]'
      )}
    >
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-[var(--space-6)]">
        {/* Left: Logo */}
        <div className="nav-logo flex items-center">
          <Logo />
        </div>

        {/* Center: Section Anchor Links */}
        <nav className="nav-links">
          <NavCenterLinks />
        </nav>

        {/* Right: Actions + ThemeToggle */}
        <div className="flex items-center gap-3">
          <div className="nav-action">
            <NavActions />
          </div>
          <div className="nav-theme">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
