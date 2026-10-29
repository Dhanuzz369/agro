# Technical SEO audit: goodbizagro.com

Checked 29 Oct 2026 against the live site. "Live" scores are for today's site; "after push" scores include the
footer language links and IndexNow setup that are built and tested locally but not yet deployed.

## Technical score: 86/100 live, 98/100 after push

| Category | Live | After push | Basis |
|---|---|---|---|
| Crawlability | 95 | 100 | Translated pages were reachable only through hreflang tags and the sitemap, not through plain links |
| Indexability | 100 | 100 | |
| Security | 85 | 85 | No full Content-Security-Policy; `access-control-allow-origin: *` (Vercel default) |
| URL structure | 95 | 95 | `http://www` takes 2 hops (Vercel upgrades to https, then redirects www) |
| Mobile | 100 | 100 | |
| Core Web Vitals | 100 (lab) | 100 (lab) | LCP and CLS measured; INP not measured (no field data yet for a new domain) |
| Structured data | 100 | 100 | |
| JS rendering | 100 | 100 | |
| IndexNow | 0 | 100 | Not set up live; key file and submit script added |

## What was checked

**Crawlability**
- `robots.txt` returns 200 with 24 groups, allows all search and AI crawlers, carries Content-Signal in every group, and declares the sitemap.
- The sitemap index is valid; all 127 URLs return 200.
- The only noindex is the 404 page, which is intended.
- All English pages are within 2 clicks of the home page.
- **Fixed (not yet live):** a crawler starting on English could reach the other languages only through hreflang tags and the sitemap, because the language picker is a dialog of buttons. The footer now links each page in every language it exists in.
- Page HTML is 115–146 KB, well under Googlebot's 2 MB limit.

**Indexability**
- Every page has a self-referencing canonical. A parameter URL (`/products?utm_source=x`) canonicalises to `/products`.
- Unknown URLs return a real 404 with noindex; there is no soft-404.
- www redirects to the plain domain with a single permanent 308.
- hreflang covers all 9 languages plus x-default, every pair is reciprocal, and `zh` is tagged `zh-Hans`.

**Security**
- HTTPS uses a valid Let's Encrypt certificate (expires 26 Jan 2027, auto-renewed by Vercel). There is no mixed content.
- These headers are present: HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and a CSP limited to `frame-ancestors`.
- There is no Back-button hijacking. The one `history.pushState` call records an in-page `#section` jump, exactly as the browser would.
- The site is static on Vercel, with no PHP or other server stack to patch.

**URL structure**
- URLs are lowercase, hyphenated and have no trailing slash; `/products/` redirects to `/products` and `/index.html` to `/`.
- `/Products` returns 404, so there is no duplicate.

**Mobile**
- The viewport meta is set. There is no horizontal overflow on any page (covered by tests), and touch targets are at least 44 px.
- On phones, the language and WhatsApp buttons step aside while the "switch language?" banner is showing. This is intended, not an overlap.

**Core Web Vitals** (Chromium lab test with phone emulation, 4× CPU slowdown and a throttled network; Google's PageSpeed API was over its daily quota)

| Page | Mobile LCP | Mobile CLS | Desktop LCP |
|---|---|---|---|
| `/` | 1.20 s | 0 | 0.52 s |
| `/products/turmeric` | 1.02 s | 0 | 0.46 s |
| `/contact` | 1.01 s | 0 | 0.37 s |
| `/ar/products/rice` | 1.44 s | 0.005 | 0.71 s |

All are well inside "good" (LCP ≤ 2.5 s, CLS ≤ 0.1). INP needs real-user data, which a new domain doesn't have yet; Search Console will report it once traffic builds.

**Structured data:** JSON-LD is in the server HTML on every page and linked as one graph by `@id`. There are no placeholders and no fake offers or reviews.

**JS rendering:** pages are statically generated. Product pages have 977 words in the raw HTML with no JavaScript needed.

## Remaining items (deliberately not changed)

| Item | Severity | Why it's left |
|---|---|---|
| Full Content-Security-Policy | Low (security, not ranking) | The language picker loads Google Translate and the site uses Vercel Analytics. A strict CSP must list every one of their hosts, or the picker breaks. Worth doing as a separate, tested change. |
| `access-control-allow-origin: *` | Info | Vercel adds it to static files. It is harmless for a public site with no logged-in data. |
| `http://www` → 2 redirect hops | Info | Vercel upgrades to HTTPS before the domain redirect. Only old `http://www` links hit it; Google follows both hops. |
| INP | Not measured | Needs field data; check Search Console → Core Web Vitals after a few weeks of traffic. |

## After deploying

Run `npm run indexnow` to tell Bing, Yandex and Naver about every page. Run it again after future content changes, or pass specific paths: `npm run indexnow -- /products/turmeric`.
