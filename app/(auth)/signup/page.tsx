import type { Metadata } from 'next'
import SignupClient from '@/components/auth/SignupClient'
import { authDestination } from '@/lib/navigation'

export const metadata: Metadata = {
  title: 'Create account',
}

export default async function SignupPage({searchParams}:{searchParams:Promise<{from?:string}>}) {
  return <SignupClient destination={authDestination((await searchParams).from)} googleEnabled={!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)} />
}
