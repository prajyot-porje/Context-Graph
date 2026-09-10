import type { Metadata } from 'next'
import { LandingPageClient } from '@/components/landing/LandingPageClient'

export const metadata: Metadata = {
  title: 'ContextGraph — Your context. Every AI.',
  description: 'Build your context graph once. Every AI you work with reads from the same source of truth — Claude, ChatGPT, Codex, Cursor.',
}

export default function Home() {
  return <LandingPageClient />
}
