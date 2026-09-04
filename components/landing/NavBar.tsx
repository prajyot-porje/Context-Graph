'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { signOut, useSession } from '@/lib/auth-client'
import { LogOut, ArrowRight } from 'lucide-react'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 transition-opacity duration-150 ease-out hover:opacity-90 shrink-0"
    >
      <div className="relative h-7 w-7 flex items-center justify-center shrink-0 rounded-md bg-[rgba(255,255,255,0.03)] dark:bg-[rgba(255,255,255,0.02)] border border-[var(--border-strong)] shadow-[var(--shadow-sm)] dark:shadow-[0_0_10px_rgba(179,236,19,0.08)] p-1 transition-all duration-200">
        <div className="absolute inset-0 rounded-md bg-[var(--accent)] opacity-[0.02] blur-sm pointer-events-none dark:block hidden" />
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

function NavLinks() {
  return (
    <Link
      href="/docs"
      className={cn(
        'inline-flex items-center justify-center',
        'h-[30px] px-3',
        'rounded-[var(--radius-sm)]',
        'text-[12px] font-semibold text-[var(--text-secondary)]',
        'bg-transparent',
        'transition-[color,background-color] duration-150 ease-out',
        'hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]'
      )}
    >
      Docs
    </Link>
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
    return <div className="h-8 w-[70px] animate-pulse rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.05)]" />
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
            'hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.02)] active:scale-[0.98]',
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
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] text-left"
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
          'h-8 px-3.5',
          'rounded-[var(--radius-sm)]',
          'text-[12px] font-semibold text-[var(--text-primary)]',
          'bg-transparent border border-[var(--border-strong)]',
          'transition-[border-color,background-color,transform] duration-150 ease-out',
          'hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.02)] active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]'
        )}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className={cn(
          'inline-flex items-center justify-center',
          'h-8 px-4',
          'rounded-[var(--radius-sm)]',
          'text-[12px] font-bold',
          'bg-[var(--text-primary)] text-[var(--bg)]',
          'transition-[opacity,transform] duration-150 ease-out',
          'hover:opacity-90 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]'
        )}
      >
        Sign up
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
        gsap.set('.nav-logo, .nav-link, .nav-action', { opacity: 1, y: 0 })
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
          '.nav-link',
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
          '.nav-action',
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
    <nav
      ref={navRef}
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-[300]',
        'flex h-[54px] w-[calc(100%-2rem)] max-w-[800px] items-center justify-between',
        'px-6 rounded-full border',
        'bg-black/50 dark:bg-[#080808]/50 backdrop-blur-xl saturate-[160%]',
        'transition-[border-color,box-shadow,background-color] duration-300 ease-out',
        scrolled
          ? 'border-white/[0.08] dark:border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.5)] bg-black/65 dark:bg-[#080808]/65'
          : 'border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
      )}
    >
      <div className="nav-logo">
        <Logo />
      </div>
      
      {/* Navigation center/right items */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="nav-link">
          <ThemeToggle />
        </div>
        <div className="nav-link">
          <NavLinks />
        </div>
        <div className="nav-action">
          <NavActions />
        </div>
      </div>
    </nav>
  )
}
