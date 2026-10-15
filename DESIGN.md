---
name: GoodBiz Agri
description: Warm-paper editorial system for a South Indian agro exporter. Structure adapted from Oura's DESIGN.md (VoltAgent/awesome-design-md); colours, type substitutes and content are GoodBiz's own.
colors:
  paper: "#F7F1E8"      # default background — never white
  surface: "#FFFFFF"    # elevated cards and inputs only
  forest: "#1F3D2B"     # dark world: hero stage, world band, footer
  turmeric: "#D99A1E"   # the single action colour — primary CTA only, ink text
  stone: "#4A4741"      # workhorse neutral: secondary pills, outlines, links, wordmark
  clay: "#6B443D"       # accent bands, eyebrows, map highlights
  gold: "#AF751B"
  gold-soft: "#DDAA61"  # accents on forest, data-viz
  olive: "#5C6F5D"
  sage-pale: "#CED4B8"
  ink: "#1C1B1A"
  ash: "#6E6B66"
  hairline: "#E1DCD3"
  error: "#B3361F"
typography:
  display: { family: Fraunces, size: "48→110px", weight: 300, lineHeight: 1.05 }
  h1: { family: Fraunces, size: 68px, weight: 300, lineHeight: 1.1 }
  h2: { family: Fraunces, size: 40px, weight: 300, lineHeight: 1.15 }
  title: { family: Manrope, size: 32px, weight: 400, lineHeight: 1.25 }
  lead: { family: Fraunces, size: 24px, weight: 300, lineHeight: 1.3 }
  body: { family: Manrope, size: 18px, weight: 400, lineHeight: 1.55 }
  body-sm: { family: Manrope, size: 16px, weight: 400, lineHeight: 1.5 }
  ui: { family: Manrope, size: 14px, weight: 500, lineHeight: 1.4 }
  caption: { family: Manrope, size: 13px, weight: 400, lineHeight: 1.4 }
  eyebrow: { family: Manrope, size: 12px, weight: 700, letterSpacing: 1px, transform: uppercase }
  data: { family: JetBrains Mono, size: 14px, weight: 400 }
rounded: { none: 0, input: 12px, card: 24px, media: 40px, full: 999px }
spacing: { base: 8px, xs: 8px, sm: 12px, md: 16px, lg: 24px, xl: 32px, section: "112px desktop / 72px mobile" }
breakpoints: { desktop: 1280px, laptop: 1024px, tablet: 768px, nav: 860px }
---

## Atmosphere
A printed field journal for a commodity trader: warm paper, thin high-contrast serif headlines, a calm sans for facts, and produce photography doing the emotional work. Restraint over decoration — flat fills, hairline rules, long vertical silences between sections.

## Surface worlds
- Cream world (`paper`) — home for editorial content, product pages, forms.
- Forest world (`forest`) — hero stage with the particle scene, the 70+ countries band, the footer. Text `paper`, accents `gold-soft`.
- White (`surface`) — only for elevated cards and inputs sitting on paper.

## Colour rules
- One `turmeric` primary CTA per view ("Request a quote"). Everything else is a `stone` pill, an outline pill, or a text link in `stone`.
- `clay`, `gold`, `olive`, `sage-pale` are for bands, eyebrows, map highlights and data — never buttons.
- Never default a background to white.

## Typography rules
- Serif for feeling, sans for facts. Fraunces 300 only at 24px and above; never body copy.
- Scale, not weight, creates hierarchy. Eyebrows set section context in small uppercase tracked sans.
- HSN codes, specs and numbers in JetBrains Mono so they read like trade documents.

## Components
- Buttons: pills, min-height 48px, 16px/600 label, padding 0 24px. Primary `turmeric`/ink; secondary `stone`/white; ghost 1px `stone` outline on paper or 1px `paper` outline on forest; on-dark `paper`/`stone`.
- Cards: `surface` or `paper`, 24px radius, 24px padding, `hairline` border or soft shadow; product imagery 40px radius (28px on mobile).
- Inputs: `surface` fill, 1px `hairline` border, 12px radius, 48px min-height, 16px text; focus ring `turmeric`; error border/text `error`.
- Pill tabs/filters: full radius, 1px `hairline` border; selected = `forest` fill, `paper` text.
- Eyebrow label: 12px/700 uppercase, `clay` on paper, `gold-soft` on forest.
- Stat: large Fraunces number in `forest` over a caption in `ash`.
- Footer: `forest` world, paper text, gold-soft headings, HSN quick reference in mono.

## Layout
- Content max-width 1216px, gutters clamp(16px, 4vw, 48px); full-bleed photography may break out.
- Section rhythm 112px desktop / 72px mobile. Card grids 4-up (≥1280) → 3-up (≥1024) → 2-up (≥768) → 1-up.

## Elevation
Level 0 flat (default). Level 1 `0 1px 2px rgb(28 27 26 / .06), 0 8px 24px rgb(28 27 26 / .06)` for resting cards. Level 2 `0 16px 48px rgb(28 27 26 / .12)` for dialogs and floating controls. Never hard shadows.

## Motion
Lenis smooth scroll; Motion for reveals, parallax, sticky story, counters and route drawing. Ease `cubic-bezier(0.22, 1, 0.36, 1)`; durations 0.6s / 1.1s. Nothing loops forever. Reduced motion shows final states immediately.

## Responsive
Nav collapses to a full-screen forest menu below 860px. Display type scales 110→48px. Touch targets ≥44px. Product imagery keeps rounded frames at every size. No horizontal scroll at 320px. Tablet (768–1023) gets two-column grids and side-by-side hero only when both columns are ≥ 320px wide.

## Do / Don't
- Do let empty cream structure the page. Don't crowd sections.
- Do keep one primary CTA per view. Don't colour links turmeric.
- Do use mono for codes and specs. Don't set body copy in the serif.
- Don't use gradients, glassmorphism, neon or hard shadows.
