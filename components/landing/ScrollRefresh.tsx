'use client'

import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis } from '@/lib/lenis'

export function ScrollRefresh() {
  useEffect(() => {
    // Refresh both ScrollTrigger and Lenis so their scroll-height calculations
    // stay in sync after dynamic sections (WhatAIKnowsSection, etc.) load
    const refresh = () => {
      getLenis()?.resize()
      ScrollTrigger.refresh()
    }

    // Immediate pass (catches most cases)
    const t1 = setTimeout(refresh, 100)
    // Second pass (catches slow dynamic imports)
    const t2 = setTimeout(refresh, 600)
    // Third pass (safety net after all animations settle)
    const t3 = setTimeout(refresh, 1500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  return null
}
