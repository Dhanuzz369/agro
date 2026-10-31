# Add processed cashew and coco pith; stop naming loading ports

Date: 31 Oct 2026. Site: goodbizagro.com (Astro 5, static, 9 languages: en, ar, fr, es, pt, ru, zh, id, de).

## Why

GoodBiz Agri now trades two more product lines, processed cashew kernels and coco pith (cocopeat). Both need full product pages that rank for buyer searches the same way the existing nine do.

The owner also wants the site to stop saying which Indian port goods load from. They can ship from wherever an order needs, so a fixed port list undersells them and can put off buyers.

## Goals

1. Add two product pages, **Processed cashew** and **Coco pith**, built like the existing nine. Each needs:
   - A data file in `src/content/products/`.
   - Text files in `src/content/products-i18n/<locale>/` for all 9 languages.
   - Varieties with specs, packing, HS codes, images, FAQ, SEO title, H1, description and keywords.
2. Remove every mention of loading or shipping ports, in all 9 languages, from:
   - product pages and their data and text
   - the `/products` compare table
   - the home page "Loading ports" stat
   - spec-sheet PDFs
   - `llms.txt` and the `/ai/*.json` discovery files
   - product FAQs (the "Which ports do you ship … from?" questions)
   - blog posts
3. Update everything that counts or lists products so it includes the two new ones:
   - `site.yaml` `stats.products` (9 → 11)
   - home and products meta descriptions and keywords
   - the home product grid
   - related-product links
   - the sitemap (automatic) and IndexNow afterwards
4. All existing tests keep passing, updated where they assert ports or 9 products. New products are covered by the same tests that cover the existing ones.

## Non-goals

- Do not remove the named markets and towns from the other nine products (for example "Erode Regulated Market"). The owner confirmed these stay; only ports go.
- Do not touch the quote form's **"Destination port"** field. That is the buyer's port, not ours. Any form wording such as "You arrange the ship from our port" must be reworded so it doesn't name or imply a fixed port of ours.
- No new registration logos. The site does not hold a Coir Board or CEPCI (Cashew Export Promotion Council) RCMC, so it must not claim one. The certifications strip stays as is.
- No roasted or flavoured cashew. Only raw processed kernels.

## Anti-goals (would count as failure even if it builds)

- Inventing claims: no RHP certificate, no OMRI, no GACC or NPPO registration, no "our plant", no prices, offers, reviews or volumes. The playbook's market figures are research, not GoodBiz facts, and do not go on the page as claims about GoodBiz.
- Naming a single supplier, plant or town for coco pith or cashew. Both are sourced from several suppliers, chosen per order.
- Reintroducing anything the owner rejected earlier: HSN codes shown as a separate visible section, harvest-season charts, MOQ, the South India map, 3D objects, or "Representative image" labels.
- Any port name left anywhere on the site in any language (Chennai, Kochi or Cochin, Tuticorin or VOC, Mangalore or New Mangalore) as a loading port. City names used as a place of sourcing are fine.

## Coco pith (decided with the owner; details from the owner's playbook)

**Sourcing.** Karnataka, Tamil Nadu and Kerala, from several suppliers, chosen to match each order's specification. No town or plant is named. The schema currently requires `regions` (place ids), `markets`, and a per-variety `region` and `market`. The builder must let these products express "states, several suppliers" without inventing a town. See "Left to the builder".

**HS code.** `53050040` (coir pith). It covers every format below.

**Varieties (formats)**, each with an image, specs and packing:

| id | Name | Key specs |
|---|---|---|
| `block-5kg` | 5 kg blocks (5:1 compression) | Expands to 65–80 L; EC grade to order; moisture ≤ 15–20%; sand ≤ 2%; weight ±100 g |
| `grow-bags` | Grow bags / slabs | Typical 100 × 15–20 × 10–18 cm, open top or pre-cut holes; buffered low-EC |
| `pith-chip-mix` | Pith and chip mixes | 70:30 or 50:50 pith to husk chip, for berry and avocado pots |
| `bricks-discs` | 650 g bricks, discs, pellets | Retail and propagation; private label |
| `husk-chips` | Husk chips | Graded sizes, for orchids, tomatoes and peppers |

**Grades** go in the specs or in a grades line, not as separate varieties:

| Grade | EC |
|---|---|
| Buffered (calcium nitrate), premium | < 0.5 mS/cm |
| Washed | 0.5–1.0 mS/cm |
| Raw / high EC | 1.5 mS/cm and above |

pH is 5.5–6.5. The contract always states the EC test method (for example 1:5 per EN 13038), as the playbook advises. That makes a good FAQ answer.

**Container load.** 40 ft HC: 5 kg blocks about 22–24 t, grow bags about 11–15 t. The 20 ft load is not in the playbook; the builder states it only if a reliable standard figure exists, otherwise marks it "on request".

**FAQ topics:**
- EC grades and test method
- buffered vs washed
- expansion volume
- formats and private label
- phytosanitary certificate per shipment
- the EU coir exemption for unused coconut fibre

None of the answers names a port.

**Export body.** The Coir Board is the export promotion council for HS 5305. Mention it only as a fact about the product, never as a registration GoodBiz holds.

## Processed cashew (decided with the owner)

**Sourcing.** Processors in Kerala, Karnataka and Tamil Nadu, several suppliers, chosen per order. No town named.

**HS codes.** `08013210` (whole kernels) and `08013220` (broken kernels).

**Varieties**, using the standard AFI grades:

- **Whole kernels:** W180, W210, W240, W320, W450, plus SW (scorched wholes).
- **Splits and pieces:** S (splits), B (butts), LWP (large white pieces), SWP (small white pieces), BB (baby bits).

That makes 11 grades. The builder decides whether each grade is its own variety, or whether there are fewer varieties (for example "White wholes", "Scorched wholes", "Splits and butts", "Pieces") with the grades listed in specs. The deciding factor is what the existing variety cards, spec-sheet PDFs and per-variety quote links handle cleanly. Either way, every grade name above appears on the page, because buyers search by grade.

**Specs** come from the AFI specification:
- count per lb for each whole grade (W180 = 170–180 per lb, and so on)
- moisture ≤ 5%
- broken and lower-grade tolerances
- colour (white, pale ivory)
- aflatoxin tested to the destination limit

**Packing.** Vacuum-packed or nitrogen-flushed 2 × 25 lb (22.68 kg) tins in a carton, or 10 kg flexi bags. Private label on request.

**Container load.** Typical published figures: 20 ft about 700 cartons of 50 lb (about 15.9 t). The builder verifies these against a reliable source before stating them.

**FAQ topics:**
- what the W-numbers mean
- wholes vs splits vs pieces
- moisture and shelf life
- packing (tins, vacuum)
- aflatoxin and lab tests

## Ports removal: what the owner decided

- Ports go from the product data schema (`ports` field), the product pages ("Loading ports" fact), the compare table column, the home "Loading ports" stat (and `stats.ports`), spec-sheet PDFs, AI discovery files, `llms.txt`, product summaries ("…shipped from Chennai, Tuticorin and Kochi…"), FAQ answers, SEO descriptions, and blog posts.
- Where a sentence needs a replacement, say something true and general, for example "shipped FOB, CFR or CIF from the Indian port that suits the order". The idea is "any Indian port".
- The port entries in `src/data/places.ts` (`kind: 'port'`) can be removed if nothing else uses them.

## Constraints

- All 9 languages must stay in parity. The translation-parity unit test enforces this for UI strings, and new product text files are needed in every locale. Translations match the quality of the existing ones (the builder writes them, using the same terms as the existing translated pages).
- New product data phrases (shelf life, packing, container loads) go into `src/i18n/data/<locale>.json` so they translate, like the existing 90 phrases.
- Images: free-licence stock photos (Unsplash or Pexels), `isStock: true`, credited in `src/assets/CREDITS.md` with "exact" or "generic", the same as the existing products. No "Representative image" label.
- Each new product's `updated:` is the date it's built. The sitemap, schema `dateModified` and visible "last updated" line follow automatically.
- Tests never post leads to the real Apps Script endpoint.
- Nothing is pushed to GitHub without the owner's go-ahead.
- After deploying, run `npm run indexnow` for the changed URLs.

## Answers from the review

These come from the conversation, the playbook, or are my calls. My calls are marked as such.

**Deploy.** Vercel deploys whenever `master` is pushed to GitHub, so the plan stops at a local commit. The owner approves the push. IndexNow runs only after the push is live.

**Playbook facts for the coco pith FAQs.** These come from the owner's playbook ("Coco Pith Export Playbook", 30 Oct 2026), which is not in the repo:
- EU Implementing Regulation 2019/2072, Annex VI, exempts growing media made "entirely of fibre of *Cocos nucifera*, previously not used". The UK has the same exemption.
- A phytosanitary certificate from India's plant quarantine service (PPQS) goes with every shipment.
- Fumigation, where a destination requires it, is done by an NPPO-accredited agency.
- Some destinations add their own conditions. Peru, for example, requires an NPPO-registered packing plant and ISPM-15 pallets.

The FAQs state these as rules of the market. They do not claim that GoodBiz holds any registration.

**More port mentions to remove:**
- `home.journey.s4.body` ("Stuffed at Chennai, Kochi, Tuticorin or New Mangalore…")
- `home.faq.a1` ("FOB, CFR and CIF from Chennai, Kochi…")

Both get a port-free rewrite in all 9 languages.

**Husk chips HS code** (my call). Leave husk chips under `53050040` with the other coco pith formats, as the playbook lists them. HS codes stay `verified: false`, as the content test requires.

**Home "Why" stats** (my call). The section already has a "Product lines" stat, which becomes 11. The "Loading ports" stat is removed without a replacement, leaving 3 figures: countries, product lines and sourcing markets. `stats.markets: 18` stays, because the named markets of the other nine products are unchanged.

**Unverifiable container loads** (my call). If a reliable source can't be found for a figure, the page says "On request" instead, for cashew 20 ft or 40 ft and for coco pith 20 ft.

**Site-wide sourcing wording** (my call). The lines that say everything is "bought direct from the markets where they grow" become true for processed goods too:
- `hero.lede` lists all products, adding cashew and coco pith, and ends "…bought from the markets and processors where they are made".
- `meta.aboutDescription`, `home.journey.s1.body` and the `llms.ts` "Business:" line also mention processors.

All 9 languages are updated.

**Lab testing** (owner confirmed). Every cashew and coco pith lot is lab-tested too:
- cashew: moisture and aflatoxin
- coco pith: EC, pH and sand

The existing "lab-tests every lot" claims stay. `home.journey.s2.body` gets a general wording that covers both food and coco pith tests, for example "tested for moisture, aflatoxin, residues or, for coco pith, EC and pH". The product pages and FAQs may state this testing.

## Left to the builder

- How to model "several suppliers in these states" in the schema without a fake town. For example, make `regions` accept state-level ids, or add an optional `sourcingStates` field and make `markets` and per-variety `market` optional.
- Product order on the grid and in `related` links.
- Cashew variety granularity (see above).
- Slugs. The suggestion is `/products/cashew` and `/products/coco-pith`, chosen for the search terms "cashew kernels exporter India" and "coco pith exporter India".
- Any new spec keys needed (for example `ec`, `ph`, `expansion`, `countPerLb`), added to `specKeys` with labels in all 9 languages.
- `harvestMonths` for products with no harvest season (it is required in the schema but not shown).
