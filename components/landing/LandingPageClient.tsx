'use client'

import { NavBar } from './NavBar'
import { Hero } from './Hero'
import { Stats } from './Stats'
import { Features } from './Features'
import { HowItWorks } from './HowItWorks'
import { CTASection } from './CTASection'
import { Footer } from './Footer'
import { ScrollRefresh } from './ScrollRefresh'
import WhatAIKnowsSection from './WhatAIKnowsWrapper'

export function LandingPageClient() {
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
