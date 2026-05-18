import { NavBar } from '@/components/landing/NavBar'
import { Footer } from '@/components/landing/Footer'
import { NotFoundScene } from '@/components/landing/NotFoundScene'

export default function NotFound() {
  return (
    <>
      <NavBar />
      <main>
        <NotFoundScene />
      </main>
      <Footer />
    </>
  )
}
