import type { Metadata } from 'next'
import LoginClient from '@/components/auth/LoginClient'
import { authDestination } from '@/lib/navigation'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default async function LoginPage({searchParams}:{searchParams:Promise<{from?:string}>}) {
  return <LoginClient destination={authDestination((await searchParams).from)} googleEnabled={!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)} />
}
