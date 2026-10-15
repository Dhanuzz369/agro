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
