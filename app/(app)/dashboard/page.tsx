import { Network } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <Network size={48} className="text-[var(--text-muted)]" />
      <p className="mt-3 text-[14px] text-[var(--text-muted)]">
        Graph loads in P07
      </p>
    </div>
  )
}
