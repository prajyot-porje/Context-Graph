import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function requireSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  
  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }
  
  return session.user
}
