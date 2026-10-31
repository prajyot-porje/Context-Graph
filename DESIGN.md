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

This is the visual/UI source of truth — exact tokens, type scale, spacing, motion rules. For business/brand scope (users, positioning, voice) see [PRODUCT.md](PRODUCT.md). For how the app is built see [ARCHITECTURE.md](ARCHITECTURE.md).

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
--accent:        #8fbe28   ← primary accent (muted lime)
--accent-soft:   #7da720   ← hover/pressed state
--accent-muted:  rgba(143, 190, 40, 0.12)   ← glow, backgrounds
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
--text-secondary:  #a0a0a0   ← descriptions, metadata
--text-muted:      #888888   ← timestamps, disabled labels
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

**Outfit** — display only. Any text 28px and above. Hero headlines, section openers, large stat numbers. Tight line-height 1.0, heavy negative letter-spacing. Creates geometric text blocks that feel carved — not typed. Fallback: `sans-serif`

**Geist** — everything else. Navigation, body copy, labels, buttons, card content, form elements. Clean, neutral, precise. Fallback: `system-ui, sans-serif`

**Geist Mono** — code only. API keys, MCP config snippets, scope strings, commit messages, any machine-readable text. Never use it for UI. Fallback: `monospace`

### Type Scale

| Token | Family | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|---|
| display-xxl | Outfit | 96px | 700 | 1.0 | -3px | Landing hero headline |
| display-xl | Outfit | 64px | 700 | 1.0 | -2px | Section openers |
| display-lg | Outfit | 48px | 700 | 1.05 | -1.5px | Sub-section titles |
| display-md | Outfit | 36px | 700 | 1.1 | -1px | Feature card titles |
| display-sm | Outfit | 28px | 600 | 1.15 | -0.5px | Dashboard page title |
| heading-lg | Geist | 24px | 600 | 1.3 | -0.4px | Card headings |
| heading-md | Geist | 20px | 600 | 1.3 | -0.3px | Panel headings |
| heading-sm | Geist | 16px | 600 | 1.4 | -0.2px | Sidebar section headers |
| body-lg | Geist | 18px | 400 | 1.6 | 0 | Landing body text |
| body-md | Geist | 15px | 400 | 1.6 | 0 | Default body |
| body-sm | Geist | 13px | 400 | 1.5 | 0 | Captions, metadata |
| label | Geist | 13px | 600 | 1.4 | 0.08em | Uppercase section labels |
| button-md | Geist | 14px | 500 | 1.0 | -0.1px | Buttons |
| button-sm | Geist | 13px | 500 | 1.0 | 0 | Small buttons, tabs |
| code-md | Geist Mono | 13px | 400 | 1.6 | 0 | Code blocks |
| code-sm | Geist Mono | 13px | 400 | 1.5 | 0 | Inline code, tab labels |

### Typography Rules
- Uppercase labels always use `letter-spacing: 0.08em` — never tight uppercase
- Display sizes hold `line-height: 1.0` — multi-line headlines stack as one geometric block
- Body text never goes below 13px
- Outfit is never used below 28px
- Geist Mono is never used for non-code content

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

--shadow-accent: 0 0 0 1px rgba(143,190,40,0.3),
                 0 0 20px rgba(143,190,40,0.08)
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
The 3D graph canvas uses the theme surface; any surrounding 2D grid decoration follows this dot pattern.
Dot color: rgba(255,255,255,0.08) on dark, rgba(0,0,0,0.06) on light.
Dot spacing: 24px × 24px.

---

## Component Visual Specifications

### Navigation Bar
```
Height: 60px marketing / 64px dashboard
Background: rgba(8,8,8,0.85) + backdrop-blur(20px) + saturate(180%)
Border-bottom: 1px solid var(--border)
Position: sticky, top-0
Padding: 0 var(--space-6)

Left: shared Brand — "ContextGraph" in Geist 20px weight 600
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

## Accessibility & Inclusion

- Minimum text contrast ratio 4.5:1 (WCAG AA) everywhere — check this against the actual token pairing in use, not just in isolation.
- Every interactive element has a visible focus state (see Components below) and a minimum 44×44px hit target, even for visually compact variants.
- `prefers-reduced-motion` is checked before every GSAP animation; when set, use `gsap.set()` directly instead of tweening (falls back to instant/opacity-only transitions).

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
- Use **Lenis** only on the marketing landing page. Setup, auth, settings and dashboard use native scrolling; scrollable panels contain their own scroll. Initialize/destroy with route changes and remove the GSAP ticker callback on cleanup.
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
- Load the relevant GSAP skill file from `.agents/skills/` before writing any animation.

### Colors & Tokens
- Never hardcode hex values in component files. Always use CSS custom properties.
- Accent color (`--accent`) appears in maximum one element per viewport.
- All shadows use the named shadow tokens from this file. No custom shadow values.

### Typography
- Outfit: only above 28px. Never use it for body, labels, or UI text.
- Geist Mono: only for code, API keys, and machine-readable text.
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

### Graph (react-force-graph-3d)
- Override default Three.js/force-graph styling with the node-tier and theme tokens.
- Node sizes follow the semantic root/branch/leaf tiers and remain legible at the current zoom.
- Edge stroke color: `rgba(255,255,255,0.12)` dark, `rgba(0,0,0,0.10)` light.
- Any 2D edge entrance uses GSAP; 3D motion must respect reduced motion and avoid continuous decorative work.

---

## Do's and Don'ts

### Do
- Use Outfit for every text element 28px and above
- Apply `--shadow-inset` to all cards to create the physical slab effect
- Keep `--accent` (#8fbe28) to one visible element per viewport
- Use Lenis for scroll, GSAP for animation — no exceptions
- Apply noise texture on hero sections for tactile depth
- Make the graph the hero of the dashboard
- Always implement dark and light mode through `data-theme` + CSS custom properties

### Don't
- Don't use Geist above 24px — that's Outfit territory
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

## UI refinement — 2026-10-30

The settings/setup type treatment is the shared reference: Outfit display headings at 28px and above; Geist body at 15px, navigation/buttons at 14px, labels/metadata at 13px; Geist Mono only for code. The shared Brand component uses Geist 20px/600 with a crisp connected-node vector, without the old raster glow. All headers, footer and auth screens use it. Dark accent is #8fbe28; light accent is #527918 with white on-accent text. These are theme variants of the same single accent.

Navigation links such as Settings and Back to dashboard use bordered 44px button styling while retaining link semantics. Dashboard chrome stays compact: one Manage connections action, exceptional queue status, refresh, view switching and graph controls. Capture toggles remain in Settings. The mobile sidebar is a closed-by-default drawer below the top bar and uses one open state, independent of desktop entrance transforms. Notes and detail panes scroll natively and wrap long content.

Saved notes are rendered as graph leaves, grouped by existing note category under Me or attached to an existing project scope. Categories are structural labels; all leaf text comes from actual saved notes. The persisted graph is unchanged. Small graphs show leaf labels, fit after their initial simulation, and keep node positions across background refreshes.

App page/auth headings follow the settings reference with display weight 400. Graph labels sit outside their projected node radius; graph controls use the same theme accent as every other control.


## Product typography and guided onboarding — 2026-10-31

Login and connect are the product typography reference. Preserve Outfit display and Geist body. Product page headings: Outfit 400, 28–36px, line-height 1.15–1.2, tracking -0.02 to -0.04em. Sections: Geist 20–24px/500–600. Body: Geist 15px/400. Supporting text: 13px/400. Buttons: 14px/500. Adjust sizes to context without substituting families. Landing display weights/scale stay unchanged. This rule supersedes older blanket heavy-display-weight requirements for product screens.

Keep neutral surfaces and the existing muted-lime accent. Provider logos are monochrome identity assets. Headers and setup controls follow the shared 44px button variants.

Three centered provider choices (Claude, ChatGPT, another MCP client) run horizontally on desktop and stack on mobile. Reveal one task at a time: name/URL, authorization, then selected context sharing. A smaller illustrated preview follows the current step, clearly labeled as a guide. Connections are confirmed by authenticated client activity, never by opening a link. Multiple connections may coexist.

Review uses searchable category-filtered rows, six per page, with expandable editors. Include/exclude choices persist across pages; save applies to all included notes. Keep the save action available at the bottom. Loading locks fields, competing actions and navigation. Successful authentication/save stays busy until departure; no cleared-field flash or reactivated submit during navigation.

On narrow screens, the illustrative connection preview is collapsed behind a Show control. The introductory brand/value heading appears on provider selection only; detailed connection and review pages lead with their current task.


## Connection and Settings refinement — 2026-11-01

Remove the illustrated preview entirely, including mobile toggles. Connection pages use one focused instruction column. Provider cards remain the only provider-selection actions; no duplicate Continue-with-provider button. No Settings link appears in Connect. The theme control there is a 44px icon-only button with a 22px glyph, without border or background.

Connected checks and labels use the existing theme accent green. Neutral indicates pending/not yet observed, red indicates a status-check error. These semantic indicators may repeat across cards and the heading; the one-accent decorative limit does not suppress connection feedback. Put connection status near the heading and beside Refresh above step navigation. Step three explicitly names where the incoming draft will appear and offers Refresh. Copy confirmation changes only the initiating button to Copied with a check; no page-top copy notices.

Settings is an Operate surface: compact neutral sidebar navigation, one focused section, familiar setting rows with dividers, labels and controls. Use six sections: Account, Appearance, Connected tools, Context capture, Security, Data & privacy. Mobile uses a horizontally scrollable navigation strip and wraps row controls without horizontal page overflow. Account/profile and settings sections retain Outfit 400 page headings and Geist body/control typography. Dangerous changes use an explicit inline confirmation with consequences; no no-op controls or invented service capabilities.
