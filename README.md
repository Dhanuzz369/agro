# GoodBiz Agri website

Astro static site. Node 20+.

    npm install
    npm run dev        # http://localhost:4321
    npm test           # unit tests
    npm run test:e2e   # browser tests (builds first)
    npm run build      # also prints the content report

## Before launch (owner checklist)

The build prints a content report. Clear every item:

1. `src/content/site.yaml` — replace every `REPLACE:` value (legal name, address, email, phone, WhatsApp, Web3Forms key, registration numbers). Set `held: false` for any registration you do not hold. The floating WhatsApp button only appears once a real number is set.
2. `site.yaml` `stats` — confirm the counters shown on the home page (countries, products, markets, ports).
3. Web3Forms — create the account, set the destination inbox for quote requests, and put the access key in `site.yaml`.
4. Certification logos — put official files in `public/logos/` and set `logo: /logos/<file>` per registration.
5. HSN codes marked unverified (arecanut, groundnuts, coconut/copra) — confirm with your CHA, then set `verified: true` in `src/content/products/<slug>.yaml`. Also confirm the rice FAQ wording on 10063090 vs 10063099 with your CHA.
6. Product facts — check varieties, specs, MOQ and ports in `src/content/products/*.yaml`.
7. Photos — replace files in `src/assets/products/<slug>/` keeping the same names; set `isStock: false` for your own photos.
8. 3D models (optional) — add `public/models/ginger.glb`, `jaggery.glb`, `coconut.glb` (≤ 300 KB, Meshopt-compressed). Without them a generated pile is shown. Adding a model needs a rebuild and redeploy.
9. Draft market report — `src/content/blog/en/market-report-2026-10.mdx` is a template with `draft: true`, so it is not published. Write it and set `draft: false`, or delete the file.
10. Translations — have a native speaker review each of the 184 translation files listed under "Pending review"; set `reviewStatus: reviewed`.
11. Served countries — confirm `src/data/countries.ts`.
12. Domain — set `SITE_URL` in Vercel and update the `Sitemap:` line in `public/robots.txt`.
13. Vercel — import the repo, enable Analytics and Speed Insights.
14. Google Search Console and Bing Webmaster Tools — verify the domain and submit `/sitemap-index.xml`.

## Editing content

- Product facts: `src/content/products/<slug>.yaml`
- Product text per language: `src/content/products-i18n/<lang>/<slug>.yaml`
- HSN text: `src/content/hsn-i18n/<lang>/<code>.yaml`
- Interface text: `src/i18n/ui/<lang>.json`
- Blog posts: `src/content/blog/<lang>/<slug>.mdx` (a translation uses the same file name as the English post)
