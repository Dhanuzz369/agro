# Sitemap validation: goodbizagro.com

Checked 29 Oct 2026 against the live site, then again against a local build with the hub `lastmod` fix.

## Result: pass, no Critical, High or Medium issues

| Check | Result |
|---|---|
| Discovery | `robots.txt` declares `https://goodbizagro.com/sitemap-index.xml`, which returns 200 and is a valid sitemap index |
| Structure | Index lists 3 sitemaps: products (90 URLs), blog (10) and pages (27), 127 URLs in total |
| Size limits | Largest file is 104 KB with 90 URLs, far under 50,000 URLs and 50 MB |
| XML | All 4 files parse as valid XML |
| Status codes | All 127 URLs return 200 directly, with no redirects |
| Indexability | No URL is noindexed, by header or meta tag |
| Canonicals | Every `<loc>` equals that page's canonical |
| Protocol | HTTPS only, on the primary host `goodbizagro.com` |
| Coverage | Every internal page linked from any sitemap page is in the sitemap (127 of 127); nothing is missing |
| hreflang | All 127 URLs carry alternates; every pair is reciprocal and every target is itself in the sitemap |
| Images | 74 `image:loc` entries across the 9 English product pages (at most 10 per URL, limit 1,000); all return 200; none of the deprecated caption or title tags |
| `priority` / `changefreq` | Not used (Google ignores both) |

## `lastmod`

`lastmod` is a real content date, never a build timestamp:

| Pages | Date source |
|---|---|
| 81 product pages | The `updated` date in that product's data file |
| 9 `/products` hubs and 9 locale home pages | The newest product `updated` date, since these pages list product data. The same date is their schema `dateModified`. |
| 9 `/blog` hubs | The newest published post's date (drafts excluded) |
| Blog posts | The post's own date |
| 18 About and Contact pages | Left out on purpose: they have no real "changed on" date, and Google ignores `lastmod` it can't trust |

The hub dates were added in this pass. Before it, 37 URLs had no `lastmod`; now only the 18 About and Contact URLs have none.

## Info only

- The `news` and `video` namespaces are declared by the sitemap generator but unused. This is harmless.

## Keeping it right

- When a product's specs, packing or loads change, update `updated:` in `src/content/products/<slug>.yaml`. The page, its schema and the sitemap all follow.
- The sitemap is generated at build time by `@astrojs/sitemap` (configured in `astro.config.mjs`); there is no hand-written XML to maintain.
- `tests/e2e/seo.spec.ts` checks the split, image entries, canonical match and product `lastmod` on every test run.
