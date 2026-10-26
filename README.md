# GoodBiz Agri website

Astro static site. Node 20+.

    npm install
    npm run dev        # http://localhost:4321
    npm test           # unit tests
    npm run test:e2e   # browser tests (builds first)
    npm run build      # also prints the content report

## Before launch (owner checklist)

The full, step-by-step version is in `docs/launch-checklist.md`; the keyword plan is in `docs/seo/keyword-map.md`.

The build prints a content report. Clear every item:

1. `src/content/site.yaml` — replace every `REPLACE:` value (legal name, address, email, phone, WhatsApp, lead endpoint, registration numbers). Set `held: false` for any registration you do not hold. The floating WhatsApp button only appears once a real number is set.
2. `site.yaml` `stats` — confirm the counters shown on the home page (countries, products, markets, ports).
3. Lead capture — set up the Google Sheet and Apps Script web app (`docs/lead-capture.md`) and put its URL in `site.yaml` → `leadEndpoint`.
4. Registration logos — APEDA, Spices Board, FSSAI, DGFT (IEC) and Coconut Development Board logos are in `public/logos/` (from each body's official site). FIEO shows as a text badge: add `public/logos/fieo.png` and set `logo: /logos/fieo.png` on the FIEO entry in `site.yaml`. Set `held: false` for any registration you do not hold.
5. Product facts — check varieties, specs and ports in `src/content/products/*.yaml`.
6. Photos — replace files in `src/assets/products/<slug>/` keeping the same names; set `isStock: false` for your own photos.
7. Draft market report — `src/content/blog/en/market-report-2026-10.mdx` is a template with `draft: true`, so it is not published. Write it and set `draft: false`, or delete the file.
8. Translations — have a native speaker review each of the 72 translation files listed under "Pending review"; set `reviewStatus: reviewed`.
9. Served countries — confirm `src/data/countries.ts`.
10. Domain — set `SITE_URL` in Vercel; `robots.txt`, the sitemap, canonical links and `llms.txt` all follow it.
11. Vercel — import the repo, enable Analytics and Speed Insights.
12. Google Search Console and Bing Webmaster Tools — verify the domain and submit `/sitemap-index.xml`.

## Editing content

- Product facts: `src/content/products/<slug>.yaml`
- Product text per language: `src/content/products-i18n/<lang>/<slug>.yaml`
- Interface text: `src/i18n/ui/<lang>.json`
- Blog posts: `src/content/blog/<lang>/<slug>.mdx` (a translation uses the same file name as the English post)
