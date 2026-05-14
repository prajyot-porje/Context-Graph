# ContextGraph Animation Skill
# Place this file at: .agent/skills/animations.md
# This file extends the official GSAP skills at:
# https://github.com/greensock/gsap-skills/tree/main/skills
# Load those skills first for core GSAP syntax, then apply these project-specific rules.

## Core Libraries
- **GSAP** + ScrollTrigger + CustomEase — all motion that involves movement or scale
- **Lenis** — all smooth scrolling, synchronized with GSAP ticker
- **CSS transition** — only for hover micro-states (color, opacity, border-color, box-shadow)

## Required Imports
```ts
// Animation setup file: /lib/gsap.ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, CustomEase)

// Register named easing curves — do this once at app init
CustomEase.create('cg-out',    '0.16, 1, 0.3, 1')     // expo out — smooth entrance
CustomEase.create('cg-in',     '0.7, 0, 0.84, 0')     // expo in — smooth exit
CustomEase.create('cg-spring', '0.34, 1.56, 0.64, 1') // spring — interactive
CustomEase.create('cg-soft',   '0.25, 0.46, 0.45, 0.94') // soft — page transitions
```

## Duration Scale
```ts
export const DUR = {
  instant:    0.05,  // 50ms  — toggle, checkbox
  fast:       0.1,   // 100ms — button press
  normal:     0.2,   // 200ms — card reveal, small state change
  moderate:   0.35,  // 350ms — panel slide, modal open
  slow:       0.5,   // 500ms — hero entrance, large layout
  deliberate: 0.8,   // 800ms — cinematic, first-load sequence
} as const
```

## Lenis Setup — REQUIRED for all projects
Initialize Lenis once in the root layout. Never initialize it in individual components.

```ts
// /lib/lenis.ts
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let lenisInstance: Lenis | null = null

export function initLenis() {
  if (lenisInstance) return lenisInstance

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  })

  // Sync Lenis scroll position with GSAP ScrollTrigger
  lenisInstance.on('scroll', ScrollTrigger.update)

  // Tick Lenis inside GSAP's RAF loop
  gsap.ticker.add((time) => {
    lenisInstance?.raf(time * 1000)
  })

  gsap.ticker.lagSmoothing(0)

  return lenisInstance
}

export function getLenis() {
  return lenisInstance
}

export function destroyLenis() {
  lenisInstance?.destroy()
  lenisInstance = null
}
```

```tsx
// In root layout.tsx — call once
'use client'
import { useEffect } from 'react'
import { initLenis } from '@/lib/lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = initLenis()
    return () => {
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
```

## Reduced Motion — MANDATORY
Always check before any GSAP animation. No exceptions.

```ts
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Usage pattern
export function animateIn(targets: gsap.TweenTarget, vars: gsap.TweenVars) {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0, x: 0, scale: 1 })
    return
  }
  gsap.from(targets, vars)
}
```

## Standard Patterns

### Entrance Animation (most common)
Use this for cards, feature sections, graph nodes coming into view.
```ts
function entranceFromBelow(elements: string | Element | Element[]) {
  if (prefersReducedMotion()) return gsap.set(elements, { opacity: 1 })

  return gsap.from(elements, {
    opacity: 0,
    y: 24,
    duration: DUR.moderate,
    ease: 'cg-out',
    stagger: 0.06,
    scrollTrigger: {
      trigger: typeof elements === 'string' ? elements : (elements as Element[])[0],
      start: 'top 88%',
      once: true,
    },
  })
}
```

### Hero Sequence (landing page only)
Choreographed timeline. Elements enter in sequence, not simultaneously.

```ts
function heroTimeline() {
  if (prefersReducedMotion()) {
    gsap.set('.hero-label, .hero-title, .hero-subtitle, .hero-cta', { opacity: 1 })
    return
  }

  const tl = gsap.timeline({ delay: 0.15 })

  tl.from('.hero-label', {
    opacity: 0, y: 10,
    duration: DUR.normal, ease: 'cg-out',
  })
  .from('.hero-title', {
    opacity: 0, y: 36,
    duration: DUR.slow, ease: 'cg-out',
  }, '-=0.1')
  .from('.hero-subtitle', {
    opacity: 0, y: 16,
    duration: DUR.moderate, ease: 'cg-out',
  }, '-=0.25')
  .from('.hero-cta > *', {
    opacity: 0, y: 12,
    duration: DUR.normal, ease: 'cg-spring',
    stagger: 0.08,
  }, '-=0.2')

  return tl
}
```

### Graph Node Entrance (dashboard)
Nodes animate from parent outward. ME node first, then children, then projects.

```ts
function graphEntrance() {
  if (prefersReducedMotion()) return

  const tl = gsap.timeline()

  tl.from('[data-node-root="true"]', {
    opacity: 0, scale: 0.88,
    duration: DUR.moderate, ease: 'cg-spring',
  })
  .from('[data-node-depth="1"]', {
    opacity: 0, scale: 0.92, y: 10,
    duration: DUR.normal, ease: 'cg-out',
    stagger: 0.07,
  }, '-=0.1')
  .from('[data-node-depth="2"]', {
    opacity: 0, scale: 0.94,
    duration: DUR.normal, ease: 'cg-out',
    stagger: 0.05,
  }, '-=0.15')
  .from('.react-flow__edge', {
    opacity: 0,
    duration: DUR.moderate, ease: 'cg-soft',
    stagger: 0.03,
  }, '-=0.2')
}
```

### Panel Slide (right detail panel)
```ts
function openDetailPanel(panel: Element) {
  if (prefersReducedMotion()) {
    gsap.set(panel, { x: 0, opacity: 1 })
    return
  }
  gsap.fromTo(panel,
    { x: 320, opacity: 0 },
    { x: 0, opacity: 1, duration: DUR.moderate, ease: 'cg-spring' }
  )
}

function closeDetailPanel(panel: Element) {
  if (prefersReducedMotion()) {
    gsap.set(panel, { x: 320, opacity: 0 })
    return
  }
  gsap.to(panel, {
    x: 320, opacity: 0,
    duration: DUR.normal, ease: 'cg-in',
  })
}
```

### Relevance Score Bar Fill
```ts
function animateRelevanceBar(barElement: Element, score: number) {
  if (prefersReducedMotion()) {
    gsap.set(barElement, { width: `${score * 100}%` })
    return
  }
  gsap.fromTo(barElement,
    { width: '0%' },
    { width: `${score * 100}%`, duration: DUR.slow, ease: 'cg-out', delay: 0.2 }
  )
}
```

### Page Transition (route change)
```ts
function pageLeave(container: Element, onComplete: () => void) {
  if (prefersReducedMotion()) { onComplete(); return }
  gsap.to(container, {
    opacity: 0, y: -8,
    duration: DUR.normal, ease: 'cg-in',
    onComplete,
  })
}

function pageEnter(container: Element) {
  if (prefersReducedMotion()) { gsap.set(container, { opacity: 1 }); return }
  gsap.from(container, {
    opacity: 0, y: 12,
    duration: DUR.moderate, ease: 'cg-out',
  })
}
```

## CSS Transition Rules (hover only)
```css
/* Allowed CSS transitions — micro-interactions only */
.card {
  transition:
    border-color 150ms ease,
    box-shadow 200ms ease;
}

.button {
  transition:
    background-color 100ms ease,
    color 100ms ease,
    opacity 100ms ease;
}

/* BANNED */
/* transition: all 0.3s ease; — never */
/* transition: all; — never */
```

## ScrollTrigger Refresh
Call after every route change and after React Flow renders.
```ts
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// After route change
ScrollTrigger.refresh()

// After React Flow init
<ReactFlow onInit={() => {
  setTimeout(() => ScrollTrigger.refresh(), 100)
}} />
```

## Cleanup
Always kill ScrollTrigger instances in useEffect cleanup.
```ts
useEffect(() => {
  const triggers: ScrollTrigger[] = []

  // ... create triggers and push to array

  return () => {
    triggers.forEach(t => t.kill())
  }
}, [])
```
