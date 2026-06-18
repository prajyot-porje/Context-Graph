'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Menu, X, Search, LogOut, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import Link from 'next/link'
import { useGraph } from '@/components/providers/GraphProvider'
import { getNodePath } from '@/lib/graph-utils'

export function TopBar({
  onToggleSidebar,
  onPreviewClick,
  mobileSidebarOpen = false,
  setMobileSidebarOpen,
}: {
  onToggleSidebar: () => void
  onPreviewClick: () => void
  mobileSidebarOpen?: boolean
  setMobileSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const { data: session } = useSession()

  const { nodes, selectedNodeId, setSelectedNodeId } = useGraph()
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null

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
          className="cg-mobile-menu-btn"
          onClick={() => {
            onToggleSidebar()
            setMobileSidebarOpen?.(prev => !prev)
          }}
          style={{
            display: 'none',  // overridden by CSS on mobile
            padding: '6px', border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--text-primary)',
          }}
          aria-label="Toggle mobile menu"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          href="/dashboard"
          className={cn(
            'inline-flex items-center gap-0',
            'font-display text-[18px] font-bold tracking-tight',
            'text-[var(--text-primary)]',
            'transition-opacity duration-100 ease-out hover:opacity-80'
          )}
        >
          Context
          <span className="text-[var(--accent)]">Graph</span>
        </Link>

        <div className="hidden sm:flex items-center gap-[var(--space-2)] border-l border-[var(--border)] pl-[var(--space-4)] ml-[var(--space-1)]">
          {selectedNode === null ? (
            <span style={{ fontSize:'12px', letterSpacing:'0.05em', color:'var(--text-muted-dark, var(--text-secondary))' }}>
              All Contexts
            </span>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              {getNodePath(nodes, selectedNode).map((n, i, arr) => (
                <React.Fragment key={n.id}>
                  {i < arr.length - 1 ? (
                    <>
                      <button
                        onClick={() => setSelectedNodeId(n.id)}
                        style={{
                          fontSize:'12px',
                          color:'var(--text-muted-dark, var(--text-secondary))',
                          background:'none',
                          border:'none',
                          cursor:'pointer',
                          padding:0,
                        }}
                      >
                        {n.title}
                      </button>
                      <span style={{ fontSize:'12px', color:'var(--text-muted-dark, var(--text-secondary))' }}>→</span>
                    </>
                  ) : (
                    <span style={{ fontSize:'12px', color:'var(--text-primary-dark, var(--text-primary))', fontWeight:600 }}>
                      {n.title}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
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

        <button
          onClick={onPreviewClick}
          className={cn(
            'flex h-[36px] items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent px-3',
            'text-[13px] font-medium text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[var(--border-strong)]',
            'transition-[background-color,border-color] duration-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]'
          )}
          title="Preview Context"
        >
          <Eye size={15} />
          <span className="hidden md:inline">Preview Context</span>
          <span className="md:hidden">Preview</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#b3ec13',
            display: 'inline-block',
            animation: 'livePulse 2s ease-in-out infinite'
          }} />
          <span style={{
            fontSize: '11px',
            letterSpacing: '0.05em',
            color: 'var(--text-muted-dark)',
            fontFamily: 'var(--font-geist)'
          }}>Live</span>
        </div>

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

