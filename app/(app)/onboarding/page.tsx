import type { Metadata } from 'next'
import { requireSessionUser } from '@/lib/auth/server'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = { title: 'Build your graph' }

// ROADMAP.md P1.6: `onboarding_done` now means "connected a tool" (set on first
// successful MCP call), not "completed this wizard" — it no longer gates this
// page. The wizard is an optional, always-revisitable shortcut, linked from
// /connect for people who'd rather answer a few questions than have the graph
// fill in from a live session.
export default async function OnboardingPage() {
  await requireSessionUser()

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <ErrorBoundary>
        <OnboardingWizard />
      </ErrorBoundary>
    </main>
  )
}
