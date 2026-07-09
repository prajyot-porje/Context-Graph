import type { Metadata } from 'next'
import { NavBar } from '@/components/landing/NavBar'
import { Hero } from '@/components/landing/Hero'
import { Stats } from '@/components/landing/Stats'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'
import { ScrollRefresh } from '@/components/landing/ScrollRefresh'
import WhatAIKnowsSection from '@/components/landing/WhatAIKnowsWrapper'

export const metadata: Metadata = {
  title: 'ContextGraph — Your context. Every AI.',
  description: 'Build your context graph once. Every AI you work with reads from the same source of truth — Claude, ChatGPT, Codex, Cursor.',
}

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <WhatAIKnowsSection />
        <CTASection />
      </main>
      <Footer />
      <ScrollRefresh />
    </>
  )
}
