import type { Metadata } from 'next'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { requireSessionUser } from '@/lib/auth/server'
import { getSetupStatus } from '@/lib/db'
import { redirect } from 'next/navigation'
import { GraphProvider } from '@/components/providers/GraphProvider'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const user=await requireSessionUser()
  if(!(await getSetupStatus(user.id)).ready)redirect('/connect')
  return <GraphProvider><DashboardShell><DashboardClient /></DashboardShell></GraphProvider>
}
