---
version: 1.0
name: ContextGraph Design System
description: >
  ContextGraph's design language — structured intelligence made visible.
  Dark-dominant, typographically precise, cinematically still.
  Inspired by Runway's editorial minimalism and Replicate's typographic
  confidence. One accent color. Depth through shadow and mono-gradient.
  Motion through GSAP and Lenis. Never through decoration.
---

# ContextGraph Design System

## Philosophy

Three principles govern every decision:

1. **The interface retreats.** The graph and user data are the hero. UI chrome should be invisible — noticed only when absent.
2. **Depth through shadow, not color.** The palette is near-monochrome. All spatial depth comes from layered shadows and subtle surface gradients.
3. **Motion earns its place.** Every animation has a trigger, a physical arc, and a purpose the user can feel. Nothing moves to impress.

---

## Color System

### Accent
One accent color. Used in exactly three roles: active/selected states, the primary CTA on the landing page, and relevance encoding in the graph. One accent element per viewport — maximum.

```
--accent:        #b3ec13   ← primary accent (electric lime)
--accent-soft:   #9fd411   ← hover/pressed state
--accent-muted:  rgba(179, 236, 19, 0.12)   ← glow, backgrounds
--on-accent:     #0A0A0A   ← text on accent surfaces
```

### Dark Mode (default)
```
--bg:              #080808   ← page background. Near-black, not pure black.
--surface:         #111111   ← sidebar, nav, elevated regions
--card:            #181818   ← cards, panels, graph nodes
--card-raised:     #202020   ← hovered cards, active panels
--border:          rgba(255, 255, 255, 0.07)   ← subtle dividers
--border-strong:   rgba(255, 255, 255, 0.14)   ← active borders, form outlines
--text-primary:    #F0F0F0   ← primary text. Off-white, not pure white.
--text-secondary:  #888888   ← descriptions, metadata
--text-muted:      #484848   ← timestamps, disabled labels
--text-disabled:   #2A2A2A   ← visually inactive
```

### Light Mode
```
--bg:              #F8F8F8
--surface:         #F0F0F0
--card:            #FFFFFF
--card-raised:     #FFFFFF
--border:          rgba(0, 0, 0, 0.07)
--border-strong:   rgba(0, 0, 0, 0.14)
--text-primary:    #0A0A0A
--text-secondary:  #666666
--text-muted:      #AAAAAA
--text-disabled:   #D4D4D4
```

### Semantic
```
--success:    #22C55E
--warning:    #F59E0B
--error:      #EF4444
--on-semantic: #FFFFFF
```

### Graph Relevance Encoding
Nodes encode relevance score visually through border opacity and text brightness.
```
Score 0.7–1.0  → border rgba(255,255,255,0.20), text #F0F0F0   ← bright, active
Score 0.4–0.69 → border rgba(255,255,255,0.10), text #888888   ← secondary
Score 0.0–0.39 → border rgba(255,255,255,0.05), text #484848   ← archived, dim
```

---

## Typography

### Font Stack — Three Families, Three Strict Lanes

**rb-freigeist-neue** — display only. Any text 28px and above. Hero headlines, section openers, the logo mark, large stat numbers. Tight line-height 1.0, heavy negative letter-spacing. Creates geometric text blocks that feel carved — not typed. Fallback: `'Bricolage Grotesque', sans-serif`

**Geist** — everything else. Navigation, body copy, labels, buttons, card content, form elements. Clean, neutral, precise. Fallback: `system-ui, sans-serif`

**JetBrains Mono** — code only. API keys, MCP config snippets, scope strings, commit messages, any machine-readable text. Never use it for UI. Fallback: `'Fira Code', monospace`

### Type Scale

| Token | Family | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|---|
| display-xxl | rb-freigeist-neue | 96px | 700 | 1.0 | -3px | Landing hero headline |
| display-xl | rb-freigeist-neue | 64px | 700 | 1.0 | -2px | Section openers |
| display-lg | rb-freigeist-neue | 48px | 700 | 1.05 | -1.5px | Sub-section titles |
| display-md | rb-freigeist-neue | 36px | 700 | 1.1 | -1px | Feature card titles |
| display-sm | rb-freigeist-neue | 28px | 600 | 1.15 | -0.5px | Dashboard page title |
| heading-lg | Geist | 24px | 600 | 1.3 | -0.4px | Card headings |
| heading-md | Geist | 20px | 600 | 1.3 | -0.3px | Panel headings |
| heading-sm | Geist | 16px | 600 | 1.4 | -0.2px | Sidebar section headers |
| body-lg | Geist | 18px | 400 | 1.6 | 0 | Landing body text |
| body-md | Geist | 15px | 400 | 1.6 | 0 | Default body |
| body-sm | Geist | 13px | 400 | 1.5 | 0 | Captions, metadata |
| label | Geist | 11px | 600 | 1.4 | 0.08em | Uppercase section labels |
| button-md | Geist | 14px | 500 | 1.0 | -0.1px | Buttons |
| button-sm | Geist | 12px | 500 | 1.0 | 0 | Small buttons, tabs |
| code-md | JetBrains Mono | 13px | 400 | 1.6 | 0 | Code blocks |
| code-sm | JetBrains Mono | 11px | 400 | 1.5 | 0 | Inline code, tab labels |

### Typography Rules
- Uppercase labels always use `letter-spacing: 0.08em` — never tight uppercase
- Display sizes hold `line-height: 1.0` — multi-line headlines stack as one geometric block
- Body text never goes below 13px
- rb-freigeist-neue is never used below 28px
- JetBrains Mono is never used for non-code content

---

## Spacing System

Base unit: 4px. All values are multiples of 4.

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
--space-24: 96px
--space-32: 128px
```

Section vertical rhythm: 96px between landing sections. 32px between dashboard sections. 24px between card elements. 16px between inline elements.

---

## Border Radius

```
--radius-xs:   4px    ← tags, micro-controls
--radius-sm:   6px    ← small containers
--radius-md:   10px   ← cards, inputs, code blocks
--radius-lg:   14px   ← graph nodes, feature cards
--radius-xl:   20px   ← large panels
--radius-xxl:  28px   ← hero sections, large containers
--radius-full: 9999px ← badges, pills
```

Buttons use `--radius-md` (10px). Not pill, not sharp. Intentional midpoint.

---

## Shadow System

Light source is always top-center. Shadows fall downward with soft diffusion. Multi-layer shadows create physical depth — never a single flat value.

### Dark Mode Shadows
```
--shadow-xs:    0 1px 2px rgba(0,0,0,0.5)

--shadow-sm:    0 1px 2px rgba(0,0,0,0.5),
                0 4px 8px rgba(0,0,0,0.35)

--shadow-md:    0 2px 4px rgba(0,0,0,0.5),
                0 8px 16px rgba(0,0,0,0.4),
                0 0 0 1px rgba(255,255,255,0.04)

--shadow-lg:    0 4px 8px rgba(0,0,0,0.5),
                0 16px 32px rgba(0,0,0,0.5),
                0 0 0 1px rgba(255,255,255,0.05)

--shadow-xl:    0 8px 16px rgba(0,0,0,0.6),
                0 32px 64px rgba(0,0,0,0.6),
                0 0 0 1px rgba(255,255,255,0.06)

--shadow-inset: inset 0 1px 0 rgba(255,255,255,0.05),
                inset 0 -1px 0 rgba(0,0,0,0.2)

--shadow-accent: 0 0 0 1px rgba(179,236,19,0.3),
                 0 0 20px rgba(179,236,19,0.08)
```

### Light Mode Shadows
```
--shadow-xs:    0 1px 2px rgba(0,0,0,0.06)

--shadow-sm:    0 1px 3px rgba(0,0,0,0.08),
                0 4px 8px rgba(0,0,0,0.04)

--shadow-md:    0 2px 4px rgba(0,0,0,0.08),
                0 8px 16px rgba(0,0,0,0.06)

--shadow-lg:    0 4px 8px rgba(0,0,0,0.08),
                0 16px 32px rgba(0,0,0,0.08)

--shadow-inset: inset 0 1px 0 rgba(255,255,255,0.8),
                inset 0 -1px 0 rgba(0,0,0,0.04)
```

### Elevation Roles
| Level | Shadow | Used On |
|---|---|---|
| Ground | none | Page background |
| Base | --shadow-xs | Hairline dividers |
| Card | --shadow-sm + --shadow-inset | Default cards, graph nodes |
| Raised | --shadow-md + --shadow-inset | Hovered cards, active panels |
| Floating | --shadow-lg | Dropdowns, tooltips, popovers |
| Modal | --shadow-xl | Modals, drawers |
| Accent | --shadow-accent | Focused inputs, selected graph nodes |

Every card gets `--shadow-inset` in addition to its elevation shadow. This creates the physical slab catching top-light effect.

---

## Texture & Atmosphere

### Page Background Gradient
Not a flat color. A radial mono-gradient from slightly lighter center to dark edge.
Creates atmospheric depth without any color.

Dark mode: radial highlight from top-center, rgba(255,255,255,0.04) fading to transparent.
Light mode: radial shadow from top-center, rgba(0,0,0,0.02) fading to transparent.

### Card Surface Gradient
Every card: lighter at top (#202020), base color at bottom (#181818).
Simulates a physical surface catching overhead light.

### Noise Texture
Landing page hero sections only. 200×200px seamless noise SVG at 3% opacity with mix-blend-mode overlay.
Creates tactile grain — makes the surface feel physical rather than digital.

### Graph Canvas
React Flow background: dot grid pattern.
Dot color: rgba(255,255,255,0.08) on dark, rgba(0,0,0,0.06) on light.
Dot spacing: 24px × 24px.

---

## Component Visual Specifications

### Navigation Bar
```
Height: 60px
Background: rgba(8,8,8,0.85) + backdrop-blur(20px) + saturate(180%)
Border-bottom: 1px solid var(--border)
Position: sticky, top-0
Padding: 0 var(--space-6)

Left: Logo — "ContextGraph" in rb-freigeist-neue 18px weight 700
Right: [Docs] [Log in] [Get Started]
  Docs → ghost button
  Log in → secondary button
  Get Started → primary button

Light mode background: rgba(248,248,248,0.85)
```

Implementation note: if a component needs a translucent or special-purpose
surface, define a named CSS custom property for it in the theme layer before
using it inside a component.

### Buttons
All buttons: `border-radius: var(--radius-md)` — 10px.

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | var(--text-primary) | var(--bg) | none | Main CTA |
| Secondary | transparent | var(--text-primary) | 1px solid var(--border-strong) | Secondary actions |
| Accent | var(--accent) | var(--on-accent) | none | One per page max |
| Ghost | transparent | var(--text-secondary) | none | Tertiary actions |

Minimum hit target: 44px for every interactive button.
Standard button height: 44px.
Compact visual variants are allowed only if the clickable area still resolves to
44px minimum.
Padding: 12px 20px standard.

### Cards
```
Background: linear-gradient from --card-raised (top) to --card (bottom)
Border: 1px solid var(--border)
Border-radius: var(--radius-lg)
Box-shadow: var(--shadow-sm), var(--shadow-inset)
Padding: var(--space-6)

Hover:
  Border: 1px solid var(--border-strong)
  Box-shadow: var(--shadow-md), var(--shadow-inset)
```

### Form Inputs
```
Background: var(--surface)
Border: 1px solid var(--border)
Border-radius: var(--radius-md)
Padding: 12px 16px
Minimum hit target: 44px
Input height: 44px
Font: body-md

Focus:
  Border: 1px solid var(--accent)
  Box-shadow: var(--shadow-accent)
```

### Graph Nodes — Three Tiers

**ME node** — root, maximum visual weight
```
Background: gradient from #242424 to #1C1C1C
Border: 1px solid rgba(255,255,255,0.20)
Border-radius: var(--radius-lg)
Box-shadow: var(--shadow-md), var(--shadow-inset)
Label: display-sm, #F0F0F0
```

**Agency / Personal nodes**
```
Border: 1px solid rgba(255,255,255,0.12)
Box-shadow: var(--shadow-sm), var(--shadow-inset)
Label: heading-sm, #CCCCCC
```

**Project nodes**
```
Border: 1px solid rgba(255,255,255,0.07)
Box-shadow: var(--shadow-xs)
Label: body-sm, #888888
```

**Selected state (any tier)**
```
Border: 1px solid var(--accent)
Box-shadow: var(--shadow-accent), var(--shadow-md)
```

### Code Blocks
```
Background: #0D0D0D
Border: 1px solid var(--border)
Border-radius: var(--radius-md)
Padding: var(--space-5) var(--space-6)
Font: code-md

Tab strip:
  Border-bottom: 1px solid var(--border)
  Tab font: code-sm, uppercase, --text-secondary
  Active tab: --text-primary, 2px bottom border var(--accent)
```

### Badges
```
Background: rgba(255,255,255,0.07)   [dark] / rgba(0,0,0,0.06)   [light]
Border-radius: var(--radius-full)
Padding: 3px 10px
Font: body-sm

Accent badge:
  Background: var(--accent-muted)
  Text: var(--accent)
```

---

## Dark / Light Mode

Implementation: `data-theme` attribute on `<html>`. All values via CSS custom properties. No JS required for the visual switch itself.

Default: dark mode.
Toggle: flip `data-theme` between `"dark"` and `"light"`.
Persist: localStorage key `"cg-theme"`.
Respect: `prefers-color-scheme` on first visit if no stored preference.

Transition on switch: `background-color 250ms`, `color 200ms`, `border-color 200ms`. Never `transition: all`.

---

## Responsive Breakpoints

```
Mobile:   < 640px
Tablet:   640px – 1023px
Desktop:  1024px – 1279px
Wide:     ≥ 1280px
```

### Display Text Scaling
```
display-xxl: 96px → 64px → 48px → 36px
display-xl:  64px → 48px → 36px → 28px
display-lg:  48px → 36px → 28px
```

### Dashboard Layout Breakpoints
```
Wide/Desktop: sidebar 240px | main flex-1 | detail panel 320px
Tablet: sidebar icon-only 48px | main flex-1 | detail panel bottom sheet
Mobile: bottom nav | main full screen | detail full-screen drawer
```

---

## Best Practices — Agent Must Follow

### Scroll & Motion
- Use **Lenis** for all page-level smooth scrolling. Initialize Lenis once in the root layout and pass its `raf` to GSAP ticker for synchronized animation.
- Never use native `scroll-behavior: smooth` — use Lenis only.
- GSAP ScrollTrigger must use Lenis's scroll position. Call `ScrollTrigger.scrollerProxy` with the Lenis instance after initialization.
- Always call `ScrollTrigger.refresh()` after route changes and layout shifts.

### Animation
- All entrance animations: GSAP only. No CSS `@keyframes` for elements entering the viewport.
- Hover state color/opacity changes: CSS `transition` only (sub-100ms, specific property).
- Never `transition: all`. Always specify the property.
- GSAP ScrollTrigger start point: `"top 88%"` for most elements. `"top 75%"` for hero-level sections.
- Always add `once: true` to ScrollTrigger for entrance animations.
- Always implement `prefers-reduced-motion` check before GSAP animations. If reduced motion is preferred, set elements directly with `gsap.set()` instead.
- Load the relevant GSAP skill file from `.agent/skills/` before writing any animation.

### Colors & Tokens
- Never hardcode hex values in component files. Always use CSS custom properties.
- Accent color (`--accent`) appears in maximum one element per viewport.
- All shadows use the named shadow tokens from this file. No custom shadow values.

### Typography
- rb-freigeist-neue: only above 28px. Never use it for body, labels, or UI text.
- JetBrains Mono: only for code, API keys, and machine-readable text.
- All uppercase labels: `letter-spacing: 0.08em` without exception.
- Display text: always negative letter-spacing.

### Spacing
- Every spacing value must be on the 4pt grid. No 7px, 11px, 15px, 18px.
- Card internal padding: always `var(--space-6)` (24px).
- Section vertical padding: always `var(--space-24)` (96px) on landing, `var(--space-8)` (32px) on dashboard.

### Shadows
- Every elevated card gets `--shadow-inset` in addition to its elevation shadow.
- Never use `filter: drop-shadow` on UI components. Always use `box-shadow`.
- Negative Y offset is banned — light comes from above.

### Components
- All interactive elements: minimum 44×44px touch target.
- Focus-visible state required on every interactive element.
- Every button needs default, hover, focus-visible, active, and disabled states.

### Graph (React Flow)
- Override all React Flow default styles. Never rely on React Flow's built-in appearance.
- Node sizes are not fixed — nodes grow to fit content.
- Edge stroke color: `rgba(255,255,255,0.12)` dark, `rgba(0,0,0,0.10)` light.
- Animated edges on connection: GSAP strokeDashoffset animation.

---

## Do's and Don'ts

### Do
- Use rb-freigeist-neue for every text element 28px and above
- Apply `--shadow-inset` to all cards to create the physical slab effect
- Keep `--accent` (#b3ec13) to one visible element per viewport
- Use Lenis for scroll, GSAP for animation — no exceptions
- Apply noise texture on hero sections for tactile depth
- Make the graph the hero of the dashboard
- Always implement dark and light mode through `data-theme` + CSS custom properties

### Don't
- Don't use Geist above 24px — that's rb-freigeist-neue territory
- Don't use pure #000000 or #FFFFFF as surfaces
- Don't use `--accent` on body text, large surfaces, or multiple elements
- Don't use `transition: all` anywhere
- Don't use CSS `@keyframes` for entrance animations
- Don't add `text-shadow` — banned entirely
- Don't use `filter: drop-shadow` on UI elements
- Don't hardcode any hex value in a component file
- Don't use `scroll-behavior: smooth` — use Lenis
- Don't introduce a second accent color
- Don't round buttons to `--radius-full` — 10px is the button radius
