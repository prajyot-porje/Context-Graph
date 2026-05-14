import { useRef } from 'react'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.cg-back-link, .cg-heading, .cg-subtext, .cg-field, .cg-submit, .cg-right-panel', {
          opacity: 1,
          y: 0,
          x: 0,
        })
        return
      }

      const tl = gsap.timeline()

      tl.from('.cg-back-link', {
        opacity: 0,
        duration: 0.2,
        ease: 'cg-out',
      })
        .from(
          '.cg-heading',
          {
            opacity: 0,
            y: 20,
            duration: 0.35,
            ease: 'cg-out',
          },
          0
        )
        .from(
          '.cg-subtext',
          {
            opacity: 0,
            y: 12,
            duration: 0.25,
            ease: 'cg-out',
          },
          0.05
        )
        .from(
          '.cg-field',
          {
            opacity: 0,
            y: 16,
            stagger: 0.06,
            duration: 0.25,
            ease: 'cg-out',
          },
          0.1
        )
        .from(
          '.cg-submit',
          {
            opacity: 0,
            y: 8,
            duration: 0.2,
            ease: 'cg-spring',
          },
          0.2
        )
        .from(
          '.cg-right-panel',
          {
            opacity: 0,
            x: 20,
            duration: 0.5,
            ease: 'cg-out',
          },
          0.1
        )
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className="flex min-h-screen w-full flex-row bg-[var(--bg)]">
      {/* Left panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-[48px_40px]">
        <Link
          href="/"
          className="cg-back-link absolute left-8 top-8 text-[14px] font-medium text-[var(--text-secondary)] transition-[color] duration-150 hover:text-[var(--text-primary)]"
        >
          ← ContextGraph
        </Link>
        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>

      {/* Right panel */}
      <div className="cg-right-panel hidden w-[480px] min-h-screen flex-col items-center justify-center border-l border-[var(--border)] bg-[var(--surface)] p-8 lg:flex">
        <div className="relative flex h-[480px] w-full max-w-[480px] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)] p-[var(--space-6)] [box-shadow:var(--shadow-lg),var(--shadow-inset)]">
          {/* Background Grid Pattern */}
          <div
            className="absolute inset-0 z-0 rounded-[var(--radius-xl)]"
            style={{
              backgroundImage: `radial-gradient(var(--graph-dot) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Mock Graph Elements */}
          <div className="relative z-10 flex w-full flex-col items-center pb-[var(--space-8)] pt-[var(--space-4)]">
            {/* Root Node */}
            <div className="relative z-10 flex min-w-[160px] flex-col items-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-gradient-to-b from-[var(--surface)] to-[var(--bg)] p-[var(--space-4)] [box-shadow:var(--shadow-md),var(--shadow-inset)]">
              <span className="text-display-sm text-[var(--text-primary)]">
                @user
              </span>
              <div className="mt-[var(--space-3)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                <div className="h-full w-full rounded-[var(--radius-full)] bg-[var(--accent)]" />
              </div>
            </div>

            {/* Gap 1 with Edge SVG */}
            <div className="relative z-0 -my-[var(--space-1)] h-[var(--space-16)] w-full">
              <svg
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <path
                  d="M 50 0 C 50 50, 25 50, 25 100"
                  fill="none"
                  stroke="var(--graph-edge)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M 50 0 C 50 50, 75 50, 75 100"
                  fill="none"
                  stroke="var(--graph-edge)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* Branch Nodes Row */}
            <div className="z-10 grid w-full grid-cols-2 gap-[var(--space-4)] px-[var(--space-4)]">
              {/* Branch 1 */}
              <div className="flex justify-center">
                <div className="relative flex w-full max-w-[140px] flex-col items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-[var(--space-3)] [box-shadow:var(--shadow-sm),var(--shadow-inset)]">
                  <span className="text-heading-sm text-[var(--text-secondary)]">
                    Projects
                  </span>
                  <div className="mt-[var(--space-2)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                    <div className="h-full w-[85%] rounded-[var(--radius-full)] bg-[var(--success)]" />
                  </div>
                </div>
              </div>

              {/* Branch 2 (Selected) */}
              <div className="flex justify-center">
                <div className="relative flex w-full max-w-[140px] flex-col items-center rounded-[var(--radius-md)] border border-[var(--accent)] bg-[var(--card)] p-[var(--space-3)] [box-shadow:var(--shadow-accent),var(--shadow-md)]">
                  <span className="text-heading-sm text-[var(--text-primary)]">
                    Identity
                  </span>
                  <div className="mt-[var(--space-2)] h-1 w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                    <div className="h-full w-[60%] rounded-[var(--radius-full)] bg-[var(--warning)]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Gap 2 with Edge SVG */}
            <div className="relative z-0 -my-[var(--space-1)] h-[var(--space-16)] w-full">
              <svg
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <path
                  d="M 25 0 C 25 50, 50 50, 50 100"
                  fill="none"
                  stroke="var(--graph-edge)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* Leaf Node */}
            <div className="relative z-10 flex min-w-[120px] flex-col items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] p-[var(--space-2)] [box-shadow:var(--shadow-xs)]">
              <span className="text-body-sm text-[var(--text-muted)]">
                Devflow
              </span>
              <div className="mt-[var(--space-1)] h-[2px] w-full rounded-[var(--radius-full)] bg-[var(--border)]">
                <div className="h-full w-[40%] rounded-[var(--radius-full)] bg-[var(--text-disabled)]" />
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="absolute bottom-[var(--space-4)] z-20 flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border border-[var(--border)] bg-[var(--surface)] px-[var(--space-3)] py-1.5 [box-shadow:var(--shadow-sm)]">
            <div className="h-2 w-2 rounded-[var(--radius-full)] bg-[var(--accent)] [box-shadow:0_0_8px_var(--accent)]" />
            <span className="text-code-sm uppercase tracking-wider text-[var(--text-secondary)]">
              MCP Server Active
            </span>
          </div>
        </div>

        <p className="mt-8 text-center text-[14px] text-[var(--text-secondary)]">
          Your context. Always ready.
        </p>
      </div>
    </div>
  )
}
