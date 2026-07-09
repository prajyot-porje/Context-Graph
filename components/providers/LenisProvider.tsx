'use client'

import { useEffect } from 'react'
import { initLenis, destroyLenis } from '@/lib/lenis'
import dynamic from 'next/dynamic'

const Agentation = dynamic(
  () => import('agentation').then(mod => mod.Agentation),
  { ssr: false }
)

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = initLenis()

    return () => {
      destroyLenis()
    }
  }, [])

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <Agentation endpoint="http://localhost:4747" />
      )}
    </>
  )
}
