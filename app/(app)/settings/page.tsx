import type { Metadata } from 'next'
import SettingsClient from '@/components/dashboard/SettingsClient'
import { requireSessionUser } from '@/lib/auth/server'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  await requireSessionUser()
  return <SettingsClient />
}
