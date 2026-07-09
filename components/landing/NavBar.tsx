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
      className="inline-flex items-center gap-3 transition-opacity duration-100 ease-out hover:opacity-90"
    >
      <div className="relative h-10 w-10 flex items-center justify-center shrink-0 rounded-lg bg-[rgba(255,255,255,0.03)] dark:bg-[rgba(255,255,255,0.02)] border border-[var(--border-strong)] shadow-[var(--shadow-sm)] dark:shadow-[0_0_15px_rgba(179,236,19,0.12)] p-1.5 transition-all duration-200">
        <div className="absolute inset-0 rounded-lg bg-[var(--accent)] opacity-[0.03] blur-sm pointer-events-none dark:block hidden" />
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
      <span className="font-display text-[19px] font-bold tracking-tight text-[var(--text-primary)]">
        Context<span className="text-[var(--accent)]">Graph</span>
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
        'h-[36px] px-[16px]',
        'rounded-[var(--radius-md)]',
        'text-[14px] font-medium text-[var(--text-secondary)]',
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
    return <div className="h-[36px] w-[80px] animate-pulse rounded-[var(--radius-md)] bg-[rgba(255,255,255,0.05)]" />
  }

  if (session) {
    const userInitials = session.user?.name
      ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : '?'

    return (
      <div className="flex items-center gap-[var(--space-3)]">
        <Link
          href="/dashboard"
          className={cn(
            'hidden sm:inline-flex items-center justify-center',
            'min-h-11 px-[18px]',
            'rounded-[var(--radius-md)]',
            'text-[14px] font-medium text-[var(--text-primary)]',
            'border border-[var(--border-strong)] bg-transparent',
            'transition-[border-color,background-color,transform] duration-150 ease-out',
            'hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.03)] active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
          )}
        >
          Dashboard
        </Link>
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
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-[var(--space-3)]">
      <Link
        href="/login"
        className={cn(
          'hidden sm:inline-flex items-center justify-center',
          'min-h-11 px-[18px]',
          'rounded-[var(--radius-md)]',
          'text-[14px] font-medium text-[var(--text-primary)]',
          'bg-transparent border border-[var(--border-strong)]',
          'transition-[border-color,background-color,transform] duration-150 ease-out',
          'hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.03)] active:scale-[0.97]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
        )}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className={cn(
          'inline-flex items-center justify-center',
          'min-h-11 px-[22px]',
          'rounded-[var(--radius-md)]',
          'text-[14px] font-semibold',
          'bg-[var(--text-primary)] text-[var(--bg)]',
          'transition-[opacity,transform] duration-150 ease-out',
          'hover:opacity-90 active:scale-[0.97]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'
        )}
      >
        Start Building
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

      const tl = gsap.timeline({ delay: 0.05 })
      tl.from('.nav-logo', {
        opacity: 0,
        x: -8,
        duration: 0.3,
        ease: 'cg-out',
      })
        .from(
          '.nav-link',
          {
            opacity: 0,
            y: -6,
            duration: 0.2,
            ease: 'cg-out',
            stagger: 0.05,
          },
          0.1
        )
        .from(
          '.nav-action',
          {
            opacity: 0,
            y: -6,
            duration: 0.2,
            ease: 'cg-out',
            stagger: 0.05,
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
        'sticky top-0 z-[300]',
        'flex h-[60px] items-center justify-between',
        'px-[var(--space-6)]',
        'bg-[var(--nav-backdrop)] backdrop-blur-[20px] saturate-[180%]',
        'transition-[border-color,box-shadow] duration-200',
        scrolled
          ? 'border-b border-[var(--border-strong)] [box-shadow:0_1px_12px_rgba(0,0,0,0.3)]'
          : 'border-b border-transparent'
      )}
    >
      <div className="nav-logo">
        <Logo />
      </div>
      <div className="flex items-center gap-[var(--space-3)] sm:gap-[var(--space-4)]">
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
