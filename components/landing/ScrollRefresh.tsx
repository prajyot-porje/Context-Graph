'use client'

import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function ScrollRefresh() {
  useEffect(() => {
    // Small timeout to ensure DOM layout is complete before refreshing
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  return null
}
