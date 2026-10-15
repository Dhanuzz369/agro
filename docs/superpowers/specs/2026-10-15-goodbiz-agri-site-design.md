# GoodBiz Agri — Export Website Design

**Date:** 2026-10-15
**Status:** Draft for review
**Owner:** GoodBiz Agri, Bangalore, Karnataka, India

## 1. Goal

A multilingual B2B website where international buyers discover GoodBiz Agri, trust it as a genuine South Indian sourcing exporter, and send a quote request. Success means:

- Buyers searching a product name, variety, or HSN code (in English or a core language) land on a GoodBiz Agri page.
- AI answer engines (ChatGPT, Perplexity, Google AI Overviews) can quote GoodBiz Agri pages for product/HSN/export questions.
- Every page leads to a quote request or WhatsApp conversation in one click.
- Mobile Lighthouse: Performance ≥ 90, SEO = 100, Accessibility ≥ 95. LCP < 2.5 s on 4G.

### Decisions already made

| Topic | Decision |
|---|---|
| Brand | GoodBiz Agri, Bangalore; products sourced from producing markets across South India |
| Photography | Stock imagery now, labelled "Representative image"; owner swaps in real photos later by replacing files of the same name |
| Primary CTA | Request-a-quote form; persistent WhatsApp button as secondary |
| Certifications | Text badges for APEDA, FSSAI, Spices Board India, IEC (DGFT), Coconut Development Board, each with a registration-number slot. Owner supplies official logo files and lists only registrations actually held |
| Stack | Astro 5 static site on Node.js, TypeScript, Three.js, Motion (vanilla build of Framer Motion) for scroll effects, Lenis for smooth scrolling; deployed to Vercel |
| Design reference | Oura DESIGN.md from VoltAgent/awesome-design-md, adapted to GoodBiz colours and content (see §5); captured in the project's own `DESIGN.md` |
| Devices | Desktop (≥ 1280), laptop (1024–1279), tablet (768–1023), mobile (≤ 767) — every page designed and tested at all four |
| 3D | Hero image-to-particles scene; 3D product objects on product pages; scroll animations elsewhere |
| World map | Animated SVG (not WebGL) for the 70+ countries section |
| Languages | Hybrid: 9 core languages as real indexed pages + 104-language switcher using live machine translation for the rest |
| Visual direction | A — Harvest editorial |
| V1 scope | Core site + blog + HSN pages. Export-to-country pages deferred to phase 2 |

## 2. Site map

```
/                              Landing
/products                      All products: card grid + HSN reference table
/products/[slug]               9 product pages
/hsn/[code]                    14 HSN reference pages (one per HSN line)
/blog                          Post list with category filters
/blog/[slug]                   Post
/about                         Company, sourcing network, quality process
/contact                       Quote form, WhatsApp, email, address
/rss.xml, /sitemap-index.xml, /robots.txt, /llms.txt
```

Every route above exists under each core-language prefix (see §6).

Product slugs: `rice`, `non-basmati-rice`, `broken-rice`, `jaggery`, `arecanut`, `groundnuts`, `coconut-copra`, `ginger`, `turmeric`.

## 3. Product catalogue (draft content — owner to verify)

| Page | HSN as supplied | Varieties (draft) | Sourcing regions / markets (draft) |
|---|---|---|---|
| Rice — South Indian specialty | 1006 | Sona Masoori (raw, steam), Ponni, Kerala Matta, Seeraga Samba, Idli rice | Raichur, Mandya, Thanjavur, Palakkad |
| Non-basmati rice — bulk grades | 10063099 | IR64 raw/parboiled, Swarna, IR36, 5% and 25% broken grades | Andhra & Tamil Nadu deltas, Raichur |
| Broken rice | 100640 | 100% white broken, parboiled broken, sortexed | Same mill network |
| Jaggery | 1701 | Block, cube, powder, organic, palm jaggery (karupatti) | Mandya, Belagavi, Tamil Nadu |
| Arecanut | 80280 (verify: `0802 80…`) | Whole white (chali), split, red (kempu/api), bette, sliced | Shivamogga, Dakshina Kannada, Kasaragod |
| Groundnuts | 120242 | Bold/runner and Java, counts 40/50–80/90, blanched | Chitradurga, Anantapur, Tamil Nadu |
| Coconut & kobre | 8011220 (verify: `0801 12 20`) | Semi-husked coconut, Tiptur ball copra, milling copra, edible cups | Tiptur, Tumakuru, Pollachi, Kerala |
| Ginger | 09101110 fresh · 09101120 dried unbleached · 09101130 dried bleached · 09101190 other | One variety per HSN line; Cochin dry ginger noted | Wayanad, Kodagu, Hassan |
| Turmeric | 09103010 fresh · 09103020 dried · 09103030 powder | Fresh; dried fingers & bulbs (Erode, Salem, Alleppey); powder 2–5% curcumin | Erode, Salem, Alleppey |

All HSN codes are displayed exactly as stored in content. Codes marked "verify" carry `hsnVerified: false` in data and must be confirmed with the owner's CHA before launch. A build warning lists unverified codes.

## 4. Page designs

### 4.1 Landing page (top → bottom)

1. **Hero** — forest-green stage. Three.js particle field (~40k points) sampled from a product photo; subtle pointer parallax; morphs rice → turmeric → arecanut on scroll. Headline: "South India's harvest, shipped to 70+ countries." CTAs: *Request a quote* (primary), *View products*. Poster image is the LCP element and renders before any JS.
2. **Trust strip** — certification badges with registration-number slots.
3. **Product range** — 9 cards: image, HSN chip, one-line origin, link.
4. **From farm to port** — pinned scroll story, 4 steps: sourcing markets → grading & lab testing → packing & fumigation → container loading (Chennai, Kochi, Tuticorin, New Mangalore).
5. **Why GoodBiz Agri** — 3–4 proof points with counters (direct sourcing, lab-tested lots, flexible MOQ, documentation support). Counter values are placeholders until owner confirms.
6. **South India sourcing map** — SVG; hovering/tapping a product highlights its districts.
7. **Buyer FAQ** — MOQ, Incoterms, payment terms, packaging, samples, lead time. FAQPage schema.
8. **70+ countries** — animated SVG world map; routes draw from Bangalore; served-region list beside it.
9. **Final CTA + footer** — quote teaser, WhatsApp, email, address, HSN quick reference, language switcher.

### 4.2 Product page template

1. Breadcrumb + product hero: 3D object (left; poster until loaded) and name, HSN chips, one-paragraph answer-first summary, CTAs *Request quote* (prefilled), *WhatsApp*, *Download spec sheet*.
2. Quick-facts bar: HSN codes, source states, harvest season, MOQ, packing, loading ports, shelf life.
3. Varieties: card per variety — photo, HSN, origin region & market, spec table, packing options, *Quote this variety*.
4. Where it comes from: South India map with source districts, named markets, sourcing story, 12-month harvest calendar.
5. Quality & documents: grading/sortex, lab tests (aflatoxin, pesticide residue, moisture), fumigation; documents supplied (COO, phytosanitary, FSSAI, APEDA RCMC, COA).
6. Packaging & shipping: bag types, 20 ft / 40 ft container loads, Incoterms, ports.
7. Product FAQ (5–6 Q&As, FAQPage schema).
8. Related products, related blog posts, CTA.

### 4.3 HSN page template

Code and official description; which GoodBiz Agri product/variety it covers; typical specs; export documents; general import-duty notes for major markets (clearly marked as indicative, "confirm with your customs broker"); FAQ; CTA. Generated entirely from product data plus a short per-code text block.

### 4.4 Blog

Categories: Market Updates, Buyer Guides, Product Knowledge, Export Process. Post layout: title, author, date, reading time, body (MDX), related products, CTA. Article + BreadcrumbList schema. RSS per language. V1 ships with 3 seed posts in English (e.g. "HSN codes for Indian turmeric explained", "Arecanut grades: chali vs kempu", "Monthly market report — October 2026" template). Translation of posts is selective.

### 4.5 About and Contact

About: company story, Bangalore base, sourcing network map, quality process, certifications. Contact: full quote form, WhatsApp, email, office address with static map image.

## 5. Visual system — Harvest editorial, built on Oura's DESIGN.md

The layout, type scale, spacing, radii, elevation and responsive rules follow the Oura DESIGN.md (VoltAgent/awesome-design-md). Oura's brand itself — name, logo, proprietary fonts, action blue — is not used. The project keeps its own `DESIGN.md` at the repo root describing the adapted system; it is the reference every UI task reads.

**Three surface worlds** (Oura pattern): cream world `--paper #F7F1E8` for editorial content; forest world `--forest #1F3D2B` for the hero stage, world-map band and footer (replaces Oura's black band); white `--surface #FFFFFF` for elevated cards and inputs only.

**Colour tokens**

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F7F1E8` | Default background (never white) |
| `--surface` | `#FFFFFF` | Elevated cards, inputs |
| `--forest` | `#1F3D2B` | Dark world: hero, world band, footer |
| `--turmeric` | `#D99A1E` | The single action colour — primary CTA pill only, one per view, ink text |
| `--stone` | `#4A4741` | Workhorse neutral: secondary pills, outlines, links, wordmark |
| `--clay` | `#6B443D` | Accent bands, map highlights, eyebrows |
| `--gold` | `#AF751B` / `--gold-soft #DDAA61` | Illustration, data-viz, accents on forest (never buttons) |
| `--olive` | `#5C6F5D` / `--sage-pale #CED4B8` | Calm accent bands, secondary data-viz |
| `--ink` | `#1C1B1A` | Body and headings |
| `--ash` | `#838280` | Meta text |
| `--hairline` | `#E1DCD3` | 1px dividers on cream |
| `--error` | `#B3361F` | Form errors (AA on cream) |

All text pairs meet WCAG AA. Earth accents never appear on buttons.

**Type:** Fraunces at weight 300 for display and section headings (substitute for Oura's Editorial New), Manrope for body and UI (substitute for AkkuratLL; covers Cyrillic), JetBrains Mono for HSN codes and specs. Scale: display 110 → 48 px (mobile), h1 68, h2 40, title 32, lead 24 (Fraunces 300), body 18, body-sm 16, ui 14, caption 13, eyebrow 12 / 700 / uppercase / 1px tracking. Serif for feeling, sans for facts; scale (not weight) creates hierarchy. Per-locale substitutes loaded only on that locale: IBM Plex Sans Arabic (ar), Noto Serif + Manrope Cyrillic (ru), Noto Sans SC (zh). Fonts self-hosted.

**Shape and space:** 8 px base unit. Buttons and tabs are full pills (`999px`); cards 24 px; large product imagery 40 px; inputs 12 px; full-bleed imagery and bands 0. Elevation is soft and warm — separation comes from surface-world shifts and hairlines. Long vertical silences between sections.

**Responsive:** breakpoints 1280 / 1024 / 768. Grids collapse 4-up → 2-up (tablet) → 1-up (mobile); horizontal nav collapses to a menu below 860 px; display type scales fluidly; touch targets ≥ 44 px; product imagery keeps its rounded frame at every size; nothing scrolls horizontally at 320 px.

**Motion rules:** Lenis smooth scroll; Motion (`motion` package — the framework-free build of Framer Motion) for scroll-linked and in-view effects: line-by-line heading reveals, image reveals, hero copy fading as it scrolls away, a sticky farm-to-port story driven by scroll progress, subtle image parallax, counters, and map routes drawing in. One easing curve `cubic-bezier(0.22, 1, 0.36, 1)` and two durations (0.6 s, 1.1 s). 3D product objects rotate once on entry then are drag-to-rotate; no infinite spin. `prefers-reduced-motion` disables Lenis, particles, parallax and reveals (content shown immediately).

**Trust details:** HSN/spec blocks styled like trade documents (hairline rules, monospace). Stock images carry a small "Representative image" label, driven by an `isStock` flag in image data. Market names shown as place tags.

## 6. Internationalisation

**Core languages (real pages):** en (default, no prefix), ar, fr, es, pt, ru, zh, id, de. Astro i18n routing; `hreflang` for every alternate plus `x-default`; `<html lang>` and `dir="rtl"` for Arabic with logical CSS properties throughout.

**Switcher:** floating pill (flag + code) bottom-left plus a globe in the header, opening a searchable list of 104 languages shown in their own script. Core-language choice navigates to the localised URL. Non-core choice lazy-loads the Google Translate element and applies the language; if the element fails to load, fall back to opening the page via translate.google.com. Choice remembered in `localStorage` (wrapped in try/catch).

**Browser-language suggestion:** if `navigator.language` matches a core language other than the current page, show a dismissible banner in that language. Never auto-redirect.

**Translation workflow:** AI-drafted translations for all UI strings and product content, each file marked `reviewStatus: pending`. Missing strings fall back to English and are listed in a build report. Owner or native speaker reviews key pages before launch.

## 7. Architecture

**Stack:** Astro 5 (`output: 'static'`), TypeScript, plain CSS with design tokens, Three.js, Motion, Lenis, `@astrojs/sitemap`, `@astrojs/mdx`, `@astrojs/rss`, Vercel adapter-free static deploy, Vercel Analytics + Speed Insights.

**Content model**

```
src/content/
  products/{slug}.yaml                 language-neutral: hsn[], varieties[] (id, hsn, specs, packing,
                                       region, market, images), regions[], harvestMonths[],
                                       ports[], moq, shelfLife, model?, hsnVerified
  products-i18n/{lang}/{slug}.yaml     name, summary, sourcingStory, variety names/descriptions, faq[]
  hsn-i18n/{lang}/{code}.yaml          description, notes, faq[]
  blog/{lang}/{slug}.mdx               frontmatter: title, date, author, category, products[], description
  ui/{lang}.json                       UI strings
  site.yaml                            company name, address, email, WhatsApp, registrations[], stats
src/assets/products/{slug}/            images (owner replaces files of same name)
public/models/{slug}.glb               optional 3D models (≤ 300 KB, Draco/Meshopt compressed)
```

Zod schemas validate every collection. Build fails on malformed HSN (digits only, 4–8 chars), missing required fields, or broken product references in blog posts.

**Components (single responsibility each)**

- `SeoHead` — title, description, canonical, hreflang, OG/Twitter, JSON-LD slot
- `JsonLd/*` — Organization, Product, FAQPage, Article, BreadcrumbList builders from content data
- `HeroParticles` — Three.js scene; inputs: list of product image URLs; outputs nothing; self-disables on no-WebGL/reduced-motion/low `deviceMemory`
- `ProductObject` — loads GLB or procedural instanced mesh (`kind: 'grains' | 'glb'`); poster fallback
- `scripts/motion.ts` — Motion + Lenis wiring driven by `data-reveal`, `data-parallax`, `data-pin`, `data-counter`, `data-draw` attributes
- `WorldMap`, `SouthIndiaMap` — SVG components fed by data
- `LanguageSwitcher`, `LanguageSuggestBanner`
- `QuoteForm` — accepts prefill from query string
- `CertStrip`, `HsnChip`, `SpecTable`, `HarvestCalendar`, `WhatsAppButton`

3D and animation code load as dynamic imports triggered by IntersectionObserver + `requestIdleCallback`.

**Quote form:** fields product, variety, quantity + unit, destination country, destination port, Incoterm (FOB/CFR/CIF/other), packing, name, company, email, WhatsApp, message. Submits to Web3Forms (owner creates the account and access key; key stored in `site.yaml`/env). Honeypot field and minimum time-to-submit check. Inline validation; success state; on network/service failure show prefilled WhatsApp and `mailto:` fallbacks.

**SEO/GEO/AEO:** per-page metadata and build-time OG images; sitemap with i18n alternates; `robots.txt` allowing GPTBot, PerplexityBot, Google-Extended, ClaudeBot; `llms.txt` summarising company, products, HSN codes; answer-first summary paragraph on every product and HSN page; spec-sheet PDFs per variety generated at build from product data; RSS per language.

## 8. Performance budget

- Initial JS ≤ 60 KB gzip; Three.js chunk (~160 KB gzip) loaded lazily only where used.
- Images via `astro:assets`: AVIF/WebP, responsive `srcset`, explicit dimensions, hero poster preloaded.
- Fonts self-hosted, subset per locale, `font-display: swap`, metric-matched fallbacks.
- GLB ≤ 300 KB each.

## 9. Error handling and fallbacks

| Failure | Behaviour |
|---|---|
| No WebGL / low-power device / reduced motion | Static poster image; no particles or 3D |
| GLB missing or fails to load | Poster image stays; no error shown |
| Image missing | Build fails (schema requires image) |
| Translation string missing | English fallback; listed in build report |
| Google Translate element unavailable | Open page via translate.google.com |
| Form service error / offline | Inline message + prefilled WhatsApp and email fallbacks |
| JS disabled | All content, navigation, and links work; form posts directly to Web3Forms |

## 10. Testing

- **Build-time:** Zod content validation; unverified-HSN and missing-translation reports.
- **Playwright smoke tests** (en, ar, zh): every page type renders; hreflang tags present; Arabic is RTL; quote form validation, prefill, and fallback; language switcher navigation; reduced-motion shows content without animation.
- **Lighthouse CI** on landing, one product, one HSN, one blog page: fail below Performance 90 / SEO 100 / Accessibility 95.
- **Link checker** and JSON-LD validation.
- **Responsive:** Playwright checks no horizontal overflow at 320, 375, 768, 1024 and 1440 px on every page type.
- **Visual review:** screenshot-and-fix loop with the taste and impeccable skills at 375, 768, 1024 and 1440 px, checked against `DESIGN.md`.

## 11. Owner-supplied before launch

- Business email, WhatsApp number, office address
- Registration numbers and official logo files for certifications actually held
- HSN verification for arecanut, groundnuts, coconut/copra codes (CHA)
- Confirmation/correction of varieties, regions, MOQ, ports, counters
- Real photos and optional GLB models (replace placeholders by file name)
- Web3Forms access key; Vercel project; Google Search Console and Bing Webmaster verification
- Native-speaker review of core-language pages

## 12. Out of scope (V1)

Export-to-country landing pages (phase 2), CMS/admin panel, live pricing, user accounts, online ordering/payments, 3D globe.
