import { NavBar } from '@/components/landing/NavBar'
import { Hero } from '@/components/landing/Hero'
import { Stats } from '@/components/landing/Stats'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'
import { ScrollRefresh } from '@/components/landing/ScrollRefresh'

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
      <ScrollRefresh />
    </>
  )
}
