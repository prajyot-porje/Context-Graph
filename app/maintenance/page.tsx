import type { Metadata } from 'next'
import { MaintenanceScene } from '@/components/maintenance/MaintenanceScene'

export const metadata: Metadata = {
  title: 'Under Maintenance | ContextGraph',
  description: 'ContextGraph is temporarily down for planned database schema migrations and system optimizations.',
}

export default function MaintenancePage() {
  return <MaintenanceScene />
}
