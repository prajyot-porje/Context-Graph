import type { Metadata } from 'next'
import { requireSessionUser } from '@/lib/auth/server'
import { getApiKeyInfo } from '@/lib/db'
import { ConnectPageClient } from '@/components/connect/ConnectPageClient'

export const metadata: Metadata = { title: 'Connect AI tools' }

export default async function ConnectPage() {
  const user = await requireSessionUser()
  const keyInfo = await getApiKeyInfo(user.id)
  const keyPrefix = keyInfo?.prefix || ''

  // Determine application URL from environment
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return <ConnectPageClient keyPrefix={keyPrefix} appUrl={appUrl} />
}
