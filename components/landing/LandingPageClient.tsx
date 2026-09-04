'use client'

import { useState, useEffect } from 'react'
import { IntroSequence } from './IntroSequence'
import { NavBar } from './NavBar'
import { Hero } from './Hero'
import { Stats } from './Stats'
import { Features } from './Features'
import { HowItWorks } from './HowItWorks'
import { CTASection } from './CTASection'
import { Footer } from './Footer'
import { ScrollRefresh } from './ScrollRefresh'
import WhatAIKnowsSection from './WhatAIKnowsWrapper'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function LandingPageClient() {
  const [introComplete, setIntroComplete] = useState(false)

  // Refresh ScrollTrigger once the page becomes visible and completes transition
  useEffect(() => {
    if (!introComplete) return

    // Immediate refresh
    ScrollTrigger.refresh()

    // Delayed refresh after transition completes
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 1050)

    return () => clearTimeout(timer)
  }, [introComplete])

  return (
    <>
      {/* Cinematic Intro Sequence */}
      <IntroSequence onComplete={() => setIntroComplete(true)} />

      {/* Main page content - transitions in once the intro is complete */}
      <div
        className={`transition-opacity duration-1000 ease-out ${
          introComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
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
      </div>
    </>
  )
}
