'use client'

import Link from 'next/link'

const PLATFORM_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'MCP Protocol', href: '/docs' },
  { label: 'Security Gateway', href: '/security' },
]

const RESOURCE_LINKS = [
  { label: 'Documentation', href: '/docs' },
  { label: 'API Reference', href: '/docs/api' },
  { label: 'System Status', href: '/status' },
  { label: 'Changelog', href: '/changelog' },
]

const COMPANY_LINKS = [
  { label: 'About Team', href: '/about' },
  { label: 'Tech Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Legal Policies', href: '/privacy' },
]

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--bg)] pt-20 pb-12 overflow-hidden">
      {/* Top subtle visual accent line */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--border-strong) 50%, transparent 100%)',
        }}
      />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)] relative z-10">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16">
          
          {/* Column 1: Brand Info (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col items-start text-left gap-6">
            {/* Logo */}
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition-opacity duration-150 hover:opacity-90"
            >
              <div className="relative h-8 w-8 flex items-center justify-center shrink-0 rounded-md bg-[rgba(255,255,255,0.03)] dark:bg-[rgba(255,255,255,0.02)] border border-[var(--border-strong)] shadow-[var(--shadow-sm)] dark:shadow-[0_0_10px_rgba(179,236,19,0.08)] p-1 transition-all duration-200">
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
              <span className="font-display text-[16px] font-bold tracking-tight text-[var(--text-primary)]">
                Context<span className="text-[var(--accent)]">Graph</span>
              </span>
            </Link>

            <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed max-w-[280px]">
              The cross-AI personal context engine. Build your context graph once. Feed active memory, goals, and rules to every assistant.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3.5 mt-2">
              <Link
                href="https://github.com/context-graph"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-[0.96]"
                aria-label="GitHub Repository"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true" style={{ width: '14px', height: '14px' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-[0.96]"
                aria-label="Twitter Account"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true" style={{ width: '14px', height: '14px' }}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Column 2: Platform Links (col-span-2) */}
          <div className="lg:col-span-2 flex flex-col items-start text-left gap-4 lg:pl-6">
            <span className="text-label text-[9px] text-[var(--text-secondary)] font-bold tracking-[0.12em] uppercase select-none">
              Platform
            </span>
            <ul className="flex flex-col gap-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources Links (col-span-2) */}
          <div className="lg:col-span-2 flex flex-col items-start text-left gap-4 lg:pl-6">
            <span className="text-label text-[9px] text-[var(--text-secondary)] font-bold tracking-[0.12em] uppercase select-none">
              Resources
            </span>
            <ul className="flex flex-col gap-2.5">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company Links (col-span-3) */}
          <div className="lg:col-span-3 flex flex-col items-start text-left gap-4 lg:pl-6">
            <span className="text-label text-[9px] text-[var(--text-secondary)] font-bold tracking-[0.12em] uppercase select-none">
              Company
            </span>
            <ul className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

      {/* Massive Screen-wide Watermark Brand Name Text (Outside max-w container to prevent horizontal clipping) */}
      <div className="relative select-none pointer-events-none w-full flex justify-center py-6 overflow-hidden">
        <div 
          className="font-display font-bold text-[8.5vw] uppercase leading-none tracking-[0.18em] text-[var(--text-primary)] opacity-[0.02]"
          style={{
            fontSmooth: 'always',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          ContextGraph
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)] relative z-10">

        {/* Bottom Metadata & Legal Bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col gap-4 md:flex-row items-center justify-between text-body-sm text-[var(--text-muted)]">
          <div>
            © 2026 ContextGraph. All rights reserved. Open-source under MIT License.
          </div>
          <div className="flex items-center gap-[var(--space-5)]">
            <Link href="/privacy" className="transition-colors hover:text-[var(--text-secondary)]">Privacy Policy</Link>
            <span className="opacity-30">·</span>
            <Link href="/terms" className="transition-colors hover:text-[var(--text-secondary)]">Terms of Service</Link>
            <span className="opacity-30">·</span>
            <Link href="/security" className="transition-colors hover:text-[var(--text-secondary)]">Security</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
