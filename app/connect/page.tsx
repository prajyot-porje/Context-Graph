import type { Metadata } from 'next'
import { requireSessionUser } from '@/lib/auth/server'
import { getApiKeyInfo } from '@/lib/db'
import { getAppUrl } from '@/lib/utils'
import { ConnectPageClient } from '@/components/connect/ConnectPageClient'

export const metadata: Metadata = { title: 'Connect AI tools' }

export default async function ConnectPage() {
  const user = await requireSessionUser()
  const keyInfo = await getApiKeyInfo(user.id)
  const keyPrefix = keyInfo?.prefix || ''

  return <ConnectPageClient keyPrefix={keyPrefix} appUrl={getAppUrl()} />
}
