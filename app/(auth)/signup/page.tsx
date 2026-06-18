import type { Metadata } from 'next'
import SignupClient from '@/components/auth/SignupClient'

export const metadata: Metadata = {
  title: 'Create account',
}

export default function SignupPage() {
  return <SignupClient />
}
