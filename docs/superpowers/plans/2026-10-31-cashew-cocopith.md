# Cashew, coco pith and no loading ports: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two product pages, `/products/cashew` and `/products/coco-pith`, in all 9 languages, and remove every mention of loading ports from the site.

**Architecture:**
- Products are YAML data files (`src/content/products/<slug>.yaml`) with per-locale text (`src/content/products-i18n/<locale>/<slug>.yaml`), rendered by `ProductView.astro` and `ProductsView.astro`.
- Ports leave the schema entirely.
- Products sourced "from several suppliers in these states" use new state-level place ids. Their per-variety region and market are optional.
- The product page then gets one interaction-polish pass following Emil Kowalski's design-engineering rules.

**Tech stack:** Astro 5 (static), zod content schemas, Vitest, Playwright, pdf-lib, sharp.

**Spec:** `docs/superpowers/specs/2026-10-31-cashew-cocopith-design.md`. Read it before starting. Its "Anti-goals" and "Answers from the review" sections apply to every task.

## Global constraints

- **9 locales:** en, ar, fr, es, pt, ru, zh, id, de. Every UI key, product text file and data phrase exists in all 9. `tests/unit/translations.test.ts` enforces this.
- **No loading-port names as GoodBiz's ports, in any language:** Chennai, Kochi/Cochin (as a port), Tuticorin/VOC, Mangalore/New Mangalore. When a sentence needs shipping wording, use "shipped FOB, CFR or CIF from the Indian port that suits the order".
- **Facts:**
  - No invented claims: no RHP, OMRI, GACC, NPPO, Coir Board or CEPCI registration, no "our plant", and no prices or volumes.
  - The Coir Board may be named only as the export body for HS 5305.
- **Sourcing wording:**
  - Coco pith: "Karnataka, Tamil Nadu and Kerala, from several suppliers chosen to match each order".
  - Cashew: "Kerala, Karnataka and Tamil Nadu, from several processors chosen per order".
  - Never name a town or plant for either.
- **Lab testing (owner confirmed):** every lot is tested. Cashew: moisture and aflatoxin. Coco pith: EC, pH and sand.
- **HS codes:**
  - Cashew: `08013210` (whole) and `08013220` (broken).
  - Coco pith: `53050040`.
  - All are `verified: false`. HS codes never appear in visitor-facing text.
- **Images:** free-licence Unsplash or Pexels photos with `isStock: true`, each credited in `src/assets/CREDITS.md` as exact or generic. No "Representative image" label.
- **Never reintroduce:** a visible HSN section, harvest charts, MOQ, the South India map, 3D objects.
- **Dates:** `updated:` on both new products is the build date (`2026-10-31`).
- **Test environment:**
  - Tests never post to `https://script.google.com/**`. The quote spec already stubs it; keep that.
  - Run e2e on port 4335: start `npx astro preview --port 4335` in the background, then run `E2E_PORT=4335 npx playwright test --timeout=60000`. Port 4321 belongs to another project.
  - Don't run `astro check` (it hangs).
- **Git:** commit locally after each task. Never `git push` without the owner's explicit go-ahead in chat.

## Review focus

1. **Arabic (RTL) spec rows with mixed digits and units** (for example `< 0.5 mS/cm` and `W240: 220–240 / lb`) must read in the right order. A Task 4 e2e test checks that the spec cells on `/ar/products/coco-pith` keep `dir="auto"`.
2. **Long grade lists wrapping on a 375 px phone.** The cashew count row must not cause horizontal page scroll. A Task 5 e2e test checks `/products/cashew` at 375 px.
3. **Varieties with no region or market:**
   - On the page, the variety must not render "Region: undefined".
   - Spec-sheet PDFs must omit those rows rather than print blanks.
   - Unit tests in Task 1 cover this, and Task 4 adds an e2e check.
4. **Quote deep-links to new varieties** (`/contact?product=cashew&variety=pieces`) must pre-select both the product and the variety. The e2e test is in Task 5.
5. **Port names surviving in translations** (`Ченнаи`, `金奈`, `تشيناي`, `Tuticorín` and similar). Task 2 adds a unit test over all 9 locales with each locale's spelling.

---

### Task 1: Remove ports from data and code; let products be sourced by state

**Files:**
- Modify:
  - `src/lib/schemas.ts`
  - `src/data/places.ts`
  - `src/content/products/*.yaml` (all 9: delete the `ports:` line)
  - `src/content/site.yaml` (`stats`: delete `ports`)
  - `src/views/ProductView.astro`
  - `src/views/ProductsView.astro`
  - `src/components/home/Why.astro`
  - `src/lib/specsheet.ts`
  - `src/pages/spec-sheets/[product]/[variety].pdf.ts`
  - `src/lib/llms.ts`
  - `src/lib/ai-discovery.ts`
  - `src/i18n/ui/*.json` (all 9: delete `fact.ports` and `home.why.stat.ports`)
- Test:
  - `tests/unit/content.test.ts`
  - `tests/unit/specsheet.test.ts`
  - `tests/unit/jsonld.test.ts` (stub `stats` without `ports`)
  - `tests/e2e/seo.spec.ts` (llms.txt string list: drop `'New Mangalore'`)

**Interfaces:**
- Produces:
  - `places` drops the four `kind: 'port'` entries and adds `karnataka`, `tamilNadu`, `kerala` with `kind: 'state'` (`name` = state name, `state` = state name, lon/lat = state centroid). The kind union becomes `'district' | 'state' | 'hq'`.
  - `placeLabel(id: PlaceId): string` in `src/data/places.ts` returns `name` for a state, otherwise `` `${name}, ${state}` ``.
  - `productSchema`:
    - drops `ports`
    - `markets: z.array(z.string())` (may be empty)
    - `harvestMonths` optional
    - variety `region` and `market` optional
  - `specKeys` gains `'ec'`, `'ph'` and `'expansion'`.
  - `siteSchema.stats` drops `ports`.
  - `SpecSheetInput` drops `ports`, and `region` and `market` become optional. `buildSpecSheet` skips a row whose value is undefined.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/content.test.ts
it('no product declares loading ports', () => {
  for (const f of readdirSync(dir)) expect(parse(readFileSync(join(dir, f), 'utf8')).ports, f).toBeUndefined();
});
it('accepts a variety with no region or market', () => {
  const raw = parse(readFileSync(join(dir, 'turmeric.yaml'), 'utf8'));
  delete raw.varieties[0].region; delete raw.varieties[0].market; raw.markets = [];
  expect(() => productSchema(imageStub).parse(raw)).not.toThrow();
});
// tests/unit/specsheet.test.ts
it('omits Region and Market rows when absent', async () => {
  const bytes = await buildSpecSheet({ productName: 'Coco pith', varietyName: '5 kg blocks', specs: [{ label: 'EC', value: '< 0.5 mS/cm' }], packing: ['Pallets'], contact: 'a@b.c', url: 'https://goodbizagro.com/products/coco-pith' });
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
});
```

Also add a `placeLabel` test: `placeLabel('kerala')` returns `'Kerala'`, and `placeLabel('erode')` returns `'Erode, Tamil Nadu'`.

- [ ] **Step 2: Run the tests and confirm they fail.** Run `npx vitest run tests/unit/content.test.ts tests/unit/specsheet.test.ts`. Expect: FAIL (ports defined; region required; `placeLabel` not exported).

- [ ] **Step 3: Implement.**
  - Make the schema and places changes listed above. Delete every `ports:` line and `stats.ports`.
  - `ProductView.astro`:
    - Remove `portNames` and the "Loading ports" fact.
    - Render `.var__where` only when `v.region` is set; its region text uses `placeLabel`.
    - Render `.pv__markets` only when `markets.length`.
  - `ProductsView.astro`: remove the ports column (header and cells).
  - `Why.astro`: remove the ports stat. Three stats remain.
  - `llms.ts`:
    - Remove the "shipping from …" clause, the `## Loading ports` section and the per-product "Loading ports" line.
    - "Sourced from" uses `placeLabel`.
    - Print "Markets we buy in" only when non-empty.
  - `ai-discovery.ts`: remove both `loadingPorts` fields.
  - Remove the two UI keys from all 9 locale JSONs.
  - `jsonld.test` stub: delete `ports`.
  - `seo.spec.ts` llms.txt list: drop `'New Mangalore'`.

- [ ] **Step 4: Run the tests and confirm they pass.** Run `npx vitest run`. Expect: all pass.

- [ ] **Step 5: Commit.** `git commit -am "refactor: drop loading ports; allow state-level sourcing"`

### Task 2: Port-free copy in all 9 languages

**Files:**
- Modify:
  - `src/content/products-i18n/<locale>/<slug>.yaml` (9 locales × 9 products)
  - `src/i18n/ui/*.json` (`home.journey.s4.body`, `home.faq.a1`, `form.inc.fob`)
- Test: `tests/unit/translations.test.ts`

**Interfaces:** consumes nothing new.

- [ ] **Step 1: Write the failing test** in `translations.test.ts`:

```ts
const portNames: Record<string, RegExp> = {
  en: /Chennai|Tuticorin|Mangalore|Kochi Port|Cochin Port|ports? (?:of|at) Kochi/i,
  ar: /تشيناي|توتيكورين|مانغالور|مانجالور/, fr: /Chennai|Tuticorin|Mangalore/i, es: /Chennai|Tuticor[ií]n|Mangalore/i,
  pt: /Chennai|Tuticorin|Mangalore/i, ru: /Ченна|Тутикорин|Мангалор/, zh: /金奈|图蒂科林|杜蒂戈林|门格洛尔|芒格洛尔/,
  id: /Chennai|Tuticorin|Mangalore/i, de: /Chennai|Tuticorin|Mangalore/i,
};
it.each(Object.keys(portNames))('%s text names no loading port', (l) => {
  const files = [`src/i18n/ui/${l}.json`, ...readdirSync(`src/content/products-i18n/${l}`).map((f) => `src/content/products-i18n/${l}/${f}`)];
  for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(portNames[l]);
});
```

Kochi as a sourcing place is allowed (ginger: "Kochi's spice trade", "Cochin ginger"). That's why `en` only matches Kochi in a port phrase.

- [ ] **Step 2: Run the test and confirm it fails.** Run `npx vitest run tests/unit/translations.test.ts`. Expect: FAIL in every locale.

- [ ] **Step 3: Rewrite the copy.** In every locale's product text:
  - `summary`: replace the "shipped from <ports>" clause with nothing, or with "shipped FOB, CFR or CIF". The summary must still match `^GoodBiz Agri exports .+ from .+` in English, which `seo.spec.ts:220` checks against the sourcing places.
  - The "Which ports do you ship X from?" FAQ: keep the item, because the FAQ count must match English. Change it to "Which port do you ship X from?" with the answer "We ship from the Indian port that suits your order and destination, on FOB, CFR or CIF terms."
  - SEO descriptions: remove any port names.
  - `home.journey.s4.body`: "Stuffed at the Indian port that suits your order, with origin, phytosanitary, FSSAI and analysis certificates."
  - `home.faq.a1`: "FOB, CFR and CIF from the Indian port that suits your order. Other terms on request."
  - `form.inc.fob`: "You arrange the ship from the Indian port".
  - Translate each into the 8 other locales, matching each file's existing terms.

- [ ] **Step 4: Run the tests and confirm they pass.** Run `npx vitest run`. Expect: all pass, including `seo.test.ts` (title and description lengths).

- [ ] **Step 5: Commit.** `git commit -am "content: port-free shipping copy in all languages"`

### Task 3: Site-wide sourcing and testing wording

**Files:**
- Modify:
  - `src/i18n/ui/*.json`: `hero.lede`, `meta.homeDescription`, `meta.productsDescription`, `meta.homeKeywords`, `meta.productsKeywords`, `meta.aboutDescription`, `home.journey.s1.body`, `home.journey.s2.body`, `products.title` (only if it says "agro" in a way that excludes coco pith; otherwise leave it)
  - `src/lib/llms.ts`: intro paragraph product list and the "Business:" line
  - `src/content/site.yaml`: `stats.products: 11`
- Test: `tests/e2e/seo.spec.ts` (llms.txt list)

- [ ] **Step 1: Write the failing test.** Add `'cashew'`, `'W320'`, `'coco pith'` and `'processors'` to the llms.txt string list in `seo.spec.ts:13`.
- [ ] **Step 2: Implement.** English values:
  - `hero.lede`: "Rice, turmeric, ginger, arecanut, jaggery, groundnuts, copra, cashew kernels and coco pith, bought from the markets and processors where they are made."
  - `meta.homeDescription` and `meta.productsDescription`: add "cashew kernels" and "coco pith". Keep the length within the limits `seo.test.ts` checks.
  - `meta.aboutDescription`: "…that buys from South India's producing markets and processors, lab-tests every lot…"
  - `home.journey.s1.body`: keep the named markets and add "and from trusted cashew and coir processors".
  - `home.journey.s2.body`: "Lots are cleaned, sorted and tested for moisture, aflatoxin and residues, or for EC, pH and sand in coco pith, before they are accepted."
  - `llms.ts` "Business:" line: "…sourced from producing markets (APMC yards), mills, processors and traders in Karnataka, Tamil Nadu, Kerala and Andhra Pradesh."
  - The llms intro list gains "cashew kernels (W180–W450 wholes, splits and pieces)" and "coco pith (cocopeat blocks, grow bags, mixes, bricks, husk chips)".
  - Translate all 9 UI values.
- [ ] **Step 3: Run the tests.** Run `npx vitest run` (unit only for now). Expect: pass. The llms e2e test passes after Task 5 adds the products.
- [ ] **Step 4: Commit.** `git commit -am "content: sourcing and testing wording covers processed lines"`

### Task 4: Coco pith product

**Files:**
- Create:
  - `src/content/products/coco-pith.yaml`
  - `src/content/products-i18n/{en,ar,fr,es,pt,ru,zh,id,de}/coco-pith.yaml`
  - `src/assets/products/coco-pith/{hero,block-5kg,grow-bags,pith-chip-mix,bricks-discs,husk-chips}.jpg`
- Modify:
  - `src/i18n/data/*.json` (8 dictionaries: every new worded phrase)
  - `src/i18n/ui/*.json` (`spec.ec` "EC (electrical conductivity)", `spec.ph` "pH", `spec.expansion` "Expanded volume", in 9 locales)
  - `src/lib/jsonld.ts` (`productCategory['coco-pith'] = 'Home & Garden > Lawn & Garden > Gardening'`)
  - `src/views/ProductView.astro` (the documents list omits `doc.fssai` for non-food products; decide by `productCategory[slug]` starting with the food root)
  - `src/assets/CREDITS.md`
- Test:
  - `tests/unit/content.test.ts`
  - `tests/e2e/product.spec.ts`

**Interfaces:**
- Consumes:
  - from Task 1: place ids `karnataka`, `tamilNadu`, `kerala`; spec keys `ec`, `ph`, `expansion`; optional variety `region` and `market`
- Produces: slug `coco-pith`, with variety ids `block-5kg`, `grow-bags`, `pith-chip-mix`, `bricks-discs`, `husk-chips`

**Data values** (from the spec):
- `regions: [karnataka, tamilNadu, kerala]` and `markets: []`. No `region` or `market` on varieties.
- `hsn: [{ code: "53050040", verified: false }]`.
- Every variety has `hsn: "53050040"`.
- `shelfLife: "24 months, stored dry"`.
- `containerLoad`:
  - `ft40`: `"5 kg blocks 22–24 MT · Grow bags 11–15 MT"`
  - `ft20`: `"On request"`
- `related: [coconut-copra, cashew]`.
- Specs:
  - `block-5kg`: `expansion` "65–80 L per block (5:1 compression)"; `ec` "Buffered < 0.5 · Washed 0.5–1.0 · Raw ≥ 1.5 mS/cm"; `ph` "5.5–6.5"; `moisture` "≤ 15–20%"; `foreignMatter` "Sand ≤ 2%"; `size` "5 kg ± 100 g"
  - `grow-bags`: `size` "100 × 15–20 × 10–18 cm, open top or pre-cut holes"; `ec` "Buffered < 0.5 mS/cm"; `ph` "5.5–6.5"
  - `pith-chip-mix`: `purity` "Pith : chip 70:30 or 50:50"; `ec` "Buffered < 0.5 mS/cm"; `ph` "5.5–6.5"
  - `bricks-discs`: `size` "650 g bricks · discs · pellets"; `expansion` "8–9 L per 650 g brick"; `ec` "Washed or buffered to order"
  - `husk-chips`: `size` "Graded chip sizes to order"; `ec` "Washed or buffered to order"; `foreignMatter` "Sand ≤ 2%"
- English text:
  - `originLine`: "Karnataka, Tamil Nadu and Kerala — several coir suppliers"
  - `summary`: "GoodBiz Agri exports coco pith (cocopeat) — 5 kg blocks, grow bags, pith and chip mixes, bricks and husk chips — from coir suppliers in Karnataka, Tamil Nadu and Kerala, in buffered, washed or raw EC grades, lab-tested for EC, pH and sand."
  - Six FAQs, per the spec's coco pith FAQ topics. The EU answer cites Regulation 2019/2072 Annex VI as a market rule.
  - SEO title "Coco Pith Exporter India: Cocopeat Blocks, Grow Bags" (check the length limit in `seo.test.ts`); h1 "Coco pith blocks, grow bags and mixes".
  - Keywords: coco pith exporter India, cocopeat blocks, coir pith grow bags, buffered cocopeat, low EC coco peat, coco husk chips.

- [ ] **Step 1: Write the failing tests.**
  - Add `'coco-pith'` to `slugs` and `'53050040'` to the HSN list in `content.test.ts`.
  - Add `0801|5305` to the tariff regex in `translations.test.ts`.
  - In `product.spec.ts`:

```ts
test('coco pith page: varieties, no region line, no FSSAI doc, RTL spec cells', async ({ page }) => {
  await page.goto('/products/coco-pith');
  await expect(page.locator('[data-variety]')).toHaveCount(5);
  await expect(page.locator('.var__where')).toHaveCount(0);
  await expect(page.locator('.pv__docs')).not.toContainText('FSSAI');
  await page.goto('/ar/products/coco-pith');
  await expect(page.locator('.var td[dir="auto"]').first()).toBeVisible();
});
```

- [ ] **Step 2: Run the tests and confirm they fail.** Run `npx vitest run tests/unit/content.test.ts`. Expect: FAIL (file missing).
- [ ] **Step 3: Implement.**
  - Find the photos and credit them.
  - Process each photo with sharp to JPEG at about 1600 px wide, the same as the existing images.
  - Write the data, the English text, and the 8 translations (same variety keys and FAQ count), the dictionary phrases and the spec labels.
- [ ] **Step 4: Build and run the tests.** Run `npm run build && npx vitest run`, then the e2e command for `product.spec.ts`. Expect: pass.
- [ ] **Step 5: Commit.** `git commit -am "feat: coco pith product page in 9 languages"`

### Task 5: Processed cashew product

**Files:**
- Create:
  - `src/content/products/cashew.yaml`
  - `src/content/products-i18n/*/cashew.yaml` (9 locales)
  - `src/assets/products/cashew/{hero,white-wholes,scorched-wholes,splits-butts,pieces}.jpg`
- Modify:
  - `src/i18n/data/*.json`
  - `src/lib/jsonld.ts` (`productCategory.cashew = `${food} > Nuts & Seeds``)
  - `src/assets/CREDITS.md`
- Test:
  - `tests/unit/content.test.ts`
  - `tests/e2e/product.spec.ts`
  - `tests/e2e/quote.spec.ts`

**Interfaces:**
- Consumes: the Task 1 state place ids
- Produces: slug `cashew`, with variety ids `white-wholes`, `scorched-wholes`, `splits-butts`, `pieces`

The grouping into 4 varieties is my call, as the spec allows. Every grade name still appears on the page.

**Data values:**
- `regions: [kerala, karnataka, tamilNadu]` and `markets: []`.
- `hsn: 08013210` (wholes) and `08013220` (splits and pieces), both `verified: false`.
- `shelfLife: "12 months in vacuum or nitrogen-flushed tins"`.
- `packing: ["2 × 25 lb (22.68 kg) vacuum tins per carton", "10 kg vacuum flexi bags", "Private label on request"]`.
- `containerLoad` uses verified figures. If none can be verified, use `"On request"`.
- `related: [groundnuts, arecanut, coco-pith]`.
- Specs:
  - `white-wholes`: `count` "W180: 170–180 · W210: 200–210 · W240: 220–240 · W320: 300–320 · W450: 400–450 kernels per lb"; `moisture` "≤ 5%"; `colour` "White, pale ivory or light ash"; `broken` "≤ 5% lower grade"; `aflatoxin` "Lab-tested to the destination limit"
  - `scorched-wholes`: `colour` "Light brown from over-scorching (SW, SW240, SW320)"; `moisture` "≤ 5%"; `aflatoxin` (same as above)
  - `splits-butts`: `size` "S: split lengthwise · B: broken crosswise"; `moisture` "≤ 5%"; `colour` "White or pale ivory"
  - `pieces`: `size` "LWP: large white pieces · SWP: small white pieces · BB: baby bits"; `moisture` "≤ 5%"; `aflatoxin` "Lab-tested to the destination limit"
  - All varieties pack in tins: wholes in "2 × 25 lb vacuum tins", pieces in "2 × 25 lb vacuum tins · 10 kg flexi bags".
- English text:
  - `name`: "Cashew kernels"
  - `originLine`: "Kerala, Karnataka and Tamil Nadu — several processors"
  - `summary`: "GoodBiz Agri exports processed cashew kernels — W180, W210, W240, W320 and W450 wholes, scorched wholes, splits, butts and pieces (LWP, SWP, BB) — from processors in Kerala, Karnataka and Tamil Nadu, vacuum-packed and lab-tested for moisture and aflatoxin."
  - FAQs (5): what the W-numbers mean; wholes vs splits vs pieces; moisture and shelf life; packing; aflatoxin and lab tests.
  - SEO h1: "Cashew kernels: W180 to W450, splits and pieces".

- [ ] **Step 1: Write the failing tests.**
  - Add `'cashew'` to the content slugs and its 2 HSN codes to the list.
  - `product.spec.ts`:
    - `/products/cashew` shows 4 `[data-variety]` and contains each of W180, W210, W240, W320, W450, SW, LWP, SWP and BB.
    - At a 375 × 812 viewport, `document.documentElement.scrollWidth <= 375`.
  - `quote.spec.ts`: `/contact?product=cashew&variety=pieces` has `input[name=product][value=cashew]` checked, and the variety step shows `pieces` selected. Keep the existing `script.google.com` route stub.
- [ ] **Step 2: Run the tests and confirm they fail.**
- [ ] **Step 3: Implement.** Use the same steps as Task 4.
- [ ] **Step 4: Build and run the tests.** Then update the count assertions from 9 to 11:
  - `home.spec.ts:10-12`
  - `product.spec.ts:33-35`
  - `seo.spec.ts:255` and `seo.spec.ts:263`
  - any other `toHaveCount(9)` that counts products (grep for it)

  Run the full e2e suite. Expect: all pass.
- [ ] **Step 5: Commit.** `git commit -am "feat: cashew kernels product page in 9 languages"`

### Task 6: Product-page interaction polish (Emil Kowalski's design-engineering rules)

**Files:**
- Modify:
  - `src/styles/global.css` (`.btn`)
  - `src/styles/tokens.css`
  - `src/components/ProductCard.astro`
  - `src/components/Faq.astro`
- Test: `tests/e2e/layout.spec.ts`

These changes reach every product page, including the two new ones. Each row is one change:

| Before | After | Why |
| --- | --- | --- |
| `.btn` transitions `transform` over `--dur-1` (0.6 s) | `transform 160ms var(--ease-out)`; colours `150ms ease` | Press feedback must land in 100–160 ms; 0.6 s feels laggy |
| `.pc__link:hover` scales the image on every device | Wrap it in `@media (hover: hover) and (pointer: fine)` | A tap on touch screens triggers sticky hover zooms |
| Card image zoom over `--dur-2` (1.1 s) to `scale(1.04)` | `transform 300ms var(--ease-out)` to `scale(1.03)` | Hover is seen tens of times per visit; keep it short and subtle |
| FAQ `+` rotates over 0.6 s | `transform 200ms var(--ease-out)` | It's a toggle; under 300 ms |
| A single `--ease` token | Add `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` and use it for the above | A stronger ease-out curve gives quicker initial feedback |
| Card links have no press state | `.pc__link:active .pc__media { transform: scale(0.98) }` | A pressable element should acknowledge the press |

Reduced motion: under `prefers-reduced-motion: reduce`, remove these transforms but keep the colour transitions.

- [ ] **Step 1: Write the failing test** in `layout.spec.ts`. On `/products`, the computed `transition-duration` of `.btn--primary` includes `0.16s`, and with `reducedMotion: 'reduce'` the computed `transform` of `.pc__media img` on hover is `none`.
- [ ] **Step 2: Run the test and confirm it fails.**
- [ ] **Step 3: Implement** the table above.
- [ ] **Step 4: Run** `layout.spec.ts` and `home.spec.ts`. Expect: pass.
- [ ] **Step 5: Commit.** `git commit -am "style: snappier press and hover states on product pages"`

### Task 7: Verify the whole site, then stop for the owner's go-ahead

- [ ] **Step 1:** Run `npm run build && npx vitest run`, then the full e2e suite on port 4335. Expect: all green. Record the counts.
- [ ] **Step 2:** Run `grep -rEil "Chennai|Tuticorin|Mangalore" dist | grep -v _astro`. Expect: no output.
- [ ] **Step 3:** Take screenshots with a temporary `.shot.mjs` (delete it afterwards):
  - pages: `/products/cashew`, `/products/coco-pith`, `/ar/products/coco-pith`, `/products`, home
  - viewports: desktop 1440 and phone 375

  Look at each one.
- [ ] **Step 4:** Check that `sitemap-products.xml` lists the 18 new URLs (2 products × 9 locales) with `lastmod` 2026-10-31.
- [ ] **Step 5:** Commit any fixes. Ask the owner to approve the push. Do not push yet.
- [ ] **Step 6 (after the owner approves the push and Vercel is live):** Run `npm run indexnow -- /products/cashew /products/coco-pith /products /` plus the 16 locale URLs of the two new pages.
