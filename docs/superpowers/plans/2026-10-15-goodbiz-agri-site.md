# GoodBiz Agri Export Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast, multilingual (9 core languages + 104-language switcher), SEO/GEO/AEO-optimised B2B export website for GoodBiz Agri with a 3D hero, 3D product objects, product/HSN/blog pages, and a quote form, deployed statically to Vercel.

**Architecture:** Astro 5 static site. Language-neutral product facts live in YAML content collections; per-language text lives in parallel YAML/JSON files. Each page type is one "view" component rendered by two thin route files (English at `/`, other core languages at `/[lang]/`). Three.js, Motion (framework-free Framer Motion) and Lenis are client-side scripts loaded lazily; every 3D/animated element has a static fallback. Pure logic (HSN, i18n paths, quote validation, language switching, particle sampling, JSON-LD) lives in `src/lib` / `src/scripts/*` modules with Vitest unit tests; pages are covered by Playwright.

**Tech Stack:** Node 20+, Astro 5, TypeScript, plain CSS tokens, Three.js, Motion (`motion` package), Lenis, @astrojs/mdx, @astrojs/sitemap, @astrojs/rss, d3-geo + topojson-client + world-atlas (build-time maps), satori + @resvg/resvg-js (OG images), pdf-lib (spec sheets), @fontsource fonts, Vitest, Playwright, @lhci/cli, linkinator. Deploy: Vercel (static).

**Spec:** `docs/superpowers/specs/2026-10-15-goodbiz-agri-site-design.md`

**Design reference:** `DESIGN.md` at the repo root (created in Task 1), adapted from Oura's DESIGN.md in VoltAgent/awesome-design-md. Every UI task reads it before writing markup or CSS.

## Global Constraints

- Core locales, exactly: `en` (default, unprefixed), `ar`, `fr`, `es`, `pt`, `ru`, `zh`, `id`, `de`. Arabic pages: `dir="rtl"`. Use CSS logical properties (`margin-inline-start`, `inset-inline-end`, …) everywhere — never `left`/`right` for layout.
- Language switcher lists 104 languages; non-core choices use live machine translation; never auto-redirect by browser language.
- Product slugs, exactly: `rice`, `non-basmati-rice`, `broken-rice`, `jaggery`, `arecanut`, `groundnuts`, `coconut-copra`, `ginger`, `turmeric`.
- HSN codes are displayed exactly as stored (digits only, 4–8 chars). Codes with `verified: false`: arecanut `80280`, groundnuts `120242`, coconut `8011220`.
- Colour tokens: `--paper #F7F1E8`, `--surface #FFFFFF`, `--forest #1F3D2B`, `--turmeric #D99A1E`, `--stone #4A4741`, `--clay #6B443D`, `--gold #AF751B`, `--gold-soft #DDAA61`, `--olive #5C6F5D`, `--sage-pale #CED4B8`, `--ink #1C1B1A`, `--ash #838280`, `--hairline #E1DCD3`, `--error #B3361F`. Turmeric is the single action colour (primary CTA pill, ink text, one per view); secondary actions are stone pills or outlines; earth accents never on buttons. Backgrounds default to paper, never white. All text pairs WCAG AA.
- Shape: buttons/tabs `border-radius: 999px`; cards `--radius-card: 24px`; product imagery `--radius-media: 40px` (28px below 768px); inputs `--radius-input: 12px`; bands and full-bleed images 0. Shadows soft and warm only.
- Type scale: display `clamp(3rem, 1.2rem + 6.2vw, 6.875rem)` (48→110px) Fraunces 300; h1 68px, h2 40px Fraunces 300; title 32px, body 18px, body-sm 16px, ui 14px, caption 13px Manrope; eyebrow 12px / 700 / uppercase / 1px tracking.
- Devices: desktop ≥1280, laptop 1024–1279, tablet 768–1023, mobile ≤767. Grids 4→2→1; nav collapses below 860px; touch targets ≥44px; no horizontal scroll at 320px.
- Fonts: Fraunces 300/400 (display), Manrope (body/UI), JetBrains Mono (HSN/specs); IBM Plex Sans Arabic (ar), Noto Serif for Cyrillic headings (ru), Noto Sans SC (zh). Self-hosted via @fontsource.
- Motion: Lenis for smooth scrolling; Motion (`import { animate, scroll, inView, stagger } from 'motion'`) for all scroll/in-view effects — no GSAP, no React. One easing `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease`, Motion `[0.22, 1, 0.36, 1]`), two durations `--dur-1: 0.6s`, `--dur-2: 1.1s`. No infinite spin. `prefers-reduced-motion: reduce` disables Lenis, particles, parallax, 3D auto-rotation and reveals.
- Skills: UI implementers follow `DESIGN.md`; Task 19 runs the `taste-skill:taste-skill` and `impeccable:impeccable` review loops.
- Budgets: initial JS ≤ 60 KB gzip per page; Three.js chunk lazy; GLB ≤ 300 KB; mobile Lighthouse Performance ≥ 90, SEO = 100, Accessibility ≥ 95; LCP < 2.5 s.
- Stock images carry a visible "Representative image" label (driven by `isStock: true`).
- Primary CTA "Request a quote" + persistent WhatsApp button on every page.
- Quote form posts to Web3Forms (`https://api.web3forms.com/submit`); honeypot field `botcheck`; minimum 3 s time-to-submit.
- `robots.txt` allows GPTBot, PerplexityBot, Google-Extended, ClaudeBot.
- Site URL from env `SITE_URL`, default `https://goodbizagri.com` (owner confirms domain).
- Owner-supplied values (email, WhatsApp, address, registration numbers, Web3Forms key) live only in `src/content/site.yaml`, each placeholder value prefixed `REPLACE:` so `scripts/content-report.mjs` can list them.
- Downloading any external file (stock photos, logos, models) requires the user's explicit approval at execution time. npm packages are fine.
- Out of scope: export-to-country pages, CMS, pricing, accounts, payments, 3D globe.

## Review Focus

1. **Arabic and every page at phone, tablet and laptop widths** — no horizontal scroll and a mirrored layout in Arabic. Test: Task 9 `tests/e2e/layout.spec.ts` checks 320/375/768/1024/1440 px across all page types including `/ar/` and `/ar/products/turmeric`.
2. **Hostile or stale quote prefill params** — `?product=<script>` or `?product=mango` must be ignored, never echoed as HTML. Test: Task 13 `parsePrefill` unit tests + e2e.
3. **No WebGL / 3D load failure** — poster image stays, page has no console errors. Test: Task 8 and Task 11 e2e with WebGL disabled and the GLB route aborted.
4. **Blocked storage or blocked Google Translate script** — switcher still works (core links navigate; machine languages fall back to translate.google.com). Test: Task 16 unit tests for `safeStorage` and `machineFallbackUrl`, e2e with the script route aborted.
5. **Double-clicking "Send quote request"** — exactly one submission is sent. Test: Task 13 e2e counts intercepted requests.

---

## File Structure

```
DESIGN.md                         adapted design system (Oura structure, GoodBiz tokens)
package.json, astro.config.mjs, tsconfig.json, vitest.config.ts, playwright.config.ts,
lighthouserc.json, vercel.json, .gitignore
public/robots.txt, public/favicon.svg, public/models/            (optional .glb files)
scripts/make-placeholders.mjs     one-off: generate labelled placeholder JPGs from product YAML
scripts/copy-fonts.mjs            prebuild: copy Noto Sans SC CSS+files to public/fonts/sc/
scripts/content-report.mjs        postbuild: unverified HSN, REPLACE: values, missing/pending translations
src/
  i18n/config.ts                  locales, labels, rtl, fontStacks
  i18n/languages.ts               104-language list + nativeName()
  i18n/paths.ts                   localizePath, stripLocale, alternates
  i18n/t.ts                       createT(locale) with English fallback
  i18n/ui/{locale}.json           UI strings (9 files)
  lib/hsn.ts                      isValidHsn, formatHsn
  lib/schemas.ts                  zod schemas (pure; image() injected)
  lib/catalog.ts                  getLocalizedProducts/Product, getHsnEntries, mergeText
  lib/jsonld.ts                   JSON-LD builders
  lib/quote.ts                    parsePrefill, validateQuote, summarizeQuote, whatsappUrl, mailtoUrl, submitQuote
  lib/lang-switch.ts              resolveTarget, suggestLocale, safeStorage, machineFallbackUrl
  lib/site.ts                     site.yaml loader (typed)
  lib/geo.ts                      build-time map path generation (d3-geo)
  data/places.ts                  district/port/HQ coordinates
  data/countries.ts               served countries + route hubs
  content.config.ts               collections
  content/site.yaml
  content/products/{slug}.yaml
  content/products-i18n/{locale}/{slug}.yaml
  content/hsn-i18n/{locale}/{code}.yaml
  content/blog/{locale}/{slug}.mdx
  assets/products/{slug}/*.jpg    placeholders → stock → owner photos
  styles/tokens.css, styles/global.css, styles/fonts.css
  layouts/Base.astro
  components/                     SeoHead, Header, Footer, WhatsAppButton, CertStrip, HsnChip,
                                  Breadcrumbs, Faq, ProductCard, SpecTable, HarvestCalendar,
                                  SouthIndiaMap, WorldMap, QuoteForm, LanguageSwitcher,
                                  LanguageSuggestBanner, HeroParticles, ProductObject, StockLabel
  components/home/                Hero, Range, Journey, Why, Sourcing, HomeFaq, World, FinalCta
  views/                          HomeView, ProductsView, ProductView, HsnView, BlogIndexView,
                                  BlogPostView, AboutView, ContactView
  pages/                          index, products/index, products/[slug], hsn/[code], blog/index,
                                  blog/[slug], about, contact, rss.xml.ts, llms.txt.ts,
                                  og/[...slug].png.ts, spec-sheets/[product]/[variety].pdf.ts
  pages/[lang]/                   same route files for non-default locales + rss.xml.ts
  scripts/lazy.ts                 whenNear, canRun3D
  scripts/motion.ts               Lenis + Motion reveals/parallax/counters/sticky story/route-draw
  scripts/particles/sample.ts     pure image → point cloud sampler
  scripts/particles/scene.ts      Three.js hero scene
  scripts/product-object/grains.ts  pure grain specs + deterministic pile
  scripts/product-object/scene.ts   Three.js product scene (grains | glb)
  scripts/lang-switcher.ts        DOM wiring for switcher + banner
  scripts/quote-form.ts           DOM wiring for form
tests/unit/*.test.ts
tests/e2e/*.spec.ts
```

---

### Task 1: Scaffold the project, tooling and design tokens

**Files:**
- Create: `DESIGN.md`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/fonts.css`, `src/pages/index.astro` (temporary), `public/favicon.svg`, `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `DESIGN.md`; npm scripts `dev`, `build`, `preview`, `test`, `test:e2e`, `lhci`, `linkcheck`; CSS custom properties listed in Global Constraints plus `--space-*`, `--radius-input`, `--radius-card`, `--radius-media`, `--measure`, `--font-display`, `--font-body`, `--font-mono`, `--shadow-1`, `--shadow-2`; button classes `.btn--primary` (turmeric pill), `.btn--secondary` (stone pill), `.btn--ghost` (outline pill), `.btn--on-dark` (paper pill).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "goodbiz-agri",
  "type": "module",
  "private": true,
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "astro dev",
    "prebuild": "node scripts/copy-fonts.mjs",
    "build": "astro build && node scripts/content-report.mjs",
    "preview": "astro preview --port 4321",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lhci": "lhci autorun",
    "linkcheck": "linkinator ./dist --recurse --skip \"^https?://(?!localhost)\""
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm i astro@^5 @astrojs/mdx @astrojs/sitemap @astrojs/rss three motion lenis yaml d3-geo topojson-client world-atlas satori @resvg/resvg-js pdf-lib @fontsource/fraunces @fontsource/manrope @fontsource/jetbrains-mono @fontsource/ibm-plex-sans-arabic @fontsource/noto-serif @fontsource/noto-sans-sc
npm i -D typescript @types/three @types/d3-geo @types/topojson-client vitest @playwright/test @lhci/cli linkinator
npx playwright install chromium
```
Expected: installs without peer-dependency errors.

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://goodbizagri.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: Object.fromEntries(locales.map((l) => [l, l])) },
      filter: (page) => !page.includes('/og/') && !page.includes('/spec-sheets/'),
    }),
  ],
  image: { responsiveStyles: true },
  vite: { build: { assetsInlineLimit: 2048 } },
});
```

- [ ] **Step 4: Create `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' } });
```

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: { command: 'npm run build && npm run preview', port: 4321, reuseExistingServer: true, timeout: 240_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

```
node_modules
dist
.astro
.vercel
test-results
playwright-report
.lighthouseci
public/fonts/sc
```

- [ ] **Step 5: Create `DESIGN.md` and `src/styles/tokens.css`**

`DESIGN.md` (repo root) — the design reference every UI task reads:

```markdown
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
  ash: "#838280"
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
```

`src/styles/tokens.css`:

```css
:root {
  --paper: #F7F1E8;
  --paper-2: #EFE7D8;
  --surface: #FFFFFF;
  --forest: #1F3D2B;
  --forest-2: #2B5139;
  --turmeric: #D99A1E;
  --turmeric-hover: #E4AC3C;
  --stone: #4A4741;
  --clay: #6B443D;
  --gold: #AF751B;
  --gold-soft: #DDAA61;
  --olive: #5C6F5D;
  --sage-pale: #CED4B8;
  --ink: #1C1B1A;
  --ink-2: #4A4741;
  --ash: #838280;
  --hairline: #E1DCD3;
  --rule: var(--hairline);
  --error: #B3361F;

  --font-display: 'Fraunces', 'Noto Serif', Georgia, serif;
  --font-body: 'Manrope', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --step--2: 0.75rem;                                   /* eyebrow 12 */
  --step--1: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem); /* caption/ui 13–14 */
  --step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);    /* body 16–18 */
  --step-1: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);     /* lead 20–24 */
  --step-2: clamp(1.6rem, 1.3rem + 1.2vw, 2rem);        /* title 26–32 */
  --step-3: clamp(2rem, 1.4rem + 2.4vw, 2.5rem);        /* h2 32–40 */
  --step-4: clamp(2.5rem, 1.4rem + 4.4vw, 4.25rem);     /* h1 40–68 */
  --step-5: clamp(3rem, 1.2rem + 6.2vw, 6.875rem);      /* display 48–110 */

  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-5: 1.5rem; --space-6: 2rem; --space-7: 3rem; --space-8: 4.5rem; --space-9: 7rem;
  --gutter: clamp(1rem, 4vw, 3rem);
  --max: 76rem;
  --measure: 62ch;
  --radius: 12px;
  --radius-input: 12px;
  --radius-card: 24px;
  --radius-media: 40px;
  --shadow-1: 0 1px 2px rgb(28 27 26 / 0.06), 0 8px 24px rgb(28 27 26 / 0.06);
  --shadow-2: 0 16px 48px rgb(28 27 26 / 0.12);

  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-1: 0.6s;
  --dur-2: 1.1s;
}
@media (max-width: 767px) { :root { --radius-media: 28px; --space-9: 4.5rem; } }
:root[lang='ar'] { --font-display: 'IBM Plex Sans Arabic', sans-serif; --font-body: 'IBM Plex Sans Arabic', sans-serif; }
:root[lang='ru'] { --font-display: 'Noto Serif', Georgia, serif; }
:root[lang='zh'] { --font-display: 'Noto Sans SC', sans-serif; --font-body: 'Noto Sans SC', 'Manrope', sans-serif; }
```

- [ ] **Step 6: Create `src/styles/fonts.css` and `src/styles/global.css`**

```css
/* fonts.css — @fontsource uses unicode-range, so browsers fetch only the subsets a page uses */
@import '@fontsource/fraunces/300.css';
@import '@fontsource/fraunces/400.css';
@import '@fontsource/manrope/400.css';
@import '@fontsource/manrope/500.css';
@import '@fontsource/manrope/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/ibm-plex-sans-arabic/400.css';
@import '@fontsource/ibm-plex-sans-arabic/500.css';
@import '@fontsource/noto-serif/cyrillic-400.css';
@import '@fontsource/noto-serif/cyrillic-500.css';
```

```css
/* global.css */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-rendering: optimizeLegibility; }
body {
  margin: 0; background: var(--paper); color: var(--ink);
  font-family: var(--font-body); font-size: var(--step-0); line-height: 1.6;
  overflow-x: clip;
}
img, svg, video, canvas { display: block; max-width: 100%; height: auto; }
h1, h2 { font-family: var(--font-display); font-weight: 300; line-height: 1.08; letter-spacing: -0.01em; margin: 0; text-wrap: balance; }
h3 { font-family: var(--font-body); font-weight: 600; font-size: var(--step-1); line-height: 1.3; margin: 0; }
h1 { font-size: var(--step-4); } h2 { font-size: var(--step-3); }
.display { font-size: var(--step-5); line-height: 1.05; }
.lead { font-family: var(--font-display); font-weight: 300; font-size: var(--step-1); line-height: 1.3; }
p { margin: 0; max-width: var(--measure); text-wrap: pretty; }
a { color: inherit; text-underline-offset: 0.2em; }
:focus-visible { outline: 2px solid var(--turmeric); outline-offset: 3px; }
.container { width: min(100% - 2 * var(--gutter), var(--max)); margin-inline: auto; }
.section { padding-block: var(--space-9); }
.eyebrow { font-family: var(--font-body); font-size: var(--step--2); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--clay); }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); min-height: 48px;
  padding: 0 var(--space-5); border-radius: 999px; border: 1px solid transparent; font-weight: 600; font-size: 1rem; line-height: 1;
  text-decoration: none; cursor: pointer;
  transition: transform var(--dur-1) var(--ease), background-color var(--dur-1) var(--ease), color var(--dur-1) var(--ease);
}
.btn:active { transform: scale(0.97); }
.btn--primary { background: var(--turmeric); color: var(--ink); }
.btn--primary:hover { background: var(--turmeric-hover); }
.btn--secondary { background: var(--stone); color: var(--surface); }
.btn--secondary:hover { background: var(--ink); }
.btn--ghost { border-color: currentColor; background: transparent; }
.btn--on-dark { background: var(--paper); color: var(--stone); }
@media (max-width: 480px) { .btn { inline-size: 100%; } }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.skip { position: absolute; inset-inline-start: var(--space-4); top: -100px; z-index: 100; background: var(--ink); color: var(--paper); padding: var(--space-3); }
.skip:focus { top: var(--space-4); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 7: Temporary `src/pages/index.astro`, `public/favicon.svg`**

```astro
---
import '../styles/fonts.css';
import '../styles/tokens.css';
import '../styles/global.css';
---
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>GoodBiz Agri</title></head>
<body><main class="container"><h1>GoodBiz Agri</h1></main></body></html>
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1F3D2B"/><path d="M16 6c-5 4-7 9-5 15 1 3 3 5 5 5s4-2 5-5c2-6 0-11-5-15z" fill="#D99A1E"/></svg>
```

- [ ] **Step 8: Write smoke tests**

```ts
// tests/unit/smoke.test.ts
import { describe, it, expect } from 'vitest';
describe('toolchain', () => { it('runs', () => { expect(1 + 1).toBe(2); }); });
```

```ts
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';
test('home renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

- [ ] **Step 9: Create stub `scripts/copy-fonts.mjs` and `scripts/content-report.mjs` so `build` runs**

```js
// scripts/copy-fonts.mjs
import { cpSync, mkdirSync, existsSync } from 'node:fs';
const src = 'node_modules/@fontsource/noto-sans-sc';
const dest = 'public/fonts/sc';
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(`${src}/400.css`, `${dest}/400.css`);
  cpSync(`${src}/500.css`, `${dest}/500.css`);
  cpSync(`${src}/files`, `${dest}/files`, { recursive: true });
}
```

```js
// scripts/content-report.mjs  (replaced with full version in Task 17)
console.log('content-report: ok');
```

Note: @fontsource CSS references `./files/...`, so copying `files/` beside the CSS keeps URLs valid.

- [ ] **Step 10: Run tests and build**

Run: `npm test && npm run test:e2e -- --project=desktop`
Expected: both PASS.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project, tooling and design tokens"
```

---

### Task 2: i18n core and HSN helpers

**Files:**
- Create: `src/i18n/config.ts`, `src/i18n/languages.ts`, `src/i18n/paths.ts`, `src/lib/hsn.ts`
- Test: `tests/unit/i18n.test.ts`, `tests/unit/hsn.test.ts`

**Interfaces:**
- Produces:
  - `type Locale = 'en'|'ar'|'fr'|'es'|'pt'|'ru'|'zh'|'id'|'de'`; `locales: readonly Locale[]`; `defaultLocale: 'en'`; `nonDefaultLocales: Locale[]`; `isLocale(x: string): x is Locale`; `isRtl(l: Locale): boolean`; `localeLabels: Record<Locale, string>` (native name); `htmlLang: Record<Locale,string>` (`zh` → `zh-Hans`); `gtToCore: Record<string, Locale>` (Google Translate code → core).
  - `allLanguages: {code: string; english: string}[]` (104 entries, Google Translate codes); `nativeName(code: string): string`.
  - `localizePath(path: string, locale: Locale): string`; `stripLocale(pathname: string): {locale: Locale; path: string}`; `alternates(path: string, available?: readonly Locale[]): {hreflang: string; path: string}[]` (includes `x-default`).
  - `isValidHsn(code: string): boolean`; `formatHsn(code: string): string`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/hsn.test.ts
import { describe, it, expect } from 'vitest';
import { isValidHsn, formatHsn } from '../../src/lib/hsn';

describe('isValidHsn', () => {
  it('accepts 4–8 digit codes', () => {
    for (const c of ['1006', '80280', '100640', '8011220', '09103030']) expect(isValidHsn(c)).toBe(true);
  });
  it('rejects bad codes', () => {
    for (const c of ['', '100', '123456789', '0910 30', '09A03030']) expect(isValidHsn(c)).toBe(false);
  });
});

describe('formatHsn', () => {
  it('groups 8-digit codes 4-2-2', () => expect(formatHsn('09103030')).toBe('0910 30 30'));
  it('groups 6-digit codes 4-2', () => expect(formatHsn('100640')).toBe('1006 40'));
  it('leaves 4, 5 and 7 digit codes as stored', () => {
    expect(formatHsn('1006')).toBe('1006');
    expect(formatHsn('80280')).toBe('80280');
    expect(formatHsn('8011220')).toBe('8011220');
  });
});
```

```ts
// tests/unit/i18n.test.ts
import { describe, it, expect } from 'vitest';
import { locales, isRtl, isLocale, gtToCore } from '../../src/i18n/config';
import { allLanguages, nativeName } from '../../src/i18n/languages';
import { localizePath, stripLocale, alternates } from '../../src/i18n/paths';

describe('config', () => {
  it('has 9 core locales with en first', () => {
    expect(locales).toEqual(['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de']);
  });
  it('marks only Arabic RTL', () => {
    expect(locales.filter(isRtl)).toEqual(['ar']);
  });
  it('maps Google Translate zh-CN to core zh', () => expect(gtToCore['zh-CN']).toBe('zh'));
  it('isLocale guards', () => { expect(isLocale('fr')).toBe(true); expect(isLocale('it')).toBe(false); });
});

describe('languages', () => {
  it('lists 104 unique languages including every core locale', () => {
    expect(allLanguages).toHaveLength(104);
    const codes = new Set(allLanguages.map((l) => l.code));
    expect(codes.size).toBe(104);
    for (const c of ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh-CN', 'id', 'de']) expect(codes.has(c)).toBe(true);
  });
  it('resolves native names', () => {
    expect(nativeName('fr')).toBe('français');
    expect(nativeName('ar')).toBe('العربية');
    expect(nativeName('iw')).toBe('עברית');
    expect(nativeName('zz-unknown')).toBe('zz-unknown');
  });
});

describe('paths', () => {
  it('localizes', () => {
    expect(localizePath('/', 'en')).toBe('/');
    expect(localizePath('/', 'ar')).toBe('/ar/');
    expect(localizePath('/products/turmeric', 'fr')).toBe('/fr/products/turmeric');
  });
  it('strips locale prefix', () => {
    expect(stripLocale('/fr/products/turmeric')).toEqual({ locale: 'fr', path: '/products/turmeric' });
    expect(stripLocale('/products/turmeric/')).toEqual({ locale: 'en', path: '/products/turmeric' });
    expect(stripLocale('/ar')).toEqual({ locale: 'ar', path: '/' });
    expect(stripLocale('/italy-guide')).toEqual({ locale: 'en', path: '/italy-guide' });
  });
  it('builds alternates with x-default', () => {
    const a = alternates('/about', ['en', 'fr']);
    expect(a).toEqual([
      { hreflang: 'en', path: '/about' },
      { hreflang: 'fr', path: '/fr/about' },
      { hreflang: 'x-default', path: '/about' },
    ]);
  });
  it('uses zh-Hans for Chinese hreflang', () => {
    expect(alternates('/', ['zh']).find((x) => x.path === '/zh/')?.hreflang).toBe('zh-Hans');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/hsn.test.ts tests/unit/i18n.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/lib/hsn.ts`**

```ts
export function isValidHsn(code: string): boolean {
  return /^\d{4,8}$/.test(code);
}

export function formatHsn(code: string): string {
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4, 6)} ${code.slice(6)}`;
  if (code.length === 6) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}
```

- [ ] **Step 4: Implement `src/i18n/config.ts`**

```ts
export const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const nonDefaultLocales = locales.filter((l) => l !== defaultLocale) as Locale[];

export function isLocale(x: string): x is Locale {
  return (locales as readonly string[]).includes(x);
}
export function isRtl(l: Locale): boolean {
  return l === 'ar';
}

export const localeLabels: Record<Locale, string> = {
  en: 'English', ar: 'العربية', fr: 'Français', es: 'Español', pt: 'Português',
  ru: 'Русский', zh: '简体中文', id: 'Bahasa Indonesia', de: 'Deutsch',
};

export const htmlLang: Record<Locale, string> = {
  en: 'en', ar: 'ar', fr: 'fr', es: 'es', pt: 'pt', ru: 'ru', zh: 'zh-Hans', id: 'id', de: 'de',
};

/** Google Translate language codes that correspond to a core locale. */
export const gtToCore: Record<string, Locale> = {
  en: 'en', ar: 'ar', fr: 'fr', es: 'es', pt: 'pt', ru: 'ru', 'zh-CN': 'zh', id: 'id', de: 'de',
};

/** Flag/short code shown on the floating pill. */
export const pillCode: Record<Locale, string> = {
  en: 'EN', ar: 'AR', fr: 'FR', es: 'ES', pt: 'PT', ru: 'RU', zh: '中文', id: 'ID', de: 'DE',
};
```

- [ ] **Step 5: Implement `src/i18n/languages.ts`**

```ts
export const allLanguages: { code: string; english: string }[] = [
  ['af','Afrikaans'],['sq','Albanian'],['am','Amharic'],['ar','Arabic'],['hy','Armenian'],['az','Azerbaijani'],
  ['eu','Basque'],['be','Belarusian'],['bn','Bengali'],['bs','Bosnian'],['bg','Bulgarian'],['ca','Catalan'],
  ['ceb','Cebuano'],['ny','Chichewa'],['zh-CN','Chinese (Simplified)'],['zh-TW','Chinese (Traditional)'],
  ['co','Corsican'],['hr','Croatian'],['cs','Czech'],['da','Danish'],['nl','Dutch'],['en','English'],
  ['eo','Esperanto'],['et','Estonian'],['tl','Filipino'],['fi','Finnish'],['fr','French'],['fy','Frisian'],
  ['gl','Galician'],['ka','Georgian'],['de','German'],['el','Greek'],['gu','Gujarati'],['ht','Haitian Creole'],
  ['ha','Hausa'],['haw','Hawaiian'],['iw','Hebrew'],['hi','Hindi'],['hmn','Hmong'],['hu','Hungarian'],
  ['is','Icelandic'],['ig','Igbo'],['id','Indonesian'],['ga','Irish'],['it','Italian'],['ja','Japanese'],
  ['jw','Javanese'],['kn','Kannada'],['kk','Kazakh'],['km','Khmer'],['ko','Korean'],['ku','Kurdish (Kurmanji)'],
  ['ky','Kyrgyz'],['lo','Lao'],['la','Latin'],['lv','Latvian'],['lt','Lithuanian'],['lb','Luxembourgish'],
  ['mk','Macedonian'],['mg','Malagasy'],['ms','Malay'],['ml','Malayalam'],['mt','Maltese'],['mi','Maori'],
  ['mr','Marathi'],['mn','Mongolian'],['my','Myanmar (Burmese)'],['ne','Nepali'],['no','Norwegian'],['ps','Pashto'],
  ['fa','Persian'],['pl','Polish'],['pt','Portuguese'],['pa','Punjabi'],['ro','Romanian'],['ru','Russian'],
  ['sm','Samoan'],['gd','Scottish Gaelic'],['sr','Serbian'],['st','Sesotho'],['sn','Shona'],['sd','Sindhi'],
  ['si','Sinhala'],['sk','Slovak'],['sl','Slovenian'],['so','Somali'],['es','Spanish'],['su','Sundanese'],
  ['sw','Swahili'],['sv','Swedish'],['tg','Tajik'],['ta','Tamil'],['te','Telugu'],['th','Thai'],['tr','Turkish'],
  ['uk','Ukrainian'],['ur','Urdu'],['uz','Uzbek'],['vi','Vietnamese'],['cy','Welsh'],['xh','Xhosa'],
  ['yi','Yiddish'],['yo','Yoruba'],['zu','Zulu'],
].map(([code, english]) => ({ code, english }));

const BCP47: Record<string, string> = { iw: 'he', jw: 'jv', 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant', tl: 'fil' };

/** Language name written in its own script; falls back to the input code. */
export function nativeName(code: string): string {
  const tag = BCP47[code] ?? code;
  try {
    const name = new Intl.DisplayNames([tag], { type: 'language' }).of(tag);
    return name && name !== tag ? name : code;
  } catch {
    return code;
  }
}
```

Note: `nativeName` runs at build time in Node (full ICU), so the browser never needs Intl data for 104 languages.

- [ ] **Step 6: Implement `src/i18n/paths.ts`**

```ts
import { locales, defaultLocale, isLocale, htmlLang, type Locale } from './config';

function clean(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return path.length > 1 ? path.replace(/\/+$/, '') : '/';
}

export function localizePath(path: string, locale: Locale): string {
  const p = clean(path);
  if (locale === defaultLocale) return p;
  return p === '/' ? `/${locale}/` : `/${locale}${p}`;
}

export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const p = clean(pathname);
  const [, first, ...rest] = p.split('/');
  if (first && isLocale(first) && first !== defaultLocale) {
    return { locale: first, path: rest.length ? `/${rest.join('/')}` : '/' };
  }
  return { locale: defaultLocale, path: p };
}

export function alternates(path: string, available: readonly Locale[] = locales) {
  const list = available.map((l) => ({ hreflang: htmlLang[l], path: localizePath(path, l) }));
  const fallback = available.includes(defaultLocale) ? defaultLocale : available[0];
  return [...list, { hreflang: 'x-default', path: localizePath(path, fallback) }];
}
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/unit/hsn.test.ts tests/unit/i18n.test.ts`
Expected: PASS. If `nativeName('fr')` returns `Français` (capitalised) on your Node ICU build, change the expectation to `.toLowerCase()` comparison — do not change the implementation.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: i18n config, 104-language list, path helpers and HSN formatting"
```

---

### Task 3: Content schemas, site config, places, and English product data

**Files:**
- Create: `src/lib/schemas.ts`, `src/data/places.ts`, `src/content.config.ts`, `src/content/site.yaml`, `src/content/products/*.yaml` (9), `scripts/make-placeholders.mjs`, `src/assets/products/**.jpg` (generated)
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Consumes: `isValidHsn` (Task 2).
- Produces:
  - `placeIds` and `places: Record<PlaceId, {name: string; state: string; lon: number; lat: number; kind: 'district'|'port'|'hq'}>`.
  - `specKeys` (tuple of spec label keys); `productSchema(image)`, `productTextSchema`, `hsnTextSchema`, `blogSchema(image)`, `siteSchema` zod schemas; types `ProductData`, `ProductText`, `HsnText`, `SiteData`.
  - Collections: `products`, `productsI18n`, `hsnI18n`, `blog`, `site`.

- [ ] **Step 1: Create `src/data/places.ts`**

```ts
export const places = {
  bengaluru: { name: 'Bengaluru', state: 'Karnataka', lon: 77.59, lat: 12.97, kind: 'hq' },
  chennai: { name: 'Chennai Port', state: 'Tamil Nadu', lon: 80.29, lat: 13.08, kind: 'port' },
  kochi: { name: 'Kochi Port', state: 'Kerala', lon: 76.27, lat: 9.97, kind: 'port' },
  tuticorin: { name: 'V.O. Chidambaranar Port, Tuticorin', state: 'Tamil Nadu', lon: 78.13, lat: 8.76, kind: 'port' },
  mangalore: { name: 'New Mangalore Port', state: 'Karnataka', lon: 74.81, lat: 12.92, kind: 'port' },
  raichur: { name: 'Raichur', state: 'Karnataka', lon: 77.36, lat: 16.2, kind: 'district' },
  mandya: { name: 'Mandya', state: 'Karnataka', lon: 76.9, lat: 12.52, kind: 'district' },
  thanjavur: { name: 'Thanjavur', state: 'Tamil Nadu', lon: 79.14, lat: 10.79, kind: 'district' },
  palakkad: { name: 'Palakkad', state: 'Kerala', lon: 76.65, lat: 10.78, kind: 'district' },
  godavari: { name: 'Godavari Delta', state: 'Andhra Pradesh', lon: 81.8, lat: 16.9, kind: 'district' },
  nellore: { name: 'Nellore', state: 'Andhra Pradesh', lon: 79.99, lat: 14.44, kind: 'district' },
  belagavi: { name: 'Belagavi', state: 'Karnataka', lon: 74.5, lat: 15.85, kind: 'district' },
  thoothukudi: { name: 'Thoothukudi', state: 'Tamil Nadu', lon: 78.13, lat: 8.9, kind: 'district' },
  shivamogga: { name: 'Shivamogga', state: 'Karnataka', lon: 75.57, lat: 13.93, kind: 'district' },
  dakshinaKannada: { name: 'Dakshina Kannada', state: 'Karnataka', lon: 75.0, lat: 12.87, kind: 'district' },
  kasaragod: { name: 'Kasaragod', state: 'Kerala', lon: 75.0, lat: 12.5, kind: 'district' },
  chitradurga: { name: 'Chitradurga', state: 'Karnataka', lon: 76.4, lat: 14.23, kind: 'district' },
  anantapur: { name: 'Anantapur', state: 'Andhra Pradesh', lon: 77.6, lat: 14.68, kind: 'district' },
  tiruvannamalai: { name: 'Tiruvannamalai', state: 'Tamil Nadu', lon: 79.07, lat: 12.23, kind: 'district' },
  tiptur: { name: 'Tiptur', state: 'Karnataka', lon: 76.48, lat: 13.26, kind: 'district' },
  tumakuru: { name: 'Tumakuru', state: 'Karnataka', lon: 77.1, lat: 13.34, kind: 'district' },
  pollachi: { name: 'Pollachi', state: 'Tamil Nadu', lon: 77.0, lat: 10.66, kind: 'district' },
  wayanad: { name: 'Wayanad', state: 'Kerala', lon: 76.13, lat: 11.68, kind: 'district' },
  kodagu: { name: 'Kodagu', state: 'Karnataka', lon: 75.8, lat: 12.42, kind: 'district' },
  hassan: { name: 'Hassan', state: 'Karnataka', lon: 76.1, lat: 13.0, kind: 'district' },
  erode: { name: 'Erode', state: 'Tamil Nadu', lon: 77.72, lat: 11.34, kind: 'district' },
  salem: { name: 'Salem', state: 'Tamil Nadu', lon: 78.15, lat: 11.66, kind: 'district' },
  alleppey: { name: 'Alappuzha (Alleppey)', state: 'Kerala', lon: 76.33, lat: 9.49, kind: 'district' },
} as const satisfies Record<string, { name: string; state: string; lon: number; lat: number; kind: 'district' | 'port' | 'hq' }>;

export type PlaceId = keyof typeof places;
export const placeIds = Object.keys(places) as [PlaceId, ...PlaceId[]];
```

- [ ] **Step 2: Write failing content test**

```ts
// tests/unit/content.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'astro/zod';
import { productSchema, siteSchema } from '../../src/lib/schemas';

const dir = 'src/content/products';
const slugs = ['rice', 'non-basmati-rice', 'broken-rice', 'jaggery', 'arecanut', 'groundnuts', 'coconut-copra', 'ginger', 'turmeric'];
const imageStub = () => z.string();

describe('products', () => {
  it('has exactly the 9 product files', () => {
    expect(readdirSync(dir).map((f) => f.replace('.yaml', '')).sort()).toEqual([...slugs].sort());
  });
  for (const slug of slugs) {
    it(`${slug} matches schema and images exist`, () => {
      const file = join(dir, `${slug}.yaml`);
      const raw = parse(readFileSync(file, 'utf8'));
      const data = productSchema(imageStub).parse(raw);
      const imgs = [data.heroImage.src, ...data.varieties.map((v) => v.image.src)];
      for (const img of imgs) expect(existsSync(resolve(dirname(file), img)), img).toBe(true);
    });
  }
  it('covers the 14 HSN lines exactly once across varieties or products', () => {
    const all = slugs.flatMap((s) => productSchema(imageStub).parse(parse(readFileSync(join(dir, `${s}.yaml`), 'utf8'))).hsn.map((h) => h.code));
    expect(all.sort()).toEqual(['09101110','09101120','09101130','09101190','09103010','09103020','09103030','100640','1006','10063099','120242','1701','80280','8011220'].sort());
  });
  it('marks arecanut, groundnut and coconut codes unverified', () => {
    for (const s of ['arecanut', 'groundnuts', 'coconut-copra']) {
      const d = productSchema(imageStub).parse(parse(readFileSync(join(dir, `${s}.yaml`), 'utf8')));
      expect(d.hsn.every((h) => h.verified === false)).toBe(true);
    }
  });
  it('rejects a malformed HSN code', () => {
    const raw = parse(readFileSync(join(dir, 'rice.yaml'), 'utf8'));
    raw.hsn[0].code = '1006 30';
    expect(() => productSchema(imageStub).parse(raw)).toThrow();
  });
  it('rejects a variety HSN not listed on the product', () => {
    const raw = parse(readFileSync(join(dir, 'turmeric.yaml'), 'utf8'));
    raw.varieties[0].hsn = '1006';
    expect(() => productSchema(imageStub).parse(raw)).toThrow();
  });
});

describe('site', () => {
  it('matches schema', () => {
    expect(() => siteSchema.parse(parse(readFileSync('src/content/site.yaml', 'utf8')))).not.toThrow();
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: FAIL — `src/lib/schemas` not found.

- [ ] **Step 4: Implement `src/lib/schemas.ts`**

```ts
import { z } from 'astro/zod';
import { isValidHsn } from './hsn';
import { placeIds } from '../data/places';

export const specKeys = [
  'moisture', 'admixture', 'broken', 'foreignMatter', 'damaged', 'grainLength', 'chalky',
  'curcumin', 'count', 'size', 'colour', 'purity', 'oil', 'ash', 'sucrose', 'insoluble',
  'volatileOil', 'fibre', 'aflatoxin', 'mesh', 'sulphur',
] as const;

const hsnCode = z.string().refine(isValidHsn, 'HSN must be 4–8 digits, no spaces');
const month = z.number().int().min(1).max(12);
type ImageFn = () => z.ZodTypeAny;

export const productSchema = (image: ImageFn) =>
  z
    .object({
      order: z.number().int(),
      hsn: z.array(z.object({ code: hsnCode, verified: z.boolean() })).min(1),
      heroImage: z.object({ src: image(), isStock: z.boolean() }),
      model: z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('grains'), grain: z.enum(['rice', 'brokenRice', 'groundnut', 'arecanut', 'turmeric', 'ginger', 'jaggery', 'copra']) }),
        z.object({ kind: z.literal('glb'), src: z.string().startsWith('/models/'), fallbackGrain: z.enum(['ginger', 'jaggery', 'copra']) }),
      ]),
      regions: z.array(z.enum(placeIds)).min(1),
      markets: z.array(z.string()).min(1),
      harvestMonths: z.array(month).min(1),
      ports: z.array(z.enum(['chennai', 'kochi', 'tuticorin', 'mangalore'])).min(1),
      moq: z.string(),
      shelfLife: z.string(),
      packing: z.array(z.string()).min(1),
      containerLoad: z.object({ ft20: z.string(), ft40: z.string() }),
      related: z.array(z.string()).max(3),
      varieties: z
        .array(
          z.object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            hsn: hsnCode,
            image: z.object({ src: image(), isStock: z.boolean() }),
            region: z.enum(placeIds),
            market: z.string(),
            specs: z.array(z.object({ key: z.enum(specKeys), value: z.string() })).min(2),
            packing: z.array(z.string()).min(1),
          }),
        )
        .min(1),
    })
    .superRefine((p, ctx) => {
      const codes = new Set(p.hsn.map((h) => h.code));
      p.varieties.forEach((v, i) => {
        if (!codes.has(v.hsn)) ctx.addIssue({ code: 'custom', path: ['varieties', i, 'hsn'], message: `variety HSN ${v.hsn} not in product hsn[]` });
      });
    });

export const faqSchema = z.array(z.object({ q: z.string(), a: z.string() }));

export const productTextSchema = z.object({
  reviewStatus: z.enum(['pending', 'reviewed']),
  name: z.string(),
  summary: z.string(),
  originLine: z.string(),
  sourcingStory: z.string(),
  varieties: z.record(z.string(), z.object({ name: z.string(), description: z.string() })),
  faq: faqSchema.min(3),
});

export const hsnTextSchema = z.object({
  reviewStatus: z.enum(['pending', 'reviewed']),
  title: z.string(),
  description: z.string(),
  notes: z.string(),
  faq: faqSchema.min(2),
});

export const blogSchema = (image: ImageFn) =>
  z.object({
    title: z.string(),
    description: z.string().max(170),
    date: z.coerce.date(),
    author: z.string(),
    category: z.enum(['market-updates', 'buyer-guides', 'product-knowledge', 'export-process']),
    products: z.array(z.string()).default([]),
    cover: z.object({ src: image(), isStock: z.boolean() }).optional(),
    translationOf: z.string().optional(),
  });

export const siteSchema = z.object({
  name: z.string(),
  legalName: z.string(),
  foundingCity: z.string(),
  address: z.object({ street: z.string(), city: z.string(), region: z.string(), postalCode: z.string(), country: z.literal('IN') }),
  email: z.string(),
  phone: z.string(),
  whatsapp: z.string(),
  web3formsKey: z.string(),
  registrations: z.array(z.object({
    id: z.enum(['apeda', 'fssai', 'spices-board', 'iec', 'cdb']),
    name: z.string(),
    number: z.string(),
    logo: z.string().optional(),
    held: z.boolean(),
  })),
  stats: z.object({ countries: z.number(), products: z.number(), markets: z.number(), ports: z.number() }),
  social: z.array(z.string().url()).default([]),
});

export type ProductData = z.infer<ReturnType<typeof productSchema>>;
export type ProductText = z.infer<typeof productTextSchema>;
export type HsnText = z.infer<typeof hsnTextSchema>;
export type SiteData = z.infer<typeof siteSchema>;
```

- [ ] **Step 5: Create `src/content/site.yaml`**

```yaml
name: GoodBiz Agri
legalName: "REPLACE: GoodBiz Agri (registered legal name)"
foundingCity: Bengaluru
address:
  street: "REPLACE: Office street address"
  city: Bengaluru
  region: Karnataka
  postalCode: "REPLACE: 5600xx"
  country: IN
email: "REPLACE: export@goodbizagri.com"
phone: "REPLACE: +91 00000 00000"
whatsapp: "REPLACE: 910000000000"
web3formsKey: "REPLACE: web3forms-access-key"
registrations:
  - { id: apeda, name: "APEDA RCMC", number: "REPLACE: RCMC no.", held: true }
  - { id: fssai, name: "FSSAI", number: "REPLACE: FSSAI licence no.", held: true }
  - { id: spices-board, name: "Spices Board India", number: "REPLACE: CRES no.", held: true }
  - { id: iec, name: "IEC (DGFT)", number: "REPLACE: IEC no.", held: true }
  - { id: cdb, name: "Coconut Development Board", number: "REPLACE: CDB no.", held: true }
stats: { countries: 70, products: 9, markets: 18, ports: 4 }
social: []
```

Component code renders `REPLACE:` numbers as the localized "Number on request" string and hides `email`/`whatsapp` links whose value starts with `REPLACE:` behind the same values (they still render, so the owner sees them in preview). `held: false` hides a badge.

- [ ] **Step 6: Create the 9 product YAML files**

Image paths are relative to the YAML file. Every file listed here must also appear in Step 7's placeholder generation (the script reads these YAMLs).

`src/content/products/turmeric.yaml`
```yaml
order: 9
hsn:
  - { code: "09103010", verified: true }
  - { code: "09103020", verified: true }
  - { code: "09103030", verified: true }
heroImage: { src: ../../assets/products/turmeric/hero.jpg, isStock: true }
model: { kind: grains, grain: turmeric }
regions: [erode, salem, alleppey]
markets: ["Erode Regulated Market", "Salem Turmeric Market", "Alappuzha spice traders"]
harvestMonths: [1, 2, 3, 4]
ports: [chennai, tuticorin, kochi]
moq: "1 × 20 ft FCL"
shelfLife: "Dried: 24 months · Powder: 18 months · Fresh: 3–4 weeks (reefer)"
packing: ["25 kg / 50 kg PP or jute bags", "Paper bags with liner (powder)", "Private label on request"]
containerLoad: { ft20: "Dried 18–19 MT · Powder 20 MT", ft40: "Dried 26 MT" }
related: [ginger, jaggery, rice]
varieties:
  - id: fresh
    hsn: "09103010"
    image: { src: ../../assets/products/turmeric/fresh.jpg, isStock: true }
    region: erode
    market: "Erode Regulated Market"
    specs:
      - { key: size, value: "Fingers 4–7 cm" }
      - { key: foreignMatter, value: "≤ 1%" }
      - { key: colour, value: "Bright orange core" }
    packing: ["10 kg ventilated cartons (reefer)"]
  - id: dried-finger
    hsn: "09103020"
    image: { src: ../../assets/products/turmeric/dried-finger.jpg, isStock: true }
    region: erode
    market: "Erode Regulated Market"
    specs:
      - { key: curcumin, value: "2.5–3.5%" }
      - { key: moisture, value: "≤ 10%" }
      - { key: foreignMatter, value: "≤ 1%" }
      - { key: size, value: "Polished fingers, double polished on request" }
    packing: ["25 kg / 50 kg PP or jute bags"]
  - id: alleppey-finger
    hsn: "09103020"
    image: { src: ../../assets/products/turmeric/alleppey-finger.jpg, isStock: true }
    region: alleppey
    market: "Alappuzha spice traders"
    specs:
      - { key: curcumin, value: "4.5–5%" }
      - { key: moisture, value: "≤ 10%" }
      - { key: volatileOil, value: "≥ 3.5 ml/100 g" }
    packing: ["25 kg jute bags"]
  - id: salem-bulb
    hsn: "09103020"
    image: { src: ../../assets/products/turmeric/salem-bulb.jpg, isStock: true }
    region: salem
    market: "Salem Turmeric Market"
    specs:
      - { key: curcumin, value: "3–4%" }
      - { key: moisture, value: "≤ 10%" }
      - { key: size, value: "Round bulbs" }
    packing: ["50 kg jute bags"]
  - id: powder
    hsn: "09103030"
    image: { src: ../../assets/products/turmeric/powder.jpg, isStock: true }
    region: erode
    market: "Erode Regulated Market"
    specs:
      - { key: curcumin, value: "2–5% (to order)" }
      - { key: moisture, value: "≤ 10%" }
      - { key: mesh, value: "60–80 mesh" }
      - { key: ash, value: "≤ 7%" }
    packing: ["25 kg paper bags with PE liner", "1 kg retail pouches (private label)"]
```

`src/content/products/ginger.yaml`
```yaml
order: 8
hsn:
  - { code: "09101110", verified: true }
  - { code: "09101120", verified: true }
  - { code: "09101130", verified: true }
  - { code: "09101190", verified: true }
heroImage: { src: ../../assets/products/ginger/hero.jpg, isStock: true }
model: { kind: glb, src: /models/ginger.glb, fallbackGrain: ginger }
regions: [wayanad, kodagu, hassan]
markets: ["Wayanad (Sulthan Bathery) ginger traders", "Kodagu growers", "Hassan APMC", "Kochi spice market"]
harvestMonths: [12, 1, 2, 3]
ports: [kochi, mangalore, chennai]
moq: "1 × 20 ft FCL (dried) · 1 × 40 ft reefer (fresh)"
shelfLife: "Dried: 24 months · Fresh: 8–12 weeks (reefer)"
packing: ["13 kg / 20 kg cartons or mesh bags (fresh)", "25 kg / 50 kg PP or jute bags (dried)"]
containerLoad: { ft20: "Dried 13–15 MT", ft40: "Fresh 26 MT (reefer)" }
related: [turmeric, arecanut, coconut-copra]
varieties:
  - id: fresh
    hsn: "09101110"
    image: { src: ../../assets/products/ginger/fresh.jpg, isStock: true }
    region: wayanad
    market: "Wayanad (Sulthan Bathery) ginger traders"
    specs:
      - { key: size, value: "≥ 150 g per hand" }
      - { key: colour, value: "Light skin, washed, air-dried" }
      - { key: foreignMatter, value: "Soil-free" }
    packing: ["13 kg / 20 kg cartons", "Mesh bags"]
  - id: dried-unbleached
    hsn: "09101120"
    image: { src: ../../assets/products/ginger/dried-unbleached.jpg, isStock: true }
    region: kodagu
    market: "Kochi spice market"
    specs:
      - { key: moisture, value: "≤ 12%" }
      - { key: volatileOil, value: "≥ 1.5 ml/100 g" }
      - { key: fibre, value: "≤ 6%" }
    packing: ["25 kg / 50 kg PP or jute bags"]
  - id: dried-bleached
    hsn: "09101130"
    image: { src: ../../assets/products/ginger/dried-bleached.jpg, isStock: true }
    region: hassan
    market: "Hassan APMC"
    specs:
      - { key: moisture, value: "≤ 12%" }
      - { key: colour, value: "Lime-bleached, pale cream" }
      - { key: sulphur, value: "Per buyer limit" }
    packing: ["25 kg / 50 kg PP bags"]
  - id: whole-other
    hsn: "09101190"
    image: { src: ../../assets/products/ginger/whole-other.jpg, isStock: true }
    region: wayanad
    market: "Wayanad (Sulthan Bathery) ginger traders"
    specs:
      - { key: moisture, value: "≤ 12%" }
      - { key: foreignMatter, value: "≤ 1%" }
    packing: ["50 kg jute bags"]
```

`src/content/products/rice.yaml`
```yaml
order: 1
hsn:
  - { code: "1006", verified: true }
heroImage: { src: ../../assets/products/rice/hero.jpg, isStock: true }
model: { kind: grains, grain: rice }
regions: [raichur, mandya, thanjavur, palakkad]
markets: ["Raichur APMC", "Mandya rice mills", "Thanjavur (Kaveri delta) mills", "Palakkad mills"]
harvestMonths: [1, 2, 10, 11, 12]
ports: [chennai, tuticorin, kochi]
moq: "1 × 20 ft FCL"
shelfLife: "12–18 months"
packing: ["5 / 10 / 25 / 50 kg PP or BOPP bags", "Jute bags", "Private label"]
containerLoad: { ft20: "25–26 MT", ft40: "27 MT" }
related: [non-basmati-rice, broken-rice, jaggery]
varieties:
  - id: sona-masoori-raw
    hsn: "1006"
    image: { src: ../../assets/products/rice/sona-masoori-raw.jpg, isStock: true }
    region: raichur
    market: "Raichur APMC"
    specs:
      - { key: grainLength, value: "5.0–5.2 mm" }
      - { key: broken, value: "≤ 5%" }
      - { key: moisture, value: "≤ 14%" }
      - { key: chalky, value: "≤ 2%" }
    packing: ["25 kg BOPP bags", "10 kg retail bags"]
  - id: sona-masoori-steam
    hsn: "1006"
    image: { src: ../../assets/products/rice/sona-masoori-steam.jpg, isStock: true }
    region: raichur
    market: "Raichur APMC"
    specs:
      - { key: grainLength, value: "5.0–5.2 mm" }
      - { key: broken, value: "≤ 5%" }
      - { key: moisture, value: "≤ 13%" }
    packing: ["25 kg BOPP bags"]
  - id: ponni
    hsn: "1006"
    image: { src: ../../assets/products/rice/ponni.jpg, isStock: true }
    region: thanjavur
    market: "Thanjavur (Kaveri delta) mills"
    specs:
      - { key: grainLength, value: "5.0 mm" }
      - { key: broken, value: "≤ 5%" }
      - { key: moisture, value: "≤ 14%" }
    packing: ["25 kg / 50 kg PP bags"]
  - id: kerala-matta
    hsn: "1006"
    image: { src: ../../assets/products/rice/kerala-matta.jpg, isStock: true }
    region: palakkad
    market: "Palakkad mills"
    specs:
      - { key: colour, value: "Red bran, parboiled" }
      - { key: broken, value: "≤ 5%" }
      - { key: moisture, value: "≤ 14%" }
    packing: ["5 / 10 / 25 kg bags"]
  - id: seeraga-samba
    hsn: "1006"
    image: { src: ../../assets/products/rice/seeraga-samba.jpg, isStock: true }
    region: thanjavur
    market: "Thanjavur (Kaveri delta) mills"
    specs:
      - { key: grainLength, value: "3.5–4 mm, aromatic" }
      - { key: broken, value: "≤ 3%" }
      - { key: moisture, value: "≤ 13%" }
    packing: ["5 / 10 / 25 kg bags"]
  - id: idli-rice
    hsn: "1006"
    image: { src: ../../assets/products/rice/idli-rice.jpg, isStock: true }
    region: mandya
    market: "Mandya rice mills"
    specs:
      - { key: colour, value: "Parboiled, short bold" }
      - { key: broken, value: "≤ 5%" }
      - { key: moisture, value: "≤ 14%" }
    packing: ["25 kg PP bags"]
```

`src/content/products/non-basmati-rice.yaml`
```yaml
order: 2
hsn:
  - { code: "10063099", verified: true }
heroImage: { src: ../../assets/products/non-basmati-rice/hero.jpg, isStock: true }
model: { kind: grains, grain: rice }
regions: [godavari, nellore, raichur, thanjavur]
markets: ["Godavari delta mills", "Nellore mills", "Raichur APMC"]
harvestMonths: [3, 4, 10, 11, 12]
ports: [chennai, tuticorin]
moq: "5 × 20 ft FCL"
shelfLife: "12–18 months"
packing: ["25 / 50 kg PP bags", "Jute bags", "Jumbo bags on request"]
containerLoad: { ft20: "25–26 MT", ft40: "27 MT" }
related: [rice, broken-rice, groundnuts]
varieties:
  - id: ir64-raw
    hsn: "10063099"
    image: { src: ../../assets/products/non-basmati-rice/ir64-raw.jpg, isStock: true }
    region: godavari
    market: "Godavari delta mills"
    specs:
      - { key: grainLength, value: "5.8–6.0 mm" }
      - { key: broken, value: "5% / 25% grades" }
      - { key: moisture, value: "≤ 14%" }
      - { key: chalky, value: "≤ 6%" }
    packing: ["50 kg PP bags"]
  - id: ir64-parboiled
    hsn: "10063099"
    image: { src: ../../assets/products/non-basmati-rice/ir64-parboiled.jpg, isStock: true }
    region: godavari
    market: "Godavari delta mills"
    specs:
      - { key: grainLength, value: "5.8–6.0 mm" }
      - { key: broken, value: "5% / 25% grades" }
      - { key: moisture, value: "≤ 14%" }
    packing: ["50 kg PP bags"]
  - id: swarna
    hsn: "10063099"
    image: { src: ../../assets/products/non-basmati-rice/swarna.jpg, isStock: true }
    region: nellore
    market: "Nellore mills"
    specs:
      - { key: grainLength, value: "5.2–5.4 mm" }
      - { key: broken, value: "5% / 25% grades" }
      - { key: moisture, value: "≤ 14%" }
    packing: ["50 kg PP bags"]
  - id: ir36
    hsn: "10063099"
    image: { src: ../../assets/products/non-basmati-rice/ir36.jpg, isStock: true }
    region: raichur
    market: "Raichur APMC"
    specs:
      - { key: grainLength, value: "5.6–5.8 mm" }
      - { key: broken, value: "5% / 25% grades" }
      - { key: moisture, value: "≤ 14%" }
    packing: ["50 kg PP bags"]
```

`src/content/products/broken-rice.yaml`
```yaml
order: 3
hsn:
  - { code: "100640", verified: true }
heroImage: { src: ../../assets/products/broken-rice/hero.jpg, isStock: true }
model: { kind: grains, grain: brokenRice }
regions: [godavari, nellore, raichur]
markets: ["Godavari delta mills", "Nellore mills"]
harvestMonths: [3, 4, 10, 11, 12]
ports: [chennai, tuticorin]
moq: "5 × 20 ft FCL"
shelfLife: "12 months"
packing: ["50 kg PP bags", "Jumbo bags"]
containerLoad: { ft20: "25–26 MT", ft40: "27 MT" }
related: [non-basmati-rice, rice, groundnuts]
varieties:
  - id: white-100
    hsn: "100640"
    image: { src: ../../assets/products/broken-rice/white-100.jpg, isStock: true }
    region: godavari
    market: "Godavari delta mills"
    specs:
      - { key: broken, value: "100%" }
      - { key: moisture, value: "≤ 14%" }
      - { key: foreignMatter, value: "≤ 0.5%" }
    packing: ["50 kg PP bags"]
  - id: parboiled
    hsn: "100640"
    image: { src: ../../assets/products/broken-rice/parboiled.jpg, isStock: true }
    region: nellore
    market: "Nellore mills"
    specs:
      - { key: broken, value: "100%" }
      - { key: moisture, value: "≤ 14%" }
      - { key: colour, value: "Parboiled cream" }
    packing: ["50 kg PP bags"]
  - id: sortexed
    hsn: "100640"
    image: { src: ../../assets/products/broken-rice/sortexed.jpg, isStock: true }
    region: raichur
    market: "Raichur APMC"
    specs:
      - { key: broken, value: "100%, sortexed" }
      - { key: damaged, value: "≤ 1%" }
      - { key: moisture, value: "≤ 13.5%" }
    packing: ["50 kg PP bags", "Jumbo bags"]
```

`src/content/products/jaggery.yaml`
```yaml
order: 4
hsn:
  - { code: "1701", verified: true }
heroImage: { src: ../../assets/products/jaggery/hero.jpg, isStock: true }
model: { kind: glb, src: /models/jaggery.glb, fallbackGrain: jaggery }
regions: [mandya, belagavi, thoothukudi]
markets: ["Mandya jaggery market", "Belagavi (Mudalgi) market", "Thoothukudi palm jaggery producers"]
harvestMonths: [11, 12, 1, 2, 3, 4]
ports: [chennai, mangalore, tuticorin]
moq: "1 × 20 ft FCL"
shelfLife: "12 months (cool, dry storage)"
packing: ["1 kg / 5 kg / 30 kg cartons", "Vacuum-packed blocks", "Private label"]
containerLoad: { ft20: "18–20 MT", ft40: "26 MT" }
related: [rice, coconut-copra, groundnuts]
varieties:
  - id: block
    hsn: "1701"
    image: { src: ../../assets/products/jaggery/block.jpg, isStock: true }
    region: mandya
    market: "Mandya jaggery market"
    specs:
      - { key: sucrose, value: "65–75%" }
      - { key: moisture, value: "≤ 8%" }
      - { key: colour, value: "Golden to dark brown" }
      - { key: insoluble, value: "≤ 2%" }
    packing: ["30 kg cartons", "1 kg vacuum blocks"]
  - id: cube
    hsn: "1701"
    image: { src: ../../assets/products/jaggery/cube.jpg, isStock: true }
    region: belagavi
    market: "Belagavi (Mudalgi) market"
    specs:
      - { key: sucrose, value: "65–75%" }
      - { key: moisture, value: "≤ 6%" }
      - { key: size, value: "10–20 g cubes" }
    packing: ["500 g / 1 kg pouches", "10 kg cartons"]
  - id: powder
    hsn: "1701"
    image: { src: ../../assets/products/jaggery/powder.jpg, isStock: true }
    region: belagavi
    market: "Belagavi (Mudalgi) market"
    specs:
      - { key: moisture, value: "≤ 3%" }
      - { key: mesh, value: "Free-flowing granules" }
      - { key: insoluble, value: "≤ 1.5%" }
    packing: ["25 kg paper bags with liner", "1 kg pouches"]
  - id: organic
    hsn: "1701"
    image: { src: ../../assets/products/jaggery/organic.jpg, isStock: true }
    region: mandya
    market: "Mandya jaggery market"
    specs:
      - { key: purity, value: "Chemical-free clarification" }
      - { key: moisture, value: "≤ 6%" }
    packing: ["1 kg / 5 kg packs"]
  - id: palm-karupatti
    hsn: "1701"
    image: { src: ../../assets/products/jaggery/palm-karupatti.jpg, isStock: true }
    region: thoothukudi
    market: "Thoothukudi palm jaggery producers"
    specs:
      - { key: moisture, value: "≤ 8%" }
      - { key: colour, value: "Dark brown, palm sap" }
    packing: ["1 kg / 5 kg packs"]
```

Note: palm jaggery is classified under 1701 per the owner's code list; flag in content report is not needed (verified: true as supplied).

`src/content/products/arecanut.yaml`
```yaml
order: 5
hsn:
  - { code: "80280", verified: false }
heroImage: { src: ../../assets/products/arecanut/hero.jpg, isStock: true }
model: { kind: grains, grain: arecanut }
regions: [shivamogga, dakshinaKannada, kasaragod]
markets: ["Shivamogga APMC", "Puttur (CAMPCO) market", "Kasaragod traders"]
harvestMonths: [11, 12, 1, 2, 3]
ports: [mangalore, chennai]
moq: "1 × 20 ft FCL"
shelfLife: "12 months"
packing: ["50 kg / 70 kg PP or jute bags"]
containerLoad: { ft20: "17–18 MT (whole)", ft40: "26 MT" }
related: [coconut-copra, ginger, turmeric]
varieties:
  - id: whole-chali
    hsn: "80280"
    image: { src: ../../assets/products/arecanut/whole-chali.jpg, isStock: true }
    region: dakshinaKannada
    market: "Puttur (CAMPCO) market"
    specs:
      - { key: moisture, value: "≤ 7%" }
      - { key: damaged, value: "≤ 3%" }
      - { key: colour, value: "White interior, sun-dried" }
    packing: ["70 kg jute bags"]
  - id: split
    hsn: "80280"
    image: { src: ../../assets/products/arecanut/split.jpg, isStock: true }
    region: dakshinaKannada
    market: "Puttur (CAMPCO) market"
    specs:
      - { key: moisture, value: "≤ 7%" }
      - { key: size, value: "Halves" }
    packing: ["50 kg PP bags"]
  - id: red-kempu
    hsn: "80280"
    image: { src: ../../assets/products/arecanut/red-kempu.jpg, isStock: true }
    region: shivamogga
    market: "Shivamogga APMC"
    specs:
      - { key: moisture, value: "≤ 8%" }
      - { key: colour, value: "Boiled, red-brown (Api / Bette grades)" }
    packing: ["50 kg PP bags"]
  - id: sliced
    hsn: "80280"
    image: { src: ../../assets/products/arecanut/sliced.jpg, isStock: true }
    region: shivamogga
    market: "Shivamogga APMC"
    specs:
      - { key: moisture, value: "≤ 8%" }
      - { key: size, value: "Uniform slices" }
    packing: ["25 kg PP bags"]
```

`src/content/products/groundnuts.yaml`
```yaml
order: 6
hsn:
  - { code: "120242", verified: false }
heroImage: { src: ../../assets/products/groundnuts/hero.jpg, isStock: true }
model: { kind: grains, grain: groundnut }
regions: [chitradurga, anantapur, tiruvannamalai]
markets: ["Chitradurga APMC", "Anantapur groundnut market", "Tiruvannamalai traders"]
harvestMonths: [10, 11, 12, 3, 4]
ports: [chennai, mangalore]
moq: "1 × 20 ft FCL"
shelfLife: "9–12 months (cool storage)"
packing: ["25 kg / 50 kg PP or jute bags", "Vacuum bags"]
containerLoad: { ft20: "18–19 MT", ft40: "26 MT" }
related: [jaggery, rice, non-basmati-rice]
varieties:
  - id: bold-runner
    hsn: "120242"
    image: { src: ../../assets/products/groundnuts/bold-runner.jpg, isStock: true }
    region: anantapur
    market: "Anantapur groundnut market"
    specs:
      - { key: count, value: "38/42, 40/50, 50/60 per oz" }
      - { key: moisture, value: "≤ 7%" }
      - { key: aflatoxin, value: "≤ 10 ppb (EU grade on request)" }
      - { key: admixture, value: "≤ 1%" }
    packing: ["50 kg jute bags"]
  - id: java
    hsn: "120242"
    image: { src: ../../assets/products/groundnuts/java.jpg, isStock: true }
    region: chitradurga
    market: "Chitradurga APMC"
    specs:
      - { key: count, value: "50/60, 60/70, 70/80, 80/90 per oz" }
      - { key: moisture, value: "≤ 7%" }
      - { key: oil, value: "45–48%" }
    packing: ["50 kg jute bags"]
  - id: blanched
    hsn: "120242"
    image: { src: ../../assets/products/groundnuts/blanched.jpg, isStock: true }
    region: tiruvannamalai
    market: "Tiruvannamalai traders"
    specs:
      - { key: count, value: "Whole / split" }
      - { key: moisture, value: "≤ 6%" }
      - { key: aflatoxin, value: "≤ 4 ppb" }
    packing: ["25 kg vacuum bags in cartons"]
```

`src/content/products/coconut-copra.yaml`
```yaml
order: 7
hsn:
  - { code: "8011220", verified: false }
heroImage: { src: ../../assets/products/coconut-copra/hero.jpg, isStock: true }
model: { kind: glb, src: /models/coconut.glb, fallbackGrain: copra }
regions: [tiptur, tumakuru, pollachi]
markets: ["Tiptur APMC (ball copra)", "Tumakuru traders", "Pollachi coconut market"]
harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
ports: [mangalore, kochi, chennai]
moq: "1 × 40 ft HC (coconut) · 1 × 20 ft FCL (copra)"
shelfLife: "Coconut: 6–8 weeks · Copra: 6–12 months"
packing: ["25–30 nut mesh bags (semi-husked)", "50 kg PP / jute bags (copra)"]
containerLoad: { ft20: "Copra 13–14 MT", ft40: "Semi-husked ~28,000–30,000 nuts" }
related: [arecanut, jaggery, groundnuts]
varieties:
  - id: semi-husked
    hsn: "8011220"
    image: { src: ../../assets/products/coconut-copra/semi-husked.jpg, isStock: true }
    region: pollachi
    market: "Pollachi coconut market"
    specs:
      - { key: size, value: "≥ 500 g per nut" }
      - { key: damaged, value: "No cracks or germination" }
    packing: ["25–30 nut mesh bags"]
  - id: tiptur-ball-copra
    hsn: "8011220"
    image: { src: ../../assets/products/coconut-copra/tiptur-ball-copra.jpg, isStock: true }
    region: tiptur
    market: "Tiptur APMC (ball copra)"
    specs:
      - { key: moisture, value: "≤ 6%" }
      - { key: oil, value: "≥ 68%" }
      - { key: colour, value: "White, sweet kernel" }
    packing: ["50 kg jute bags"]
  - id: milling-copra
    hsn: "8011220"
    image: { src: ../../assets/products/coconut-copra/milling-copra.jpg, isStock: true }
    region: tumakuru
    market: "Tumakuru traders"
    specs:
      - { key: moisture, value: "≤ 6%" }
      - { key: oil, value: "≥ 65%" }
    packing: ["50 kg PP bags"]
  - id: edible-cups
    hsn: "8011220"
    image: { src: ../../assets/products/coconut-copra/edible-cups.jpg, isStock: true }
    region: tiptur
    market: "Tiptur APMC (ball copra)"
    specs:
      - { key: moisture, value: "≤ 6%" }
      - { key: size, value: "Half cups" }
    packing: ["40 kg PP bags"]
```

- [ ] **Step 7: Create `scripts/make-placeholders.mjs` and run it**

```js
// Generates labelled placeholder JPGs for every image referenced in product YAML.
// Run once; real stock photos replace these files later (same names).
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join, basename } from 'node:path';
import { parse } from 'yaml';
import sharp from 'sharp';

const dir = 'src/content/products';
const tints = ['#C9B48A', '#B9864A', '#8A4B2A', '#D99A1E', '#A7A27A', '#7F8C5A'];
let i = 0;
for (const f of readdirSync(dir)) {
  const file = join(dir, f);
  const p = parse(readFileSync(file, 'utf8'));
  const imgs = [p.heroImage.src, ...p.varieties.map((v) => v.image.src)];
  for (const rel of imgs) {
    const out = resolve(dirname(file), rel);
    if (existsSync(out)) continue;
    mkdirSync(dirname(out), { recursive: true });
    const label = `${f.replace('.yaml', '')} / ${basename(out, '.jpg')}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="100%" height="100%" fill="${tints[i++ % tints.length]}"/><text x="80" y="1120" font-family="sans-serif" font-size="56" fill="#1A1A17">${label}</text></svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toFile(out);
  }
}
console.log('placeholders ready');
```

Run: `node scripts/make-placeholders.mjs`
Expected: prints `placeholders ready`; `src/assets/products/<slug>/*.jpg` exist.

- [ ] **Step 8: Create `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';
import { productSchema, productTextSchema, hsnTextSchema, blogSchema, siteSchema } from './lib/schemas';

export const collections = {
  products: defineCollection({ loader: glob({ pattern: '*.yaml', base: './src/content/products' }), schema: ({ image }) => productSchema(image) }),
  productsI18n: defineCollection({ loader: glob({ pattern: '**/*.yaml', base: './src/content/products-i18n' }), schema: productTextSchema }),
  hsnI18n: defineCollection({ loader: glob({ pattern: '**/*.yaml', base: './src/content/hsn-i18n' }), schema: hsnTextSchema }),
  blog: defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }), schema: ({ image }) => blogSchema(image) }),
  site: defineCollection({ loader: file('./src/content/site.yaml', { parser: (text) => [{ id: 'site', ...parseYaml(text) }] }), schema: siteSchema }),
};
```

- [ ] **Step 9: Run tests and type-check**

Run: `npx vitest run tests/unit/content.test.ts && npx astro sync`
Expected: PASS; `astro sync` completes without schema errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: content schemas, places, site config and English product data"
```

---

### Task 4: UI strings, translator and product/HSN English text

**Files:**
- Create: `src/i18n/ui/en.json`, `src/i18n/t.ts`, `src/content/products-i18n/en/*.yaml` (9), `src/content/hsn-i18n/en/*.yaml` (14), `src/lib/catalog.ts`
- Test: `tests/unit/t.test.ts`, `tests/unit/catalog.test.ts`, extend `tests/unit/content.test.ts`

**Interfaces:**
- Consumes: `Locale` (Task 2), schemas (Task 3).
- Produces:
  - `createT(locale: Locale): T` where `type T = (key: UiKey, vars?: Record<string, string | number>) => string`; `UiKey = keyof typeof en`; `missingKeys(locale): UiKey[]`.
  - `mergeText<T>(base: T | undefined, localized: T | undefined): { text: T; fallback: boolean }`.
  - `getLocalizedProducts(locale): Promise<LocalizedProduct[]>` sorted by `order`; `getLocalizedProduct(locale, slug)`; `getHsnEntries(locale): Promise<HsnEntry[]>`; `getSite(): Promise<SiteData>`.
  - `type LocalizedProduct = { slug: string; data: ProductData; text: ProductText; fallback: boolean }`
  - `type HsnEntry = { code: string; verified: boolean; product: LocalizedProduct; varietyIds: string[]; text: HsnText; fallback: boolean }`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/t.test.ts
import { describe, it, expect } from 'vitest';
import { createT } from '../../src/i18n/t';

describe('createT', () => {
  it('returns English strings', () => expect(createT('en')('cta.quote')).toBe('Request a quote'));
  it('interpolates variables', () => expect(createT('en')('blog.readingTime', { n: 4 })).toBe('4 min read'));
  it('falls back to English for a missing key in another locale', () => {
    const t = createT('fr');
    expect(typeof t('cta.quote')).toBe('string');
    expect(t('cta.quote').length).toBeGreaterThan(0);
  });
});
```

```ts
// tests/unit/catalog.test.ts
import { describe, it, expect } from 'vitest';
import { mergeText } from '../../src/lib/catalog-pure';

describe('mergeText', () => {
  it('prefers localized text', () => expect(mergeText({ a: 1 }, { a: 2 })).toEqual({ text: { a: 2 }, fallback: false }));
  it('falls back to base when localized missing', () => expect(mergeText({ a: 1 }, undefined)).toEqual({ text: { a: 1 }, fallback: true }));
  it('throws when both missing', () => expect(() => mergeText(undefined, undefined)).toThrow());
});
```

Append to `tests/unit/content.test.ts`:
```ts
import { productTextSchema, hsnTextSchema } from '../../src/lib/schemas';

describe('english text', () => {
  for (const slug of slugs) {
    it(`products-i18n/en/${slug} names every variety`, () => {
      const text = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/en/${slug}.yaml`, 'utf8')));
      const data = productSchema(imageStub).parse(parse(readFileSync(join(dir, `${slug}.yaml`), 'utf8')));
      expect(Object.keys(text.varieties).sort()).toEqual(data.varieties.map((v) => v.id).sort());
    });
  }
  it('has an hsn-i18n/en file per HSN code', () => {
    const codes = ['09101110','09101120','09101130','09101190','09103010','09103020','09103030','100640','1006','10063099','120242','1701','80280','8011220'];
    for (const c of codes) hsnTextSchema.parse(parse(readFileSync(`src/content/hsn-i18n/en/${c}.yaml`, 'utf8')));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/t.test.ts tests/unit/catalog.test.ts tests/unit/content.test.ts`
Expected: FAIL — modules/files missing.

- [ ] **Step 3: Create `src/i18n/ui/en.json`**

```json
{
  "meta.siteName": "GoodBiz Agri",
  "meta.homeTitle": "GoodBiz Agri — Rice, Spices and Agro Exports from South India",
  "meta.homeDescription": "Bangalore-based exporter of rice, turmeric, ginger, arecanut, jaggery, groundnuts and copra, sourced from South India's producing markets and shipped to 70+ countries.",
  "meta.productsTitle": "Agro Export Products and HSN Codes",
  "meta.productsDescription": "Rice, non-basmati and broken rice, jaggery, arecanut, groundnuts, coconut and copra, ginger and turmeric — varieties, specifications and HSN codes.",
  "meta.blogTitle": "Agro Export Insights",
  "meta.blogDescription": "Market updates, buyer guides and export know-how for South Indian rice, spices and agro commodities.",
  "meta.aboutTitle": "About GoodBiz Agri",
  "meta.aboutDescription": "How GoodBiz Agri sources, grades and ships agro commodities from South India's producing markets.",
  "meta.contactTitle": "Request a Quote",
  "meta.contactDescription": "Send product, quantity and destination port. GoodBiz Agri replies with FOB, CFR or CIF pricing.",
  "meta.productTitle": "{name} Exporter from India — HSN {hsn}",
  "meta.hsnTitle": "HSN {code}: {title}",

  "nav.skip": "Skip to content",
  "nav.home": "Home",
  "nav.products": "Products",
  "nav.about": "About",
  "nav.blog": "Insights",
  "nav.contact": "Contact",
  "nav.menu": "Menu",
  "nav.close": "Close menu",

  "cta.quote": "Request a quote",
  "cta.viewProducts": "View products",
  "cta.viewProduct": "View product",
  "cta.whatsapp": "Chat on WhatsApp",
  "cta.specSheet": "Download spec sheet",
  "cta.quoteVariety": "Quote this variety",
  "cta.readPost": "Read article",

  "hero.eyebrow": "Agro exporters · Bengaluru, India",
  "hero.title": "South India's harvest, shipped to 70+ countries",
  "hero.lede": "Rice, spices, arecanut, jaggery, groundnuts and copra — bought direct from the markets where they grow, graded, lab-tested and loaded at Chennai, Kochi, Tuticorin and New Mangalore.",

  "trust.title": "Registered with",
  "trust.regNo": "Reg. no.",
  "trust.onRequest": "Number on request",

  "home.range.eyebrow": "Product range",
  "home.range.title": "Nine commodities, one accountable supplier",
  "home.range.lede": "Every product page lists varieties, specifications, HSN codes and the exact markets we buy from.",

  "home.journey.eyebrow": "From farm to port",
  "home.journey.title": "How a lot reaches your container",
  "home.journey.s1.title": "Bought at source",
  "home.journey.s1.body": "Our buyers work the regulated markets of Erode, Shivamogga, Tiptur, Raichur and Wayanad, where each crop is traded.",
  "home.journey.s2.title": "Graded and lab-tested",
  "home.journey.s2.body": "Lots are cleaned, sorted and tested for moisture, aflatoxin and pesticide residue before they are accepted.",
  "home.journey.s3.title": "Packed and fumigated",
  "home.journey.s3.body": "Packed to your specification in PP, jute, BOPP or vacuum bags, with fumigation and phytosanitary certification.",
  "home.journey.s4.title": "Loaded and documented",
  "home.journey.s4.body": "Stuffed at Chennai, Kochi, Tuticorin or New Mangalore with origin, phytosanitary, FSSAI and analysis certificates.",

  "home.why.eyebrow": "Why buyers stay",
  "home.why.title": "Fewer surprises at the destination port",
  "home.why.p1.title": "Direct sourcing",
  "home.why.p1.body": "We buy in the producing markets, so we know the lot, the farmer group and the harvest date.",
  "home.why.p2.title": "Lab-tested lots",
  "home.why.p2.body": "Pre-shipment samples and third-party analysis on request, matched to your market's limits.",
  "home.why.p3.title": "Flexible order sizes",
  "home.why.p3.body": "From a single 20 ft container to recurring contracts across several products.",
  "home.why.p4.title": "Paperwork handled",
  "home.why.p4.body": "Certificates of origin, phytosanitary, fumigation and analysis documents prepared with every shipment.",
  "home.why.stat.countries": "Countries served",
  "home.why.stat.products": "Product lines",
  "home.why.stat.markets": "Sourcing markets",
  "home.why.stat.ports": "Loading ports",

  "home.sourcing.eyebrow": "Where it comes from",
  "home.sourcing.title": "Sourced across four southern states",
  "home.sourcing.lede": "Choose a product to see the districts and markets we buy from.",

  "home.faq.eyebrow": "Buyer questions",
  "home.faq.title": "Before you place an order",

  "home.world.eyebrow": "Global reach",
  "home.world.title": "Shipping to 70+ countries",
  "home.world.lede": "Regular shipments to the Gulf, Africa, Southeast Asia, Europe and the Americas.",
  "region.middle-east": "Middle East",
  "region.africa": "Africa",
  "region.asia": "Asia",
  "region.europe": "Europe",
  "region.americas": "Americas",
  "region.oceania": "Oceania",

  "home.cta.title": "Tell us the product, quantity and port",
  "home.cta.body": "You'll get specifications, packing options and an FOB, CFR or CIF quote.",

  "footer.tagline": "Agro commodities from South India's producing markets.",
  "footer.hsnRef": "HSN quick reference",
  "footer.contact": "Contact",
  "footer.rights": "© {year} GoodBiz Agri. All rights reserved.",

  "product.quickFacts": "Quick facts",
  "fact.hsn": "HSN codes",
  "fact.states": "Sourced from",
  "fact.season": "Harvest season",
  "fact.moq": "Minimum order",
  "fact.packing": "Packing",
  "fact.ports": "Loading ports",
  "fact.shelfLife": "Shelf life",
  "product.varieties": "Varieties",
  "product.region": "Region",
  "product.market": "Market",
  "product.packing": "Packing",
  "product.specs": "Specifications",
  "product.where": "Where it comes from",
  "product.calendar": "Harvest calendar",
  "product.quality": "Quality and documents",
  "product.quality.body": "Every lot is cleaned, sorted and tested for moisture, aflatoxin and pesticide residue. Third-party inspection (SGS, Bureau Veritas or your nominee) on request.",
  "product.documents": "Documents with each shipment",
  "doc.coo": "Certificate of Origin",
  "doc.phyto": "Phytosanitary certificate",
  "doc.fumigation": "Fumigation certificate",
  "doc.fssai": "FSSAI licence",
  "doc.rcmc": "APEDA / Spices Board registration",
  "doc.coa": "Certificate of analysis",
  "product.shipping": "Packing and shipping",
  "product.container20": "20 ft container",
  "product.container40": "40 ft container",
  "product.incoterms": "Incoterms",
  "product.related": "Related products",
  "product.relatedPosts": "Related insights",
  "product.faq": "Questions about {name}",
  "product.representative": "Representative image",
  "product.hsnUnverified": "Code under verification",
  "product.drag": "Drag to rotate",

  "spec.moisture": "Moisture",
  "spec.admixture": "Admixture",
  "spec.broken": "Broken",
  "spec.foreignMatter": "Foreign matter",
  "spec.damaged": "Damaged / discoloured",
  "spec.grainLength": "Grain length",
  "spec.chalky": "Chalky grains",
  "spec.curcumin": "Curcumin",
  "spec.count": "Count",
  "spec.size": "Size",
  "spec.colour": "Colour / type",
  "spec.purity": "Purity",
  "spec.oil": "Oil content",
  "spec.ash": "Total ash",
  "spec.sucrose": "Sucrose",
  "spec.insoluble": "Insoluble matter",
  "spec.volatileOil": "Volatile oil",
  "spec.fibre": "Crude fibre",
  "spec.aflatoxin": "Aflatoxin",
  "spec.mesh": "Mesh / texture",
  "spec.sulphur": "Sulphur residue",

  "hsn.eyebrow": "HSN reference",
  "hsn.covers": "What we supply under this code",
  "hsn.notes": "Classification notes",
  "hsn.documents": "Typical export documents",
  "hsn.dutyNote": "Import duty and rules vary by destination and change often. Confirm the current rate with your customs broker before ordering.",
  "hsn.tableTitle": "HSN codes we export",
  "hsn.code": "HSN code",
  "hsn.description": "Description",
  "hsn.product": "Product",

  "blog.eyebrow": "Insights",
  "blog.title": "Market updates and buyer guides",
  "blog.all": "All",
  "blog.cat.market-updates": "Market updates",
  "blog.cat.buyer-guides": "Buyer guides",
  "blog.cat.product-knowledge": "Product knowledge",
  "blog.cat.export-process": "Export process",
  "blog.readingTime": "{n} min read",
  "blog.by": "By {author}",
  "blog.inEnglish": "In English",

  "about.eyebrow": "About us",
  "about.title": "A Bengaluru exporter with buyers in the markets",
  "about.lede": "GoodBiz Agri connects importers with the regulated markets and mills of Karnataka, Tamil Nadu, Kerala and Andhra Pradesh.",
  "about.story.title": "Why we work this way",
  "about.story.body": "South India grows some of the world's most traded spices and grains, but most buyers only ever see a trader's price list. We put our people in the producing markets so every lot has a known origin, grade and harvest date — and so you have one accountable partner from auction to bill of lading.",
  "about.network.title": "Our sourcing network",
  "about.quality.title": "Our quality process",

  "contact.eyebrow": "Contact",
  "contact.title": "Request a quote",
  "contact.lede": "Share what you need. We usually reply within one business day with specifications, packing options and pricing.",
  "contact.office": "Office",
  "contact.direct": "Prefer to talk directly?",

  "form.product": "Product",
  "form.variety": "Variety",
  "form.anyVariety": "Any / not sure",
  "form.select": "Choose…",
  "form.quantity": "Quantity",
  "form.unit": "Unit",
  "form.unit.mt": "Metric tonnes",
  "form.unit.fcl20": "20 ft containers",
  "form.unit.fcl40": "40 ft containers",
  "form.country": "Destination country",
  "form.port": "Destination port",
  "form.incoterm": "Incoterm",
  "form.incoterm.other": "Other / not sure",
  "form.packing": "Packing preference",
  "form.name": "Your name",
  "form.company": "Company",
  "form.email": "Email",
  "form.whatsapp": "WhatsApp number (optional)",
  "form.message": "Anything else we should know?",
  "form.submit": "Send quote request",
  "form.sending": "Sending…",
  "form.success.title": "Request received",
  "form.success.body": "Thank you. We'll reply within one business day.",
  "form.error.title": "Your request didn't send",
  "form.error.body": "Send the same details on WhatsApp or by email instead — we've written the message for you.",
  "form.error.whatsapp": "Send on WhatsApp",
  "form.error.email": "Send by email",
  "form.err.required": "Required",
  "form.err.email": "Enter a valid email address",
  "form.err.quantity": "Enter a quantity above 0",
  "form.err.product": "Choose a product",

  "lang.button": "Language",
  "lang.title": "Choose your language",
  "lang.search": "Search languages",
  "lang.core": "Full translations",
  "lang.machine": "Machine translated",
  "lang.suggestion": "View this site in English?",
  "lang.suggestYes": "Yes, switch",
  "lang.dismiss": "No, thanks",

  "breadcrumb.label": "Breadcrumb",
  "a11y.close": "Close"
}
```

- [ ] **Step 4: Implement `src/i18n/t.ts`**

```ts
import en from './ui/en.json';
import type { Locale } from './config';

export type UiKey = keyof typeof en;
export type T = (key: UiKey, vars?: Record<string, string | number>) => string;

const files = import.meta.glob<{ default: Partial<Record<UiKey, string>> }>('./ui/*.json', { eager: true });
const dict: Record<string, Partial<Record<UiKey, string>>> = {};
for (const [path, mod] of Object.entries(files)) dict[path.match(/\/(\w+)\.json$/)![1]] = mod.default;

function interpolate(s: string, vars?: Record<string, string | number>) {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;
}

export function createT(locale: Locale): T {
  const table = dict[locale] ?? {};
  return (key, vars) => interpolate(table[key] ?? en[key], vars);
}

export function missingKeys(locale: Locale): UiKey[] {
  const table = dict[locale] ?? {};
  return (Object.keys(en) as UiKey[]).filter((k) => !table[k]);
}
```

Vitest supports `import.meta.glob` only through Vite — it does (Vitest is Vite-based). If the glob fails in tests, keep the code; it runs in both Astro and Vitest.

- [ ] **Step 5: Implement `src/lib/catalog-pure.ts` and `src/lib/catalog.ts`**

```ts
// src/lib/catalog-pure.ts
export function mergeText<T>(base: T | undefined, localized: T | undefined): { text: T; fallback: boolean } {
  if (localized) return { text: localized, fallback: false };
  if (base) return { text: base, fallback: true };
  throw new Error('No text in either locale');
}
```

```ts
// src/lib/catalog.ts
import { getCollection, getEntry } from 'astro:content';
import type { Locale } from '../i18n/config';
import type { ProductData, ProductText, HsnText, SiteData } from './schemas';
import { mergeText } from './catalog-pure';

export type LocalizedProduct = { slug: string; data: ProductData; text: ProductText; fallback: boolean };
export type HsnEntry = { code: string; verified: boolean; product: LocalizedProduct; varietyIds: string[]; text: HsnText; fallback: boolean };

export async function getLocalizedProducts(locale: Locale): Promise<LocalizedProduct[]> {
  const [products, texts] = await Promise.all([getCollection('products'), getCollection('productsI18n')]);
  const byId = new Map(texts.map((t) => [t.id, t.data]));
  return products
    .map((p) => {
      const { text, fallback } = mergeText(byId.get(`en/${p.id}`), byId.get(`${locale}/${p.id}`));
      return { slug: p.id, data: p.data as ProductData, text, fallback };
    })
    .sort((a, b) => a.data.order - b.data.order);
}

export async function getLocalizedProduct(locale: Locale, slug: string) {
  const all = await getLocalizedProducts(locale);
  const found = all.find((p) => p.slug === slug);
  if (!found) throw new Error(`Unknown product ${slug}`);
  return found;
}

export async function getHsnEntries(locale: Locale): Promise<HsnEntry[]> {
  const [products, texts] = await Promise.all([getLocalizedProducts(locale), getCollection('hsnI18n')]);
  const byId = new Map(texts.map((t) => [t.id, t.data]));
  return products.flatMap((product) =>
    product.data.hsn.map((h) => {
      const { text, fallback } = mergeText(byId.get(`en/${h.code}`), byId.get(`${locale}/${h.code}`));
      return {
        code: h.code,
        verified: h.verified,
        product,
        varietyIds: product.data.varieties.filter((v) => v.hsn === h.code).map((v) => v.id),
        text,
        fallback,
      };
    }),
  );
}

export async function getSite(): Promise<SiteData> {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('site.yaml missing');
  return entry.data as SiteData;
}
```

Update `tests/unit/catalog.test.ts` import path to `../../src/lib/catalog-pure` (already as written).

- [ ] **Step 6: Create English product text (9 files)**

`src/content/products-i18n/en/turmeric.yaml`
```yaml
reviewStatus: reviewed
name: Turmeric
summary: GoodBiz Agri exports fresh turmeric (HSN 09103010), dried turmeric fingers and bulbs (HSN 09103020) and turmeric powder (HSN 09103030) sourced from Erode and Salem in Tamil Nadu and Alappuzha in Kerala, with curcumin from 2% to 5% and moisture below 10%.
originLine: Erode, Salem and Alleppey — India's turmeric heartland
sourcingStory: Erode's regulated market sets the price for much of the world's turmeric. We buy polished fingers and bulbs there and in Salem each harvest, and source high-curcumin Alleppey finger from Kerala traders for buyers who need colour strength. Powder is milled to order so curcumin and mesh match your specification.
varieties:
  fresh: { name: Fresh turmeric, description: Washed, air-dried rhizomes shipped in ventilated cartons by reefer. }
  dried-finger: { name: Erode dried finger, description: Boiled, sun-dried and polished fingers with 2.5–3.5% curcumin. }
  alleppey-finger: { name: Alleppey finger, description: High-curcumin Kerala turmeric favoured for extraction and colour. }
  salem-bulb: { name: Salem bulb, description: Round bulbs from Salem, popular for grinding. }
  powder: { name: Turmeric powder, description: Milled to order, 60–80 mesh, curcumin graded 2–5%. }
faq:
  - { q: What is the HSN code for turmeric powder?, a: "Turmeric powder is classified under HSN 09103030. Dried whole turmeric is 09103020 and fresh turmeric is 09103010." }
  - { q: What curcumin levels can you supply?, a: "Erode and Salem turmeric typically test 2.5–4% curcumin; Alleppey finger tests 4.5–5%. Powder can be blended to a specified curcumin level." }
  - { q: What is the minimum order for turmeric?, a: "One 20 ft container, which holds about 18–19 tonnes of dried turmeric or 20 tonnes of powder." }
  - { q: When is turmeric harvested?, a: "The main harvest runs from January to April, with fresh arrivals at Erode from February." }
  - { q: Can you meet EU pesticide limits?, a: "Yes. We source and test lots against EU MRLs and can provide third-party analysis before shipment." }
```

`src/content/products-i18n/en/ginger.yaml`
```yaml
reviewStatus: reviewed
name: Ginger
summary: GoodBiz Agri exports fresh ginger (HSN 09101110), dried unbleached ginger (09101120), dried bleached ginger (09101130) and other whole ginger (09101190) from Wayanad in Kerala and Kodagu and Hassan in Karnataka.
originLine: Wayanad, Kodagu and Hassan — the Western Ghats ginger belt
sourcingStory: Ginger grown on the slopes of the Western Ghats is known for its pungency and oil content. We buy fresh ginger from Wayanad growers during harvest and dried ginger through Kochi's spice trade, where the "Cochin ginger" grade has been traded for centuries.
varieties:
  fresh: { name: Fresh ginger, description: Washed and air-dried hands, packed in cartons or mesh bags for reefer shipment. }
  dried-unbleached: { name: Dried unbleached ginger, description: Peeled, sun-dried ginger with natural colour. }
  dried-bleached: { name: Dried bleached ginger, description: Lime-bleached for a pale, uniform appearance. }
  whole-other: { name: Whole dried ginger (other), description: Whole ginger neither crushed nor ground, to buyer grade. }
faq:
  - { q: What is the HSN code for dried ginger?, a: "Dried unbleached ginger is HSN 09101120 and dried bleached ginger is 09101130. Fresh ginger is 09101110." }
  - { q: How is fresh ginger shipped?, a: "In 40 ft reefer containers at about 12–13 °C, holding around 26 tonnes." }
  - { q: When is the ginger harvest?, a: "December to March. Dried ginger is available year-round from stock." }
  - { q: What is the minimum order?, a: "One 20 ft container for dried ginger, or one 40 ft reefer for fresh ginger." }
```

`src/content/products-i18n/en/rice.yaml`
```yaml
reviewStatus: reviewed
name: South Indian Rice
summary: GoodBiz Agri exports South Indian specialty rice under HSN 1006 — Sona Masoori (raw and steam), Ponni, Kerala Matta, Seeraga Samba and idli rice — milled in Raichur, Mandya, Thanjavur and Palakkad.
originLine: Raichur, Mandya, Thanjavur and Palakkad mills
sourcingStory: South India's rice is lighter and more varied than the long-grain types most buyers know. We buy Sona Masoori from the Tungabhadra command area around Raichur, Ponni and Seeraga Samba from the Kaveri delta mills of Thanjavur, and Matta from Palakkad, matching each lot to the dish and market it is for.
varieties:
  sona-masoori-raw: { name: Sona Masoori (raw), description: Light, medium-grain rice, the everyday staple of South Indian kitchens. }
  sona-masoori-steam: { name: Sona Masoori (steam), description: Steamed before milling for firmer grains and longer shelf life. }
  ponni: { name: Ponni, description: Soft, medium-grain Tamil Nadu rice preferred across Southeast Asia and the Gulf. }
  kerala-matta: { name: Kerala Matta, description: Red-bran parboiled rice from Palakkad with a nutty taste. }
  seeraga-samba: { name: Seeraga Samba, description: Small, aromatic grain used for biryani in Tamil Nadu. }
  idli-rice: { name: Idli rice, description: Short, bold parboiled rice for idli and dosa batter. }
faq:
  - { q: What is the HSN code for Sona Masoori rice?, a: "Rice falls under HSN 1006; milled non-basmati rice such as Sona Masoori is typically declared under 10063090 sub-headings. Confirm the 8-digit line with your broker." }
  - { q: What is the difference between raw and steam Sona Masoori?, a: "Steam rice is lightly steamed before milling, giving firmer cooked grains and longer storage life." }
  - { q: Can you supply private-label retail bags?, a: "Yes, in 5, 10 and 25 kg BOPP or jute bags with your branding." }
  - { q: What is the minimum order?, a: "One 20 ft container, about 25–26 tonnes." }
```

`src/content/products-i18n/en/non-basmati-rice.yaml`
```yaml
reviewStatus: reviewed
name: Non-Basmati Rice
summary: GoodBiz Agri exports bulk non-basmati rice under HSN 10063099 — IR64 raw and parboiled, Swarna and IR36 in 5% and 25% broken grades — from mills in the Godavari delta, Nellore and Raichur.
originLine: Godavari delta, Nellore and Raichur mills
sourcingStory: Andhra Pradesh's Godavari delta and Nellore district are among India's largest rice bowls. We contract with sortex-equipped mills there for consistent IR64 and Swarna in the broken grades African and Asian importers specify.
varieties:
  ir64-raw: { name: IR64 raw, description: Long-grain white rice in 5% and 25% broken grades. }
  ir64-parboiled: { name: IR64 parboiled, description: Parboiled for higher yield and firmer grains, popular in West Africa. }
  swarna: { name: Swarna, description: Medium-grain rice from Andhra Pradesh, widely used in Bangladesh and Africa. }
  ir36: { name: IR36, description: Long-grain white rice for price-sensitive markets. }
faq:
  - { q: What is HSN 10063099?, a: "It covers semi-milled or wholly milled non-basmati rice not elsewhere specified." }
  - { q: Which broken percentages do you supply?, a: "5% and 25% broken as standard; 10% and 15% on request." }
  - { q: What is the minimum order?, a: "Five 20 ft containers for bulk grades." }
  - { q: Is there an export duty on non-basmati rice?, a: "Indian export policy for rice changes periodically. We confirm the current DGFT position before every contract." }
```

`src/content/products-i18n/en/broken-rice.yaml`
```yaml
reviewStatus: reviewed
name: Broken Rice
summary: GoodBiz Agri exports 100% broken rice under HSN 100640 — white, parboiled and sortexed — from mills in the Godavari delta, Nellore and Raichur.
originLine: Godavari delta, Nellore and Raichur mills
sourcingStory: Broken rice is a staple in Senegal, the Gambia and much of West Africa, and a key input for brewing and feed. We buy it from the same mills that supply our whole-grain rice, so moisture and cleanliness meet the same standard.
varieties:
  white-100: { name: 100% white broken, description: Clean white brokens for food markets. }
  parboiled: { name: Parboiled broken, description: Parboiled brokens with a firmer texture. }
  sortexed: { name: Sortexed broken, description: Colour-sorted for uniform appearance and fewer damaged grains. }
faq:
  - { q: What is the HSN code for broken rice?, a: "Broken rice is classified under HSN 100640." }
  - { q: Who buys broken rice?, a: "Food importers in West Africa and Asia, breweries and animal-feed producers." }
  - { q: What is the minimum order?, a: "Five 20 ft containers." }
```

`src/content/products-i18n/en/jaggery.yaml`
```yaml
reviewStatus: reviewed
name: Jaggery
summary: GoodBiz Agri exports jaggery under HSN 1701 — blocks, cubes, powder, organic jaggery and palm jaggery (karupatti) — from Mandya and Belagavi in Karnataka and Thoothukudi in Tamil Nadu.
originLine: Mandya, Belagavi and Thoothukudi
sourcingStory: Mandya's sugarcane belt has made jaggery for generations, boiling fresh cane juice in open pans. We buy blocks and organic jaggery there, cubes and powder from Belagavi's processors, and palm jaggery from Thoothukudi's palmyra tappers.
varieties:
  block: { name: Jaggery blocks, description: Traditional moulded blocks, golden to dark brown. }
  cube: { name: Jaggery cubes, description: Small cubes for retail and food service. }
  powder: { name: Jaggery powder, description: Free-flowing granules for bakeries and beverages. }
  organic: { name: Organic jaggery, description: Made without chemical clarification. }
  palm-karupatti: { name: Palm jaggery (karupatti), description: Made from palmyra palm sap in southern Tamil Nadu. }
faq:
  - { q: What is the HSN code for jaggery?, a: "Jaggery is classified under HSN heading 1701." }
  - { q: How long does jaggery keep?, a: "About 12 months in cool, dry storage; powder and vacuum-packed blocks keep best." }
  - { q: What is the minimum order?, a: "One 20 ft container, about 18–20 tonnes." }
  - { q: Can you supply private label?, a: "Yes, in 500 g to 5 kg packs with your branding." }
```

`src/content/products-i18n/en/arecanut.yaml`
```yaml
reviewStatus: reviewed
name: Arecanut
summary: GoodBiz Agri exports arecanut (betel nut) — whole white chali, split, red kempu (api and bette grades) and sliced — sourced from Shivamogga and Dakshina Kannada in Karnataka and Kasaragod in Kerala.
originLine: Shivamogga, Dakshina Kannada and Kasaragod
sourcingStory: Karnataka produces most of India's arecanut. Coastal Dakshina Kannada and Kasaragod are known for sun-dried white chali, traded through Puttur's cooperative market, while Shivamogga's Malnad region specialises in boiled red grades.
varieties:
  whole-chali: { name: Whole white (chali), description: Sun-dried whole nuts with a white interior. }
  split: { name: Split arecanut, description: Halved nuts for processors. }
  red-kempu: { name: Red (kempu) — api and bette, description: Boiled and dried red-brown grades from Shivamogga. }
  sliced: { name: Sliced arecanut, description: Uniform slices for direct consumption markets. }
faq:
  - { q: What is the HSN code for arecanut?, a: "Arecanut falls under HSN heading 0802 80. We are confirming the exact 8-digit line for each grade; ask us for the code to use on your import documents." }
  - { q: What is the difference between chali and kempu?, a: "Chali is sun-dried whole nut from coastal Karnataka; kempu is boiled and dried, giving a red colour." }
  - { q: When is arecanut harvested?, a: "November to March, with new-crop arrivals peaking in January." }
```

`src/content/products-i18n/en/groundnuts.yaml`
```yaml
reviewStatus: reviewed
name: Groundnuts
summary: GoodBiz Agri exports shelled groundnuts (peanuts) — bold runner, Java and blanched in counts from 38/42 to 80/90 — sourced from Chitradurga in Karnataka, Anantapur in Andhra Pradesh and Tiruvannamalai in Tamil Nadu.
originLine: Chitradurga, Anantapur and Tiruvannamalai
sourcingStory: The dry Deccan plateau around Anantapur and Chitradurga is one of India's largest groundnut regions. We buy kernels after harvest, sort them by count and test for aflatoxin before packing.
varieties:
  bold-runner: { name: Bold (runner), description: Large, elongated kernels for roasting and snacks. }
  java: { name: Java (Spanish), description: Round, high-oil kernels for confectionery and crushing. }
  blanched: { name: Blanched, description: Skin removed, whole or split, low aflatoxin. }
faq:
  - { q: What is the HSN code for groundnut kernels?, a: "Shelled groundnuts are classified under HSN 1202 42. We are confirming the 8-digit line." }
  - { q: Can you meet EU aflatoxin limits?, a: "Yes, with sorted lots and third-party testing to ≤ 4 ppb total aflatoxin on request." }
  - { q: What counts are available?, a: "38/42 to 80/90 kernels per ounce, depending on variety." }
```

`src/content/products-i18n/en/coconut-copra.yaml`
```yaml
reviewStatus: reviewed
name: Coconut and Copra
summary: GoodBiz Agri exports semi-husked coconuts and copra (kobre) — Tiptur ball copra, milling copra and edible cups — sourced from Tiptur and Tumakuru in Karnataka and Pollachi in Tamil Nadu.
originLine: Tiptur, Tumakuru and Pollachi
sourcingStory: Tiptur in Tumakuru district is famous for ball copra — whole kernels dried slowly inside the shell for a sweet, white result. We buy it there, milling copra from Tumakuru traders and fresh semi-husked coconuts from Pollachi's year-round market.
varieties:
  semi-husked: { name: Semi-husked coconut, description: Mature nuts with partial husk, packed in mesh bags. }
  tiptur-ball-copra: { name: Tiptur ball copra, description: Whole, slow-dried edible copra with a sweet white kernel. }
  milling-copra: { name: Milling copra, description: Cup copra for oil extraction. }
  edible-cups: { name: Edible copra cups, description: Half cups for food use. }
faq:
  - { q: What is the HSN code for copra?, a: "Coconut and copra fall under HSN heading 0801. We are confirming the exact 8-digit line for each product." }
  - { q: What is Tiptur ball copra?, a: "Copra dried whole inside the shell for up to a year, giving a sweet, white kernel prized in the Gulf and South Asia." }
  - { q: Are coconuts available year-round?, a: "Yes. Pollachi supplies semi-husked coconuts throughout the year." }
```

- [ ] **Step 7: Create English HSN text (14 files)**

Each file: `src/content/hsn-i18n/en/<code>.yaml`. Contents:

`1006.yaml`
```yaml
reviewStatus: reviewed
title: Rice
description: HSN heading 1006 covers rice in all forms — paddy, husked (brown), semi-milled or wholly milled, and broken.
notes: Sona Masoori, Ponni, Matta and other South Indian varieties are non-basmati rice; the 8-digit line depends on milling and parboiling.
faq:
  - { q: Which rice varieties fall under 1006?, a: "All rice, including Sona Masoori, Ponni, Kerala Matta, Seeraga Samba and idli rice." }
  - { q: Is basmati under the same heading?, a: "Yes, but basmati has its own sub-headings. GoodBiz Agri exports non-basmati varieties." }
```

`10063099.yaml`
```yaml
reviewStatus: reviewed
title: Non-basmati rice, other (semi or wholly milled)
description: HSN 10063099 covers semi-milled or wholly milled non-basmati rice not specified elsewhere.
notes: Commonly used for IR64, Swarna and IR36 in white and parboiled forms.
faq:
  - { q: Which products use 10063099?, a: "Bulk non-basmati grades such as IR64, Swarna and IR36." }
  - { q: Does parboiled rice use this code?, a: "Parboiled rice has its own sub-heading in some tariff schedules; confirm with your broker." }
```

`100640.yaml`
```yaml
reviewStatus: reviewed
title: Broken rice
description: HSN 100640 covers broken rice — fragments of milled rice.
notes: Includes 100% white, parboiled and sortexed brokens for food, brewing and feed.
faq:
  - { q: What counts as broken rice?, a: "Grain fragments below three-quarters of the whole kernel length." }
  - { q: Where is broken rice in demand?, a: "West Africa, parts of Asia, breweries and feed mills." }
```

`1701.yaml`
```yaml
reviewStatus: reviewed
title: Cane or beet sugar, including jaggery
description: HSN heading 1701 covers cane and beet sugar in solid form, including jaggery (gur).
notes: GoodBiz Agri ships jaggery blocks, cubes, powder, organic jaggery and palm jaggery under this heading.
faq:
  - { q: Is jaggery classified as sugar?, a: "Yes, jaggery is non-centrifugal cane sugar under heading 1701." }
  - { q: Does jaggery powder use the same heading?, a: "Yes." }
```

`80280.yaml`
```yaml
reviewStatus: pending
title: Areca nuts
description: Areca nuts (betel nuts) are classified under HSN heading 0802 80, with sub-lines for whole, split and ground nuts.
notes: The code is shown as supplied by GoodBiz Agri and is under verification. Confirm the full 8-digit line with your broker.
faq:
  - { q: Which arecanut grades do you export?, a: "Whole white chali, split, red kempu (api and bette) and sliced." }
  - { q: Why is the code under verification?, a: "We are confirming the exact 8-digit line for each grade before publishing it." }
```

`120242.yaml`
```yaml
reviewStatus: pending
title: Groundnuts, shelled
description: HSN 1202 42 covers groundnuts (peanuts), shelled, whether or not broken, not roasted or otherwise cooked.
notes: The code is shown as supplied and is under verification for the 8-digit line.
faq:
  - { q: Does this cover blanched kernels?, a: "Blanched kernels that are not roasted are generally included; confirm with your broker." }
  - { q: Which varieties do you supply?, a: "Bold (runner), Java (Spanish) and blanched kernels." }
```

`8011220.yaml`
```yaml
reviewStatus: pending
title: Coconuts and copra
description: Coconuts and copra are classified under HSN heading 0801 (coconuts) and related lines for dried kernel.
notes: The code is shown as supplied and is under verification. Copra may be classified under a separate heading in some schedules.
faq:
  - { q: Which coconut products do you export?, a: "Semi-husked coconuts, Tiptur ball copra, milling copra and edible copra cups." }
  - { q: Why is the code under verification?, a: "Classification differs between fresh coconut and dried copra; we are confirming each line." }
```

`09101110.yaml`
```yaml
reviewStatus: reviewed
title: Fresh ginger
description: HSN 09101110 covers fresh ginger, neither crushed nor ground.
notes: Shipped washed and air-dried in reefer containers.
faq:
  - { q: How is fresh ginger packed?, a: "In 13 kg or 20 kg cartons or mesh bags." }
  - { q: What temperature is used for shipping?, a: "About 12–13 °C in reefer containers." }
```

`09101120.yaml`
```yaml
reviewStatus: reviewed
title: Dried ginger, unbleached
description: HSN 09101120 covers dried ginger that has not been bleached, neither crushed nor ground.
notes: Includes peeled and unpeeled sun-dried ginger, including Cochin grades.
faq:
  - { q: What moisture is typical?, a: "12% or below." }
  - { q: What is Cochin ginger?, a: "A traditional Kerala dried ginger grade traded through Kochi." }
```

`09101130.yaml`
```yaml
reviewStatus: reviewed
title: Dried ginger, bleached
description: HSN 09101130 covers bleached dried ginger, neither crushed nor ground.
notes: Lime-bleached for a pale, uniform appearance.
faq:
  - { q: How is ginger bleached?, a: "Traditionally with lime; sulphur limits are agreed with the buyer." }
  - { q: Which markets prefer bleached ginger?, a: "Mainly Middle Eastern and some Asian markets." }
```

`09101190.yaml`
```yaml
reviewStatus: reviewed
title: Other ginger, neither crushed nor ground
description: HSN 09101190 covers ginger not elsewhere specified, neither crushed nor ground.
notes: Used for whole ginger forms outside the fresh and dried lines.
faq:
  - { q: When is this code used?, a: "For whole ginger that is not classed as fresh or as dried bleached or unbleached." }
  - { q: Can you advise on the right code?, a: "Yes — share your product description and we will suggest the line to confirm with your broker." }
```

`09103010.yaml`
```yaml
reviewStatus: reviewed
title: Fresh turmeric
description: HSN 09103010 covers fresh turmeric (curcuma) rhizomes.
notes: Shipped washed in ventilated cartons by reefer.
faq:
  - { q: How long does fresh turmeric keep?, a: "Three to four weeks under refrigeration." }
  - { q: When is it available?, a: "February to April." }
```

`09103020.yaml`
```yaml
reviewStatus: reviewed
title: Dried turmeric
description: HSN 09103020 covers dried turmeric, whole — fingers and bulbs — neither crushed nor ground.
notes: Includes Erode, Salem and Alleppey fingers and bulbs.
faq:
  - { q: What curcumin do dried fingers have?, a: "2.5–3.5% for Erode, up to 5% for Alleppey finger." }
  - { q: Are fingers polished?, a: "Yes, single or double polished on request." }
```

`09103030.yaml`
```yaml
reviewStatus: reviewed
title: Turmeric powder
description: HSN 09103030 covers turmeric that is crushed or ground.
notes: Milled to order for curcumin level and mesh size.
faq:
  - { q: What mesh sizes are available?, a: "60–80 mesh as standard; finer on request." }
  - { q: How is powder packed?, a: "25 kg paper bags with PE liner, or retail pouches under your label." }
```

- [ ] **Step 8: Run tests**

Run: `npx vitest run && npx astro sync`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: English UI strings, translator, catalog loaders and product/HSN text"
```

---

### Task 5: Base layout, SEO head and JSON-LD builders

**Files:**
- Create: `src/lib/jsonld.ts`, `src/components/SeoHead.astro`, `src/layouts/Base.astro`
- Test: `tests/unit/jsonld.test.ts`

**Interfaces:**
- Consumes: `alternates`, `localizePath`, `htmlLang`, `isRtl` (Task 2); `createT` (Task 4); `getSite` (Task 4).
- Produces:
  - `organizationLd(site: SiteData, siteUrl: string): object`
  - `productLd(args: { name: string; description: string; url: string; image: string; hsn: string[]; brand: string; varieties: { name: string; hsn: string }[] }): object`
  - `faqLd(items: { q: string; a: string }[]): object`
  - `breadcrumbLd(items: { name: string; url: string }[]): object`
  - `articleLd(args: { title: string; description: string; url: string; image: string; date: Date; author: string; locale: string }): object`
  - `Base.astro` props: `{ locale: Locale; title: string; description: string; path: string; available?: readonly Locale[]; ogImage?: string; jsonLd?: object[]; noindex?: boolean; hero?: 'dark' | 'light' }` with a default `<slot />`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/jsonld.test.ts
import { describe, it, expect } from 'vitest';
import { organizationLd, productLd, faqLd, breadcrumbLd, articleLd } from '../../src/lib/jsonld';

const site = {
  name: 'GoodBiz Agri', legalName: 'GoodBiz Agri', foundingCity: 'Bengaluru',
  address: { street: 'X', city: 'Bengaluru', region: 'Karnataka', postalCode: '560001', country: 'IN' as const },
  email: 'a@b.c', phone: '+91', whatsapp: '91', web3formsKey: 'k', registrations: [], stats: { countries: 70, products: 9, markets: 18, ports: 4 }, social: [],
};

describe('jsonld', () => {
  it('organization', () => {
    const o = organizationLd(site, 'https://x.com') as any;
    expect(o['@type']).toBe('Organization');
    expect(o.address.addressCountry).toBe('IN');
    expect(o.url).toBe('https://x.com/');
  });
  it('omits REPLACE: placeholders from organization contact', () => {
    const o = organizationLd({ ...site, email: 'REPLACE: x', phone: 'REPLACE: y' }, 'https://x.com') as any;
    expect(o.email).toBeUndefined();
    expect(o.telephone).toBeUndefined();
  });
  it('product carries HSN as additionalProperty and offers no price', () => {
    const p = productLd({ name: 'Turmeric', description: 'd', url: 'https://x.com/products/turmeric', image: 'https://x.com/i.jpg', hsn: ['09103020'], brand: 'GoodBiz Agri', varieties: [{ name: 'Erode', hsn: '09103020' }] }) as any;
    expect(p['@type']).toBe('Product');
    expect(p.additionalProperty[0]).toEqual({ '@type': 'PropertyValue', name: 'HSN code', value: '09103020' });
    expect(p.offers).toBeUndefined();
  });
  it('faq', () => {
    const f = faqLd([{ q: 'Q', a: 'A' }]) as any;
    expect(f.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Q', acceptedAnswer: { '@type': 'Answer', text: 'A' } });
  });
  it('breadcrumb positions start at 1', () => {
    const b = breadcrumbLd([{ name: 'Home', url: 'u1' }, { name: 'Products', url: 'u2' }]) as any;
    expect(b.itemListElement.map((i: any) => i.position)).toEqual([1, 2]);
  });
  it('article dates are ISO', () => {
    const a = articleLd({ title: 't', description: 'd', url: 'u', image: 'i', date: new Date('2026-10-01'), author: 'A', locale: 'en' }) as any;
    expect(a.datePublished).toBe('2026-10-01T00:00:00.000Z');
    expect(a.inLanguage).toBe('en');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/jsonld.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/jsonld.ts`**

```ts
import type { SiteData } from './schemas';

const ctx = 'https://schema.org';
const real = (v: string) => (v.startsWith('REPLACE:') ? undefined : v);

export function organizationLd(site: SiteData, siteUrl: string) {
  const url = new URL('/', siteUrl).href;
  return {
    '@context': ctx,
    '@type': 'Organization',
    name: site.name,
    legalName: real(site.legalName),
    url,
    logo: new URL('/favicon.svg', siteUrl).href,
    email: real(site.email),
    telephone: real(site.phone),
    address: {
      '@type': 'PostalAddress',
      streetAddress: real(site.address.street),
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: real(site.address.postalCode),
      addressCountry: site.address.country,
    },
    areaServed: 'Worldwide',
    sameAs: site.social.length ? site.social : undefined,
  };
}

export function productLd(a: { name: string; description: string; url: string; image: string; hsn: string[]; brand: string; varieties: { name: string; hsn: string }[] }) {
  return {
    '@context': ctx,
    '@type': 'Product',
    name: a.name,
    description: a.description,
    url: a.url,
    image: a.image,
    brand: { '@type': 'Brand', name: a.brand },
    countryOfOrigin: { '@type': 'Country', name: 'India' },
    additionalProperty: a.hsn.map((h) => ({ '@type': 'PropertyValue', name: 'HSN code', value: h })),
    hasVariant: a.varieties.map((v) => ({
      '@type': 'Product',
      name: v.name,
      additionalProperty: [{ '@type': 'PropertyValue', name: 'HSN code', value: v.hsn }],
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    '@context': ctx,
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    '@context': ctx,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((i, idx) => ({ '@type': 'ListItem', position: idx + 1, name: i.name, item: i.url })),
  };
}

export function articleLd(a: { title: string; description: string; url: string; image: string; date: Date; author: string; locale: string }) {
  return {
    '@context': ctx,
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    mainEntityOfPage: a.url,
    image: a.image,
    datePublished: a.date.toISOString(),
    author: { '@type': 'Person', name: a.author },
    publisher: { '@type': 'Organization', name: 'GoodBiz Agri' },
    inLanguage: a.locale,
  };
}
```

`JSON.stringify` drops `undefined` fields, which keeps placeholder values out of the output.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/jsonld.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `src/components/SeoHead.astro`**

```astro
---
import { alternates, localizePath } from '../i18n/paths';
import { htmlLang, type Locale, locales } from '../i18n/config';

interface Props {
  locale: Locale; title: string; description: string; path: string;
  available?: readonly Locale[]; ogImage?: string; jsonLd?: object[]; noindex?: boolean;
}
const { locale, title, description, path, available = locales, ogImage, jsonLd = [], noindex = false } = Astro.props;
const site = Astro.site!;
const canonical = new URL(localizePath(path, locale), site).href;
const og = new URL(ogImage ?? '/og/home.png', site).href;
const fullTitle = title.includes('GoodBiz') ? title : `${title} | GoodBiz Agri`;
---
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
{noindex && <meta name="robots" content="noindex" />}
{alternates(path, available).map((a) => <link rel="alternate" hreflang={a.hreflang} href={new URL(a.path, site).href} />)}
<meta property="og:type" content="website" />
<meta property="og:site_name" content="GoodBiz Agri" />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={og} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content={htmlLang[locale].replace('-', '_')} />
<meta name="twitter:card" content="summary_large_image" />
<link rel="alternate" type="application/rss+xml" title="GoodBiz Agri" href={localizePath('/rss.xml', locale)} />
{jsonLd.map((d) => <script type="application/ld+json" set:html={JSON.stringify(d)} />)}
```

- [ ] **Step 6: Implement `src/layouts/Base.astro`**

```astro
---
import '../styles/fonts.css';
import '../styles/tokens.css';
import '../styles/global.css';
import SeoHead from '../components/SeoHead.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import WhatsAppButton from '../components/WhatsAppButton.astro';
import LanguageSwitcher from '../components/LanguageSwitcher.astro';
import LanguageSuggestBanner from '../components/LanguageSuggestBanner.astro';
import { htmlLang, isRtl, type Locale } from '../i18n/config';
import { createT } from '../i18n/t';
import { organizationLd } from '../lib/jsonld';
import { getSite } from '../lib/catalog';

interface Props {
  locale: Locale; title: string; description: string; path: string;
  available?: readonly Locale[]; ogImage?: string; jsonLd?: object[]; noindex?: boolean; hero?: 'dark' | 'light';
}
const { locale, hero = 'light', jsonLd = [], ...seo } = Astro.props;
const t = createT(locale);
const site = await getSite();
const ld = [organizationLd(site, Astro.site!.href), ...jsonLd];
---
<!doctype html>
<html lang={htmlLang[locale]} dir={isRtl(locale) ? 'rtl' : 'ltr'} data-hero={hero}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#1F3D2B" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    {locale === 'zh' && <link rel="stylesheet" href="/fonts/sc/400.css" />}
    {locale === 'zh' && <link rel="stylesheet" href="/fonts/sc/500.css" />}
    <SeoHead locale={locale} jsonLd={ld} {...seo} />
    <slot name="head" />
  </head>
  <body>
    <a class="skip" href="#main">{t('nav.skip')}</a>
    <Header locale={locale} path={seo.path} hero={hero} />
    <main id="main"><slot /></main>
    <Footer locale={locale} />
    <WhatsAppButton locale={locale} />
    <LanguageSwitcher locale={locale} path={seo.path} available={seo.available} />
    <LanguageSuggestBanner locale={locale} path={seo.path} available={seo.available} />
    <script>import '../scripts/motion';</script>
  </body>
</html>
```

`Header`, `Footer`, `WhatsAppButton`, `LanguageSwitcher`, `LanguageSuggestBanner` and `scripts/motion.ts` are created in Tasks 6, 7 and 16. To keep this task buildable, create minimal stubs now that later tasks replace:

```astro
---
// src/components/Header.astro, Footer.astro, WhatsAppButton.astro, LanguageSwitcher.astro, LanguageSuggestBanner.astro (identical stub)
const _ = Astro.props;
---
```

```ts
// src/scripts/motion.ts (stub)
export {};
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: JSON-LD builders, SEO head and base layout"
```

---

### Task 6: Site chrome, view/route pattern and home skeleton

**Files:**
- Create: `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/WhatsAppButton.astro`, `src/components/CertStrip.astro`, `src/components/HsnChip.astro`, `src/components/Breadcrumbs.astro`, `src/components/StockLabel.astro`, `src/components/Faq.astro`, `src/lib/site.ts`, `src/lib/routes.ts`, `src/views/HomeView.astro`, `src/pages/index.astro` (replace), `src/pages/[lang]/index.astro`
- Test: `tests/e2e/chrome.spec.ts`, `tests/unit/site.test.ts`

**Interfaces:**
- Consumes: Base layout (Task 5), `createT`, `getSite`, `getLocalizedProducts`, `formatHsn`, `localizePath`.
- Produces:
  - `isPlaceholder(v: string): boolean`; `whatsappHref(number: string, text?: string): string | null` (null when placeholder); `mailtoHref(email: string, subject?: string, body?: string): string | null`.
  - `localeStaticPaths()` → `{ params: { lang: Locale } }[]` for non-default locales.
  - Components: `<HsnChip code verified locale />`, `<CertStrip locale />`, `<Breadcrumbs locale items={{name, path}[]} />`, `<StockLabel locale show />`, `<Faq items={{q,a}[]} />`, `<WhatsAppButton locale text? />`.
  - `HomeView` props `{ locale: Locale }`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/site.test.ts
import { describe, it, expect } from 'vitest';
import { isPlaceholder, whatsappHref, mailtoHref } from '../../src/lib/site';

describe('site helpers', () => {
  it('detects placeholders', () => { expect(isPlaceholder('REPLACE: x')).toBe(true); expect(isPlaceholder('91987')).toBe(false); });
  it('builds WhatsApp links with digits only', () => expect(whatsappHref('+91 98765-43210', 'Hi there')).toBe('https://wa.me/919876543210?text=Hi%20there'));
  it('returns null for placeholder numbers', () => expect(whatsappHref('REPLACE: 91')).toBeNull());
  it('builds mailto links', () => expect(mailtoHref('a@b.co', 'Quote', 'Body')).toBe('mailto:a@b.co?subject=Quote&body=Body'));
});
```

```ts
// tests/e2e/chrome.spec.ts
import { test, expect } from '@playwright/test';

test('english home has header, footer, quote CTA and WhatsApp', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request a quote' }).first()).toBeVisible();
  await expect(page.locator('[data-whatsapp]')).toHaveCount(1);
});

test('arabic home is rtl', async ({ page }) => {
  await page.goto('/ar/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('home has hreflang for all 9 locales plus x-default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(10);
});

test('every ld+json block parses', async ({ page }) => {
  await page.goto('/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks.length).toBeGreaterThan(0);
  for (const b of blocks) expect(() => JSON.parse(b)).not.toThrow();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/site.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/site.ts` and `src/lib/routes.ts`**

```ts
// src/lib/site.ts
export const isPlaceholder = (v: string) => v.trim().startsWith('REPLACE:');

export function whatsappHref(number: string, text?: string): string | null {
  if (isPlaceholder(number)) return null;
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function mailtoHref(email: string, subject?: string, body?: string): string | null {
  if (isPlaceholder(email)) return null;
  const q = new URLSearchParams();
  if (subject) q.set('subject', subject);
  if (body) q.set('body', body);
  const qs = q.toString().replace(/\+/g, '%20');
  return `mailto:${email}${qs ? `?${qs}` : ''}`;
}
```

Adjust the mailto test expectation if `URLSearchParams` encoding differs: the implementation converts `+` to `%20`, so `'Quote'` and `'Body'` encode unchanged and the test passes as written.

```ts
// src/lib/routes.ts
import { nonDefaultLocales } from '../i18n/config';
export function localeStaticPaths() {
  return nonDefaultLocales.map((lang) => ({ params: { lang } }));
}
```

- [ ] **Step 4: Implement small components**

```astro
---
// src/components/HsnChip.astro
import { formatHsn } from '../lib/hsn';
import { createT } from '../i18n/t';
import type { Locale } from '../i18n/config';
interface Props { code: string; verified: boolean; locale: Locale; href?: string }
const { code, verified, locale, href } = Astro.props;
const t = createT(locale);
const Tag = href ? 'a' : 'span';
---
<Tag class="hsn" href={href} dir="ltr" title={verified ? undefined : t('product.hsnUnverified')}>
  <span class="hsn__label">HSN</span> {formatHsn(code)}{!verified && <span class="hsn__flag" aria-label={t('product.hsnUnverified')}>*</span>}
</Tag>
<style>
  .hsn { display: inline-flex; gap: 0.4em; align-items: baseline; font-family: var(--font-mono); font-size: var(--step--1);
    border: 1px solid currentColor; border-radius: 3px; padding: 0.15em 0.5em; text-decoration: none; white-space: nowrap; }
  .hsn__label { opacity: 0.7; }
  .hsn__flag { color: var(--clay); }
</style>
```

```astro
---
// src/components/StockLabel.astro
import { createT } from '../i18n/t';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale; show: boolean }
const { locale, show } = Astro.props;
---
{show && <span class="stock">{createT(locale)('product.representative')}</span>}
<style>
  .stock { position: absolute; inset-block-end: var(--space-2); inset-inline-start: var(--space-2); font-size: 0.7rem;
    background: rgb(26 26 23 / 0.62); color: var(--paper); padding: 0.15em 0.5em; border-radius: 3px; }
</style>
```

```astro
---
// src/components/Faq.astro
interface Props { items: { q: string; a: string }[] }
const { items } = Astro.props;
---
<div class="faq">
  {items.map((i) => (
    <details>
      <summary><h3>{i.q}</h3></summary>
      <p>{i.a}</p>
    </details>
  ))}
</div>
<style>
  .faq { border-block-start: 1px solid var(--rule); }
  details { border-block-end: 1px solid var(--rule); padding-block: var(--space-5); }
  summary { cursor: pointer; list-style: none; display: flex; justify-content: space-between; gap: var(--space-4); }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: '+'; font-family: var(--font-mono); transition: transform var(--dur-1) var(--ease); }
  details[open] summary::after { transform: rotate(45deg); }
  summary h3 { font-size: var(--step-1); }
  details p { margin-block-start: var(--space-3); color: var(--ink-2); }
</style>
```

```astro
---
// src/components/Breadcrumbs.astro
import { localizePath } from '../i18n/paths';
import { createT } from '../i18n/t';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale; items: { name: string; path: string }[] }
const { locale, items } = Astro.props;
const t = createT(locale);
---
<nav aria-label={t('breadcrumb.label')} class="crumbs">
  <ol>
    {items.map((i, idx) => (
      <li>{idx < items.length - 1 ? <a href={localizePath(i.path, locale)}>{i.name}</a> : <span aria-current="page">{i.name}</span>}</li>
    ))}
  </ol>
</nav>
<style>
  .crumbs ol { display: flex; flex-wrap: wrap; gap: var(--space-2); list-style: none; padding: 0; margin: 0; font-size: var(--step--1); }
  .crumbs li + li::before { content: '/'; margin-inline-end: var(--space-2); opacity: 0.5; }
</style>
```

```astro
---
// src/components/CertStrip.astro
import { createT } from '../i18n/t';
import { getSite } from '../lib/catalog';
import { isPlaceholder } from '../lib/site';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const site = await getSite();
const regs = site.registrations.filter((r) => r.held);
---
<section class="certs" aria-labelledby="certs-title">
  <div class="container certs__inner">
    <h2 id="certs-title" class="eyebrow">{t('trust.title')}</h2>
    <ul>
      {regs.map((r) => (
        <li>
          {r.logo ? <img src={r.logo} alt={r.name} width="120" height="48" loading="lazy" /> : <strong>{r.name}</strong>}
          <span dir="ltr">{t('trust.regNo')} {isPlaceholder(r.number) ? t('trust.onRequest') : r.number}</span>
        </li>
      ))}
    </ul>
  </div>
</section>
<style>
  .certs { border-block: 1px solid var(--rule); padding-block: var(--space-6); }
  .certs__inner { display: grid; gap: var(--space-4); }
  ul { display: flex; flex-wrap: wrap; gap: var(--space-5) var(--space-7); list-style: none; margin: 0; padding: 0; }
  li { display: grid; gap: var(--space-1); }
  strong { font-family: var(--font-display); font-weight: 500; font-size: var(--step-1); }
  span { font-family: var(--font-mono); font-size: var(--step--1); color: var(--ink-2); }
</style>
```

```astro
---
// src/components/WhatsAppButton.astro
import { createT } from '../i18n/t';
import { getSite } from '../lib/catalog';
import { whatsappHref } from '../lib/site';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale; text?: string }
const { locale, text } = Astro.props;
const site = await getSite();
const href = whatsappHref(site.whatsapp, text) ?? '#contact-whatsapp-missing';
const label = createT(locale)('cta.whatsapp');
---
<a class="wa" data-whatsapp href={href} target="_blank" rel="noopener" aria-label={label}>
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2.1.7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.2Z"/></svg>
</a>
<style>
  .wa { position: fixed; inset-block-end: var(--space-5); inset-inline-end: var(--space-5); z-index: 40;
    inline-size: 56px; block-size: 56px; border-radius: 50%; display: grid; place-items: center;
    background: var(--forest); color: var(--paper); box-shadow: 0 6px 20px rgb(26 26 23 / 0.25);
    transition: transform var(--dur-1) var(--ease); }
  .wa:hover { transform: translateY(-2px); }
</style>
```

- [ ] **Step 5: Implement `Header.astro` and `Footer.astro`**

```astro
---
// src/components/Header.astro
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale; path: string; hero?: 'dark' | 'light' }
const { locale, path, hero = 'light' } = Astro.props;
const t = createT(locale);
const links = [
  { href: '/products', label: t('nav.products') },
  { href: '/about', label: t('nav.about') },
  { href: '/blog', label: t('nav.blog') },
  { href: '/contact', label: t('nav.contact') },
];
const isActive = (href: string) => path === href || path.startsWith(`${href}/`);
---
<header class="hdr" data-tone={hero}>
  <div class="container hdr__row">
    <a class="brand" href={localizePath('/', locale)}>GoodBiz <span>Agri</span></a>
    <nav aria-label="Main" class="hdr__nav" id="main-nav">
      <ul>
        {links.map((l) => <li><a href={localizePath(l.href, locale)} aria-current={isActive(l.href) ? 'page' : undefined}>{l.label}</a></li>)}
      </ul>
      <a class="btn btn--primary" href={localizePath('/contact', locale)}>{t('cta.quote')}</a>
    </nav>
    <button class="hdr__toggle" aria-expanded="false" aria-controls="main-nav" data-open={t('nav.menu')} data-close={t('nav.close')}>{t('nav.menu')}</button>
  </div>
</header>
<script>
  const btn = document.querySelector<HTMLButtonElement>('.hdr__toggle');
  btn?.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? btn.dataset.close! : btn.dataset.open!;
    document.documentElement.classList.toggle('nav-open', open);
  });
</script>
<style>
  .hdr { position: absolute; inset-inline: 0; inset-block-start: 0; z-index: 30; padding-block: var(--space-4); }
  .hdr[data-tone='dark'] { color: var(--paper); }
  .hdr__row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-5); }
  .brand { font-family: var(--font-display); font-size: var(--step-1); text-decoration: none; }
  .brand span { color: var(--turmeric); }
  .hdr__nav { display: flex; align-items: center; gap: var(--space-6); }
  .hdr__nav ul { display: flex; gap: var(--space-5); list-style: none; margin: 0; padding: 0; }
  .hdr__nav a:not(.btn) { text-decoration: none; }
  .hdr__nav a[aria-current='page'] { text-decoration: underline; }
  .hdr__toggle { display: none; min-block-size: 44px; background: none; border: 1px solid currentColor; color: inherit; border-radius: 999px; padding-inline: var(--space-4); font: inherit; }
  @media (max-width: 860px) {
    .hdr__toggle { display: inline-flex; align-items: center; }
    .hdr__nav { position: fixed; inset: 0; background: var(--forest); color: var(--paper); flex-direction: column; justify-content: center; gap: var(--space-6);
      opacity: 0; pointer-events: none; transition: opacity var(--dur-1) var(--ease); }
    .hdr__nav ul { flex-direction: column; align-items: center; font-family: var(--font-display); font-size: var(--step-2); }
    :global(.nav-open) .hdr__nav { opacity: 1; pointer-events: auto; }
    .hdr__toggle { position: relative; z-index: 2; }
  }
</style>
```

```astro
---
// src/components/Footer.astro
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import { getSite, getHsnEntries } from '../lib/catalog';
import { mailtoHref } from '../lib/site';
import { formatHsn } from '../lib/hsn';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const site = await getSite();
const hsn = await getHsnEntries(locale);
const mail = mailtoHref(site.email);
---
<footer class="ftr">
  <div class="container ftr__grid">
    <div>
      <p class="ftr__brand">GoodBiz <span>Agri</span></p>
      <p>{t('footer.tagline')}</p>
      <address>
        {site.address.street}<br />{site.address.city}, {site.address.region} {site.address.postalCode}<br />India
      </address>
      {mail && <a href={mail}>{site.email}</a>}
    </div>
    <div>
      <h2 class="eyebrow">{t('footer.hsnRef')}</h2>
      <ul class="ftr__hsn">
        {hsn.map((h) => <li><a href={localizePath(`/hsn/${h.code}`, locale)}><span dir="ltr">{formatHsn(h.code)}</span> {h.text.title}</a></li>)}
      </ul>
    </div>
  </div>
  <div class="container ftr__base"><p>{t('footer.rights', { year: new Date().getFullYear() })}</p></div>
</footer>
<style>
  .ftr { background: var(--forest); color: var(--paper); padding-block: var(--space-8) var(--space-6); }
  .ftr .eyebrow { color: var(--gold-soft); }
  .ftr__grid { display: grid; gap: var(--space-7); grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); }
  .ftr__brand { font-family: var(--font-display); font-size: var(--step-2); }
  .ftr__brand span { color: var(--turmeric); }
  address { font-style: normal; margin-block: var(--space-4); opacity: 0.85; }
  .ftr__hsn { list-style: none; padding: 0; margin: var(--space-4) 0 0; columns: 2 14rem; font-size: var(--step--1); }
  .ftr__hsn li { break-inside: avoid; padding-block: var(--space-1); }
  .ftr__hsn span { font-family: var(--font-mono); color: var(--gold-soft); }
  .ftr__base { margin-block-start: var(--space-7); padding-block-start: var(--space-5); border-block-start: 1px solid rgb(246 241 231 / 0.2); font-size: var(--step--1); opacity: 0.8; }
</style>
```

- [ ] **Step 6: Create `HomeView` skeleton and route files**

```astro
---
// src/views/HomeView.astro (sections added in Tasks 8–9)
import Base from '../layouts/Base.astro';
import CertStrip from '../components/CertStrip.astro';
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
---
<Base locale={locale} title={t('meta.homeTitle')} description={t('meta.homeDescription')} path="/" hero="dark">
  <section class="hero-placeholder">
    <div class="container">
      <p class="eyebrow">{t('hero.eyebrow')}</p>
      <h1>{t('hero.title')}</h1>
      <a class="btn btn--primary" href={localizePath('/contact', locale)}>{t('cta.quote')}</a>
    </div>
  </section>
  <CertStrip locale={locale} />
</Base>
<style>
  .hero-placeholder { background: var(--forest); color: var(--paper); padding-block: 10rem var(--space-8); }
</style>
```

```astro
---
// src/pages/index.astro
import HomeView from '../views/HomeView.astro';
---
<HomeView locale="en" />
```

```astro
---
// src/pages/[lang]/index.astro
import HomeView from '../../views/HomeView.astro';
import { localeStaticPaths } from '../../lib/routes';
import type { Locale } from '../../i18n/config';
export const getStaticPaths = localeStaticPaths;
const lang = Astro.params.lang as Locale;
---
<HomeView locale={lang} />
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run && npm run test:e2e -- --project=desktop tests/e2e/chrome.spec.ts`
Expected: PASS. (Non-English pages render English strings until Task 17 — expected.)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: site chrome, shared components and localized route pattern"
```

---

### Task 7: Motion system (Lenis smooth scroll + Motion reveals, parallax, sticky story, counters, route drawing)

**Files:**
- Create: `src/scripts/lazy.ts`, `src/scripts/motion.ts` (replace stub)
- Test: `tests/unit/lazy.test.ts`, `tests/e2e/motion.spec.ts`

**Interfaces:**
- Produces:
  - `prefersReducedMotion(win?: Window): boolean`
  - `canRun3D(env: { reducedMotion: boolean; webgl: boolean; deviceMemory?: number; saveData?: boolean }): boolean` (false when reduced motion, no WebGL, deviceMemory < 4, or saveData)
  - `hasWebGL(): boolean`
  - `whenNear(el: Element, cb: () => void, rootMargin = '400px'): void` (calls once; falls back to immediate call without IntersectionObserver)
  - `onIdle(cb: () => void): void`
  - Data attributes consumed by `motion.ts`: `data-reveal` (fade/translate in), `data-reveal="lines"` (split by `<span class="line">`), `data-counter="70"` (+ optional `data-suffix="+"`), `data-pin` (tall track element containing a sticky child; desktop only) with `data-pin-step` children, `data-draw` (SVG paths: stroke draw on enter), `data-parallax` (image drifts ±30px across its scroll range), `data-hero-copy` (fades and lifts as the hero scrolls away).
  - CSS contract for `data-pin`: below 1024px or with reduced motion the track has `height: auto` and the inner block is static; at ≥1024px the track is `height: calc(100svh + <steps> * 60svh)` and its first child is `position: sticky; top: 0; height: 100svh`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/lazy.test.ts
import { describe, it, expect } from 'vitest';
import { canRun3D } from '../../src/scripts/lazy';

describe('canRun3D', () => {
  const ok = { reducedMotion: false, webgl: true, deviceMemory: 8, saveData: false };
  it('runs on capable devices', () => expect(canRun3D(ok)).toBe(true));
  it('runs when deviceMemory is unknown', () => expect(canRun3D({ ...ok, deviceMemory: undefined })).toBe(true));
  it('skips with reduced motion', () => expect(canRun3D({ ...ok, reducedMotion: true })).toBe(false));
  it('skips without WebGL', () => expect(canRun3D({ ...ok, webgl: false })).toBe(false));
  it('skips on low memory', () => expect(canRun3D({ ...ok, deviceMemory: 2 })).toBe(false));
  it('skips with Save-Data', () => expect(canRun3D({ ...ok, saveData: true })).toBe(false));
});
```

```ts
// tests/e2e/motion.spec.ts
import { test, expect } from '@playwright/test';

test('reduced motion: below-fold content is visible without scrolling animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const revealed = page.locator('[data-reveal]').last();
  await revealed.scrollIntoViewIfNeeded();
  await expect(revealed).toHaveCSS('opacity', '1');
  await ctx.close();
});

test('counters end at their target value', async ({ page }) => {
  await page.goto('/');
  const counter = page.locator('[data-counter]').first();
  await counter.scrollIntoViewIfNeeded();
  const target = await counter.getAttribute('data-counter');
  await expect(counter).toContainText(target!, { timeout: 5000 });
});
```

The e2e counter test passes once Task 9 adds counters; run only the unit test in this task.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/lazy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/scripts/lazy.ts`**

```ts
export function prefersReducedMotion(win: Window = window): boolean {
  return win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function canRun3D(env: { reducedMotion: boolean; webgl: boolean; deviceMemory?: number; saveData?: boolean }): boolean {
  if (env.reducedMotion || !env.webgl || env.saveData) return false;
  if (env.deviceMemory !== undefined && env.deviceMemory < 4) return false;
  return true;
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function currentEnv() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return { reducedMotion: prefersReducedMotion(), webgl: hasWebGL(), deviceMemory: nav.deviceMemory, saveData: nav.connection?.saveData };
}

export function whenNear(el: Element, cb: () => void, rootMargin = '400px'): void {
  if (!('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { rootMargin });
  io.observe(el);
}

export function onIdle(cb: () => void): void {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  ric ? ric(cb, { timeout: 2000 }) : setTimeout(cb, 200);
}
```

- [ ] **Step 4: Implement `src/scripts/motion.ts`**

```ts
import { prefersReducedMotion, onIdle } from './lazy';

const EASE = [0.22, 1, 0.36, 1] as const;

function setFinalCounters() {
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
    el.textContent = `${el.dataset.counter}${el.dataset.suffix ?? ''}`;
  });
}

async function init() {
  if (prefersReducedMotion()) { setFinalCounters(); return; }

  const [{ animate, scroll, inView, stagger }, { default: Lenis }] = await Promise.all([import('motion'), import('lenis')]);

  const lenis = new Lenis({ lerp: 0.1, autoRaf: true });
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector<HTMLElement>(a.getAttribute('href')!);
      if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
    });
  });

  const vh = window.innerHeight;
  const belowFold = (el: Element) => el.getBoundingClientRect().top > vh * 0.9;

  // Reveals — never hide what is already on screen (protects LCP)
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (!belowFold(el)) return;
    const targets = el.dataset.reveal === 'lines' ? [...el.querySelectorAll<HTMLElement>('.line')] : [el];
    animate(targets, { opacity: 0, y: 28 }, { duration: 0 });
    let done = false;
    inView(el, () => {
      if (done) return;
      done = true;
      animate(targets, { opacity: 1, y: 0 }, { duration: 1.1, ease: EASE, delay: stagger(0.08) });
    }, { margin: '0px 0px -15% 0px' });
  });

  // Hero copy fades and lifts as the hero scrolls away
  document.querySelectorAll<HTMLElement>('[data-hero-copy]').forEach((el) => {
    const section = el.closest('section') ?? el;
    scroll(animate(el, { opacity: [1, 0], y: [0, -80] }, { ease: 'linear' }), { target: section, offset: ['start start', 'end start'] });
  });

  // Gentle image parallax
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    scroll(animate(el, { y: [-30, 30] }, { ease: 'linear' }), { target: el, offset: ['start end', 'end start'] });
  });

  // Counters
  document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => {
    const end = Number(el.dataset.counter);
    const suffix = el.dataset.suffix ?? '';
    el.textContent = `0${suffix}`;
    let done = false;
    inView(el, () => {
      if (done) return;
      done = true;
      animate(0, end, { duration: 1.6, ease: EASE, onUpdate: (v) => { el.textContent = `${Math.round(v)}${suffix}`; } });
    });
  });

  // Sticky farm-to-port story (desktop only; CSS makes the track tall and the inner block sticky)
  if (window.matchMedia('(min-width: 1024px)').matches) {
    document.querySelectorAll<HTMLElement>('[data-pin]').forEach((track) => {
      const steps = [...track.querySelectorAll<HTMLElement>('[data-pin-step]')];
      steps.forEach((s, i) => { s.style.opacity = i === 0 ? '1' : '0.2'; });
      scroll((progress: number) => {
        const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));
        steps.forEach((s, i) => {
          const target = i === active ? 1 : i < active ? 0.35 : 0.2;
          if (s.style.opacity !== String(target)) animate(s, { opacity: target, y: i === active ? 0 : i < active ? -6 : 6 }, { duration: 0.6, ease: EASE });
        });
      }, { target: track, offset: ['start start', 'end end'] });
    });
  }

  // Map routes draw in
  document.querySelectorAll<SVGSVGElement>('svg:has([data-draw])').forEach((svg) => {
    const paths = [...svg.querySelectorAll<SVGPathElement>('[data-draw]')];
    paths.forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = `${len}`; p.style.strokeDashoffset = `${len}`; });
    let done = false;
    inView(svg, () => {
      if (done) return;
      done = true;
      paths.forEach((p, i) => animate(p, { strokeDashoffset: 0 }, { duration: 1.4, delay: (i % 12) * 0.08, ease: EASE }));
    }, { amount: 0.3 });
  });
}

onIdle(() => { void init(); });
```

Motion and Lenis are dynamically imported after idle, so they are not part of the initial JS budget. If the installed `motion` version does not export `scroll(callback, options)` with a progress number, use `scroll((info) => …info.y.progress…)` per its docs — check `node_modules/motion/package.json` version and the `scroll` type signature before writing this file.

- [ ] **Step 5: Run unit test**

Run: `npx vitest run tests/unit/lazy.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Motion + Lenis scroll effects with reduced-motion support"
```

---

### Task 8: Hero particle scene

**Files:**
- Create: `src/scripts/particles/sample.ts`, `src/scripts/particles/scene.ts`, `src/components/HeroParticles.astro`, `src/components/home/Hero.astro`
- Modify: `src/views/HomeView.astro` (replace placeholder hero with `<Hero />`)
- Test: `tests/unit/sample.test.ts`, `tests/e2e/hero.spec.ts`

**Interfaces:**
- Consumes: `canRun3D`, `currentEnv`, `whenNear`, `onIdle` (Task 7); `getLocalizedProducts` (Task 4).
- Produces:
  - `sampleImage(img: { data: Uint8ClampedArray; width: number; height: number }, count: number, opts?: { alphaMin?: number; seed?: number; spread?: number }): { positions: Float32Array; colors: Float32Array }` — positions centred at origin, x in [-spread/2, spread/2] scaled to aspect, z jitter ±0.15; colors RGB 0–1. Deterministic for a given seed. Returns exactly `count` points (sampling with replacement from opaque pixels; if none opaque, returns zeros).
  - `mountHero(canvas: HTMLCanvasElement, imageUrls: string[]): Promise<() => void>` (returns dispose)
  - `<HeroParticles images={string[]} poster={ImageMetadata} alt={string} />`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/sample.test.ts
import { describe, it, expect } from 'vitest';
import { sampleImage } from '../../src/scripts/particles/sample';

function img(w: number, h: number, fill: (x: number, y: number) => [number, number, number, number]) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data.set(fill(x, y), (y * w + x) * 4);
  return { data, width: w, height: h };
}

describe('sampleImage', () => {
  it('returns exactly count points', () => {
    const r = sampleImage(img(10, 10, () => [255, 0, 0, 255]), 500);
    expect(r.positions.length).toBe(1500);
    expect(r.colors.length).toBe(1500);
  });
  it('maps colours to 0..1', () => {
    const r = sampleImage(img(4, 4, () => [255, 128, 0, 255]), 10);
    expect(r.colors[0]).toBeCloseTo(1);
    expect(r.colors[1]).toBeCloseTo(128 / 255);
    expect(r.colors[2]).toBeCloseTo(0);
  });
  it('ignores transparent pixels', () => {
    const r = sampleImage(img(10, 1, (x) => (x < 5 ? [0, 0, 0, 0] : [255, 255, 255, 255])), 200, { spread: 10 });
    // opaque pixels start at x = 5 (the centre); allow half a pixel of jitter
    for (let i = 0; i < 200; i++) expect(r.positions[i * 3]).toBeGreaterThanOrEqual(-0.5);
  });
  it('is deterministic for a seed', () => {
    const a = sampleImage(img(8, 8, (x, y) => [x * 30, y * 30, 0, 255]), 50, { seed: 7 });
    const b = sampleImage(img(8, 8, (x, y) => [x * 30, y * 30, 0, 255]), 50, { seed: 7 });
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
  });
  it('returns zeros for a fully transparent image', () => {
    const r = sampleImage(img(4, 4, () => [0, 0, 0, 0]), 10);
    expect(r.positions.every((v) => v === 0)).toBe(true);
  });
});
```

```ts
// tests/e2e/hero.spec.ts
import { test, expect } from '@playwright/test';

test('hero poster is visible immediately and is the LCP candidate', async ({ page }) => {
  await page.goto('/');
  const poster = page.locator('[data-hero-poster]');
  await expect(poster).toBeVisible();
  await expect(poster).toHaveAttribute('fetchpriority', 'high');
});

test('without WebGL the poster stays and no errors are logged', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test override
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      // @ts-expect-error passthrough
      return orig.call(this, type, ...rest);
    };
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.waitForTimeout(2500);
  await expect(page.locator('[data-hero-poster]')).toBeVisible();
  await expect(page.locator('[data-hero-canvas]')).toHaveAttribute('data-state', 'off');
  expect(errors).toEqual([]);
  await ctx.close();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/sample.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/scripts/particles/sample.ts`**

```ts
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleImage(
  img: { data: Uint8ClampedArray; width: number; height: number },
  count: number,
  opts: { alphaMin?: number; seed?: number; spread?: number } = {},
) {
  const { alphaMin = 128, seed = 1, spread = 6 } = opts;
  const { data, width, height } = img;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const opaque: number[] = [];
  for (let i = 0; i < width * height; i++) if (data[i * 4 + 3] >= alphaMin) opaque.push(i);
  if (!opaque.length) return { positions, colors };

  const rand = mulberry32(seed);
  const scale = spread / Math.max(width, height);
  for (let p = 0; p < count; p++) {
    const idx = opaque[Math.floor(rand() * opaque.length)];
    const x = idx % width;
    const y = Math.floor(idx / width);
    positions[p * 3] = (x - width / 2) * scale + (rand() - 0.5) * scale;
    positions[p * 3 + 1] = (height / 2 - y) * scale + (rand() - 0.5) * scale;
    positions[p * 3 + 2] = (rand() - 0.5) * 0.3;
    colors[p * 3] = data[idx * 4] / 255;
    colors[p * 3 + 1] = data[idx * 4 + 1] / 255;
    colors[p * 3 + 2] = data[idx * 4 + 2] / 255;
  }
  return { positions, colors };
}
```

- [ ] **Step 4: Implement `src/scripts/particles/scene.ts`**

```ts
import * as THREE from 'three';
import { sampleImage } from './sample';

const COUNT = 40000;

async function loadPixels(url: string, size = 220) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  const ratio = img.width / img.height;
  c.width = ratio >= 1 ? size : Math.round(size * ratio);
  c.height = ratio >= 1 ? Math.round(size / ratio) : size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return ctx.getImageData(0, 0, c.width, c.height);
}

const vertex = /* glsl */ `
  attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 cFrom; attribute vec3 cTo;
  uniform float uMix; uniform float uTime; uniform vec2 uPointer; uniform float uSize;
  varying vec3 vColor;
  void main() {
    float m = smoothstep(0.0, 1.0, uMix);
    vec3 p = mix(aFrom, aTo, m);
    float wobble = sin(uTime * 0.6 + p.x * 2.0 + p.y * 1.3) * 0.04;
    p.z += wobble;
    p.xy += uPointer * (0.12 + p.z * 0.4);
    vColor = mix(cFrom, cTo, m);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.2, d));
  }`;

export async function mountHero(canvas: HTMLCanvasElement, imageUrls: string[]): Promise<() => void> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 9;

  const shapes = [];
  for (const [i, url] of imageUrls.entries()) shapes.push(sampleImage(await loadPixels(url), COUNT, { seed: i + 1, spread: 6.5 }));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(shapes[0].positions.slice(), 3));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(shapes[0].positions, 3));
  geo.setAttribute('aTo', new THREE.BufferAttribute(shapes[Math.min(1, shapes.length - 1)].positions, 3));
  geo.setAttribute('cFrom', new THREE.BufferAttribute(shapes[0].colors, 3));
  geo.setAttribute('cTo', new THREE.BufferAttribute(shapes[Math.min(1, shapes.length - 1)].colors, 3));

  const uniforms = { uMix: { value: 0 }, uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() }, uSize: { value: 28 * renderer.getPixelRatio() } };
  const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    points.position.x = w > 860 ? 1.8 : 0;
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const target = new THREE.Vector2();
  const onPointer = (e: PointerEvent) => target.set((e.clientX / innerWidth - 0.5) * 0.6, -(e.clientY / innerHeight - 0.5) * 0.6);
  addEventListener('pointermove', onPointer, { passive: true });

  // scroll progress through the hero section drives which pair of shapes is shown
  const section = canvas.closest('section')!;
  let stage = 0;
  function setStage(next: number) {
    if (next === stage || next >= shapes.length - 1 && stage === shapes.length - 2) return;
    const from = shapes[Math.max(0, Math.min(next, shapes.length - 2))];
    const to = shapes[Math.max(1, Math.min(next + 1, shapes.length - 1))];
    (geo.getAttribute('aFrom') as THREE.BufferAttribute).set(from.positions); geo.getAttribute('aFrom').needsUpdate = true;
    (geo.getAttribute('aTo') as THREE.BufferAttribute).set(to.positions); geo.getAttribute('aTo').needsUpdate = true;
    (geo.getAttribute('cFrom') as THREE.BufferAttribute).set(from.colors); geo.getAttribute('cFrom').needsUpdate = true;
    (geo.getAttribute('cTo') as THREE.BufferAttribute).set(to.colors); geo.getAttribute('cTo').needsUpdate = true;
    stage = next;
  }

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(section);

  const clock = new THREE.Clock();
  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 0.999) * (shapes.length - 1);
    setStage(Math.floor(progress));
    uniforms.uMix.value = progress - Math.floor(progress);
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uPointer.value.lerp(target, 0.05);
    renderer.render(scene, camera);
  }
  frame();

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    removeEventListener('pointermove', onPointer);
    geo.dispose(); mat.dispose(); renderer.dispose();
  };
}
```

- [ ] **Step 5: Implement `src/components/HeroParticles.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
interface Props { images: string[]; poster: ImageMetadata; alt: string }
const { images, poster, alt } = Astro.props;
---
<div class="hp">
  <Image data-hero-poster src={poster} alt={alt} widths={[640, 960, 1440, 1920]} sizes="100vw" loading="eager" fetchpriority="high" class="hp__poster" />
  <canvas data-hero-canvas data-state="idle" data-images={JSON.stringify(images)} class="hp__canvas" aria-hidden="true"></canvas>
</div>
<script>
  import { canRun3D, currentEnv, onIdle } from '../scripts/lazy';
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-canvas]');
  if (canvas) {
    if (!canRun3D(currentEnv())) {
      canvas.dataset.state = 'off';
    } else {
      onIdle(async () => {
        try {
          const { mountHero } = await import('../scripts/particles/scene');
          await mountHero(canvas, JSON.parse(canvas.dataset.images ?? '[]'));
          canvas.dataset.state = 'on';
        } catch {
          canvas.dataset.state = 'off';
        }
      });
    }
  }
</script>
<style>
  .hp { position: absolute; inset: 0; overflow: hidden; }
  .hp__poster { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; object-fit: cover; opacity: 0.55; transition: opacity var(--dur-2) var(--ease); }
  .hp__canvas { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; opacity: 0; transition: opacity var(--dur-2) var(--ease); }
  .hp__canvas[data-state='on'] { opacity: 1; }
  .hp:has(.hp__canvas[data-state='on']) .hp__poster { opacity: 0.12; }
</style>
```

- [ ] **Step 6: Implement `src/components/home/Hero.astro` and wire into `HomeView`**

```astro
---
import { getImage } from 'astro:assets';
import HeroParticles from '../HeroParticles.astro';
import { createT } from '../../i18n/t';
import { localizePath } from '../../i18n/paths';
import { getLocalizedProducts } from '../../lib/catalog';
import type { Locale } from '../../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const products = await getLocalizedProducts(locale);
const order = ['rice', 'turmeric', 'arecanut'];
const picks = order.map((s) => products.find((p) => p.slug === s)!);
const small = await Promise.all(picks.map((p) => getImage({ src: p.data.heroImage.src, width: 320, format: 'webp' })));
const title = t('hero.title');
---
<section class="hero">
  <HeroParticles images={small.map((s) => s.src)} poster={picks[0].data.heroImage.src} alt="" />
  <div class="container hero__copy" data-hero-copy>
    <p class="eyebrow">{t('hero.eyebrow')}</p>
    <h1 class="display">{title}</h1>
    <p class="hero__lede">{t('hero.lede')}</p>
    <div class="hero__ctas">
      <a class="btn btn--primary" href={localizePath('/contact', locale)}>{t('cta.quote')}</a>
      <a class="btn btn--ghost" href={localizePath('/products', locale)}>{t('cta.viewProducts')}</a>
    </div>
  </div>
</section>
<style>
  .hero { position: relative; min-block-size: 100svh; display: grid; align-items: end; background: var(--forest); color: var(--paper); padding-block: 9rem var(--space-8); isolation: isolate; }
  .hero__copy { position: relative; z-index: 1; display: grid; gap: var(--space-5); }
  .hero .eyebrow { color: var(--gold-soft); }
  .hero h1 { max-inline-size: 14ch; }
  .hero__lede { font-size: var(--step-1); line-height: 1.45; opacity: 0.9; max-inline-size: 46ch; }
  .hero__ctas { display: flex; flex-wrap: wrap; gap: var(--space-3); }
</style>
```

In `HomeView.astro`, replace the `hero-placeholder` section and its style with:
```astro
import Hero from '../components/home/Hero.astro';
...
<Hero locale={locale} />
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/unit/sample.test.ts && npm run test:e2e -- --project=desktop tests/e2e/hero.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: hero image-to-particles scene with static poster fallback"
```

---

### Task 9: Landing sections and maps

**Files:**
- Create: `src/data/countries.ts`, `src/lib/geo.ts`, `src/components/ProductCard.astro`, `src/components/SouthIndiaMap.astro`, `src/components/WorldMap.astro`, `src/components/home/Range.astro`, `src/components/home/Journey.astro`, `src/components/home/Why.astro`, `src/components/home/Sourcing.astro`, `src/components/home/HomeFaq.astro`, `src/components/home/World.astro`, `src/components/home/FinalCta.astro`, `src/i18n/home-faq.ts`
- Modify: `src/views/HomeView.astro`
- Test: `tests/unit/geo.test.ts`, `tests/e2e/home.spec.ts`, `tests/e2e/layout.spec.ts`

**Interfaces:**
- Consumes: `places` (Task 3), catalog, `createT`, `Faq`, `faqLd`.
- Produces:
  - `servedCountries: { id: string; name: string; region: Region }[]` (≥ 70); `routeHubs: { name: string; lon: number; lat: number }[]`; `type Region = 'middle-east'|'africa'|'asia'|'europe'|'americas'|'oceania'`.
  - `worldPaths(width: number, height: number, highlight: Set<string>): { id: string; d: string; served: boolean }[]`; `worldArcs(width, height, from: [number, number], to: [number, number][]): string[]`; `projectWorld(width, height, lonlat): [number, number]`; `southIndiaOutline(width, height): string`; `projectSouth(width, height, lonlat): [number, number]`.
  - `homeFaq(locale): { q: string; a: string }[]` (from ui keys `home.faq.qN` / `home.faq.aN`, N = 1..6).

- [ ] **Step 1: Add FAQ keys to `src/i18n/ui/en.json`**

```json
  "home.faq.q1": "What is your minimum order quantity?",
  "home.faq.a1": "One 20 ft container for most products; five containers for bulk non-basmati and broken rice. Mixed containers are possible for some spices.",
  "home.faq.q2": "Which Incoterms do you quote?",
  "home.faq.a2": "FOB, CFR and CIF from Chennai, Kochi, Tuticorin or New Mangalore. Other terms on request.",
  "home.faq.q3": "What payment terms do you accept?",
  "home.faq.a3": "Irrevocable letter of credit at sight, or advance payment against documents for established buyers.",
  "home.faq.q4": "Can I get samples before ordering?",
  "home.faq.a4": "Yes. We send pre-shipment samples by courier; the courier cost is adjusted against your first order.",
  "home.faq.q5": "How long from order to shipment?",
  "home.faq.a5": "Usually 2–4 weeks after confirmation, depending on product, packing and vessel availability.",
  "home.faq.q6": "Can you pack under our brand?",
  "home.faq.a6": "Yes. We supply private-label retail and bulk packing with your design and language."
```

- [ ] **Step 2: Write failing tests**

```ts
// tests/unit/geo.test.ts
import { describe, it, expect } from 'vitest';
import { servedCountries, routeHubs } from '../../src/data/countries';
import { worldPaths, worldArcs, projectSouth, southIndiaOutline } from '../../src/lib/geo';

describe('countries', () => {
  it('lists at least 70 unique served countries', () => {
    expect(servedCountries.length).toBeGreaterThanOrEqual(70);
    expect(new Set(servedCountries.map((c) => c.id)).size).toBe(servedCountries.length);
  });
});

describe('geo', () => {
  it('produces world paths and flags served countries', () => {
    const paths = worldPaths(1000, 500, new Set(['784', '686']));
    expect(paths.length).toBeGreaterThan(150);
    expect(paths.filter((p) => p.served).map((p) => p.id).sort()).toEqual(['686', '784']);
  });
  it('produces one arc per hub', () => {
    const arcs = worldArcs(1000, 500, [77.59, 12.97], routeHubs.map((h) => [h.lon, h.lat]));
    expect(arcs).toHaveLength(routeHubs.length);
    for (const d of arcs) expect(d.startsWith('M')).toBe(true);
  });
  it('projects Bengaluru inside the South India frame', () => {
    const [x, y] = projectSouth(600, 700, [77.59, 12.97]);
    expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(600);
    expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(700);
  });
  it('produces an India outline path', () => expect(southIndiaOutline(600, 700).length).toBeGreaterThan(100));
});
```

```ts
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test('landing has all sections in order', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section[id], main > div > section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['range', 'journey', 'why', 'sourcing', 'faq', 'world', 'cta']);
});

test('range lists 9 products linking to product pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#range a[href^="/products/"]')).toHaveCount(9);
});

test('faq has FAQPage JSON-LD', async ({ page }) => {
  await page.goto('/');
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent!)['@type']));
  expect(types).toContain('FAQPage');
});

test('sourcing map highlights districts for the chosen product', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sourcing').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Turmeric' }).click();
  await expect(page.locator('#sourcing [data-place="erode"]')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('#sourcing [data-place="raichur"]')).toHaveAttribute('data-active', 'false');
});
```

```ts
// tests/e2e/layout.spec.ts
import { test, expect } from '@playwright/test';

const widths = [320, 375, 768, 1024, 1440];
const paths = ['/', '/ar/', '/ar/products/turmeric', '/zh/', '/products/turmeric', '/products', '/hsn/09103030', '/blog', '/contact', '/about'];
for (const width of widths) for (const path of paths) {
  test(`no horizontal overflow at ${width}px: ${path}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const res = await page.goto(path);
    test.skip(res?.status() === 404, 'page not built yet');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await ctx.close();
  });
}
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/unit/geo.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `src/data/countries.ts`**

```ts
export type Region = 'middle-east' | 'africa' | 'asia' | 'europe' | 'americas' | 'oceania';
type C = { id: string; name: string; region: Region };
const r = (region: Region, list: [string, string][]): C[] => list.map(([id, name]) => ({ id, name, region }));

// Draft list — owner confirms. ids are ISO 3166-1 numeric (matches world-atlas).
export const servedCountries: C[] = [
  ...r('middle-east', [['784','United Arab Emirates'],['682','Saudi Arabia'],['512','Oman'],['634','Qatar'],['414','Kuwait'],['048','Bahrain'],['364','Iran'],['368','Iraq'],['400','Jordan'],['376','Israel'],['792','Türkiye'],['818','Egypt'],['887','Yemen']]),
  ...r('africa', [['686','Senegal'],['384',"Côte d'Ivoire"],['204','Benin'],['768','Togo'],['288','Ghana'],['566','Nigeria'],['324','Guinea'],['270','Gambia'],['694','Sierra Leone'],['430','Liberia'],['466','Mali'],['854','Burkina Faso'],['120','Cameroon'],['266','Gabon'],['180','DR Congo'],['178','Congo'],['024','Angola'],['508','Mozambique'],['450','Madagascar'],['404','Kenya'],['834','Tanzania'],['800','Uganda'],['231','Ethiopia'],['262','Djibouti'],['706','Somalia'],['710','South Africa'],['480','Mauritius'],['504','Morocco'],['012','Algeria'],['788','Tunisia'],['434','Libya'],['729','Sudan']]),
  ...r('asia', [['050','Bangladesh'],['524','Nepal'],['144','Sri Lanka'],['462','Maldives'],['104','Myanmar'],['764','Thailand'],['704','Vietnam'],['458','Malaysia'],['702','Singapore'],['360','Indonesia'],['608','Philippines'],['156','China'],['344','Hong Kong'],['392','Japan'],['410','South Korea'],['004','Afghanistan'],['398','Kazakhstan'],['860','Uzbekistan'],['643','Russia']]),
  ...r('europe', [['826','United Kingdom'],['276','Germany'],['528','Netherlands'],['056','Belgium'],['250','France'],['380','Italy'],['724','Spain'],['616','Poland']]),
  ...r('americas', [['840','United States'],['124','Canada'],['484','Mexico'],['076','Brazil'],['170','Colombia'],['604','Peru'],['152','Chile']]),
  ...r('oceania', [['036','Australia'],['554','New Zealand']]),
];

export const routeHubs = [
  { name: 'Dubai', lon: 55.27, lat: 25.2 },
  { name: 'Jeddah', lon: 39.17, lat: 21.54 },
  { name: 'Dakar', lon: -17.45, lat: 14.69 },
  { name: 'Lagos', lon: 3.38, lat: 6.52 },
  { name: 'Mombasa', lon: 39.67, lat: -4.04 },
  { name: 'Durban', lon: 31.03, lat: -29.86 },
  { name: 'Rotterdam', lon: 4.48, lat: 51.92 },
  { name: 'New York', lon: -74.0, lat: 40.71 },
  { name: 'Santos', lon: -46.33, lat: -23.96 },
  { name: 'Shanghai', lon: 121.47, lat: 31.23 },
  { name: 'Jakarta', lon: 106.85, lat: -6.21 },
  { name: 'Sydney', lon: 151.21, lat: -33.87 },
  { name: 'Novorossiysk', lon: 37.77, lat: 44.72 },
];
```

- [ ] **Step 5: Implement `src/lib/geo.ts`**

```ts
import { geoEqualEarth, geoMercator, geoPath, geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world110 from 'world-atlas/countries-110m.json' with { type: 'json' };
import world50 from 'world-atlas/countries-50m.json' with { type: 'json' };

type FC = GeoJSON.FeatureCollection<GeoJSON.Geometry, { name: string }>;
const countries110 = feature(world110 as unknown as Topology, (world110 as any).objects.countries as GeometryCollection) as unknown as FC;
const countries50 = feature(world50 as unknown as Topology, (world50 as any).objects.countries as GeometryCollection) as unknown as FC;

function worldProjection(width: number, height: number) {
  return geoEqualEarth().fitExtent([[8, 8], [width - 8, height - 8]], { type: 'Sphere' } as any);
}

export function projectWorld(width: number, height: number, lonlat: [number, number]): [number, number] {
  return worldProjection(width, height)(lonlat) as [number, number];
}

export function worldPaths(width: number, height: number, highlight: Set<string>) {
  const path = geoPath(worldProjection(width, height));
  return countries110.features
    .filter((f) => f.id !== '010') // drop Antarctica
    .map((f) => ({ id: String(f.id), d: path(f) ?? '', served: highlight.has(String(f.id)) }))
    .filter((p) => p.d);
}

export function worldArcs(width: number, height: number, from: [number, number], to: [number, number][]) {
  const path = geoPath(worldProjection(width, height));
  return to.map((dest) => {
    const interp = geoInterpolate(from, dest);
    const coords = Array.from({ length: 48 }, (_, i) => interp(i / 47));
    return path({ type: 'LineString', coordinates: coords }) ?? '';
  });
}

function southProjection(width: number, height: number) {
  const frame: GeoJSON.Feature = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[72.5, 7.8], [84.5, 7.8], [84.5, 18.5], [72.5, 18.5], [72.5, 7.8]]] } };
  return geoMercator().fitExtent([[16, 16], [width - 16, height - 16]], frame);
}

export function projectSouth(width: number, height: number, lonlat: [number, number]): [number, number] {
  return southProjection(width, height)(lonlat) as [number, number];
}

export function southIndiaOutline(width: number, height: number): string {
  const india = countries50.features.find((f) => f.id === '356')!;
  const lanka = countries50.features.find((f) => f.id === '144')!;
  const path = geoPath(southProjection(width, height));
  return `${path(india) ?? ''}${path(lanka) ?? ''}`;
}
```

Install the topojson types: `npm i -D @types/topojson-specification @types/geojson`. If the `with { type: 'json' }` import attribute is unsupported by your TypeScript target, use `import world110 from 'world-atlas/countries-110m.json';` (Vite handles JSON).

The map components clip the outline with an SVG `clipPath` matching the frame, so northern India is cropped cleanly.

- [ ] **Step 6: Run unit tests**

Run: `npx vitest run tests/unit/geo.test.ts`
Expected: PASS.

- [ ] **Step 7: Implement `ProductCard.astro`**

```astro
---
import { Image } from 'astro:assets';
import HsnChip from './HsnChip.astro';
import StockLabel from './StockLabel.astro';
import { localizePath } from '../i18n/paths';
import type { Locale } from '../i18n/config';
import type { LocalizedProduct } from '../lib/catalog';
interface Props { locale: Locale; product: LocalizedProduct; headingLevel?: 'h2' | 'h3' }
const { locale, product, headingLevel = 'h3' } = Astro.props;
const H = headingLevel;
const href = localizePath(`/products/${product.slug}`, locale);
---
<article class="pc" data-reveal>
  <a href={href} class="pc__link">
    <div class="pc__media">
      <Image src={product.data.heroImage.src} alt={product.text.name} widths={[360, 540, 720]} sizes="(max-width: 700px) 100vw, 33vw" loading="lazy" />
      <StockLabel locale={locale} show={product.data.heroImage.isStock} />
    </div>
    <H class="pc__title">{product.text.name}</H>
  </a>
  <p class="pc__origin">{product.text.originLine}</p>
  <div class="pc__hsn">{product.data.hsn.slice(0, 3).map((h) => <HsnChip code={h.code} verified={h.verified} locale={locale} />)}{product.data.hsn.length > 3 && <span>+{product.data.hsn.length - 3}</span>}</div>
</article>
<style>
  .pc { display: grid; gap: var(--space-3); }
  .pc__link { display: grid; gap: var(--space-3); text-decoration: none; }
  .pc__media { position: relative; overflow: hidden; border-radius: var(--radius-media); aspect-ratio: 4 / 3; background: var(--paper-2); }
  .pc__media :global(img) { inline-size: 100%; block-size: 100%; object-fit: cover; transition: transform var(--dur-2) var(--ease); }
  .pc__link:hover .pc__media :global(img) { transform: scale(1.04); }
  .pc__title { font-size: var(--step-2); }
  .pc__origin { color: var(--ink-2); font-size: var(--step--1); }
  .pc__hsn { display: flex; flex-wrap: wrap; gap: var(--space-2); color: var(--forest); }
</style>
```

- [ ] **Step 8: Implement the landing sections**

```astro
---
// src/components/home/Range.astro
import ProductCard from '../ProductCard.astro';
import { createT } from '../../i18n/t';
import { getLocalizedProducts } from '../../lib/catalog';
import type { Locale } from '../../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const products = await getLocalizedProducts(locale);
---
<section id="range" class="section">
  <div class="container">
    <header class="sh" data-reveal>
      <p class="eyebrow">{t('home.range.eyebrow')}</p>
      <h2>{t('home.range.title')}</h2>
      <p>{t('home.range.lede')}</p>
    </header>
    <div class="grid">{products.map((p) => <ProductCard locale={locale} product={p} />)}</div>
  </div>
</section>
<style>
  .sh { display: grid; gap: var(--space-4); margin-block-end: var(--space-7); }
  .sh h2 { max-inline-size: 18ch; }
  .grid { display: grid; gap: var(--space-7) var(--space-5); grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); }
</style>
```

```astro
---
// src/components/home/Journey.astro
import { createT } from '../../i18n/t';
import type { Locale } from '../../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const steps = [1, 2, 3, 4] as const;
---
<section id="journey" class="journey">
  <div class="journey__track" data-pin style={`--steps: ${steps.length}`}>
  <div class="container journey__inner">
    <header>
      <p class="eyebrow">{t('home.journey.eyebrow')}</p>
      <h2>{t('home.journey.title')}</h2>
    </header>
    <ol>
      {steps.map((n) => (
        <li data-pin-step>
          <span class="num" dir="ltr">0{n}</span>
          <h3>{t(`home.journey.s${n}.title`)}</h3>
          <p>{t(`home.journey.s${n}.body`)}</p>
        </li>
      ))}
    </ol>
  </div>
  </div>
</section>
<style>
  .journey { background: var(--paper-2); }
  .journey__inner { display: grid; gap: var(--space-7); align-content: center; padding-block: var(--space-8); }
  @media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
    .journey__track { block-size: calc(100svh + var(--steps) * 60svh); }
    .journey__inner { position: sticky; inset-block-start: 0; block-size: 100svh; }
  }
  .journey .eyebrow { margin-block-end: var(--space-3); }
  ol { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-6); grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); }
  li { display: grid; gap: var(--space-3); border-block-start: 1px solid var(--ink); padding-block-start: var(--space-4); }
  .num { font-family: var(--font-mono); color: var(--clay); }
</style>
```

```astro
---
// src/components/home/Why.astro
import { createT } from '../../i18n/t';
import { getSite } from '../../lib/catalog';
import type { Locale } from '../../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const { stats } = await getSite();
const points = [1, 2, 3, 4] as const;
const statItems = [
  { v: stats.countries, suffix: '+', label: t('home.why.stat.countries') },
  { v: stats.products, suffix: '', label: t('home.why.stat.products') },
  { v: stats.markets, suffix: '', label: t('home.why.stat.markets') },
  { v: stats.ports, suffix: '', label: t('home.why.stat.ports') },
];
---
<section id="why" class="section">
  <div class="container why">
    <header data-reveal>
      <p class="eyebrow">{t('home.why.eyebrow')}</p>
      <h2>{t('home.why.title')}</h2>
    </header>
    <dl class="stats">
      {statItems.map((s) => (
        <div><dt>{s.label}</dt><dd dir="ltr"><span data-counter={s.v} data-suffix={s.suffix}>{s.v}{s.suffix}</span></dd></div>
      ))}
    </dl>
    <ul class="points">
      {points.map((n) => <li data-reveal><h3>{t(`home.why.p${n}.title`)}</h3><p>{t(`home.why.p${n}.body`)}</p></li>)}
    </ul>
  </div>
</section>
<style>
  .why { display: grid; gap: var(--space-7); }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr)); gap: var(--space-5); margin: 0; }
  .stats div { border-block-start: 1px solid var(--rule); padding-block-start: var(--space-3); }
  dt { font-size: var(--step--1); color: var(--ink-2); }
  dd { margin: 0; font-family: var(--font-display); font-size: var(--step-4); color: var(--forest); line-height: 1; }
  .points { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-6); grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
  .points li { display: grid; gap: var(--space-2); }
</style>
```

```astro
---
// src/components/SouthIndiaMap.astro
import { places, type PlaceId } from '../data/places';
import { projectSouth, southIndiaOutline } from '../lib/geo';
interface Props { active?: PlaceId[]; label: string; interactiveId?: string }
const { active = [], label, interactiveId } = Astro.props;
const W = 600, H = 700;
const outline = southIndiaOutline(W, H);
const pts = (Object.keys(places) as PlaceId[]).map((id) => {
  const p = places[id];
  const [x, y] = projectSouth(W, H, [p.lon, p.lat]);
  return { id, x, y, ...p };
});
---
<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} class="sim" data-map={interactiveId}>
  <defs><clipPath id="sim-clip"><rect x="0" y="0" width={W} height={H} /></clipPath></defs>
  <path d={outline} clip-path="url(#sim-clip)" class="sim__land" />
  {pts.map((p) => (
    <g data-place={p.id} data-kind={p.kind} data-active={String(active.includes(p.id))} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
      <circle r={p.kind === 'district' ? 6 : 5} />
      <text x="10" y="4">{p.name}</text>
    </g>
  ))}
</svg>
<style>
  .sim { inline-size: 100%; block-size: auto; }
  .sim__land { fill: var(--paper-2); stroke: var(--ink); stroke-width: 0.8; }
  g circle { fill: var(--paper); stroke: var(--ink-2); stroke-width: 1; transition: fill var(--dur-1) var(--ease), r var(--dur-1) var(--ease); }
  g text { font-family: var(--font-body); font-size: 13px; fill: var(--ink-2); opacity: 0; transition: opacity var(--dur-1) var(--ease); direction: ltr; }
  g[data-kind='district'][data-active='true'] circle { fill: var(--turmeric); stroke: var(--ink); r: 9; }
  g[data-active='true'] text, g[data-kind='hq'] text, g[data-kind='port'] text { opacity: 1; }
  g[data-kind='hq'] circle { fill: var(--forest); r: 8; }
  g[data-kind='port'] circle { fill: var(--clay); stroke: none; }
</style>
```

```astro
---
// src/components/home/Sourcing.astro
import SouthIndiaMap from '../SouthIndiaMap.astro';
import { createT } from '../../i18n/t';
import { getLocalizedProducts } from '../../lib/catalog';
import type { Locale } from '../../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const products = await getLocalizedProducts(locale);
const first = products.find((p) => p.slug === 'turmeric')!;
const regionsBySlug = Object.fromEntries(products.map((p) => [p.slug, p.data.regions]));
---
<section id="sourcing" class="section">
  <div class="container src">
    <div class="src__copy" data-reveal>
      <p class="eyebrow">{t('home.sourcing.eyebrow')}</p>
      <h2>{t('home.sourcing.title')}</h2>
      <p>{t('home.sourcing.lede')}</p>
      <div class="src__buttons" role="group" aria-label={t('home.sourcing.title')}>
        {products.map((p) => <button type="button" data-slug={p.slug} aria-pressed={String(p.slug === first.slug)}>{p.text.name}</button>)}
      </div>
    </div>
    <div class="src__map" data-regions={JSON.stringify(regionsBySlug)}>
      <SouthIndiaMap active={first.data.regions} label={t('home.sourcing.title')} interactiveId="home" />
    </div>
  </div>
</section>
<script>
  const wrap = document.querySelector<HTMLElement>('#sourcing .src__map');
  const regions: Record<string, string[]> = JSON.parse(wrap?.dataset.regions ?? '{}');
  document.querySelectorAll<HTMLButtonElement>('#sourcing button[data-slug]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const active = new Set(regions[btn.dataset.slug!] ?? []);
      document.querySelectorAll('#sourcing button[data-slug]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      wrap?.querySelectorAll<SVGGElement>('[data-place]').forEach((g) => g.setAttribute('data-active', String(active.has(g.dataset.place!))));
    });
  });
</script>
<style>
  .src { display: grid; gap: var(--space-7); grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); align-items: center; }
  .src__copy { display: grid; gap: var(--space-4); }
  .src__buttons { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .src__buttons button { min-block-size: 44px; padding-inline: var(--space-4); border: 1px solid var(--rule); background: transparent; border-radius: 999px; font: inherit; font-size: var(--step--1); cursor: pointer; }
  .src__buttons button[aria-pressed='true'] { background: var(--forest); color: var(--paper); border-color: var(--forest); }
</style>
```

```ts
// src/i18n/home-faq.ts
import { createT, type UiKey } from './t';
import type { Locale } from './config';
export function homeFaq(locale: Locale) {
  const t = createT(locale);
  return [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`home.faq.q${n}` as UiKey), a: t(`home.faq.a${n}` as UiKey) }));
}
```

```astro
---
// src/components/home/HomeFaq.astro
import Faq from '../Faq.astro';
import { createT } from '../../i18n/t';
import { homeFaq } from '../../i18n/home-faq';
import type { Locale } from '../../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
---
<section id="faq" class="section">
  <div class="container faqwrap">
    <header data-reveal><p class="eyebrow">{t('home.faq.eyebrow')}</p><h2>{t('home.faq.title')}</h2></header>
    <Faq items={homeFaq(locale)} />
  </div>
</section>
<style>
  .faqwrap { display: grid; gap: var(--space-7); grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); align-items: start; }
</style>
```

```astro
---
// src/components/WorldMap.astro
import { servedCountries, routeHubs } from '../data/countries';
import { worldPaths, worldArcs, projectWorld } from '../lib/geo';
import { places } from '../data/places';
interface Props { label: string }
const { label } = Astro.props;
const W = 1000, H = 520;
const served = new Set(servedCountries.map((c) => c.id));
const paths = worldPaths(W, H, served);
const origin: [number, number] = [places.bengaluru.lon, places.bengaluru.lat];
const arcs = worldArcs(W, H, origin, routeHubs.map((h) => [h.lon, h.lat]));
const [ox, oy] = projectWorld(W, H, origin);
const hubs = routeHubs.map((h) => ({ ...h, xy: projectWorld(W, H, [h.lon, h.lat]) }));
---
<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} class="wm">
  {paths.map((p) => <path d={p.d} class:list={['wm__c', { 'wm__c--on': p.served }]} />)}
  {arcs.map((d) => <path d={d} class="wm__arc" data-draw />)}
  {hubs.map((h) => <circle cx={h.xy[0]} cy={h.xy[1]} r="3.5" class="wm__hub" />)}
  <circle cx={ox} cy={oy} r="7" class="wm__origin" />
</svg>
<style>
  .wm { inline-size: 100%; block-size: auto; }
  .wm__c { fill: rgb(246 241 231 / 0.12); stroke: rgb(246 241 231 / 0.18); stroke-width: 0.4; }
  .wm__c--on { fill: rgb(217 154 30 / 0.55); }
  .wm__arc { fill: none; stroke: var(--gold-soft); stroke-width: 1.2; stroke-linecap: round; }
  .wm__hub { fill: var(--gold-soft); }
  .wm__origin { fill: var(--turmeric); stroke: var(--paper); stroke-width: 2; }
</style>
```

```astro
---
// src/components/home/World.astro
import WorldMap from '../WorldMap.astro';
import { createT, type UiKey } from '../../i18n/t';
import { servedCountries, type Region } from '../../data/countries';
import type { Locale } from '../../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const regions: Region[] = ['middle-east', 'africa', 'asia', 'europe', 'americas', 'oceania'];
---
<section id="world" class="world">
  <div class="container world__inner">
    <header data-reveal>
      <p class="eyebrow">{t('home.world.eyebrow')}</p>
      <h2>{t('home.world.title')}</h2>
      <p>{t('home.world.lede')}</p>
    </header>
    <WorldMap label={t('home.world.title')} />
    <div class="world__lists">
      {regions.map((r) => (
        <div>
          <h3>{t(`region.${r}` as UiKey)}</h3>
          <p>{servedCountries.filter((c) => c.region === r).map((c) => c.name).join(' · ')}</p>
        </div>
      ))}
    </div>
  </div>
</section>
<style>
  .world { background: var(--forest); color: var(--paper); padding-block: var(--space-9); }
  .world .eyebrow { color: var(--gold-soft); }
  .world__inner { display: grid; gap: var(--space-7); }
  .world__inner header { display: grid; gap: var(--space-4); }
  .world__lists { display: grid; gap: var(--space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); font-size: var(--step--1); }
  .world__lists h3 { font-size: var(--step-0); font-family: var(--font-body); font-weight: 700; color: var(--gold-soft); margin-block-end: var(--space-2); }
  .world__lists p { opacity: 0.85; }
</style>
```

Country names stay in English in v1 (localizing them needs ISO alpha-2 codes — out of scope).

```astro
---
// src/components/home/FinalCta.astro
import { createT } from '../../i18n/t';
import { localizePath } from '../../i18n/paths';
import type { Locale } from '../../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
---
<section id="cta" class="section">
  <div class="container cta" data-reveal>
    <h2>{t('home.cta.title')}</h2>
    <p>{t('home.cta.body')}</p>
    <a class="btn btn--primary" href={localizePath('/contact', locale)}>{t('cta.quote')}</a>
  </div>
</section>
<style>
  .cta { display: grid; gap: var(--space-5); justify-items: start; border-block-start: 1px solid var(--ink); padding-block-start: var(--space-7); }
  .cta h2 { max-inline-size: 20ch; }
</style>
```

- [ ] **Step 9: Compose `HomeView.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/home/Hero.astro';
import CertStrip from '../components/CertStrip.astro';
import Range from '../components/home/Range.astro';
import Journey from '../components/home/Journey.astro';
import Why from '../components/home/Why.astro';
import Sourcing from '../components/home/Sourcing.astro';
import HomeFaq from '../components/home/HomeFaq.astro';
import World from '../components/home/World.astro';
import FinalCta from '../components/home/FinalCta.astro';
import { createT } from '../i18n/t';
import { homeFaq } from '../i18n/home-faq';
import { faqLd } from '../lib/jsonld';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
---
<Base locale={locale} title={t('meta.homeTitle')} description={t('meta.homeDescription')} path="/" hero="dark" ogImage="/og/home.png" jsonLd={[faqLd(homeFaq(locale))]}>
  <Hero locale={locale} />
  <CertStrip locale={locale} />
  <Range locale={locale} />
  <Journey locale={locale} />
  <Why locale={locale} />
  <Sourcing locale={locale} />
  <HomeFaq locale={locale} />
  <World locale={locale} />
  <FinalCta locale={locale} />
</Base>
```

The e2e "sections in order" test selects `main > section[id]`; `Hero` and `CertStrip` have no `id`, so the expected list starts at `range`.

- [ ] **Step 10: Run tests**

Run: `npx vitest run && npm run test:e2e -- tests/e2e/home.spec.ts tests/e2e/layout.spec.ts tests/e2e/motion.spec.ts`
Expected: PASS (layout cases for unbuilt routes are skipped).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: landing sections, South India sourcing map and world map"
```

---

### Task 10: Products index and product page template

**Files:**
- Create: `src/components/SpecTable.astro`, `src/components/HarvestCalendar.astro`, `src/components/HsnTable.astro`, `src/views/ProductsView.astro`, `src/views/ProductView.astro`, `src/pages/products/index.astro`, `src/pages/products/[slug].astro`, `src/pages/[lang]/products/index.astro`, `src/pages/[lang]/products/[slug].astro`, `src/lib/months.ts`
- Test: `tests/unit/months.test.ts`, `tests/e2e/product.spec.ts`

**Interfaces:**
- Consumes: catalog, `HsnChip`, `StockLabel`, `Breadcrumbs`, `Faq`, `SouthIndiaMap`, `ProductCard`, `productLd`, `faqLd`, `breadcrumbLd`, `whatsappHref`, `getSite`.
- Produces:
  - `monthLabels(locale: string): string[]` (12 short month names via `Intl.DateTimeFormat`); `seasonRange(months: number[], locale: string): string` (e.g. "Jan – Apr"; wraps across the year: `[11,12,1,2,3]` → "Nov – Mar"; all 12 → localized "Jan – Dec").
  - `ProductView` props `{ locale: Locale; slug: string }`; `ProductsView` props `{ locale: Locale }`.
  - Quote links use `localizePath('/contact', locale) + '?product=<slug>&variety=<id>'`.
  - Spec sheet links: `/spec-sheets/<slug>/<varietyId>.pdf` (built in Task 18).
  - Product hero renders `<ProductObject>` (Task 11). Until then render the hero image only, inside `<div class="pv__object">`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/months.test.ts
import { describe, it, expect } from 'vitest';
import { monthLabels, seasonRange } from '../../src/lib/months';

describe('months', () => {
  it('returns 12 labels', () => expect(monthLabels('en')).toHaveLength(12));
  it('formats a simple range', () => expect(seasonRange([1, 2, 3, 4], 'en')).toBe('Jan – Apr'));
  it('formats a range that wraps the year', () => expect(seasonRange([11, 12, 1, 2, 3], 'en')).toBe('Nov – Mar'));
  it('formats all-year', () => expect(seasonRange([1,2,3,4,5,6,7,8,9,10,11,12], 'en')).toBe('Jan – Dec'));
  it('bridges a short gap and starts after the largest one', () => expect(seasonRange([3, 4, 10, 11, 12], 'en')).toBe('Oct – Apr'));
});
```

Rule for the last case: find the largest circular gap between selected months; the range starts after it and ends before it. For `[3,4,10,11,12]` the largest gap is 4→10, so the range is Oct – Apr.

```ts
// tests/e2e/product.spec.ts
import { test, expect } from '@playwright/test';

const slugs = ['rice', 'non-basmati-rice', 'broken-rice', 'jaggery', 'arecanut', 'groundnuts', 'coconut-copra', 'ginger', 'turmeric'];

for (const slug of slugs) {
  test(`product page renders: ${slug}`, async ({ page }) => {
    await page.goto(`/products/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-variety]').first()).toBeVisible();
  });
}

test('turmeric page has varieties, specs, HSN, quote prefill link and JSON-LD', async ({ page }) => {
  await page.goto('/products/turmeric');
  await expect(page.locator('[data-variety]')).toHaveCount(5);
  await expect(page.getByText('0910 30 30').first()).toBeVisible();
  const quote = page.locator('[data-variety="powder"] a', { hasText: 'Quote this variety' });
  await expect(quote).toHaveAttribute('href', '/contact?product=turmeric&variety=powder');
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent!)['@type']));
  expect(types).toEqual(expect.arrayContaining(['Organization', 'Product', 'FAQPage', 'BreadcrumbList']));
});

test('unverified HSN is flagged on arecanut', async ({ page }) => {
  await page.goto('/products/arecanut');
  await expect(page.locator('.hsn__flag').first()).toBeVisible();
});

test('products index lists 9 products and 14 HSN rows', async ({ page }) => {
  await page.goto('/products');
  await expect(page.locator('main article')).toHaveCount(9);
  await expect(page.locator('[data-hsn-row]')).toHaveCount(14);
});

test('localized product page links back with locale prefix', async ({ page }) => {
  await page.goto('/fr/products/turmeric');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('[data-variety="powder"] a[href^="/fr/contact?product=turmeric"]')).toHaveCount(1);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/months.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/months.ts`**

```ts
export function monthLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2026, i, 15))).replace('.', ''));
}

/** Season as "Start – End". Months are 1–12; the range starts after the largest circular gap. */
export function seasonRange(months: number[], locale: string): string {
  const labels = monthLabels(locale);
  const sorted = [...new Set(months)].sort((a, b) => a - b);
  if (sorted.length === 12) return `${labels[0]} – ${labels[11]}`;
  let gapAfter = sorted.length - 1;
  let best = -1;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length] + (i === sorted.length - 1 ? 12 : 0);
    const gap = next - sorted[i];
    if (gap > best) { best = gap; gapAfter = i; }
  }
  const start = sorted[(gapAfter + 1) % sorted.length];
  const end = sorted[gapAfter];
  return start === end ? labels[start - 1] : `${labels[start - 1]} – ${labels[end - 1]}`;
}
```

- [ ] **Step 4: Run unit test**

Run: `npx vitest run tests/unit/months.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `SpecTable`, `HarvestCalendar`, `HsnTable`**

```astro
---
// src/components/SpecTable.astro
import { createT, type UiKey } from '../i18n/t';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale; specs: { key: string; value: string }[]; caption: string }
const { locale, specs, caption } = Astro.props;
const t = createT(locale);
---
<table class="spec">
  <caption class="sr-only">{caption}</caption>
  <tbody>
    {specs.map((s) => <tr><th scope="row">{t(`spec.${s.key}` as UiKey)}</th><td dir="ltr">{s.value}</td></tr>)}
  </tbody>
</table>
<style>
  .spec { inline-size: 100%; border-collapse: collapse; font-size: var(--step--1); }
  th, td { padding-block: var(--space-2); border-block-end: 1px solid var(--rule); text-align: start; vertical-align: top; }
  th { font-weight: 500; color: var(--ink-2); inline-size: 45%; }
  td { font-family: var(--font-mono); unicode-bidi: plaintext; text-align: start; }
</style>
```

```astro
---
// src/components/HarvestCalendar.astro
import { monthLabels } from '../lib/months';
import type { Locale } from '../i18n/config';
import { htmlLang } from '../i18n/config';
interface Props { locale: Locale; months: number[]; label: string }
const { locale, months, label } = Astro.props;
const labels = monthLabels(htmlLang[locale]);
const on = new Set(months);
---
<ol class="cal" aria-label={label}>
  {labels.map((m, i) => <li data-on={String(on.has(i + 1))}><span>{m}</span></li>)}
</ol>
<style>
  .cal { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(12, 1fr); gap: 2px; }
  li { display: grid; gap: var(--space-1); font-size: 0.7rem; text-align: center; color: var(--ink-2); }
  li::before { content: ''; block-size: 10px; background: var(--rule); border-radius: 2px; }
  li[data-on='true']::before { background: var(--turmeric); }
  @media (max-width: 480px) { li span { writing-mode: vertical-rl; transform: rotate(180deg); margin-inline: auto; } }
</style>
```

```astro
---
// src/components/HsnTable.astro
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import { formatHsn } from '../lib/hsn';
import { getHsnEntries } from '../lib/catalog';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const rows = await getHsnEntries(locale);
---
<div class="hsnt">
  <table>
    <caption><h2>{t('hsn.tableTitle')}</h2></caption>
    <thead><tr><th scope="col">{t('hsn.code')}</th><th scope="col">{t('hsn.description')}</th><th scope="col">{t('hsn.product')}</th></tr></thead>
    <tbody>
      {rows.map((r) => (
        <tr data-hsn-row>
          <td dir="ltr"><a href={localizePath(`/hsn/${r.code}`, locale)}>{formatHsn(r.code)}</a>{!r.verified && <span class="hsn__flag" title={t('product.hsnUnverified')}>*</span>}</td>
          <td>{r.text.title}</td>
          <td><a href={localizePath(`/products/${r.product.slug}`, locale)}>{r.product.text.name}</a></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
<style>
  .hsnt { overflow-x: auto; }
  table { inline-size: 100%; border-collapse: collapse; min-inline-size: 34rem; }
  caption { text-align: start; margin-block-end: var(--space-5); }
  th, td { text-align: start; padding: var(--space-3) var(--space-2); border-block-end: 1px solid var(--rule); }
  th { font-size: var(--step--1); color: var(--ink-2); font-weight: 500; }
  td:first-child { font-family: var(--font-mono); white-space: nowrap; }
  .hsn__flag { color: var(--clay); margin-inline-start: 0.2em; }
</style>
```

- [ ] **Step 6: Implement `ProductsView` and `ProductView`**

```astro
---
// src/views/ProductsView.astro
import Base from '../layouts/Base.astro';
import ProductCard from '../components/ProductCard.astro';
import HsnTable from '../components/HsnTable.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import { createT } from '../i18n/t';
import { getLocalizedProducts } from '../lib/catalog';
import { breadcrumbLd } from '../lib/jsonld';
import { localizePath } from '../i18n/paths';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const products = await getLocalizedProducts(locale);
const crumbs = [{ name: t('nav.home'), path: '/' }, { name: t('nav.products'), path: '/products' }];
const abs = (p: string) => new URL(localizePath(p, locale), Astro.site).href;
---
<Base locale={locale} title={t('meta.productsTitle')} description={t('meta.productsDescription')} path="/products" ogImage="/og/products.png"
  jsonLd={[breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: abs(c.path) })))]}>
  <div class="container page">
    <Breadcrumbs locale={locale} items={crumbs} />
    <header class="page__head">
      <p class="eyebrow">{t('home.range.eyebrow')}</p>
      <h1>{t('home.range.title')}</h1>
      <p>{t('home.range.lede')}</p>
    </header>
    <div class="grid">{products.map((p) => <ProductCard locale={locale} product={p} headingLevel="h2" />)}</div>
    <section class="section"><HsnTable locale={locale} /></section>
  </div>
</Base>
<style>
  .page { padding-block: 8rem var(--space-8); display: grid; gap: var(--space-7); }
  .page__head { display: grid; gap: var(--space-4); }
  .grid { display: grid; gap: var(--space-7) var(--space-5); grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); }
</style>
```

```astro
---
// src/views/ProductView.astro
import { Image, getImage } from 'astro:assets';
import Base from '../layouts/Base.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import HsnChip from '../components/HsnChip.astro';
import StockLabel from '../components/StockLabel.astro';
import SpecTable from '../components/SpecTable.astro';
import HarvestCalendar from '../components/HarvestCalendar.astro';
import SouthIndiaMap from '../components/SouthIndiaMap.astro';
import ProductCard from '../components/ProductCard.astro';
import Faq from '../components/Faq.astro';
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import { htmlLang, type Locale } from '../i18n/config';
import { getLocalizedProduct, getLocalizedProducts, getSite } from '../lib/catalog';
import { productLd, faqLd, breadcrumbLd } from '../lib/jsonld';
import { seasonRange } from '../lib/months';
import { whatsappHref } from '../lib/site';
import { formatHsn } from '../lib/hsn';
import { places } from '../data/places';
interface Props { locale: Locale; slug: string }
const { locale, slug } = Astro.props;
const t = createT(locale);
const p = await getLocalizedProduct(locale, slug);
const all = await getLocalizedProducts(locale);
const related = p.data.related.map((s) => all.find((x) => x.slug === s)!).filter(Boolean);
const site = await getSite();
const path = `/products/${slug}`;
const abs = (x: string) => new URL(localizePath(x, locale), Astro.site).href;
const states = [...new Set(p.data.regions.map((r) => places[r].state))].join(', ');
const portNames = p.data.ports.map((id) => places[id].name).join(', ');
const crumbs = [{ name: t('nav.home'), path: '/' }, { name: t('nav.products'), path: '/products' }, { name: p.text.name, path }];
const hero = await getImage({ src: p.data.heroImage.src, width: 1200, format: 'jpg' });
const wa = whatsappHref(site.whatsapp, `${p.text.name} — ${abs(path)}`);
const quoteHref = (variety?: string) => `${localizePath('/contact', locale)}?product=${slug}${variety ? `&variety=${variety}` : ''}`;
const ld = [
  productLd({
    name: p.text.name, description: p.text.summary, url: abs(path), image: new URL(hero.src, Astro.site).href,
    hsn: p.data.hsn.map((h) => h.code), brand: 'GoodBiz Agri',
    varieties: p.data.varieties.map((v) => ({ name: p.text.varieties[v.id]?.name ?? v.id, hsn: v.hsn })),
  }),
  faqLd(p.text.faq),
  breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: abs(c.path) }))),
];
const title = t('meta.productTitle', { name: p.text.name, hsn: formatHsn(p.data.hsn[0].code) });
---
<Base locale={locale} title={title} description={p.text.summary} path={path} ogImage={`/og/products/${slug}.png`} jsonLd={ld}>
  <article class="pv">
    <section class="pv__hero container">
      <Breadcrumbs locale={locale} items={crumbs} />
      <div class="pv__heroGrid">
        <div class="pv__object">
          <Image src={p.data.heroImage.src} alt={p.text.name} widths={[480, 720, 960]} sizes="(max-width: 860px) 100vw, 50vw" loading="eager" fetchpriority="high" data-object-poster />
          <StockLabel locale={locale} show={p.data.heroImage.isStock} />
        </div>
        <div class="pv__intro">
          <h1>{p.text.name}</h1>
          <div class="pv__chips">{p.data.hsn.map((h) => <HsnChip code={h.code} verified={h.verified} locale={locale} href={localizePath(`/hsn/${h.code}`, locale)} />)}</div>
          <p class="pv__summary">{p.text.summary}</p>
          <div class="pv__ctas">
            <a class="btn btn--primary" href={quoteHref()}>{t('cta.quote')}</a>
            {wa && <a class="btn btn--ghost" href={wa} target="_blank" rel="noopener">{t('cta.whatsapp')}</a>}
          </div>
        </div>
      </div>
    </section>

    <section class="container pv__facts" aria-labelledby="facts">
      <h2 id="facts" class="sr-only">{t('product.quickFacts')}</h2>
      <dl>
        <div><dt>{t('fact.hsn')}</dt><dd dir="ltr">{p.data.hsn.map((h) => formatHsn(h.code)).join(' · ')}</dd></div>
        <div><dt>{t('fact.states')}</dt><dd>{states}</dd></div>
        <div><dt>{t('fact.season')}</dt><dd>{seasonRange(p.data.harvestMonths, htmlLang[locale])}</dd></div>
        <div><dt>{t('fact.moq')}</dt><dd>{p.data.moq}</dd></div>
        <div><dt>{t('fact.ports')}</dt><dd>{portNames}</dd></div>
        <div><dt>{t('fact.shelfLife')}</dt><dd>{p.data.shelfLife}</dd></div>
      </dl>
    </section>

    <section class="section container" aria-labelledby="varieties">
      <h2 id="varieties" data-reveal>{t('product.varieties')}</h2>
      <div class="pv__varieties">
        {p.data.varieties.map((v) => {
          const vt = p.text.varieties[v.id];
          return (
            <article class="var" data-variety={v.id} data-reveal>
              <div class="var__media">
                <Image src={v.image.src} alt={vt?.name ?? v.id} widths={[360, 540]} sizes="(max-width: 700px) 100vw, 33vw" loading="lazy" />
                <StockLabel locale={locale} show={v.image.isStock} />
              </div>
              <div class="var__body">
                <h3>{vt?.name ?? v.id}</h3>
                <HsnChip code={v.hsn} verified={p.data.hsn.find((h) => h.code === v.hsn)!.verified} locale={locale} />
                <p>{vt?.description}</p>
                <p class="var__where"><span>{t('product.region')}:</span> {places[v.region].name}, {places[v.region].state} · <span>{t('product.market')}:</span> {v.market}</p>
                <SpecTable locale={locale} specs={v.specs} caption={`${t('product.specs')} — ${vt?.name ?? v.id}`} />
                <p class="var__pack"><span>{t('product.packing')}:</span> {v.packing.join(' · ')}</p>
                <div class="var__ctas">
                  <a class="btn btn--primary" href={quoteHref(v.id)}>{t('cta.quoteVariety')}</a>
                  <a href={`/spec-sheets/${slug}/${v.id}.pdf`} download>{t('cta.specSheet')}</a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>

    <section class="section pv__where" aria-labelledby="where">
      <div class="container pv__whereGrid">
        <div data-reveal>
          <h2 id="where">{t('product.where')}</h2>
          <p class="pv__origin">{p.text.originLine}</p>
          <p>{p.text.sourcingStory}</p>
          <ul class="pv__markets">{p.data.markets.map((m) => <li>{m}</li>)}</ul>
          <h3>{t('product.calendar')}</h3>
          <HarvestCalendar locale={locale} months={p.data.harvestMonths} label={t('product.calendar')} />
        </div>
        <SouthIndiaMap active={p.data.regions} label={`${t('product.where')}: ${p.text.name}`} />
      </div>
    </section>

    <section class="section container pv__two">
      <div data-reveal>
        <h2>{t('product.quality')}</h2>
        <p>{t('product.quality.body')}</p>
        <h3>{t('product.documents')}</h3>
        <ul class="pv__docs">
          {(['doc.coo', 'doc.phyto', 'doc.fumigation', 'doc.fssai', 'doc.rcmc', 'doc.coa'] as const).map((k) => <li>{t(k)}</li>)}
        </ul>
      </div>
      <div data-reveal>
        <h2>{t('product.shipping')}</h2>
        <dl class="pv__ship">
          <div><dt>{t('fact.packing')}</dt><dd>{p.data.packing.join(' · ')}</dd></div>
          <div><dt>{t('product.container20')}</dt><dd>{p.data.containerLoad.ft20}</dd></div>
          <div><dt>{t('product.container40')}</dt><dd>{p.data.containerLoad.ft40}</dd></div>
          <div><dt>{t('product.incoterms')}</dt><dd dir="ltr">FOB · CFR · CIF</dd></div>
        </dl>
      </div>
    </section>

    <section class="section container" aria-labelledby="pfaq">
      <h2 id="pfaq">{t('product.faq', { name: p.text.name })}</h2>
      <Faq items={p.text.faq} />
    </section>

    {related.length > 0 && (
      <section class="section container" aria-labelledby="related">
        <h2 id="related">{t('product.related')}</h2>
        <div class="pv__related">{related.map((r) => <ProductCard locale={locale} product={r} />)}</div>
      </section>
    )}

    <section class="container pv__cta">
      <h2>{t('home.cta.title')}</h2>
      <a class="btn btn--primary" href={quoteHref()}>{t('cta.quote')}</a>
    </section>
  </article>
</Base>
<style>
  .pv__hero { padding-block: 7.5rem var(--space-7); display: grid; gap: var(--space-5); }
  .pv__heroGrid { display: grid; gap: var(--space-7); grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); align-items: center; }
  .pv__object { position: relative; aspect-ratio: 1; border-radius: var(--radius-media); overflow: hidden; background: var(--paper-2); }
  .pv__object :global(img) { inline-size: 100%; block-size: 100%; object-fit: cover; }
  .pv__intro { display: grid; gap: var(--space-5); }
  .pv__chips { display: flex; flex-wrap: wrap; gap: var(--space-2); color: var(--forest); }
  .pv__summary { font-size: var(--step-1); line-height: 1.45; }
  .pv__ctas, .var__ctas { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }
  .pv__facts dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: var(--space-4); margin: 0; border-block: 1px solid var(--ink); padding-block: var(--space-5); }
  dt { font-size: var(--step--1); color: var(--ink-2); }
  dd { margin: 0; font-weight: 500; }
  .pv__varieties { display: grid; gap: var(--space-8); margin-block-start: var(--space-7); }
  .var { display: grid; gap: var(--space-6); grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); align-items: start; }
  .var__media { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-radius: var(--radius-media); background: var(--paper-2); }
  .var__media :global(img) { inline-size: 100%; block-size: 100%; object-fit: cover; }
  .var__body { display: grid; gap: var(--space-3); justify-items: start; }
  .var__where, .var__pack { font-size: var(--step--1); color: var(--ink-2); }
  .var__where span, .var__pack span { color: var(--ink); font-weight: 500; }
  .pv__where { background: var(--paper-2); }
  .pv__whereGrid { display: grid; gap: var(--space-7); grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); align-items: center; }
  .pv__whereGrid > div { display: grid; gap: var(--space-4); }
  .pv__origin { font-family: var(--font-display); font-size: var(--step-1); color: var(--clay); }
  .pv__markets { margin: 0; padding-inline-start: 1.2em; }
  .pv__two { display: grid; gap: var(--space-7); grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); }
  .pv__two > div { display: grid; gap: var(--space-4); align-content: start; }
  .pv__docs { margin: 0; padding-inline-start: 1.2em; }
  .pv__ship { display: grid; gap: var(--space-3); margin: 0; }
  .pv__related { display: grid; gap: var(--space-5); grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr)); margin-block-start: var(--space-6); }
  .pv__cta { display: grid; gap: var(--space-5); justify-items: start; padding-block: var(--space-8); border-block-start: 1px solid var(--ink); }
  section > h2 + :global(.faq) { margin-block-start: var(--space-6); }
</style>
```

- [ ] **Step 7: Route files**

```astro
---
// src/pages/products/index.astro
import ProductsView from '../../views/ProductsView.astro';
---
<ProductsView locale="en" />
```

```astro
---
// src/pages/products/[slug].astro
import { getCollection } from 'astro:content';
import ProductView from '../../views/ProductView.astro';
export async function getStaticPaths() {
  return (await getCollection('products')).map((p) => ({ params: { slug: p.id } }));
}
---
<ProductView locale="en" slug={Astro.params.slug!} />
```

```astro
---
// src/pages/[lang]/products/index.astro
import ProductsView from '../../../views/ProductsView.astro';
import { localeStaticPaths } from '../../../lib/routes';
import type { Locale } from '../../../i18n/config';
export const getStaticPaths = localeStaticPaths;
---
<ProductsView locale={Astro.params.lang as Locale} />
```

```astro
---
// src/pages/[lang]/products/[slug].astro
import { getCollection } from 'astro:content';
import ProductView from '../../../views/ProductView.astro';
import { nonDefaultLocales, type Locale } from '../../../i18n/config';
export async function getStaticPaths() {
  const products = await getCollection('products');
  return nonDefaultLocales.flatMap((lang) => products.map((p) => ({ params: { lang, slug: p.id } })));
}
---
<ProductView locale={Astro.params.lang as Locale} slug={Astro.params.slug!} />
```

- [ ] **Step 8: Run tests**

Run: `npm run test:e2e -- tests/e2e/product.spec.ts tests/e2e/layout.spec.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: products index, HSN table and product page template"
```

---

### Task 11: 3D product objects

**Files:**
- Create: `src/scripts/product-object/grains.ts`, `src/scripts/product-object/scene.ts`, `src/components/ProductObject.astro`
- Modify: `src/views/ProductView.astro` (wrap hero image with `<ProductObject>`)
- Test: `tests/unit/grains.test.ts`, `tests/e2e/product-object.spec.ts`

**Interfaces:**
- Consumes: `canRun3D`, `currentEnv`, `whenNear`, `prefersReducedMotion` (Task 7).
- Produces:
  - `type GrainKind = 'rice'|'brokenRice'|'groundnut'|'arecanut'|'turmeric'|'ginger'|'jaggery'|'copra'`
  - `grainSpec(kind: GrainKind): { count: number; scale: [number, number, number]; color: string; jitter: number; shape: 'ellipsoid' | 'capsule' | 'box' | 'sphere' }`
  - `scatterPile(count: number, seed: number, radius?: number): Float32Array` — `count * 4` floats (x, y, z, rotationY); y ≥ 0; deterministic; points within `radius` in xz; pile is higher at the centre.
  - `mountProductObject(canvas: HTMLCanvasElement, model: { kind: 'grains'; grain: GrainKind } | { kind: 'glb'; src: string; fallbackGrain: GrainKind }, opts: { autoRotate: boolean }): Promise<() => void>`
  - `<ProductObject model alt locale>` with default slot for the poster image.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/grains.test.ts
import { describe, it, expect } from 'vitest';
import { grainSpec, scatterPile } from '../../src/scripts/product-object/grains';

describe('grainSpec', () => {
  it('rice is elongated', () => {
    const s = grainSpec('rice');
    expect(s.scale[0]).toBeGreaterThan(s.scale[1] * 2);
  });
  it('every kind has a positive count under 2500', () => {
    for (const k of ['rice', 'brokenRice', 'groundnut', 'arecanut', 'turmeric', 'ginger', 'jaggery', 'copra'] as const) {
      const s = grainSpec(k);
      expect(s.count).toBeGreaterThan(0);
      expect(s.count).toBeLessThanOrEqual(2500);
    }
  });
});

describe('scatterPile', () => {
  it('returns 4 floats per instance', () => expect(scatterPile(100, 1).length).toBe(400));
  it('is deterministic', () => expect(Array.from(scatterPile(50, 3))).toEqual(Array.from(scatterPile(50, 3))));
  it('keeps points inside the radius and above the floor', () => {
    const p = scatterPile(500, 2, 1.5);
    for (let i = 0; i < 500; i++) {
      expect(Math.hypot(p[i * 4], p[i * 4 + 2])).toBeLessThanOrEqual(1.5 + 1e-6);
      expect(p[i * 4 + 1]).toBeGreaterThanOrEqual(0);
    }
  });
  it('is higher at the centre than at the rim', () => {
    const p = scatterPile(2000, 4, 1.5);
    let inner = 0, innerN = 0, outer = 0, outerN = 0;
    for (let i = 0; i < 2000; i++) {
      const r = Math.hypot(p[i * 4], p[i * 4 + 2]);
      if (r < 0.5) { inner += p[i * 4 + 1]; innerN++; } else if (r > 1.1) { outer += p[i * 4 + 1]; outerN++; }
    }
    expect(inner / innerN).toBeGreaterThan(outer / outerN);
  });
});
```

```ts
// tests/e2e/product-object.spec.ts
import { test, expect } from '@playwright/test';

test('grain product mounts a canvas when WebGL is available', async ({ page }) => {
  await page.goto('/products/rice');
  const canvas = page.locator('[data-object-canvas]');
  await expect(canvas).toHaveAttribute('data-state', /on|off/, { timeout: 8000 });
});

test('missing GLB keeps the poster and logs no page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/models/*.glb', (r) => r.abort());
  await page.goto('/products/ginger');
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-object-poster]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('reduced motion: no 3D, poster only', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/products/turmeric');
  await expect(page.locator('[data-object-canvas]')).toHaveAttribute('data-state', 'off');
  await ctx.close();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/grains.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/scripts/product-object/grains.ts`**

```ts
export type GrainKind = 'rice' | 'brokenRice' | 'groundnut' | 'arecanut' | 'turmeric' | 'ginger' | 'jaggery' | 'copra';
type Spec = { count: number; scale: [number, number, number]; color: string; jitter: number; shape: 'ellipsoid' | 'capsule' | 'box' | 'sphere' };

const SPECS: Record<GrainKind, Spec> = {
  rice: { count: 2200, scale: [0.11, 0.035, 0.035], color: '#F3EEDF', jitter: 0.04, shape: 'ellipsoid' },
  brokenRice: { count: 2400, scale: [0.06, 0.035, 0.035], color: '#EFE8D6', jitter: 0.05, shape: 'ellipsoid' },
  groundnut: { count: 900, scale: [0.12, 0.08, 0.08], color: '#D9A97A', jitter: 0.08, shape: 'ellipsoid' },
  arecanut: { count: 260, scale: [0.2, 0.17, 0.2], color: '#8A5A36', jitter: 0.12, shape: 'sphere' },
  turmeric: { count: 320, scale: [0.32, 0.06, 0.06], color: '#C9822A', jitter: 0.12, shape: 'capsule' },
  ginger: { count: 140, scale: [0.42, 0.13, 0.16], color: '#C8A57A', jitter: 0.15, shape: 'capsule' },
  jaggery: { count: 90, scale: [0.3, 0.22, 0.3], color: '#7A4A1E', jitter: 0.1, shape: 'box' },
  copra: { count: 160, scale: [0.3, 0.07, 0.24], color: '#F1EADB', jitter: 0.1, shape: 'ellipsoid' },
};

export function grainSpec(kind: GrainKind): Spec {
  return SPECS[kind];
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Instances as (x, y, z, rotY) forming a cone-shaped pile. */
export function scatterPile(count: number, seed: number, radius = 1.5): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    const height = (1 - r / radius) * radius * 0.7;
    out[i * 4] = Math.cos(a) * r;
    out[i * 4 + 1] = Math.max(0, height * rand() ** 0.5);
    out[i * 4 + 2] = Math.sin(a) * r;
    out[i * 4 + 3] = rand() * Math.PI * 2;
  }
  return out;
}
```

- [ ] **Step 4: Implement `src/scripts/product-object/scene.ts`**

```ts
import * as THREE from 'three';
import { grainSpec, scatterPile, type GrainKind } from './grains';

type Model = { kind: 'grains'; grain: GrainKind } | { kind: 'glb'; src: string; fallbackGrain: GrainKind };

function geometryFor(shape: ReturnType<typeof grainSpec>['shape']) {
  switch (shape) {
    case 'capsule': return new THREE.CapsuleGeometry(0.5, 1.4, 4, 8);
    case 'box': return new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
    case 'sphere': return new THREE.IcosahedronGeometry(0.5, 2);
    default: return new THREE.SphereGeometry(0.5, 10, 8);
  }
}

function buildPile(kind: GrainKind) {
  const spec = grainSpec(kind);
  const geo = geometryFor(spec.shape);
  const mat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.75, metalness: 0 });
  const mesh = new THREE.InstancedMesh(geo, mat, spec.count);
  const pile = scatterPile(spec.count, 11);
  const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const s = new THREE.Vector3(); const e = new THREE.Euler();
  const color = new THREE.Color();
  for (let i = 0; i < spec.count; i++) {
    const j = 1 + (Math.sin(i * 12.9898) * 0.5) * spec.jitter * 4;
    s.set(spec.scale[0] * j, spec.scale[1] * j, spec.scale[2] * j);
    e.set((i % 7) * 0.4, pile[i * 4 + 3], (i % 5) * 0.3);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(pile[i * 4], pile[i * 4 + 1], pile[i * 4 + 2]), q, s);
    mesh.setMatrixAt(i, m);
    color.set(spec.color).offsetHSL(0, 0, (Math.sin(i * 78.233) * 0.5) * spec.jitter);
    mesh.setColorAt(i, color);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

async function loadGlb(src: string): Promise<THREE.Object3D> {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js'),
  ]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(src);
  const obj = gltf.scene;
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()).length();
  obj.scale.setScalar(3 / size);
  box.setFromObject(obj);
  obj.position.sub(box.getCenter(new THREE.Vector3()));
  return obj;
}

export async function mountProductObject(canvas: HTMLCanvasElement, model: Model, opts: { autoRotate: boolean }): Promise<() => void> {
  let object: THREE.Object3D;
  if (model.kind === 'glb') {
    const head = await fetch(model.src, { method: 'HEAD' }).catch(() => null);
    object = head?.ok ? await loadGlb(model.src).catch(() => buildPile(model.fallbackGrain)) : buildPile(model.fallbackGrain);
  } else {
    object = buildPile(model.grain);
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 2.6, 5.2);
  camera.lookAt(0, 0.4, 0);
  scene.add(new THREE.HemisphereLight('#FFF6E5', '#3B2A1A', 1.4));
  const sun = new THREE.DirectionalLight('#FFE9C2', 2.2);
  sun.position.set(3, 5, 2);
  scene.add(sun);
  const group = new THREE.Group();
  group.add(object);
  scene.add(group);

  const resize = () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // one slow turn on entry, then drag to rotate
  let target = opts.autoRotate ? Math.PI * 2 : 0;
  let rot = 0; let dragging = false; let lastX = 0;
  const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (!dragging) return; target += (e.clientX - lastX) * 0.01; lastX = e.clientX; };
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);

  let raf = 0;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    rot += (target - rot) * 0.04;
    group.rotation.y = rot;
    renderer.render(scene, camera);
  };
  frame();

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    renderer.dispose();
  };
}
```

- [ ] **Step 5: Implement `src/components/ProductObject.astro`**

```astro
---
import { createT } from '../i18n/t';
import type { Locale } from '../i18n/config';
import type { ProductData } from '../lib/schemas';
interface Props { model: ProductData['model']; locale: Locale }
const { model, locale } = Astro.props;
const t = createT(locale);
---
<div class="po">
  <slot />
  <canvas data-object-canvas data-state="idle" data-model={JSON.stringify(model)} aria-hidden="true" class="po__canvas"></canvas>
  <span class="po__hint">{t('product.drag')}</span>
</div>
<script>
  import { canRun3D, currentEnv, whenNear } from '../scripts/lazy';
  document.querySelectorAll<HTMLCanvasElement>('[data-object-canvas]').forEach((canvas) => {
    if (!canRun3D(currentEnv())) { canvas.dataset.state = 'off'; return; }
    whenNear(canvas, async () => {
      try {
        const { mountProductObject } = await import('../scripts/product-object/scene');
        await mountProductObject(canvas, JSON.parse(canvas.dataset.model!), { autoRotate: true });
        canvas.dataset.state = 'on';
      } catch {
        canvas.dataset.state = 'off';
      }
    }, '200px');
  });
</script>
<style>
  .po { position: absolute; inset: 0; }
  .po__canvas { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; opacity: 0; transition: opacity var(--dur-2) var(--ease); cursor: grab; touch-action: pan-y; }
  .po__canvas[data-state='on'] { opacity: 1; }
  .po:has(.po__canvas[data-state='on']) :global([data-object-poster]) { opacity: 0; transition: opacity var(--dur-2) var(--ease); }
  .po__hint { position: absolute; inset-block-end: var(--space-2); inset-inline-end: var(--space-2); font-size: 0.7rem; color: var(--ink-2); opacity: 0; }
  .po:has(.po__canvas[data-state='on']) .po__hint { opacity: 1; }
</style>
```

When the canvas is on, the poster fades to `opacity: 0` but stays in layout; Playwright treats `opacity: 0` as visible, so the GLB-abort test (where the fallback grain pile mounts) still finds the poster.

- [ ] **Step 6: Wire into `ProductView.astro`**

Replace the `pv__object` block contents with:
```astro
<div class="pv__object">
  <ProductObject model={p.data.model} locale={locale}>
    <Image src={p.data.heroImage.src} alt={p.text.name} widths={[480, 720, 960]} sizes="(max-width: 860px) 100vw, 50vw" loading="eager" fetchpriority="high" data-object-poster />
    <StockLabel locale={locale} show={p.data.heroImage.isStock} />
  </ProductObject>
</div>
```
and add `import ProductObject from '../components/ProductObject.astro';`.

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/unit/grains.test.ts && npm run test:e2e -- tests/e2e/product-object.spec.ts tests/e2e/product.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: 3D product objects with grain piles, GLB support and poster fallback"
```

---

### Task 12: HSN reference pages

**Files:**
- Create: `src/views/HsnView.astro`, `src/pages/hsn/[code].astro`, `src/pages/[lang]/hsn/[code].astro`
- Test: `tests/e2e/hsn.spec.ts`

**Interfaces:**
- Consumes: `getHsnEntries`, `HsnChip`, `SpecTable`, `Faq`, `Breadcrumbs`, `faqLd`, `breadcrumbLd`, `formatHsn`.
- Produces: `HsnView` props `{ locale: Locale; code: string }`; routes `/hsn/<code>` for 14 codes × 9 locales.

- [ ] **Step 1: Write failing test**

```ts
// tests/e2e/hsn.spec.ts
import { test, expect } from '@playwright/test';
const codes = ['09101110','09101120','09101130','09101190','09103010','09103020','09103030','100640','1006','10063099','120242','1701','80280','8011220'];

for (const code of codes) {
  test(`hsn page ${code}`, async ({ page }) => {
    const res = await page.goto(`/hsn/${code}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('HSN');
  });
}

test('turmeric powder HSN page answers first and links to product', async ({ page }) => {
  await page.goto('/hsn/09103030');
  await expect(page.locator('[data-answer]')).toContainText('09103030');
  await expect(page.locator('a[href="/contact?product=turmeric&variety=powder"]')).toHaveCount(1);
  await expect(page.locator('a[href="/products/turmeric"]').first()).toBeVisible();
});

test('unverified HSN page shows the verification note', async ({ page }) => {
  await page.goto('/hsn/80280');
  await expect(page.locator('[data-unverified]')).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:e2e -- --project=desktop tests/e2e/hsn.spec.ts`
Expected: FAIL (404s).

- [ ] **Step 3: Implement `HsnView.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import HsnChip from '../components/HsnChip.astro';
import SpecTable from '../components/SpecTable.astro';
import Faq from '../components/Faq.astro';
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import type { Locale } from '../i18n/config';
import { getHsnEntries } from '../lib/catalog';
import { faqLd, breadcrumbLd } from '../lib/jsonld';
import { formatHsn } from '../lib/hsn';
interface Props { locale: Locale; code: string }
const { locale, code } = Astro.props;
const t = createT(locale);
const entry = (await getHsnEntries(locale)).find((e) => e.code === code)!;
const { product } = entry;
const varieties = product.data.varieties.filter((v) => entry.varietyIds.includes(v.id));
const path = `/hsn/${code}`;
const abs = (x: string) => new URL(localizePath(x, locale), Astro.site).href;
const crumbs = [{ name: t('nav.home'), path: '/' }, { name: t('nav.products'), path: '/products' }, { name: `HSN ${formatHsn(code)}`, path }];
const answer = `${entry.text.description} (HSN ${code})`;
---
<Base locale={locale} title={t('meta.hsnTitle', { code: formatHsn(code), title: entry.text.title })} description={entry.text.description} path={path} ogImage={`/og/hsn/${code}.png`}
  jsonLd={[faqLd(entry.text.faq), breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: abs(c.path) })))]}>
  <div class="container hv">
    <Breadcrumbs locale={locale} items={crumbs} />
    <header class="hv__head">
      <p class="eyebrow">{t('hsn.eyebrow')}</p>
      <h1><span dir="ltr">HSN {formatHsn(code)}</span> — {entry.text.title}</h1>
      <p class="hv__answer" data-answer>{answer}</p>
      {!entry.verified && <p class="hv__flag" data-unverified>{t('product.hsnUnverified')}. {entry.text.notes}</p>}
    </header>

    <section>
      <h2>{t('hsn.covers')}</h2>
      <p><a href={localizePath(`/products/${product.slug}`, locale)}>{product.text.name}</a> — {product.text.originLine}</p>
      <div class="hv__vars">
        {varieties.map((v) => (
          <article>
            <h3>{product.text.varieties[v.id]?.name ?? v.id}</h3>
            <HsnChip code={v.hsn} verified={entry.verified} locale={locale} />
            <SpecTable locale={locale} specs={v.specs} caption={product.text.varieties[v.id]?.name ?? v.id} />
            <a class="btn btn--primary" href={`${localizePath('/contact', locale)}?product=${product.slug}&variety=${v.id}`}>{t('cta.quoteVariety')}</a>
          </article>
        ))}
      </div>
    </section>

    {entry.verified && <section><h2>{t('hsn.notes')}</h2><p>{entry.text.notes}</p></section>}

    <section>
      <h2>{t('hsn.documents')}</h2>
      <ul>{(['doc.coo', 'doc.phyto', 'doc.fumigation', 'doc.fssai', 'doc.rcmc', 'doc.coa'] as const).map((k) => <li>{t(k)}</li>)}</ul>
      <p class="hv__duty">{t('hsn.dutyNote')}</p>
    </section>

    <section><Faq items={entry.text.faq} /></section>
  </div>
</Base>
<style>
  .hv { padding-block: 7.5rem var(--space-8); display: grid; gap: var(--space-8); }
  .hv__head { display: grid; gap: var(--space-4); }
  .hv__answer { font-size: var(--step-1); line-height: 1.45; }
  .hv__flag, .hv__duty { font-size: var(--step--1); color: var(--clay); border-inline-start: 3px solid var(--clay); padding-inline-start: var(--space-3); }
  section { display: grid; gap: var(--space-4); }
  .hv__vars { display: grid; gap: var(--space-6); grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); }
  .hv__vars article { display: grid; gap: var(--space-3); justify-items: start; border-block-start: 1px solid var(--ink); padding-block-start: var(--space-4); }
  ul { margin: 0; padding-inline-start: 1.2em; }
</style>
```

- [ ] **Step 4: Route files**

```astro
---
// src/pages/hsn/[code].astro
import { getCollection } from 'astro:content';
import HsnView from '../../views/HsnView.astro';
export async function getStaticPaths() {
  const products = await getCollection('products');
  return products.flatMap((p) => p.data.hsn.map((h) => ({ params: { code: h.code } })));
}
---
<HsnView locale="en" code={Astro.params.code!} />
```

```astro
---
// src/pages/[lang]/hsn/[code].astro
import { getCollection } from 'astro:content';
import HsnView from '../../../views/HsnView.astro';
import { nonDefaultLocales, type Locale } from '../../../i18n/config';
export async function getStaticPaths() {
  const codes = (await getCollection('products')).flatMap((p) => p.data.hsn.map((h) => h.code));
  return nonDefaultLocales.flatMap((lang) => codes.map((code) => ({ params: { lang, code } })));
}
---
<HsnView locale={Astro.params.lang as Locale} code={Astro.params.code!} />
```

- [ ] **Step 5: Run tests**

Run: `npm run test:e2e -- --project=desktop tests/e2e/hsn.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: HSN reference pages"
```

---

### Task 13: Quote form and contact page

**Files:**
- Create: `src/lib/quote.ts`, `src/components/QuoteForm.astro`, `src/scripts/quote-form.ts`, `src/views/ContactView.astro`, `src/pages/contact.astro`, `src/pages/[lang]/contact.astro`, `src/pages/thanks.astro`
- Test: `tests/unit/quote.test.ts`, `tests/e2e/quote.spec.ts`

**Interfaces:**
- Consumes: catalog, `whatsappHref`, `mailtoHref`, `getSite`, `createT`.
- Produces:
  - `type Catalog = { slug: string; varieties: string[] }[]`
  - `parsePrefill(search: string, catalog: Catalog): { product?: string; variety?: string }` — accepts only known slugs/variety ids; variety requires a valid product.
  - `type QuoteInput = { product: string; variety: string; quantity: string; unit: 'mt'|'fcl20'|'fcl40'; country: string; port: string; incoterm: 'FOB'|'CFR'|'CIF'|'other'; packing: string; name: string; company: string; email: string; whatsapp: string; message: string; botcheck: string; startedAt: number }`
  - `validateQuote(input: QuoteInput, now: number): { ok: true } | { ok: false; errors: Partial<Record<keyof QuoteInput, 'required'|'email'|'quantity'|'product'>>; spam?: boolean }` — spam when `botcheck` non-empty or `now - startedAt < 3000`.
  - `summarizeQuote(input: QuoteInput, labels: { product: string; variety: string }): string` — plain-text message for WhatsApp/email fallback.
  - `submitQuote(fetchFn: typeof fetch, accessKey: string, input: QuoteInput, labels): Promise<'ok' | 'error'>` — POSTs JSON to `https://api.web3forms.com/submit`; `'error'` on network failure, non-2xx, or `{ success: false }`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/quote.test.ts
import { describe, it, expect, vi } from 'vitest';
import { parsePrefill, validateQuote, summarizeQuote, submitQuote, type QuoteInput } from '../../src/lib/quote';

const catalog = [{ slug: 'turmeric', varieties: ['powder', 'dried-finger'] }, { slug: 'rice', varieties: ['ponni'] }];
const base: QuoteInput = {
  product: 'turmeric', variety: 'powder', quantity: '20', unit: 'mt', country: 'UAE', port: 'Jebel Ali', incoterm: 'CIF',
  packing: '25 kg bags', name: 'Amal', company: 'Gulf Foods', email: 'amal@gulf.ae', whatsapp: '', message: '', botcheck: '', startedAt: 0,
};

describe('parsePrefill', () => {
  it('reads known product and variety', () => expect(parsePrefill('?product=turmeric&variety=powder', catalog)).toEqual({ product: 'turmeric', variety: 'powder' }));
  it('ignores unknown product', () => expect(parsePrefill('?product=mango&variety=powder', catalog)).toEqual({}));
  it('ignores variety from another product', () => expect(parsePrefill('?product=rice&variety=powder', catalog)).toEqual({ product: 'rice' }));
  it('ignores script injection', () => expect(parsePrefill('?product=%3Cscript%3Ealert(1)%3C/script%3E', catalog)).toEqual({}));
  it('handles empty search', () => expect(parsePrefill('', catalog)).toEqual({}));
});

describe('validateQuote', () => {
  it('accepts a complete request', () => expect(validateQuote(base, 10_000)).toEqual({ ok: true }));
  it('requires product, quantity, country, name, email', () => {
    const r = validateQuote({ ...base, product: '', quantity: '', country: '', name: '', email: '' }, 10_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toEqual({ product: 'product', quantity: 'quantity', country: 'required', name: 'required', email: 'required' });
  });
  it('rejects bad email', () => {
    const r = validateQuote({ ...base, email: 'nope' }, 10_000);
    expect(r.ok === false && r.errors.email).toBe('email');
  });
  it('rejects zero or negative quantity', () => {
    for (const q of ['0', '-5', 'abc']) {
      const r = validateQuote({ ...base, quantity: q }, 10_000);
      expect(r.ok === false && r.errors.quantity).toBe('quantity');
    }
  });
  it('flags honeypot as spam', () => {
    const r = validateQuote({ ...base, botcheck: 'x' }, 10_000);
    expect(r.ok === false && r.spam).toBe(true);
  });
  it('flags submissions faster than 3 s as spam', () => {
    const r = validateQuote({ ...base, startedAt: 9_000 }, 10_000);
    expect(r.ok === false && r.spam).toBe(true);
  });
});

describe('summarizeQuote', () => {
  it('includes the key fields', () => {
    const s = summarizeQuote(base, { product: 'Turmeric', variety: 'Turmeric powder' });
    for (const part of ['Turmeric', 'Turmeric powder', '20', 'Jebel Ali', 'CIF', 'Gulf Foods', 'amal@gulf.ae']) expect(s).toContain(part);
  });
});

describe('submitQuote', () => {
  const labels = { product: 'Turmeric', variety: 'Turmeric powder' };
  it('returns ok on success', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    expect(await submitQuote(f as any, 'key', base, labels)).toBe('ok');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://api.web3forms.com/submit');
    expect(JSON.parse(init.body).access_key).toBe('key');
    expect(JSON.parse(init.body).botcheck).toBeUndefined();
  });
  it('returns error on success:false', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) });
    expect(await submitQuote(f as any, 'key', base, labels)).toBe('error');
  });
  it('returns error on network failure', async () => {
    const f = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await submitQuote(f as any, 'key', base, labels)).toBe('error');
  });
});
```

```ts
// tests/e2e/quote.spec.ts
import { test, expect } from '@playwright/test';

test('prefills product and variety from query', async ({ page }) => {
  await page.goto('/contact?product=turmeric&variety=powder');
  await expect(page.locator('select[name="product"]')).toHaveValue('turmeric');
  await expect(page.locator('select[name="variety"]')).toHaveValue('powder');
});

test('hostile query params are ignored', async ({ page }) => {
  await page.goto('/contact?product=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');
  await expect(page.locator('select[name="product"]')).toHaveValue('');
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test('shows inline errors on empty submit', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.locator('#err-email')).toHaveText('Required');
  await expect(page.locator('#err-product')).toHaveText('Choose a product');
});

async function fill(page: import('@playwright/test').Page) {
  await page.goto('/contact?product=turmeric&variety=powder');
  await page.fill('input[name="quantity"]', '20');
  await page.fill('input[name="country"]', 'UAE');
  await page.fill('input[name="name"]', 'Amal');
  await page.fill('input[name="email"]', 'amal@gulf.ae');
  await page.waitForTimeout(3100);
}

test('double click sends exactly one request and shows success', async ({ page }) => {
  let calls = 0;
  await page.route('https://api.web3forms.com/submit', async (r) => { calls++; await new Promise((res) => setTimeout(res, 500)); await r.fulfill({ json: { success: true } }); });
  await fill(page);
  const btn = page.getByRole('button', { name: 'Send quote request' });
  await btn.dblclick();
  await expect(page.locator('[data-form-state="success"]')).toBeVisible();
  expect(calls).toBe(1);
});

test('service failure shows WhatsApp and email fallbacks', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', (r) => r.fulfill({ status: 500, body: 'err' }));
  await fill(page);
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.locator('[data-form-state="error"]')).toBeVisible();
  await expect(page.locator('[data-fallback="email"]')).toBeVisible();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/quote.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/quote.ts`**

```ts
export type Catalog = { slug: string; varieties: string[] }[];
export type QuoteInput = {
  product: string; variety: string; quantity: string; unit: 'mt' | 'fcl20' | 'fcl40'; country: string; port: string;
  incoterm: 'FOB' | 'CFR' | 'CIF' | 'other'; packing: string; name: string; company: string; email: string;
  whatsapp: string; message: string; botcheck: string; startedAt: number;
};
type ErrorCode = 'required' | 'email' | 'quantity' | 'product';
export type QuoteResult = { ok: true } | { ok: false; errors: Partial<Record<keyof QuoteInput, ErrorCode>>; spam?: boolean };

export function parsePrefill(search: string, catalog: Catalog): { product?: string; variety?: string } {
  const q = new URLSearchParams(search);
  const product = catalog.find((c) => c.slug === q.get('product'));
  if (!product) return {};
  const variety = q.get('variety');
  return variety && product.varieties.includes(variety) ? { product: product.slug, variety } : { product: product.slug };
}

export function validateQuote(input: QuoteInput, now: number): QuoteResult {
  if (input.botcheck || now - input.startedAt < 3000) return { ok: false, errors: {}, spam: true };
  const errors: Partial<Record<keyof QuoteInput, ErrorCode>> = {};
  if (!input.product) errors.product = 'product';
  const qty = Number(input.quantity);
  if (!input.quantity.trim() || !Number.isFinite(qty) || qty <= 0) errors.quantity = 'quantity';
  if (!input.country.trim()) errors.country = 'required';
  if (!input.name.trim()) errors.name = 'required';
  if (!input.email.trim()) errors.email = 'required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) errors.email = 'email';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

export function summarizeQuote(i: QuoteInput, labels: { product: string; variety: string }): string {
  const unit = { mt: 'MT', fcl20: '× 20 ft', fcl40: '× 40 ft' }[i.unit];
  return [
    `Quote request — ${labels.product}${labels.variety ? ` (${labels.variety})` : ''}`,
    `Quantity: ${i.quantity} ${unit}`,
    `Destination: ${i.port ? `${i.port}, ` : ''}${i.country}`,
    `Incoterm: ${i.incoterm}`,
    i.packing && `Packing: ${i.packing}`,
    `Name: ${i.name}${i.company ? `, ${i.company}` : ''}`,
    `Email: ${i.email}`,
    i.whatsapp && `WhatsApp: ${i.whatsapp}`,
    i.message && `Notes: ${i.message}`,
  ].filter(Boolean).join('\n');
}

export async function submitQuote(fetchFn: typeof fetch, accessKey: string, input: QuoteInput, labels: { product: string; variety: string }): Promise<'ok' | 'error'> {
  const { botcheck: _b, startedAt: _s, ...fields } = input;
  try {
    const res = await fetchFn('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Quote request: ${labels.product}${labels.variety ? ` — ${labels.variety}` : ''} (${input.country})`,
        from_name: 'GoodBiz Agri website',
        ...fields,
        product: labels.product,
        variety: labels.variety,
        summary: summarizeQuote(input, labels),
      }),
    });
    if (!res.ok) return 'error';
    const data = (await res.json()) as { success?: boolean };
    return data.success ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}
```

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run tests/unit/quote.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `QuoteForm.astro`**

The form works without JS: it posts to Web3Forms with a `redirect` to `/thanks`. With JS, `quote-form.ts` intercepts submit.

```astro
---
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import type { Locale } from '../i18n/config';
import { getLocalizedProducts, getSite } from '../lib/catalog';
import { whatsappHref, mailtoHref } from '../lib/site';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const site = await getSite();
const products = await getLocalizedProducts(locale);
const catalog = products.map((p) => ({
  slug: p.slug, name: p.text.name,
  varieties: p.data.varieties.map((v) => ({ id: v.id, name: p.text.varieties[v.id]?.name ?? v.id })),
}));
const thanks = new URL(localizePath('/thanks', 'en'), Astro.site).href;
const msgs = {
  required: t('form.err.required'), email: t('form.err.email'), quantity: t('form.err.quantity'), product: t('form.err.product'),
  sending: t('form.sending'), submit: t('form.submit'), any: t('form.anyVariety'),
};
const waBase = whatsappHref(site.whatsapp) ?? '';
const mailBase = mailtoHref(site.email) ?? '';
---
<form class="qf" method="POST" action="https://api.web3forms.com/submit" novalidate
  data-quote-form data-key={site.web3formsKey} data-catalog={JSON.stringify(catalog)} data-msgs={JSON.stringify(msgs)}
  data-wa={waBase} data-mail={mailBase} data-form-state="idle">
  <input type="hidden" name="access_key" value={site.web3formsKey} />
  <input type="hidden" name="redirect" value={thanks} />
  <input type="checkbox" name="botcheck" class="sr-only" tabindex="-1" autocomplete="off" aria-hidden="true" />

  <div class="qf__grid">
    <label>{t('form.product')}
      <select name="product" required aria-describedby="err-product">
        <option value="">{t('form.select')}</option>
        {catalog.map((p) => <option value={p.slug}>{p.name}</option>)}
      </select>
      <span class="qf__err" id="err-product" aria-live="polite"></span>
    </label>
    <label>{t('form.variety')}
      <select name="variety"><option value="">{t('form.anyVariety')}</option></select>
    </label>
    <label>{t('form.quantity')}
      <input name="quantity" type="number" inputmode="decimal" min="0" step="any" required aria-describedby="err-quantity" />
      <span class="qf__err" id="err-quantity" aria-live="polite"></span>
    </label>
    <label>{t('form.unit')}
      <select name="unit">
        <option value="mt">{t('form.unit.mt')}</option>
        <option value="fcl20">{t('form.unit.fcl20')}</option>
        <option value="fcl40">{t('form.unit.fcl40')}</option>
      </select>
    </label>
    <label>{t('form.country')}
      <input name="country" autocomplete="country-name" required aria-describedby="err-country" />
      <span class="qf__err" id="err-country" aria-live="polite"></span>
    </label>
    <label>{t('form.port')}<input name="port" /></label>
    <label>{t('form.incoterm')}
      <select name="incoterm"><option>FOB</option><option>CFR</option><option selected>CIF</option><option value="other">{t('form.incoterm.other')}</option></select>
    </label>
    <label>{t('form.packing')}<input name="packing" /></label>
    <label>{t('form.name')}
      <input name="name" autocomplete="name" required aria-describedby="err-name" />
      <span class="qf__err" id="err-name" aria-live="polite"></span>
    </label>
    <label>{t('form.company')}<input name="company" autocomplete="organization" /></label>
    <label>{t('form.email')}
      <input name="email" type="email" autocomplete="email" required aria-describedby="err-email" />
      <span class="qf__err" id="err-email" aria-live="polite"></span>
    </label>
    <label>{t('form.whatsapp')}<input name="whatsapp" type="tel" autocomplete="tel" /></label>
    <label class="qf__wide">{t('form.message')}<textarea name="message" rows="4"></textarea></label>
  </div>

  <button class="btn btn--primary" type="submit">{t('form.submit')}</button>

  <div class="qf__status qf__status--success" role="status" data-show="success">
    <h3>{t('form.success.title')}</h3><p>{t('form.success.body')}</p>
  </div>
  <div class="qf__status qf__status--error" role="alert" data-show="error">
    <h3>{t('form.error.title')}</h3><p>{t('form.error.body')}</p>
    <div class="qf__fallbacks">
      {waBase && <a class="btn btn--primary" data-fallback="whatsapp" href={waBase} target="_blank" rel="noopener">{t('form.error.whatsapp')}</a>}
      <a class="btn btn--ghost" data-fallback="email" href={mailBase || '#'}>{t('form.error.email')}</a>
    </div>
  </div>
</form>
<script>import '../scripts/quote-form';</script>
<style>
  .qf { display: grid; gap: var(--space-6); }
  .qf__grid { display: grid; gap: var(--space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
  label { display: grid; gap: var(--space-2); font-size: var(--step--1); font-weight: 500; }
  input, select, textarea { font: inherit; font-size: 16px; min-block-size: 48px; padding: var(--space-2) var(--space-3); border: 1px solid var(--hairline); border-radius: var(--radius-input); background: var(--surface); color: var(--ink); }
  input:focus, select:focus, textarea:focus { outline: 2px solid var(--turmeric); outline-offset: 1px; }
  [aria-invalid='true'] { border-color: var(--error); }
  .qf__wide { grid-column: 1 / -1; }
  .qf__err { color: var(--error); font-weight: 400; min-block-size: 1.2em; }
  .qf__status { display: none; gap: var(--space-3); padding: var(--space-5); border-radius: var(--radius-card); }
  .qf[data-form-state='success'] .qf__status--success { display: grid; background: #E6EFE3; }
  .qf[data-form-state='error'] .qf__status--error { display: grid; background: #F6E3D9; }
  .qf__fallbacks { display: flex; flex-wrap: wrap; gap: var(--space-3); }
  .qf[data-form-state='success'] .qf__grid, .qf[data-form-state='success'] > button { display: none; }
</style>
```

- [ ] **Step 6: Implement `src/scripts/quote-form.ts`**

```ts
import { parsePrefill, validateQuote, submitQuote, summarizeQuote, type QuoteInput } from '../lib/quote';

type CatalogItem = { slug: string; name: string; varieties: { id: string; name: string }[] };

for (const form of document.querySelectorAll<HTMLFormElement>('[data-quote-form]')) {
  const catalog: CatalogItem[] = JSON.parse(form.dataset.catalog!);
  const msgs: Record<string, string> = JSON.parse(form.dataset.msgs!);
  const product = form.elements.namedItem('product') as HTMLSelectElement;
  const variety = form.elements.namedItem('variety') as HTMLSelectElement;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const startedAt = Date.now();
  let busy = false;

  const fillVarieties = (slug: string) => {
    variety.replaceChildren(new Option(msgs.any, ''));
    for (const v of catalog.find((c) => c.slug === slug)?.varieties ?? []) variety.add(new Option(v.name, v.id));
  };
  product.addEventListener('change', () => fillVarieties(product.value));

  const pre = parsePrefill(location.search, catalog.map((c) => ({ slug: c.slug, varieties: c.varieties.map((v) => v.id) })));
  if (pre.product) { product.value = pre.product; fillVarieties(pre.product); }
  if (pre.variety) variety.value = pre.variety;

  const read = (): QuoteInput => {
    const fd = new FormData(form);
    const s = (k: string) => String(fd.get(k) ?? '');
    return {
      product: s('product'), variety: s('variety'), quantity: s('quantity'), unit: s('unit') as QuoteInput['unit'],
      country: s('country'), port: s('port'), incoterm: s('incoterm') as QuoteInput['incoterm'], packing: s('packing'),
      name: s('name'), company: s('company'), email: s('email'), whatsapp: s('whatsapp'), message: s('message'),
      botcheck: fd.get('botcheck') ? 'on' : '', startedAt,
    };
  };

  const labelsFor = (i: QuoteInput) => {
    const p = catalog.find((c) => c.slug === i.product);
    return { product: p?.name ?? i.product, variety: p?.varieties.find((v) => v.id === i.variety)?.name ?? '' };
  };

  const showErrors = (errors: Partial<Record<string, string>>) => {
    form.querySelectorAll<HTMLElement>('.qf__err').forEach((el) => { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    let first: HTMLElement | null = null;
    for (const [field, code] of Object.entries(errors)) {
      const err = form.querySelector<HTMLElement>(`#err-${field}`);
      const input = form.elements.namedItem(field) as HTMLElement | null;
      if (err) err.textContent = msgs[code!];
      input?.setAttribute('aria-invalid', 'true');
      first ??= input;
    }
    first?.focus();
  };

  form.addEventListener('input', (e) => {
    const el = e.target as HTMLElement;
    if (el.getAttribute('aria-invalid')) {
      el.removeAttribute('aria-invalid');
      const err = form.querySelector(`#err-${(el as HTMLInputElement).name}`);
      if (err) err.textContent = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const input = read();
    const result = validateQuote(input, Date.now());
    if (!result.ok) {
      if (result.spam) { form.dataset.formState = 'success'; return; } // silently drop bots
      showErrors(result.errors);
      return;
    }
    busy = true;
    button.textContent = msgs.sending;
    button.setAttribute('aria-busy', 'true');
    const labels = labelsFor(input);
    const status = await submitQuote(fetch, form.dataset.key!, input, labels);
    busy = false;
    button.textContent = msgs.submit;
    button.removeAttribute('aria-busy');
    if (status === 'ok') { form.dataset.formState = 'success'; return; }
    const text = summarizeQuote(input, labels);
    const wa = form.querySelector<HTMLAnchorElement>('[data-fallback="whatsapp"]');
    if (wa && form.dataset.wa) wa.href = `${form.dataset.wa}?text=${encodeURIComponent(text)}`;
    const mail = form.querySelector<HTMLAnchorElement>('[data-fallback="email"]');
    if (mail && form.dataset.mail) mail.href = `${form.dataset.mail}?subject=${encodeURIComponent(`Quote request: ${labels.product}`)}&body=${encodeURIComponent(text)}`;
    form.dataset.formState = 'error';
  });
}
```

Note on e2e "double click": the first click sets `busy = true` synchronously before `await`, so the second submit returns early. Bots skip the 3 s minimum; the e2e helper waits 3.1 s.

- [ ] **Step 7: Implement `ContactView`, routes and `/thanks`**

```astro
---
// src/views/ContactView.astro
import Base from '../layouts/Base.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import QuoteForm from '../components/QuoteForm.astro';
import { createT } from '../i18n/t';
import { getSite } from '../lib/catalog';
import { whatsappHref, mailtoHref, isPlaceholder } from '../lib/site';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const site = await getSite();
const wa = whatsappHref(site.whatsapp);
const mail = mailtoHref(site.email);
---
<Base locale={locale} title={t('meta.contactTitle')} description={t('meta.contactDescription')} path="/contact" ogImage="/og/contact.png">
  <div class="container cv">
    <Breadcrumbs locale={locale} items={[{ name: t('nav.home'), path: '/' }, { name: t('nav.contact'), path: '/contact' }]} />
    <div class="cv__grid">
      <div class="cv__form">
        <p class="eyebrow">{t('contact.eyebrow')}</p>
        <h1>{t('contact.title')}</h1>
        <p>{t('contact.lede')}</p>
        <QuoteForm locale={locale} />
      </div>
      <aside class="cv__aside">
        <h2>{t('contact.direct')}</h2>
        {wa && <a class="btn btn--primary" href={wa} target="_blank" rel="noopener">{t('cta.whatsapp')}</a>}
        {mail && <a href={mail}>{site.email}</a>}
        {!isPlaceholder(site.phone) && <a href={`tel:${site.phone.replace(/\s/g, '')}`} dir="ltr">{site.phone}</a>}
        <h3>{t('contact.office')}</h3>
        <address>{site.address.street}<br />{site.address.city}, {site.address.region} {site.address.postalCode}<br />India</address>
      </aside>
    </div>
  </div>
</Base>
<style>
  .cv { padding-block: 7.5rem var(--space-8); display: grid; gap: var(--space-6); }
  .cv__grid { display: grid; gap: var(--space-8); grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
  .cv__form { display: grid; gap: var(--space-5); }
  .cv__aside { display: grid; gap: var(--space-4); align-content: start; border-inline-start: 1px solid var(--rule); padding-inline-start: var(--space-6); }
  address { font-style: normal; }
  @media (max-width: 860px) { .cv__grid { grid-template-columns: 1fr; } .cv__aside { border: 0; padding: 0; } }
</style>
```

```astro
---
// src/pages/contact.astro
import ContactView from '../views/ContactView.astro';
---
<ContactView locale="en" />
```

```astro
---
// src/pages/[lang]/contact.astro
import ContactView from '../../views/ContactView.astro';
import { localeStaticPaths } from '../../lib/routes';
import type { Locale } from '../../i18n/config';
export const getStaticPaths = localeStaticPaths;
---
<ContactView locale={Astro.params.lang as Locale} />
```

```astro
---
// src/pages/thanks.astro — no-JS form redirect target (noindex)
import Base from '../layouts/Base.astro';
import { createT } from '../i18n/t';
const t = createT('en');
---
<Base locale="en" title={t('form.success.title')} description={t('form.success.body')} path="/thanks" available={['en']} noindex>
  <div class="container" style="padding-block: 10rem var(--space-8); display: grid; gap: var(--space-4);">
    <h1>{t('form.success.title')}</h1><p>{t('form.success.body')}</p>
    <a class="btn btn--primary" href="/products">{t('cta.viewProducts')}</a>
  </div>
</Base>
```

Add `/thanks` to the sitemap filter in `astro.config.mjs`: `filter: (page) => !page.includes('/og/') && !page.includes('/spec-sheets/') && !page.endsWith('/thanks/')`.

- [ ] **Step 8: Run tests**

Run: `npx vitest run && npm run test:e2e -- --project=desktop tests/e2e/quote.spec.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: quote form with validation, spam checks, prefill and fallbacks"
```

---

### Task 14: Blog, seed posts and RSS

**Files:**
- Create: `src/lib/blog.ts`, `src/views/BlogIndexView.astro`, `src/views/BlogPostView.astro`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/[lang]/blog/index.astro`, `src/pages/[lang]/blog/[slug].astro`, `src/pages/rss.xml.ts`, `src/pages/[lang]/rss.xml.ts`, `src/content/blog/en/turmeric-hsn-codes-explained.mdx`, `src/content/blog/en/arecanut-grades-chali-vs-kempu.mdx`, `src/content/blog/en/market-report-2026-10.mdx`
- Test: `tests/unit/blog.test.ts`, `tests/e2e/blog.spec.ts`

**Interfaces:**
- Consumes: `blogSchema`, catalog, `articleLd`, `breadcrumbLd`.
- Produces:
  - `readingTime(text: string): number` (words / 220, min 1, rounded up; CJK counts characters / 400).
  - `postSlug(id: string): string` (`"en/foo"` → `"foo"`); `postLocale(id: string): string` (`"en/foo"` → `"en"`).
  - `postsFor(locale: Locale): Promise<{ entry; slug; locale; fallback: boolean }[]>` — posts in that locale, plus English posts with no translation in it (marked `fallback: true`), newest first.
  - `postAvailability(slug: string): Promise<Locale[]>` — locales that have this post (for hreflang).
  - `/[lang]/blog/[slug]` exists only where the post exists in that locale.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/blog.test.ts
import { describe, it, expect } from 'vitest';
import { readingTime, postSlug, postLocale } from '../../src/lib/blog-pure';

describe('blog helpers', () => {
  it('reading time for 440 words is 2', () => expect(readingTime(Array(440).fill('word').join(' '))).toBe(2));
  it('minimum 1 minute', () => expect(readingTime('short')).toBe(1));
  it('counts CJK by characters', () => expect(readingTime('字'.repeat(800))).toBe(2));
  it('splits ids', () => { expect(postSlug('fr/foo-bar')).toBe('foo-bar'); expect(postLocale('fr/foo-bar')).toBe('fr'); });
});
```

```ts
// tests/e2e/blog.spec.ts
import { test, expect } from '@playwright/test';

test('blog index lists 3 posts', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.locator('[data-post]')).toHaveCount(3);
});

test('category filter narrows the list', async ({ page }) => {
  await page.goto('/blog');
  await page.getByRole('button', { name: 'Market updates' }).click();
  await expect(page.locator('[data-post]:visible')).toHaveCount(1);
});

test('post has Article JSON-LD and related product link', async ({ page }) => {
  await page.goto('/blog/turmeric-hsn-codes-explained');
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent!)['@type']));
  expect(types).toContain('Article');
  await expect(page.locator('a[href="/products/turmeric"]').first()).toBeVisible();
});

test('english posts appear on the french index marked In English', async ({ page }) => {
  await page.goto('/fr/blog');
  await expect(page.locator('[data-post] [data-fallback]').first()).toBeVisible();
});

test('rss feed is valid xml with items', async ({ request }) => {
  const res = await request.get('/rss.xml');
  expect(res.ok()).toBe(true);
  expect(await res.text()).toContain('<item>');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/blog.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/blog-pure.ts` and `src/lib/blog.ts`**

```ts
// src/lib/blog-pure.ts
export function readingTime(text: string): number {
  const cjk = (text.match(/[㐀-鿿]/g) ?? []).length;
  const words = text.replace(/[㐀-鿿]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220 + cjk / 400));
}
export const postSlug = (id: string) => id.split('/').slice(1).join('/');
export const postLocale = (id: string) => id.split('/')[0];
```

```ts
// src/lib/blog.ts
import { getCollection, type CollectionEntry } from 'astro:content';
import { locales, type Locale } from '../i18n/config';
import { postSlug, postLocale } from './blog-pure';

export type PostRef = { entry: CollectionEntry<'blog'>; slug: string; locale: string; fallback: boolean };

export async function postsFor(locale: Locale): Promise<PostRef[]> {
  const all = await getCollection('blog');
  const local = all.filter((p) => postLocale(p.id) === locale);
  const localSlugs = new Set(local.map((p) => p.data.translationOf ?? postSlug(p.id)));
  const english = locale === 'en' ? [] : all.filter((p) => postLocale(p.id) === 'en' && !localSlugs.has(postSlug(p.id)));
  return [
    ...local.map((entry) => ({ entry, slug: postSlug(entry.id), locale, fallback: false })),
    ...english.map((entry) => ({ entry, slug: postSlug(entry.id), locale: 'en', fallback: true })),
  ].sort((a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime());
}

export async function postAvailability(slug: string): Promise<Locale[]> {
  const all = await getCollection('blog');
  return locales.filter((l) => all.some((p) => postLocale(p.id) === l && postSlug(p.id) === slug));
}
```

Translated posts keep the same file name as the English original (`src/content/blog/fr/turmeric-hsn-codes-explained.mdx`), so the slug matches across locales.

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run tests/unit/blog.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the three seed posts**

`src/content/blog/en/turmeric-hsn-codes-explained.mdx`
```mdx
---
title: "HSN codes for Indian turmeric, explained"
description: "Fresh, dried and powdered turmeric each have their own HSN line. Here is which one to use, and why it matters at customs."
date: 2026-10-10
author: GoodBiz Agri
category: buyer-guides
products: [turmeric]
---

Turmeric is classified under HSN heading **0910 30**, and India's tariff schedule splits it into three 8-digit lines:

| HSN | Product |
|---|---|
| 0910 30 10 | Fresh turmeric |
| 0910 30 20 | Dried turmeric, whole (fingers and bulbs) |
| 0910 30 30 | Turmeric powder (crushed or ground) |

## Why the right line matters

Your importer's customs declaration has to match the code on our commercial invoice and phytosanitary certificate. A mismatch can delay clearance or change the duty rate.

## Which one should you buy?

- **Fresh turmeric (0910 30 10)** suits buyers who process it locally. It ships by reefer and keeps three to four weeks.
- **Dried fingers (0910 30 20)** are the most traded form. Erode fingers test about 2.5–3.5% curcumin; Alleppey finger reaches 4.5–5%.
- **Powder (0910 30 30)** is milled to order, so we can match curcumin level and mesh size to your specification.

See varieties and specifications on our [turmeric page](/products/turmeric), or [request a quote](/contact?product=turmeric).
```

`src/content/blog/en/arecanut-grades-chali-vs-kempu.mdx`
```mdx
---
title: "Arecanut grades: chali vs kempu"
description: "How sun-dried white chali differs from boiled red kempu, where each comes from in Karnataka, and how to specify them."
date: 2026-10-05
author: GoodBiz Agri
category: product-knowledge
products: [arecanut]
---

Karnataka grows most of India's arecanut, and two processing traditions produce very different products.

## Chali (white)

Harvested ripe in coastal Dakshina Kannada and Kasaragod, the nuts are sun-dried in their husk for six to eight weeks, then de-husked. The kernel is white and hard. Chali is traded through Puttur's cooperative market.

## Kempu (red)

In Shivamogga's Malnad region, tender nuts are de-husked, boiled and dried. The result is red-brown, softer, and graded into **api**, **bette** and other categories by size and colour.

## How to specify

State the type (chali or kempu), grade, moisture (we supply ≤ 7–8%) and packing. See our [arecanut page](/products/arecanut) for current specifications.
```

`src/content/blog/en/market-report-2026-10.mdx`
```mdx
---
title: "South India market report — October 2026"
description: "Arrivals and price direction for turmeric, arecanut, copra, ginger and rice in South India's main trading markets this month."
date: 2026-10-14
author: GoodBiz Agri
category: market-updates
products: [turmeric, arecanut, coconut-copra, ginger, rice]
---

*This is the template for our monthly report. Replace the notes below with the month's observations before publishing.*

## Turmeric — Erode
Arrivals and price direction for Erode and Salem fingers and bulbs.

## Arecanut — Shivamogga and Puttur
New-crop expectations for chali and kempu grades.

## Copra — Tiptur
Ball copra arrivals and quality.

## Ginger — Wayanad
Planting status and dried-ginger stock levels in Kochi.

## Rice — Raichur and the Godavari delta
Kharif harvest progress and milling.

[Request a quote](/contact) for current offers.
```

Before launch, the owner either fills in the market report or removes it (the content report lists posts containing "Replace the notes").

- [ ] **Step 6: Implement `BlogIndexView` and `BlogPostView`**

```astro
---
// src/views/BlogIndexView.astro
import Base from '../layouts/Base.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import { createT, type UiKey } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import { htmlLang, type Locale } from '../i18n/config';
import { postsFor } from '../lib/blog';
import { readingTime } from '../lib/blog-pure';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const posts = await postsFor(locale);
const cats = ['market-updates', 'buyer-guides', 'product-knowledge', 'export-process'] as const;
const date = new Intl.DateTimeFormat(htmlLang[locale], { dateStyle: 'medium', timeZone: 'UTC' });
---
<Base locale={locale} title={t('meta.blogTitle')} description={t('meta.blogDescription')} path="/blog" ogImage="/og/blog.png">
  <div class="container bi">
    <Breadcrumbs locale={locale} items={[{ name: t('nav.home'), path: '/' }, { name: t('nav.blog'), path: '/blog' }]} />
    <header><p class="eyebrow">{t('blog.eyebrow')}</p><h1>{t('blog.title')}</h1></header>
    <div class="bi__filters" role="group" aria-label={t('blog.title')}>
      <button type="button" data-cat="" aria-pressed="true">{t('blog.all')}</button>
      {cats.map((c) => <button type="button" data-cat={c} aria-pressed="false">{t(`blog.cat.${c}` as UiKey)}</button>)}
    </div>
    <ul class="bi__list">
      {posts.map((p) => (
        <li data-post data-category={p.entry.data.category}>
          <a href={localizePath(`/blog/${p.slug}`, p.fallback ? 'en' : locale)}>
            <p class="bi__meta"><span>{t(`blog.cat.${p.entry.data.category}` as UiKey)}</span> · <time datetime={p.entry.data.date.toISOString()}>{date.format(p.entry.data.date)}</time> · {t('blog.readingTime', { n: readingTime(p.entry.body ?? '') })}{p.fallback && <> · <span data-fallback>{t('blog.inEnglish')}</span></>}</p>
            <h2 lang={p.fallback ? 'en' : undefined}>{p.entry.data.title}</h2>
            <p lang={p.fallback ? 'en' : undefined}>{p.entry.data.description}</p>
          </a>
        </li>
      ))}
    </ul>
  </div>
</Base>
<script>
  const buttons = document.querySelectorAll<HTMLButtonElement>('.bi__filters button');
  buttons.forEach((b) => b.addEventListener('click', () => {
    buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.querySelectorAll<HTMLElement>('[data-post]').forEach((li) => { li.hidden = !!b.dataset.cat && li.dataset.category !== b.dataset.cat; });
  }));
</script>
<style>
  .bi { padding-block: 7.5rem var(--space-8); display: grid; gap: var(--space-6); }
  .bi__filters { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .bi__filters button { min-block-size: 44px; padding-inline: var(--space-4); border: 1px solid var(--rule); background: transparent; border-radius: 999px; font: inherit; font-size: var(--step--1); cursor: pointer; }
  .bi__filters button[aria-pressed='true'] { background: var(--forest); color: var(--paper); }
  .bi__list { list-style: none; padding: 0; margin: 0; display: grid; }
  .bi__list li { border-block-start: 1px solid var(--rule); }
  .bi__list a { display: grid; gap: var(--space-2); padding-block: var(--space-6); text-decoration: none; }
  .bi__list h2 { font-size: var(--step-2); }
  .bi__meta { font-size: var(--step--1); color: var(--ink-2); }
</style>
```

```astro
---
// src/views/BlogPostView.astro
import { render, type CollectionEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import ProductCard from '../components/ProductCard.astro';
import { createT, type UiKey } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import { htmlLang, type Locale } from '../i18n/config';
import { getLocalizedProducts } from '../lib/catalog';
import { postAvailability } from '../lib/blog';
import { readingTime } from '../lib/blog-pure';
import { articleLd, breadcrumbLd } from '../lib/jsonld';
interface Props { locale: Locale; slug: string; entry: CollectionEntry<'blog'> }
const { locale, slug, entry } = Astro.props;
const t = createT(locale);
const { Content } = await render(entry);
const available = await postAvailability(slug);
const products = (await getLocalizedProducts(locale)).filter((p) => entry.data.products.includes(p.slug));
const path = `/blog/${slug}`;
const abs = (x: string) => new URL(localizePath(x, locale), Astro.site).href;
const crumbs = [{ name: t('nav.home'), path: '/' }, { name: t('nav.blog'), path: '/blog' }, { name: entry.data.title, path }];
const date = new Intl.DateTimeFormat(htmlLang[locale], { dateStyle: 'long', timeZone: 'UTC' });
---
<Base locale={locale} title={entry.data.title} description={entry.data.description} path={path} available={available} ogImage={`/og/blog/${slug}.png`}
  jsonLd={[
    articleLd({ title: entry.data.title, description: entry.data.description, url: abs(path), image: new URL(`/og/blog/${slug}.png`, Astro.site).href, date: entry.data.date, author: entry.data.author, locale: htmlLang[locale] }),
    breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: abs(c.path) }))),
  ]}>
  <article class="container bp">
    <Breadcrumbs locale={locale} items={crumbs} />
    <header>
      <p class="eyebrow">{t(`blog.cat.${entry.data.category}` as UiKey)}</p>
      <h1>{entry.data.title}</h1>
      <p class="bp__meta">{t('blog.by', { author: entry.data.author })} · <time datetime={entry.data.date.toISOString()}>{date.format(entry.data.date)}</time> · {t('blog.readingTime', { n: readingTime(entry.body ?? '') })}</p>
    </header>
    <div class="bp__body"><Content /></div>
    {products.length > 0 && (
      <section>
        <h2>{t('product.related')}</h2>
        <div class="bp__related">{products.map((p) => <ProductCard locale={locale} product={p} />)}</div>
      </section>
    )}
    <a class="btn btn--primary" href={localizePath('/contact', locale)}>{t('cta.quote')}</a>
  </article>
</Base>
<style>
  .bp { padding-block: 7.5rem var(--space-8); display: grid; gap: var(--space-7); max-inline-size: 52rem; }
  .bp header { display: grid; gap: var(--space-4); }
  .bp__meta { font-size: var(--step--1); color: var(--ink-2); }
  .bp__body { display: grid; gap: var(--space-4); font-size: var(--step-0); }
  .bp__body :global(h2) { font-size: var(--step-2); margin-block-start: var(--space-5); }
  .bp__body :global(table) { border-collapse: collapse; inline-size: 100%; font-size: var(--step--1); }
  .bp__body :global(th), .bp__body :global(td) { text-align: start; padding: var(--space-2); border-block-end: 1px solid var(--rule); }
  .bp__body :global(td:first-child) { font-family: var(--font-mono); white-space: nowrap; }
  .bp__related { display: grid; gap: var(--space-5); grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); margin-block-start: var(--space-5); }
</style>
```

MDX links like `/products/turmeric` point to English pages; translated posts write localized links (`/fr/products/turmeric`) in their own MDX.

- [ ] **Step 7: Route files and RSS**

```astro
---
// src/pages/blog/index.astro
import BlogIndexView from '../../views/BlogIndexView.astro';
---
<BlogIndexView locale="en" />
```

```astro
---
// src/pages/blog/[slug].astro
import { getCollection } from 'astro:content';
import BlogPostView from '../../views/BlogPostView.astro';
import { postSlug, postLocale } from '../../lib/blog-pure';
export async function getStaticPaths() {
  return (await getCollection('blog')).filter((p) => postLocale(p.id) === 'en').map((entry) => ({ params: { slug: postSlug(entry.id) }, props: { entry } }));
}
---
<BlogPostView locale="en" slug={Astro.params.slug!} entry={Astro.props.entry} />
```

```astro
---
// src/pages/[lang]/blog/index.astro
import BlogIndexView from '../../../views/BlogIndexView.astro';
import { localeStaticPaths } from '../../../lib/routes';
import type { Locale } from '../../../i18n/config';
export const getStaticPaths = localeStaticPaths;
---
<BlogIndexView locale={Astro.params.lang as Locale} />
```

```astro
---
// src/pages/[lang]/blog/[slug].astro
import { getCollection } from 'astro:content';
import BlogPostView from '../../../views/BlogPostView.astro';
import { postSlug, postLocale } from '../../../lib/blog-pure';
import { isLocale, type Locale } from '../../../i18n/config';
export async function getStaticPaths() {
  return (await getCollection('blog'))
    .filter((p) => postLocale(p.id) !== 'en' && isLocale(postLocale(p.id)))
    .map((entry) => ({ params: { lang: postLocale(entry.id), slug: postSlug(entry.id) }, props: { entry } }));
}
---
<BlogPostView locale={Astro.params.lang as Locale} slug={Astro.params.slug!} entry={Astro.props.entry} />
```

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { postsFor } from '../lib/blog';
import { createT } from '../i18n/t';
import { localizePath } from '../i18n/paths';
import type { Locale } from '../i18n/config';

export async function feed(locale: Locale, context: APIContext) {
  const t = createT(locale);
  const posts = (await postsFor(locale)).filter((p) => !p.fallback);
  return rss({
    title: `GoodBiz Agri — ${t('meta.blogTitle')}`,
    description: t('meta.blogDescription'),
    site: context.site!,
    items: posts.map((p) => ({ title: p.entry.data.title, description: p.entry.data.description, pubDate: p.entry.data.date, link: localizePath(`/blog/${p.slug}`, locale) })),
    customData: `<language>${locale}</language>`,
  });
}

export const GET = (context: APIContext) => feed('en', context);
```

```ts
// src/pages/[lang]/rss.xml.ts
import type { APIContext } from 'astro';
import { feed } from '../rss.xml';
import { localeStaticPaths } from '../../lib/routes';
import type { Locale } from '../../i18n/config';
export const getStaticPaths = localeStaticPaths;
export const GET = (context: APIContext) => feed(context.params.lang as Locale, context);
```

A locale feed with no native posts yet is valid RSS with zero items; the e2e test only checks the English feed.

- [ ] **Step 8: Run tests**

Run: `npx vitest run && npm run test:e2e -- --project=desktop tests/e2e/blog.spec.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: blog with categories, seed posts, Article schema and RSS"
```

---

### Task 15: About page

**Files:**
- Create: `src/views/AboutView.astro`, `src/pages/about.astro`, `src/pages/[lang]/about.astro`
- Modify: `src/i18n/ui/en.json` (add quality step keys)
- Test: `tests/e2e/about.spec.ts`

**Interfaces:**
- Consumes: `SouthIndiaMap`, `CertStrip`, `Breadcrumbs`, catalog.
- Produces: `/about` and `/[lang]/about`.

- [ ] **Step 1: Add keys to `en.json`**

```json
  "about.quality.s1": "Lot inspection at the market: appearance, moisture and foreign matter.",
  "about.quality.s2": "Cleaning, grading and colour sorting at partner units.",
  "about.quality.s3": "Laboratory testing for moisture, aflatoxin and pesticide residues against your market's limits.",
  "about.quality.s4": "Pre-shipment sample approval and optional third-party inspection.",
  "about.quality.s5": "Fumigation, phytosanitary certification and supervised container stuffing."
```

- [ ] **Step 2: Write failing test**

```ts
// tests/e2e/about.spec.ts
import { test, expect } from '@playwright/test';
test('about page shows story, network map and quality steps', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('svg[role="img"]')).toBeVisible();
  await expect(page.locator('[data-quality-step]')).toHaveCount(5);
});
```

- [ ] **Step 3: Implement `AboutView.astro` and routes**

```astro
---
import Base from '../layouts/Base.astro';
import Breadcrumbs from '../components/Breadcrumbs.astro';
import CertStrip from '../components/CertStrip.astro';
import SouthIndiaMap from '../components/SouthIndiaMap.astro';
import { createT, type UiKey } from '../i18n/t';
import { getLocalizedProducts } from '../lib/catalog';
import type { Locale } from '../i18n/config';
interface Props { locale: Locale }
const { locale } = Astro.props;
const t = createT(locale);
const products = await getLocalizedProducts(locale);
const allRegions = [...new Set(products.flatMap((p) => p.data.regions))];
---
<Base locale={locale} title={t('meta.aboutTitle')} description={t('meta.aboutDescription')} path="/about" ogImage="/og/about.png">
  <div class="container av">
    <Breadcrumbs locale={locale} items={[{ name: t('nav.home'), path: '/' }, { name: t('nav.about'), path: '/about' }]} />
    <header class="av__head">
      <p class="eyebrow">{t('about.eyebrow')}</p>
      <h1>{t('about.title')}</h1>
      <p class="av__lede">{t('about.lede')}</p>
    </header>
    <section class="av__two">
      <div data-reveal><h2>{t('about.story.title')}</h2><p>{t('about.story.body')}</p></div>
      <div><h2>{t('about.network.title')}</h2><SouthIndiaMap active={allRegions} label={t('about.network.title')} /></div>
    </section>
    <section>
      <h2>{t('about.quality.title')}</h2>
      <ol class="av__steps">
        {[1, 2, 3, 4, 5].map((n) => <li data-quality-step data-reveal><span dir="ltr">0{n}</span><p>{t(`about.quality.s${n}` as UiKey)}</p></li>)}
      </ol>
    </section>
  </div>
  <CertStrip locale={locale} />
</Base>
<style>
  .av { padding-block: 7.5rem var(--space-8); display: grid; gap: var(--space-8); }
  .av__head { display: grid; gap: var(--space-4); }
  .av__lede { font-size: var(--step-1); line-height: 1.45; }
  .av__two { display: grid; gap: var(--space-7); grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr)); align-items: start; }
  .av__two > div { display: grid; gap: var(--space-4); }
  .av__steps { list-style: none; margin: var(--space-6) 0 0; padding: 0; display: grid; gap: var(--space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr)); }
  .av__steps li { border-block-start: 1px solid var(--ink); padding-block-start: var(--space-3); display: grid; gap: var(--space-2); }
  .av__steps span { font-family: var(--font-mono); color: var(--clay); }
</style>
```

```astro
---
// src/pages/about.astro
import AboutView from '../views/AboutView.astro';
---
<AboutView locale="en" />
```

```astro
---
// src/pages/[lang]/about.astro
import AboutView from '../../views/AboutView.astro';
import { localeStaticPaths } from '../../lib/routes';
import type { Locale } from '../../i18n/config';
export const getStaticPaths = localeStaticPaths;
---
<AboutView locale={Astro.params.lang as Locale} />
```

- [ ] **Step 4: Run test**

Run: `npm run test:e2e -- --project=desktop tests/e2e/about.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: about page with sourcing network and quality process"
```

---

### Task 16: Language switcher (104 languages) and suggestion banner

**Files:**
- Create: `src/lib/lang-switch.ts`, `src/scripts/lang-switcher.ts`
- Modify: `src/components/LanguageSwitcher.astro`, `src/components/LanguageSuggestBanner.astro` (replace stubs)
- Test: `tests/unit/lang-switch.test.ts`, `tests/e2e/lang.spec.ts`

**Interfaces:**
- Consumes: `allLanguages`, `nativeName`, `gtToCore`, `localizePath`, `stripLocale`, `locales`, `pillCode`.
- Produces:
  - `resolveTarget(gtCode: string, pathname: string, available: readonly Locale[]): { type: 'core'; href: string } | { type: 'machine'; gtCode: string }` — core only if the language maps to a core locale that is in `available`.
  - `suggestLocale(navLangs: readonly string[], current: Locale, available: readonly Locale[]): Locale | null` — first browser language whose primary subtag (`zh-*` → `zh`, `pt-BR` → `pt`) is a core locale in `available` and differs from `current`; null if the first matching language is the current one.
  - `safeStorage: { get(key: string): string | null; set(key: string, value: string): void }` — never throws.
  - `machineFallbackUrl(gtCode: string, pageUrl: string): string` → `https://translate.google.com/translate?sl=auto&tl=<code>&u=<encoded url>`.
  - `googTransCookie(gtCode: string): string` → `googtrans=/en/<code>; path=/; SameSite=Lax`.
  - Storage keys: `gb.lang` (last explicit choice), `gb.suggest.dismissed` (`'1'`).

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/lang-switch.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveTarget, suggestLocale, safeStorage, machineFallbackUrl, googTransCookie } from '../../src/lib/lang-switch';
import { locales } from '../../src/i18n/config';

describe('resolveTarget', () => {
  it('core language navigates to localized path', () =>
    expect(resolveTarget('fr', '/products/turmeric', locales)).toEqual({ type: 'core', href: '/fr/products/turmeric' }));
  it('switching from a localized page keeps the path', () =>
    expect(resolveTarget('de', '/ar/hsn/1701', locales)).toEqual({ type: 'core', href: '/de/hsn/1701' }));
  it('zh-CN maps to core zh', () => expect(resolveTarget('zh-CN', '/', locales)).toEqual({ type: 'core', href: '/zh/' }));
  it('English goes to unprefixed path', () => expect(resolveTarget('en', '/fr/about', locales)).toEqual({ type: 'core', href: '/about' }));
  it('non-core language uses machine translation', () => expect(resolveTarget('tr', '/about', locales)).toEqual({ type: 'machine', gtCode: 'tr' }));
  it('core language without that page version uses machine translation', () =>
    expect(resolveTarget('fr', '/blog/x', ['en'])).toEqual({ type: 'machine', gtCode: 'fr' }));
});

describe('suggestLocale', () => {
  it('suggests a matching core locale', () => expect(suggestLocale(['fr-FR', 'en'], 'en', locales)).toBe('fr'));
  it('maps zh-Hans-CN to zh', () => expect(suggestLocale(['zh-Hans-CN'], 'en', locales)).toBe('zh'));
  it('maps pt-BR to pt', () => expect(suggestLocale(['pt-BR'], 'en', locales)).toBe('pt'));
  it('returns null when browser language is the current one', () => expect(suggestLocale(['en-US', 'fr'], 'en', locales)).toBeNull());
  it('returns null for non-core languages', () => expect(suggestLocale(['tr-TR'], 'en', locales)).toBeNull());
  it('returns null when the page lacks that locale', () => expect(suggestLocale(['fr'], 'en', ['en'])).toBeNull());
});

describe('safeStorage', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('returns null and swallows errors when storage throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(safeStorage.get('x')).toBeNull();
    expect(() => safeStorage.set('x', '1')).not.toThrow();
  });
  it('returns null when storage is undefined', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(safeStorage.get('x')).toBeNull();
  });
});

describe('machine translation helpers', () => {
  it('builds fallback url', () =>
    expect(machineFallbackUrl('tr', 'https://goodbizagri.com/about')).toBe('https://translate.google.com/translate?sl=auto&tl=tr&u=https%3A%2F%2Fgoodbizagri.com%2Fabout'));
  it('builds googtrans cookie', () => expect(googTransCookie('tr')).toBe('googtrans=/en/tr; path=/; SameSite=Lax'));
});
```

```ts
// tests/e2e/lang.spec.ts
import { test, expect } from '@playwright/test';

test('switcher lists 104 languages and filters by search', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-lang-open]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-lang-option]')).toHaveCount(104);
  await dialog.getByRole('searchbox').fill('fran');
  await expect(dialog.locator('[data-lang-option]:visible')).toHaveCount(1);
});

test('choosing a core language navigates to the localized page', async ({ page }) => {
  await page.goto('/products/turmeric');
  await page.locator('[data-lang-open]').click();
  await page.locator('[data-lang-option][data-code="es"]').click();
  await expect(page).toHaveURL(/\/es\/products\/turmeric\/?$/);
});

test('blocked translate script falls back to translate.google.com', async ({ page }) => {
  await page.route('**/translate_a/element.js*', (r) => r.abort());
  let fallbackUrl = '';
  await page.route('https://translate.google.com/translate?**', (r) => { fallbackUrl = r.request().url(); return r.fulfill({ body: 'ok' }); });
  await page.goto('/about');
  await page.locator('[data-lang-open]').click();
  await page.locator('[data-lang-option][data-code="tr"]').click();
  await expect.poll(() => fallbackUrl, { timeout: 8000 }).toContain('tl=tr');
});

test('switcher works when storage is blocked', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.locator('[data-lang-open]').click();
  await page.locator('[data-lang-option][data-code="fr"]').click();
  await expect(page).toHaveURL(/\/fr\/?$/);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('suggestion banner offers French to a French browser and never redirects', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  const banner = page.locator('[data-lang-suggest]');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('français');
  await banner.locator('[data-dismiss]').click();
  await page.reload();
  await expect(banner).toBeHidden();
  await ctx.close();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/lang-switch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/lang-switch.ts`**

```ts
import { gtToCore, isLocale, type Locale } from '../i18n/config';
import { localizePath, stripLocale } from '../i18n/paths';

export function resolveTarget(gtCode: string, pathname: string, available: readonly Locale[]) {
  const core = gtToCore[gtCode];
  const { path } = stripLocale(pathname);
  if (core && available.includes(core)) return { type: 'core' as const, href: localizePath(path, core) };
  return { type: 'machine' as const, gtCode };
}

export function suggestLocale(navLangs: readonly string[], current: Locale, available: readonly Locale[]): Locale | null {
  for (const tag of navLangs) {
    const primary = tag.toLowerCase().split('-')[0];
    if (!isLocale(primary) || !available.includes(primary)) continue;
    return primary === current ? null : primary;
  }
  return null;
}

export const safeStorage = {
  get(key: string): string | null {
    try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
  },
  set(key: string, value: string): void {
    try { globalThis.localStorage?.setItem(key, value); } catch { /* storage blocked */ }
  },
};

export function machineFallbackUrl(gtCode: string, pageUrl: string): string {
  return `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(gtCode)}&u=${encodeURIComponent(pageUrl)}`;
}

export function googTransCookie(gtCode: string): string {
  return `googtrans=/en/${gtCode}; path=/; SameSite=Lax`;
}
```

- [ ] **Step 4: Run unit tests**

Run: `npx vitest run tests/unit/lang-switch.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `LanguageSwitcher.astro`**

```astro
---
import { allLanguages, nativeName } from '../i18n/languages';
import { createT } from '../i18n/t';
import { gtToCore, locales, pillCode, type Locale } from '../i18n/config';
interface Props { locale: Locale; path: string; available?: readonly Locale[] }
const { locale, available = locales } = Astro.props;
const t = createT(locale);
const options = allLanguages
  .map((l) => ({ ...l, native: nativeName(l.code), core: !!gtToCore[l.code] && available.includes(gtToCore[l.code]) }))
  .sort((a, b) => Number(b.core) - Number(a.core) || a.english.localeCompare(b.english));
const current = Object.entries(gtToCore).find(([, v]) => v === locale)?.[0] ?? 'en';
---
<div class="ls" data-lang-root data-available={JSON.stringify(available)}>
  <button class="ls__pill" type="button" data-lang-open aria-haspopup="dialog" aria-label={t('lang.button')}>
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9S9.5 5.6 12 3Z"/></svg>
    <span data-lang-current>{pillCode[locale]}</span>
  </button>
  <dialog class="ls__dialog" aria-labelledby="ls-title">
    <div class="ls__head">
      <h2 id="ls-title">{t('lang.title')}</h2>
      <button type="button" data-lang-close aria-label={t('a11y.close')}>×</button>
    </div>
    <input type="search" placeholder={t('lang.search')} aria-label={t('lang.search')} data-lang-search />
    <div class="ls__list">
      <p class="eyebrow">{t('lang.core')}</p>
      <ul>{options.filter((o) => o.core).map((o) => (
        <li><button type="button" data-lang-option data-code={o.code} data-core="true" data-search={`${o.english} ${o.native} ${o.code}`.toLowerCase()} aria-current={o.code === current ? 'true' : undefined} lang={o.code}>{o.native}<small>{o.english}</small></button></li>
      ))}</ul>
      <p class="eyebrow">{t('lang.machine')}</p>
      <ul>{options.filter((o) => !o.core).map((o) => (
        <li><button type="button" data-lang-option data-code={o.code} data-core="false" data-search={`${o.english} ${o.native} ${o.code}`.toLowerCase()} lang={o.code}>{o.native}<small>{o.english}</small></button></li>
      ))}</ul>
    </div>
  </dialog>
  <div id="google_translate_element" hidden></div>
</div>
<script>import '../scripts/lang-switcher';</script>
<style>
  .ls__pill { position: fixed; inset-block-end: var(--space-5); inset-inline-start: var(--space-5); z-index: 40; display: inline-flex; align-items: center; gap: var(--space-2);
    min-block-size: 44px; padding-inline: var(--space-4); border-radius: 999px; border: 1px solid var(--rule); background: var(--paper); color: var(--ink); font: inherit; font-weight: 700; font-size: var(--step--1);
    box-shadow: 0 6px 20px rgb(26 26 23 / 0.15); cursor: pointer; }
  .ls__dialog { inline-size: min(100% - 2rem, 34rem); max-block-size: min(80svh, 44rem); padding: 0; border: 0; border-radius: var(--radius-card); box-shadow: var(--shadow-2); background: var(--paper); color: var(--ink); }
  .ls__dialog::backdrop { background: rgb(26 26 23 / 0.5); }
  .ls__head { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-5) var(--space-3); }
  .ls__head h2 { font-size: var(--step-1); }
  .ls__head button { inline-size: 44px; block-size: 44px; border: 0; background: none; font-size: 1.6rem; cursor: pointer; color: inherit; }
  input[type='search'] { margin-inline: var(--space-5); inline-size: calc(100% - 2 * var(--space-5)); min-block-size: 44px; font: inherit; font-size: 16px; padding-inline: var(--space-3); border: 1px solid var(--rule); border-radius: var(--radius); }
  .ls__list { overflow-y: auto; max-block-size: calc(min(80svh, 44rem) - 9rem); padding: var(--space-4) var(--space-5) var(--space-5); }
  .ls__list .eyebrow { margin-block: var(--space-4) var(--space-2); }
  .ls__list ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); gap: var(--space-1); }
  .ls__list button { inline-size: 100%; min-block-size: 44px; display: grid; text-align: start; padding: var(--space-2); border: 0; border-radius: var(--radius); background: none; font: inherit; cursor: pointer; color: inherit; }
  .ls__list button:hover, .ls__list button[aria-current='true'] { background: var(--paper-2); }
  .ls__list small { font-size: 0.75rem; color: var(--ink-2); }
  :global(body) { top: 0 !important; }
  :global(.skiptranslate iframe), :global(#goog-gt-tt) { display: none !important; }
</style>
```

Native names are computed at build time, so no Intl data loads in the browser. The pill sits bottom-start; WhatsApp sits bottom-end, so they never overlap (in RTL they mirror).

- [ ] **Step 6: Implement `src/scripts/lang-switcher.ts`**

```ts
import { resolveTarget, safeStorage, machineFallbackUrl, googTransCookie } from '../lib/lang-switch';
import type { Locale } from '../i18n/config';

const root = document.querySelector<HTMLElement>('[data-lang-root]');
if (root) {
  const available: Locale[] = JSON.parse(root.dataset.available ?? '[]');
  const dialog = root.querySelector('dialog')!;
  const search = root.querySelector<HTMLInputElement>('[data-lang-search]')!;
  const options = [...root.querySelectorAll<HTMLButtonElement>('[data-lang-option]')];

  root.querySelector('[data-lang-open]')!.addEventListener('click', () => { dialog.showModal(); search.focus(); });
  root.querySelector('[data-lang-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    for (const o of options) o.closest('li')!.hidden = !!q && !o.dataset.search!.includes(q);
  });

  function machineTranslate(code: string) {
    document.cookie = googTransCookie(code);
    const fallback = () => { location.href = machineFallbackUrl(code, location.href); };
    const timer = setTimeout(fallback, 4000);
    (window as unknown as Record<string, unknown>).gbTranslateInit = () => {
      clearTimeout(timer);
      const g = (window as unknown as { google?: { translate?: { TranslateElement?: new (o: object, id: string) => unknown } } }).google;
      if (!g?.translate?.TranslateElement) return fallback();
      new g.translate.TranslateElement({ pageLanguage: document.documentElement.lang.split('-')[0], autoDisplay: false }, 'google_translate_element');
      dialog.close();
    };
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=gbTranslateInit';
    s.async = true;
    s.onerror = () => { clearTimeout(timer); fallback(); };
    document.head.append(s);
  }

  for (const o of options) {
    o.addEventListener('click', () => {
      const code = o.dataset.code!;
      safeStorage.set('gb.lang', code);
      const target = resolveTarget(code, location.pathname, available);
      if (target.type === 'core') {
        document.cookie = 'googtrans=; path=/; max-age=0';
        location.href = target.href + location.search;
      } else {
        machineTranslate(target.gtCode);
      }
    });
  }
}
```

- [ ] **Step 7: Implement `LanguageSuggestBanner.astro`**

The banner text must be in the suggested language, so the component embeds the `lang.suggestion`, `lang.suggestYes`, `lang.dismiss` strings for every available locale.

```astro
---
import { createT } from '../i18n/t';
import { locales, type Locale } from '../i18n/config';
interface Props { locale: Locale; path: string; available?: readonly Locale[] }
const { locale, available = locales } = Astro.props;
const strings = Object.fromEntries(available.map((l) => {
  const t = createT(l);
  return [l, { text: t('lang.suggestion'), yes: t('lang.suggestYes'), no: t('lang.dismiss') }];
}));
---
<div class="lsb" data-lang-suggest hidden data-current={locale} data-available={JSON.stringify(available)} data-strings={JSON.stringify(strings)} role="region" aria-live="polite">
  <p data-text></p>
  <a class="btn btn--primary" data-yes href="#"></a>
  <button type="button" class="btn btn--ghost" data-dismiss></button>
</div>
<script>
  import { suggestLocale, safeStorage } from '../lib/lang-switch';
  import { localizePath, stripLocale } from '../i18n/paths';
  import type { Locale } from '../i18n/config';
  const el = document.querySelector<HTMLElement>('[data-lang-suggest]');
  if (el && !safeStorage.get('gb.suggest.dismissed') && !safeStorage.get('gb.lang')) {
    const available: Locale[] = JSON.parse(el.dataset.available!);
    const target = suggestLocale(navigator.languages ?? [navigator.language], el.dataset.current as Locale, available);
    if (target) {
      const s = JSON.parse(el.dataset.strings!)[target];
      el.lang = target;
      el.dir = target === 'ar' ? 'rtl' : 'ltr';
      el.querySelector('[data-text]')!.textContent = s.text;
      const yes = el.querySelector<HTMLAnchorElement>('[data-yes]')!;
      yes.textContent = s.yes;
      yes.href = localizePath(stripLocale(location.pathname).path, target);
      yes.addEventListener('click', () => safeStorage.set('gb.lang', target));
      const no = el.querySelector<HTMLButtonElement>('[data-dismiss]')!;
      no.textContent = s.no;
      no.addEventListener('click', () => { safeStorage.set('gb.suggest.dismissed', '1'); el.hidden = true; });
      el.hidden = false;
    }
  }
</script>
<style>
  .lsb { position: fixed; inset-block-start: var(--space-4); inset-inline: var(--space-4); z-index: 50; margin-inline: auto; max-inline-size: 36rem;
    display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); padding: var(--space-4); border-radius: 10px; background: var(--paper); color: var(--ink);
    box-shadow: var(--shadow-2); border-radius: var(--radius-card); }
  .lsb[hidden] { display: none; }
  .lsb p { flex: 1 1 12rem; font-weight: 500; }
</style>
```

The French test expects the banner to contain "français": the French `lang.suggestion` string (Task 17) is `Voir ce site en français ?`. Until Task 17, run this e2e test with `test.fixme` or after Task 17.

- [ ] **Step 8: Run tests**

Run: `npx vitest run && npm run test:e2e -- --project=desktop tests/e2e/lang.spec.ts`
Expected: PASS except the suggestion-banner test, which passes after Task 17.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: 104-language switcher with core-page routing, machine translation fallback and suggestion banner"
```

---

### Task 17: Translations for 8 core locales and the content report

**Files:**
- Create: `src/i18n/ui/{ar,fr,es,pt,ru,zh,id,de}.json`, `src/content/products-i18n/{ar,fr,es,pt,ru,zh,id,de}/*.yaml` (72), `src/content/hsn-i18n/{ar,fr,es,pt,ru,zh,id,de}/*.yaml` (112), `scripts/content-report.mjs` (replace stub)
- Test: `tests/unit/translations.test.ts`

**Interfaces:**
- Consumes: `en.json`, English product/HSN text, schemas.
- Produces: complete UI string tables; per-locale product and HSN text with `reviewStatus: pending`; `scripts/content-report.mjs` printing four sections: `Unverified HSN`, `Placeholders (REPLACE:)`, `Missing translations`, `Pending review`, plus `Draft posts`. Exit code 0 always (report, not gate).

Translation rules for the translator (the implementing agent writes these files directly):
- Translate meaning for B2B buyers; keep it plain and specific. Keep product proper names in Latin script where they are trade names (Sona Masoori, Ponni, Tiptur, Erode, Alleppey, chali, kempu) and add a transliteration in parentheses for ar, ru and zh on first use in `summary`.
- Never translate HSN codes, numbers, units (MT, kg, ppb, %), Incoterms (FOB, CFR, CIF) or `{placeholders}`.
- `lang.suggestion` must be in its own language: fr `Voir ce site en français ?`, es `¿Ver este sitio en español?`, pt `Ver este site em português?`, de `Diese Seite auf Deutsch ansehen?`, ru `Открыть сайт на русском?`, ar `هل تريد عرض الموقع بالعربية؟`, zh `以简体中文查看本网站？`, id `Lihat situs ini dalam Bahasa Indonesia?`.
- Every translated YAML file starts with `reviewStatus: pending`.

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/translations.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { productTextSchema, hsnTextSchema } from '../../src/lib/schemas';

const en = JSON.parse(readFileSync('src/i18n/ui/en.json', 'utf8'));
const others = ['ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe('ui translations', () => {
  for (const l of others) {
    const table = JSON.parse(readFileSync(`src/i18n/ui/${l}.json`, 'utf8'));
    it(`${l} has every key`, () => expect(Object.keys(table).sort()).toEqual(Object.keys(en).sort()));
    it(`${l} keeps placeholders`, () => {
      for (const k of Object.keys(en)) expect(placeholders(table[k]), k).toEqual(placeholders(en[k]));
    });
    it(`${l} has no empty strings`, () => {
      for (const [k, v] of Object.entries(table)) expect(String(v).trim().length, k).toBeGreaterThan(0);
    });
  }
});

describe('content translations', () => {
  const products = readdirSync('src/content/products-i18n/en');
  const hsn = readdirSync('src/content/hsn-i18n/en');
  for (const l of others) {
    it(`${l} has all product files and the same variety keys`, () => {
      for (const f of products) {
        const enText = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/en/${f}`, 'utf8')));
        const text = productTextSchema.parse(parse(readFileSync(`src/content/products-i18n/${l}/${f}`, 'utf8')));
        expect(Object.keys(text.varieties).sort(), f).toEqual(Object.keys(enText.varieties).sort());
      }
    });
    it(`${l} has all HSN files`, () => {
      for (const f of hsn) hsnTextSchema.parse(parse(readFileSync(`src/content/hsn-i18n/${l}/${f}`, 'utf8')));
    });
    it(`${l} summaries keep every HSN code from English`, () => {
      for (const f of products) {
        const enS = parse(readFileSync(`src/content/products-i18n/en/${f}`, 'utf8')).summary as string;
        const s = parse(readFileSync(`src/content/products-i18n/${l}/${f}`, 'utf8')).summary as string;
        for (const code of enS.match(/\b\d{4,8}\b/g) ?? []) expect(s, `${l}/${f}`).toContain(code);
      }
    });
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/translations.test.ts`
Expected: FAIL — files missing.

- [ ] **Step 3: Write the 8 UI tables**

For each locale in `ar, fr, es, pt, ru, zh, id, de`, create `src/i18n/ui/<locale>.json` with exactly the keys of `en.json` (including keys added in Tasks 9 and 15), translated per the rules above. Do this one locale at a time, running `npx vitest run tests/unit/translations.test.ts -t "ui translations"` after each file; the parity and placeholder checks catch omissions.

- [ ] **Step 4: Write product and HSN text per locale**

For each locale, create `src/content/products-i18n/<locale>/<slug>.yaml` for all 9 products and `src/content/hsn-i18n/<locale>/<code>.yaml` for all 14 codes, translating the English files from Task 4 field by field and setting `reviewStatus: pending`. Keep `varieties` keys identical to English. Run the content tests after each locale.

- [ ] **Step 5: Replace `scripts/content-report.mjs`**

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
const out = { 'Unverified HSN': [], 'Placeholders (REPLACE:)': [], 'Missing translations': [], 'Pending review': [], 'Draft posts': [] };

for (const f of readdirSync('src/content/products')) {
  const p = parse(readFileSync(join('src/content/products', f), 'utf8'));
  for (const h of p.hsn) if (!h.verified) out['Unverified HSN'].push(`${f.replace('.yaml', '')}: ${h.code}`);
}

const walk = (obj, path = '') =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? walk(v, `${path}${k}.`) : typeof v === 'string' && v.startsWith('REPLACE:') ? [`${path}${k}`] : []));
out['Placeholders (REPLACE:)'] = walk(parse(readFileSync('src/content/site.yaml', 'utf8')));

const en = JSON.parse(readFileSync('src/i18n/ui/en.json', 'utf8'));
for (const l of locales.slice(1)) {
  const file = `src/i18n/ui/${l}.json`;
  const table = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const missing = Object.keys(en).filter((k) => !table[k]);
  if (missing.length) out['Missing translations'].push(`ui/${l}: ${missing.length} keys`);
  for (const dir of ['products-i18n', 'hsn-i18n']) {
    for (const f of readdirSync(`src/content/${dir}/en`)) {
      const path = `src/content/${dir}/${l}/${f}`;
      if (!existsSync(path)) { out['Missing translations'].push(`${dir}/${l}/${f}`); continue; }
      if (parse(readFileSync(path, 'utf8')).reviewStatus === 'pending') out['Pending review'].push(`${dir}/${l}/${f}`);
    }
  }
}

for (const l of locales) {
  const dir = `src/content/blog/${l}`;
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (readFileSync(join(dir, f), 'utf8').includes('Replace the notes')) out['Draft posts'].push(`${l}/${f}`);
}

for (const [title, items] of Object.entries(out)) {
  console.log(`\n${title} (${items.length})`);
  const shown = title === 'Pending review' ? items.slice(0, 10) : items;
  for (const i of shown) console.log(`  - ${i}`);
  if (shown.length < items.length) console.log(`  … and ${items.length - shown.length} more`);
}
```

- [ ] **Step 6: Run tests and build**

Run: `npx vitest run && npm run build && npm run test:e2e -- --project=desktop tests/e2e/lang.spec.ts tests/e2e/layout.spec.ts`
Expected: PASS; build prints the content report with 3 unverified HSN, the `REPLACE:` list, 0 missing translations and the pending-review count.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: core-language translations (pending review) and content report"
```

---

### Task 18: SEO assets — robots, llms.txt, OG images, spec-sheet PDFs

**Files:**
- Create: `public/robots.txt`, `src/pages/llms.txt.ts`, `src/lib/og.ts`, `src/pages/og/[...slug].png.ts`, `src/lib/specsheet.ts`, `src/pages/spec-sheets/[product]/[variety].pdf.ts`
- Test: `tests/unit/specsheet.test.ts`, `tests/e2e/seo.spec.ts`

**Interfaces:**
- Consumes: catalog, `formatHsn`, `places`, `getSite`.
- Produces:
  - `renderOg({ eyebrow: string; title: string; subtitle?: string }): Promise<Buffer>` — 1200×630 PNG.
  - `buildSpecSheet(args: { productName: string; varietyName: string; hsn: string; region: string; market: string; specs: { label: string; value: string }[]; packing: string[]; moq: string; ports: string; contact: string; url: string }): Promise<Uint8Array>` — single-page A4 PDF.
  - OG routes: `/og/home.png`, `/og/products.png`, `/og/blog.png`, `/og/about.png`, `/og/contact.png`, `/og/products/<slug>.png`, `/og/hsn/<code>.png`, `/og/blog/<slug>.png`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/specsheet.test.ts
import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildSpecSheet } from '../../src/lib/specsheet';

describe('buildSpecSheet', () => {
  it('produces a one-page PDF with metadata', async () => {
    const bytes = await buildSpecSheet({
      productName: 'Turmeric', varietyName: 'Turmeric powder', hsn: '09103030', region: 'Erode, Tamil Nadu', market: 'Erode Regulated Market',
      specs: [{ label: 'Curcumin', value: '2–5%' }, { label: 'Moisture', value: '≤ 10%' }], packing: ['25 kg paper bags'], moq: '1 × 20 ft FCL',
      ports: 'Chennai Port', contact: 'export@example.com', url: 'https://goodbizagri.com/products/turmeric',
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getTitle()).toBe('Turmeric powder — GoodBiz Agri spec sheet');
  });
});
```

```ts
// tests/e2e/seo.spec.ts
import { test, expect } from '@playwright/test';

test('robots.txt allows AI crawlers and lists sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  for (const bot of ['GPTBot', 'PerplexityBot', 'Google-Extended', 'ClaudeBot']) expect(body).toContain(`User-agent: ${bot}`);
  expect(body).toContain('Sitemap:');
});

test('llms.txt lists products and HSN codes', async ({ request }) => {
  const body = await (await request.get('/llms.txt')).text();
  expect(body).toContain('# GoodBiz Agri');
  expect(body).toContain('09103030');
  expect(body).toContain('/products/turmeric');
});

test('sitemap includes localized URLs', async ({ request }) => {
  const idx = await (await request.get('/sitemap-index.xml')).text();
  const first = idx.match(/<loc>(.*?)<\/loc>/)![1];
  const map = await (await request.get(new URL(first).pathname)).text();
  expect(map).toContain('/fr/products/turmeric');
  expect(map).toContain('hreflang="ar"');
});

test('og image and spec sheet are served', async ({ request }) => {
  const og = await request.get('/og/products/turmeric.png');
  expect(og.headers()['content-type']).toContain('image/png');
  const pdf = await request.get('/spec-sheets/turmeric/powder.pdf');
  expect(pdf.ok()).toBe(true);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
});

test('every page has exactly one h1, a description and a canonical', async ({ page }) => {
  for (const path of ['/', '/products', '/products/turmeric', '/hsn/1701', '/blog', '/about', '/contact', '/ar/products/rice']) {
    await page.goto(path);
    await expect(page.locator('h1'), path).toHaveCount(1);
    await expect(page.locator('meta[name="description"]'), path).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]'), path).toHaveCount(1);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/specsheet.test.ts`
Expected: FAIL.

- [ ] **Step 3: `public/robots.txt`**

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://goodbizagri.com/sitemap-index.xml
```

If `SITE_URL` differs at deploy, update the `Sitemap:` line to match (Task 19 checklist).

- [ ] **Step 4: Implement `src/lib/specsheet.ts`**

```ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const forest = rgb(0x1f / 255, 0x3d / 255, 0x2b / 255);
const ink = rgb(0x1a / 255, 0x1a / 255, 0x17 / 255);
const muted = rgb(0x4a / 255, 0x47 / 255, 0x40 / 255);
// StandardFonts are WinAnsi-only; normalise characters they cannot encode.
const safe = (s: string) => s.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/[–—]/g, '-').replace(/×/g, 'x').replace(/·/g, '|').replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

export async function buildSpecSheet(a: {
  productName: string; varietyName: string; hsn: string; region: string; market: string;
  specs: { label: string; value: string }[]; packing: string[]; moq: string; ports: string; contact: string; url: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${a.varietyName} — GoodBiz Agri spec sheet`);
  doc.setAuthor('GoodBiz Agri');
  doc.setSubject(`${a.productName} specification, HSN ${a.hsn}`);
  const page = doc.addPage([595.28, 841.89]);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  let y = 780;
  const x = 56;

  page.drawRectangle({ x: 0, y: 800, width: 595.28, height: 42, color: forest });
  page.drawText('GoodBiz Agri', { x, y: 815, size: 16, font: serif, color: rgb(0.96, 0.95, 0.91) });
  page.drawText('Specification sheet', { x: 420, y: 817, size: 10, font: sans, color: rgb(0.91, 0.77, 0.42) });

  page.drawText(safe(a.productName.toUpperCase()), { x, y: (y -= 20), size: 9, font: bold, color: muted });
  page.drawText(safe(a.varietyName), { x, y: (y -= 28), size: 24, font: serif, color: ink });
  page.drawText(`HSN ${a.hsn}`, { x, y: (y -= 22), size: 11, font: mono, color: forest });

  const row = (label: string, value: string) => {
    y -= 22;
    page.drawText(safe(label), { x, y, size: 10, font: sans, color: muted });
    page.drawText(safe(value), { x: 220, y, size: 10, font: mono, color: ink, maxWidth: 320 });
    page.drawLine({ start: { x, y: y - 7 }, end: { x: 539, y: y - 7 }, thickness: 0.4, color: rgb(0.85, 0.83, 0.78) });
  };

  y -= 18;
  page.drawText('Origin', { x, y: (y -= 14), size: 12, font: bold, color: ink });
  row('Region', a.region);
  row('Market', a.market);
  y -= 14;
  page.drawText('Specifications', { x, y: (y -= 14), size: 12, font: bold, color: ink });
  for (const s of a.specs) row(s.label, s.value);
  y -= 14;
  page.drawText('Commercial', { x, y: (y -= 14), size: 12, font: bold, color: ink });
  row('Packing', a.packing.join(', '));
  row('Minimum order', a.moq);
  row('Loading ports', a.ports);
  row('Incoterms', 'FOB, CFR, CIF');

  page.drawText('Specifications are typical values; final specification is agreed per contract.', { x, y: 90, size: 8, font: sans, color: muted });
  page.drawText(safe(`${a.contact}   ${a.url}`), { x, y: 72, size: 9, font: sans, color: forest });
  return doc.save();
}
```

Spec sheets are English-only in v1 (StandardFonts cannot render Arabic or Chinese).

- [ ] **Step 5: Implement `src/lib/og.ts`**

```ts
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';

const font = (pkg: string, file: string) => readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`);
const fonts = [
  { name: 'Fraunces', data: font('fraunces', 'fraunces-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'Manrope', data: font('manrope', 'manrope-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];

export async function renderOg(o: { eyebrow: string; title: string; subtitle?: string }): Promise<Buffer> {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: { width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#1F3D2B', color: '#F6F1E7', fontFamily: 'Manrope' },
        children: [
          { type: 'div', props: { style: { fontSize: 28, color: '#E9C46A', letterSpacing: 2 }, children: o.eyebrow.toUpperCase() } },
          { type: 'div', props: { style: { fontFamily: 'Fraunces', fontSize: 76, lineHeight: 1.05, maxWidth: 980 }, children: o.title } },
          { type: 'div', props: { style: { display: 'flex', justifyContent: 'space-between', fontSize: 28 }, children: [
            { type: 'span', props: { children: o.subtitle ?? '' } },
            { type: 'span', props: { style: { color: '#D99A1E' }, children: 'GoodBiz Agri' } },
          ] } },
        ],
      },
    } as never,
    { width: 1200, height: 630, fonts },
  );
  return new Resvg(svg).render().asPng();
}
```

OG images use English text for every locale (satori cannot shape Arabic); this is acceptable because social previews show the brand and product name.

- [ ] **Step 6: Implement OG and spec-sheet endpoints, and `llms.txt`**

```ts
// src/pages/og/[...slug].png.ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderOg } from '../../lib/og';
import { getLocalizedProducts, getHsnEntries } from '../../lib/catalog';
import { formatHsn } from '../../lib/hsn';
import { postSlug, postLocale } from '../../lib/blog-pure';

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getLocalizedProducts('en');
  const hsn = await getHsnEntries('en');
  const posts = (await getCollection('blog')).filter((p) => postLocale(p.id) === 'en');
  const pages = [
    { slug: 'home', eyebrow: 'Agro exporters · Bengaluru, India', title: "South India's harvest, shipped to 70+ countries" },
    { slug: 'products', eyebrow: 'Product range', title: 'Rice, spices, arecanut, jaggery, groundnuts and copra' },
    { slug: 'blog', eyebrow: 'Insights', title: 'Market updates and buyer guides' },
    { slug: 'about', eyebrow: 'About', title: 'Buyers in the markets where it grows' },
    { slug: 'contact', eyebrow: 'Contact', title: 'Request a quote' },
    ...products.map((p) => ({ slug: `products/${p.slug}`, eyebrow: `HSN ${p.data.hsn.map((h) => formatHsn(h.code)).join(' · ')}`, title: p.text.name, subtitle: p.text.originLine })),
    ...hsn.map((h) => ({ slug: `hsn/${h.code}`, eyebrow: 'HSN reference', title: `HSN ${formatHsn(h.code)} — ${h.text.title}` })),
    ...posts.map((p) => ({ slug: `blog/${postSlug(p.id)}`, eyebrow: 'Insights', title: p.data.title })),
  ];
  return pages.map(({ slug, ...props }) => ({ params: { slug }, props }));
};

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderOg(props as { eyebrow: string; title: string; subtitle?: string }), { headers: { 'Content-Type': 'image/png' } });
```

```ts
// src/pages/spec-sheets/[product]/[variety].pdf.ts
import type { APIRoute, GetStaticPaths } from 'astro';
import { buildSpecSheet } from '../../../lib/specsheet';
import { getLocalizedProducts, getSite } from '../../../lib/catalog';
import { createT, type UiKey } from '../../../i18n/t';
import { places } from '../../../data/places';
import { isPlaceholder } from '../../../lib/site';

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getLocalizedProducts('en');
  return products.flatMap((p) => p.data.varieties.map((v) => ({ params: { product: p.slug, variety: v.id }, props: { p, v } })));
};

export const GET: APIRoute = async ({ props, site }) => {
  const { p, v } = props as { p: Awaited<ReturnType<typeof getLocalizedProducts>>[number]; v: Awaited<ReturnType<typeof getLocalizedProducts>>[number]['data']['varieties'][number] };
  const t = createT('en');
  const s = await getSite();
  const bytes = await buildSpecSheet({
    productName: p.text.name, varietyName: p.text.varieties[v.id]?.name ?? v.id, hsn: v.hsn,
    region: `${places[v.region].name}, ${places[v.region].state}`, market: v.market,
    specs: v.specs.map((x) => ({ label: t(`spec.${x.key}` as UiKey), value: x.value })),
    packing: v.packing, moq: p.data.moq, ports: p.data.ports.map((id) => places[id].name).join(', '),
    contact: isPlaceholder(s.email) ? 'goodbizagri.com/contact' : s.email,
    url: new URL(`/products/${p.slug}`, site).href,
  });
  return new Response(bytes, { headers: { 'Content-Type': 'application/pdf' } });
};
```

```ts
// src/pages/llms.txt.ts
import type { APIRoute } from 'astro';
import { getLocalizedProducts, getHsnEntries, getSite } from '../lib/catalog';
import { formatHsn } from '../lib/hsn';
import { places } from '../data/places';

export const GET: APIRoute = async ({ site }) => {
  const s = await getSite();
  const products = await getLocalizedProducts('en');
  const hsn = await getHsnEntries('en');
  const u = (p: string) => new URL(p, site).href;
  const lines = [
    '# GoodBiz Agri',
    '',
    `> Agro commodity exporter based in ${s.address.city}, Karnataka, India. Sources rice, turmeric, ginger, arecanut, jaggery, groundnuts, coconut and copra from producing markets in Karnataka, Tamil Nadu, Kerala and Andhra Pradesh, and ships to ${s.stats.countries}+ countries. Quotes FOB, CFR and CIF.`,
    '',
    '## Products',
    ...products.map((p) => `- [${p.text.name}](${u(`/products/${p.slug}`)}): HSN ${p.data.hsn.map((h) => h.code).join(', ')}. ${p.text.originLine}. Varieties: ${p.data.varieties.map((v) => p.text.varieties[v.id]?.name).join(', ')}.`),
    '',
    '## HSN codes',
    ...hsn.map((h) => `- [${h.code} (${formatHsn(h.code)})](${u(`/hsn/${h.code}`)}): ${h.text.title}${h.verified ? '' : ' (code under verification)'}`),
    '',
    '## Sourcing regions',
    ...[...new Set(products.flatMap((p) => p.data.regions))].map((r) => `- ${places[r].name}, ${places[r].state}`),
    '',
    '## Contact',
    `- [Request a quote](${u('/contact')})`,
    '',
    '## Languages',
    '- Full pages in English, Arabic, French, Spanish, Portuguese, Russian, Chinese (Simplified), Indonesian and German.',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run && npm run test:e2e -- --project=desktop tests/e2e/seo.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: robots.txt, llms.txt, OG images and spec-sheet PDFs"
```

---

### Task 19: Quality gates, Vercel config and visual review

**Files:**
- Create: `lighthouserc.json`, `vercel.json`, `README.md`, `tests/e2e/budget.spec.ts`
- Modify: any component the visual review flags

**Interfaces:**
- Consumes: the built site.
- Produces: passing Lighthouse CI, link check, JS budget test; `vercel.json` headers; README with owner hand-off checklist.

- [ ] **Step 1: Write the JS budget test**

```ts
// tests/e2e/budget.spec.ts
import { test, expect } from '@playwright/test';

for (const path of ['/', '/products/turmeric', '/hsn/1701', '/blog']) {
  test(`initial JS ≤ 60 KB gzip before interaction: ${path}`, async ({ page }) => {
    const sizes: number[] = [];
    page.on('response', async (r) => {
      if (r.request().resourceType() !== 'script' || !r.url().startsWith('http://localhost')) return;
      const len = Number(r.headers()['content-length'] ?? 0) || (await r.body()).length;
      sizes.push(len);
    });
    await page.goto(path, { waitUntil: 'load' });
    // scripts requested after idle (Motion, Lenis, Three.js) are excluded by stopping here
    const total = sizes.reduce((a, b) => a + b, 0);
    expect(total / 1024).toBeLessThanOrEqual(60 * 3.2); // uncompressed bytes; ≈ 60 KB gzip at ~3.2× ratio
  });
}
```

`astro preview` does not gzip, so the test compares uncompressed size against 60 KB × 3.2. Lighthouse (Step 3) reports the real transfer size.

- [ ] **Step 2: `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": ["/index.html", "/products/turmeric/index.html", "/hsn/1701/index.html", "/blog/turmeric-hsn-codes-explained/index.html", "/ar/index.html"],
      "numberOfRuns": 2,
      "settings": { "preset": "perf", "formFactor": "mobile", "screenEmulation": { "mobile": true, "width": 412, "height": 823, "deviceScaleFactor": 1.75 } }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }]
      }
    }
  }
}
```

If `preset: "perf"` excludes SEO/accessibility categories in your LHCI version, remove the `preset` key so all categories run.

- [ ] **Step 3: Run the gates**

Run:
```bash
npm run build
npm test
npm run test:e2e
npm run lhci
npm run linkcheck
```
Expected: all pass. For each Lighthouse failure, fix the cause (image sizes, font preloads, contrast, missing labels) — do not lower thresholds.

- [ ] **Step 4: `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    { "source": "/_astro/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/fonts/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/models/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=604800" }] },
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
    ] }
  ]
}
```

Add Vercel Analytics and Speed Insights by inserting into `Base.astro` `<head>`:
```astro
<script defer src="/_vercel/insights/script.js"></script>
<script defer src="/_vercel/speed-insights/script.js"></script>
```
(These paths are served by Vercel once Analytics and Speed Insights are enabled in the project dashboard; locally they 404 harmlessly. Exclude `/_vercel/` in the linkcheck skip pattern: `--skip "^https?://(?!localhost)|/_vercel/"`.)

- [ ] **Step 5: Visual review loop**

Invoke the `taste-skill:taste-skill` skill, then `impeccable:impeccable` (audit/polish mode), on the running preview (`npm run preview`). Review against `DESIGN.md` at 375, 768, 1024 and 1440 px for `/`, `/products/turmeric`, `/hsn/09103030`, `/blog`, `/contact`, `/ar/` and `/zh/`. For each issue: fix in the component's CSS, rebuild, re-screenshot. Re-run `npm run test:e2e` and `npm run lhci` after the loop. Commit fixes in small commits, e.g. `style: tighten product hero spacing on mobile`.

- [ ] **Step 6: Write `README.md`**

```markdown
# GoodBiz Agri website

Astro static site. Node 20+.

    npm install
    npm run dev        # http://localhost:4321
    npm test           # unit tests
    npm run test:e2e   # browser tests (builds first)
    npm run build      # also prints the content report

## Before launch (owner checklist)

The build prints a content report. Clear every item:

1. `src/content/site.yaml` — replace every `REPLACE:` value (legal name, address, email, phone, WhatsApp, Web3Forms key, registration numbers). Set `held: false` for any registration you do not hold.
2. Certification logos — put official files in `public/logos/` and set `logo: /logos/<file>` per registration.
3. HSN codes marked unverified (arecanut, groundnuts, coconut/copra) — confirm with your CHA, then set `verified: true` in `src/content/products/<slug>.yaml`.
4. Product facts — check varieties, specs, MOQ and ports in `src/content/products/*.yaml`.
5. Photos — replace files in `src/assets/products/<slug>/` keeping the same names; set `isStock: false` for your own photos.
6. 3D models (optional) — add `public/models/ginger.glb`, `jaggery.glb`, `coconut.glb` (≤ 300 KB, Meshopt-compressed). Without them a generated pile is shown.
7. Translations — have a native speaker review each language; set `reviewStatus: reviewed`.
8. Served countries — confirm `src/data/countries.ts`.
9. Domain — set `SITE_URL` in Vercel and update the `Sitemap:` line in `public/robots.txt`.
10. Vercel — import the repo, enable Analytics and Speed Insights.
11. Google Search Console and Bing Webmaster Tools — verify the domain and submit `/sitemap-index.xml`.

## Editing content

- Product facts: `src/content/products/<slug>.yaml`
- Product text per language: `src/content/products-i18n/<lang>/<slug>.yaml`
- HSN text: `src/content/hsn-i18n/<lang>/<code>.yaml`
- Interface text: `src/i18n/ui/<lang>.json`
- Blog posts: `src/content/blog/<lang>/<slug>.mdx` (a translation uses the same file name as the English post)
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: Lighthouse CI, Vercel config, JS budget test and owner README"
```

---

### Task 20: Replace placeholders with licensed stock photos (requires user approval)

**Files:**
- Modify: `src/assets/products/**.jpg`
- Create: `src/assets/CREDITS.md`

**Interfaces:**
- Consumes: placeholder file names from Task 3.
- Produces: real representative photos at the same paths; `isStock: true` stays.

- [ ] **Step 1: Ask the user before downloading**

List the planned sources (Unsplash or Pexels, both free for commercial use without attribution, attribution given anyway in `CREDITS.md`), the number of files (9 hero + 37 variety images = 46), and approximate total size (~15 MB before optimisation). Wait for an explicit yes.

- [ ] **Step 2: Download into a fresh directory and inspect**

Save downloads to a new empty directory in the scratchpad, open each file to confirm it shows the right product (e.g. turmeric fingers, not ginger), then copy to `src/assets/products/<slug>/<name>.jpg`, resized to max 2000 px on the long edge:

```bash
node -e "const sharp=require('sharp');const [i,o]=process.argv.slice(1);sharp(i).resize({width:2000,height:2000,fit:'inside'}).jpeg({quality:82,mozjpeg:true}).toFile(o)" <downloaded-file> src/assets/products/<slug>/<name>.jpg
```

- [ ] **Step 3: Record credits**

`src/assets/CREDITS.md`: one line per file — path, photographer, source URL, licence.

- [ ] **Step 4: Rebuild and re-run gates**

Run: `npm run build && npm run test:e2e && npm run lhci`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "content: representative stock photography with credits"
```
