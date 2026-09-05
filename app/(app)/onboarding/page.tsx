import type { Metadata } from 'next'
import { requireSessionUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export const metadata: Metadata = { title: 'Build your graph' }

export default async function OnboardingPage() {
  const user = await requireSessionUser()

  if (user.onboarding_done) {
    redirect('/dashboard')
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <ErrorBoundary>
        <OnboardingWizard />
      </ErrorBoundary>
    </main>
  )
}
