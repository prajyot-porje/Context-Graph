import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { GraphProvider } from '@/components/providers/GraphProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GraphProvider>
      <DashboardShell>{children}</DashboardShell>
    </GraphProvider>
  )
}
