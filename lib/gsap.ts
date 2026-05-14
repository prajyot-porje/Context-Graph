'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, CustomEase)

// ---- Named easing curves (registered once at module load) ----
CustomEase.create('cg-out', '0.16, 1, 0.3, 1') // expo out — smooth entrance
CustomEase.create('cg-in', '0.7, 0, 0.84, 0') // expo in — smooth exit
CustomEase.create('cg-spring', '0.34, 1.56, 0.64, 1') // spring — interactive
CustomEase.create('cg-soft', '0.25, 0.46, 0.45, 0.94') // soft — page transitions

// ---- Duration scale ----
export const DUR = {
  instant: 0.05, // 50ms  — toggle, checkbox
  fast: 0.1, // 100ms — button press
  normal: 0.2, // 200ms — card reveal, small state change
  moderate: 0.35, // 350ms — panel slide, modal open
  slow: 0.5, // 500ms — hero entrance, large layout
  deliberate: 0.8, // 800ms — cinematic, first-load sequence
} as const

// ---- Reduced motion helper ----
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---- Entrance animation helper ----
export function animateIn(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars
) {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, x: 0, scale: 1 })
    return
  }
  gsap.from(targets, vars)
}

export { gsap, ScrollTrigger, CustomEase }
