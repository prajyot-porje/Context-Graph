import Link from 'next/link'

const FOOTER_LINKS = [
  { label: 'GitHub', href: 'https://github.com' },
  { label: 'Docs', href: '/docs' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Twitter', href: 'https://twitter.com' },
]

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--bg)]">
      {/* Subtle top gradient fade */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--border-strong) 50%, transparent 100%)',
        }}
      />

      <div className="mx-auto max-w-[1200px] px-[var(--space-6)] pb-[var(--space-8)] pt-[var(--space-12)]">
        {/* Top row */}
        <div className="flex flex-col items-start justify-between gap-[var(--space-6)] md:flex-row md:items-center md:gap-0">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-center font-display text-[16px] font-bold text-[var(--text-primary)] transition-opacity duration-100 hover:opacity-80"
          >
            Context
            <span className="text-[var(--accent)]">Graph</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-[var(--space-6)]">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[14px] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div
          className="mt-[var(--space-8)] h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, var(--border) 20%, var(--border) 80%, transparent 100%)',
          }}
        />

        {/* Bottom row */}
        <div className="mt-[var(--space-6)] flex flex-col items-start justify-between gap-[var(--space-4)] md:flex-row md:items-center md:gap-0">
          <p className="text-body-sm text-[var(--text-muted)]">
            © 2026 ContextGraph. Built by Prajyot Porje.
          </p>
          <p className="text-body-sm text-[var(--text-muted)]">
            Made in Pune, India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  )
}
