'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, DUR, prefersReducedMotion } from '@/lib/gsap'

interface IntroSequenceProps {
  onComplete: () => void
}

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const line1Ref = useRef<HTMLDivElement>(null)
  const line2Ref = useRef<HTMLDivElement>(null)
  const line3Ref = useRef<HTMLDivElement>(null)
  
  const [shouldShow, setShouldShow] = useState<boolean | null>(null)

  // Determine whether to show the intro on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const seen = sessionStorage.getItem('cg-intro-seen') === 'true'
    const isReduced = prefersReducedMotion()

    if (seen || isReduced) {
      setShouldShow(false)
      document.documentElement.classList.remove('intro-pending')
      onComplete()
    } else {
      setShouldShow(true)
      document.documentElement.classList.add('intro-pending')
    }
  }, [onComplete])

  // GSAP animation sequence
  useGSAP(
    () => {
      if (shouldShow !== true) return

      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem('cg-intro-seen', 'true')
          document.documentElement.classList.remove('intro-pending')
          onComplete()
        },
      })

      // Ensure initial styles are set
      gsap.set([line1Ref.current, line2Ref.current, line3Ref.current], {
        opacity: 0,
        y: 20,
        filter: 'blur(4px)',
      })

      // 1. Phrase 1 Reveal
      tl.to(line1Ref.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'cg-out',
      })
      .to(line1Ref.current, {
        opacity: 0,
        y: -12,
        filter: 'blur(4px)',
        duration: 0.6,
        ease: 'cg-in',
        delay: 1.4,
      })

      // 2. Phrase 2 Reveal
      tl.to(line2Ref.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'cg-out',
      })
      .to(line2Ref.current, {
        opacity: 0,
        y: -12,
        filter: 'blur(4px)',
        duration: 0.6,
        ease: 'cg-in',
        delay: 1.4,
      })

      // 3. Phrase 3 Reveal (Meet ContextGraph)
      tl.to(line3Ref.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'cg-out',
      })
      
      // Draw a subtle line under "ContextGraph"
      .fromTo(
        '.intro-underline',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.5,
          ease: 'cg-out',
        },
        '-=0.2'
      )
      
      // Hold line 3, then fade out the entire screen
      tl.to(containerRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: 'cg-in',
        delay: 1.6,
      })
    },
    { scope: containerRef, dependencies: [shouldShow] }
  )

  if (shouldShow === null || shouldShow === false) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080808] overflow-hidden select-none"
    >
      {/* Precision grid backdrop (ultra dim) */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div ref={textRef} className="relative flex flex-col items-center justify-center w-full max-w-xl px-6 text-center">
        
        {/* Step 1 */}
        <div
          ref={line1Ref}
          className="absolute text-display-md text-white font-medium tracking-tight leading-tight uppercase font-display"
        >
          Your profile is scattered.
        </div>

        {/* Step 2 */}
        <div
          ref={line2Ref}
          className="absolute text-display-md text-white font-medium tracking-tight leading-tight uppercase font-display"
        >
          Your instructions are fragmented.
        </div>

        {/* Step 3 */}
        <div
          ref={line3Ref}
          className="absolute flex flex-col items-center gap-4"
        >
          <div className="text-display-md text-white font-bold tracking-tight leading-tight uppercase font-display">
            Meet <span className="text-[var(--accent)]">ContextGraph</span>
          </div>
          <div className="intro-underline h-[1px] w-24 bg-[var(--accent)] origin-center scale-x-0" />
        </div>

      </div>
    </div>
  )
}
