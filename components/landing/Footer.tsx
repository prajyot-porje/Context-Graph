import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)] pb-[32px] pt-[48px]">
      <div className="mx-auto max-w-[1200px] px-[24px]">
        {/* Top row */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center md:gap-0">
          <div className="font-display text-[16px] font-bold text-[var(--text-primary)]">
            ContextGraph
          </div>
          
          <nav className="flex items-center gap-[24px]">
            <Link href="https://github.com" className="font-geist text-[14px] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
              GitHub
            </Link>
            <Link href="/docs" className="font-geist text-[14px] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
              Docs
            </Link>
            <Link href="/privacy" className="font-geist text-[14px] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
              Privacy
            </Link>
            <Link href="https://twitter.com" className="font-geist text-[14px] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)]">
              Twitter
            </Link>
          </nav>
        </div>

        {/* Bottom row */}
        <div className="mt-[32px] flex flex-col items-start justify-between gap-4 border-t border-[var(--border)] pt-[24px] md:flex-row md:items-center md:gap-0">
          <p className="font-geist text-[13px] text-[var(--text-muted)]">
            © 2026 ContextGraph. Built by Prajyot Porje.
          </p>
          <p className="font-geist text-[13px] text-[var(--text-muted)]">
            Made in Pune, India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  )
}
