# GoodBiz Agri — launch checklist

Plain-language steps for the owner, most important first. Tick each box before (or right after) going live.
Every `npm run build` also prints a "content report" that lists what is still missing.

> **An honest note on rankings.** Nobody — no agency, no tool, no AI — can guarantee the #1 position on Google
> or a mention in ChatGPT. The website is now technically ready: fast, translated into 9 languages, with clean
> titles, descriptions, structured data and files that AI engines read. What decides the ranking from here is
> (1) **trust signals** — real company details, registrations and reviews; (2) **links from other websites**,
> especially trade directories, export bodies and buyers; (3) **fresh, useful content** — the monthly market
> report and buyer guides; (4) **time** — new domains usually take 3–6 months to rank for competitive terms
> such as "turmeric exporter India". Long, specific searches ("Tiptur ball copra supplier", "IR64 parboiled 5%
> broken exporter") come first.

---

## 1. Must do before going live (blocks launch)

- [ ] **Domain and `SITE_URL`.** In Vercel → your project → *Settings → Environment Variables*, add
  `SITE_URL` = `https://www.yourdomain.com` (the exact address you will use, no trailing slash) for
  *Production*, then redeploy. Canonical links, hreflang, the sitemap, `robots.txt`, `llms.txt` and structured
  data all use this value automatically. Until it is set they point at `https://goodbizagro.com`.
- [ ] **Connect the domain** in Vercel → *Settings → Domains*; pick one version (with or without `www`) and let
  Vercel redirect the other to it.
- [ ] **Lead capture (Google Sheets).** Follow `docs/lead-capture.md` to create the sheet and Apps Script web app,
  then put its `/exec` URL in `src/content/site.yaml` → `leadEndpoint`. Until then the form still works step by
  step, but nothing is saved: on the last step visitors are offered WhatsApp/email instead.
- [ ] **Business email** → `site.yaml` → `email` (e.g. `export@yourdomain.com`). Set up the mailbox first and
  send yourself a test.
- [ ] **Registered legal name** → `site.yaml` → `legalName` (exactly as on your GST / IEC certificate).
- [ ] **Office address** → `site.yaml` → `address.street` and `address.postalCode`. Use the same wording
  everywhere (website, Google Business Profile, directories) — consistency matters for local search.
- [ ] **Registration numbers** → `site.yaml` → `registrations` (APEDA RCMC, Spices Board CRES, FIEO RCMC,
  FSSAI licence, IEC, Coconut Development Board). For any registration you do **not** hold, set
  `held: false` so its logo disappears. Showing a body you are not registered with is a legal risk.
- [ ] **Check the facts**: varieties, specifications, ports and packing in `src/content/products/*.yaml`;
  home-page numbers (`stats` in `site.yaml`: 70+ countries, 18 markets, 4 ports); served countries in
  `src/data/countries.ts`.
- [ ] **Translations.** 72 product files in Arabic, French, Spanish, Portuguese, Russian, Chinese, Indonesian
  and German are marked `reviewStatus: pending`. Ask a native speaker (ideally someone in the trade) to read
  each and set `reviewStatus: reviewed`. Search titles and descriptions sit in the `seo:` block of each file and
  in `src/i18n/ui/<lang>.json` (`meta.*`). Keep titles under 45 characters (the brand is added
  automatically) and descriptions between 140 and 160 characters — `npm test` checks this.

Already done: phone / WhatsApp `+91 88847 99369` is live in the site and in the structured data.

## 2. First week after going live

- [ ] **Google Search Console** (search.google.com/search-console): *Add property → Domain*, verify with the DNS
  TXT record your domain registrar shows, then *Sitemaps → enter `sitemap-index.xml` → Submit*. Use
  *URL inspection → Request indexing* for the home page and the 9 product pages.
- [ ] **Bing Webmaster Tools** (bing.com/webmasters): sign in, *Import from Google Search Console* (one click),
  confirm the sitemap. Bing also powers ChatGPT search and Microsoft Copilot answers.
- [ ] **Google Business Profile** (business.google.com): create the profile for "GoodBiz Agri", category
  *Exporter* (add *Agricultural product wholesaler*), the same address and phone as the website, website link,
  opening hours, 5–10 real photos (office, warehouse, produce, packing). Verify by post or video. Ask happy
  buyers for a Google review.
- [ ] **Vercel Analytics and Speed Insights**: Vercel → project → *Analytics* → Enable; *Speed Insights* → Enable.
- [ ] **Social profiles** (LinkedIn company page at least). Once they exist, add the URLs to `site.yaml` →
  `social:`; they then appear as `sameAs` links in the structured data (only add real, active profiles).

## 3. First month — links from trusted sites (biggest ranking lever)

Create a complete company profile on each, with the same name, address and phone, a link to your website,
and a link to the matching product page where the directory allows it:

- [ ] **APEDA** member/exporter directory and **Spices Board India** exporter listing (via your RCMC/CRES login).
- [ ] **FIEO** member directory (Indian Trade Portal) and the **Coconut Development Board** exporter list.
- [ ] **IndiaMART**, **TradeIndia**, **ExportersIndia** — list each product with the same product names used on
  the site (e.g. "Sona Masoori rice", "Tiptur ball copra") and the website link.
- [ ] **Alibaba.com**, **Go4WorldBusiness**, **Tradekey**, **EC21** — international buyer marketplaces.
- [ ] Your **bank / chamber of commerce** (e.g. Karnataka Exporters Association, FKCCI) member pages.
- [ ] Ask existing buyers, freight forwarders and inspection agencies you work with to mention or link to you.

Avoid paid "SEO link packages": they can get the site penalised.

## 4. Ongoing — what keeps you ranking

- [ ] **Publish the monthly market report.** `src/content/blog/en/market-report-2026-10.mdx` is a draft template:
  write it, set `draft: false`. One useful article a month (prices, arrivals, quality notes, how-to-import
  guides) builds authority and gives AI assistants something to quote.
- [ ] **Replace stock photos** with your own (same file names in `src/assets/products/<slug>/`; set
  `isStock: false`). Real photos of your lots, warehouse and loading build trust.
- [ ] **Monthly check** in Search Console → *Performance*: which searches show your pages; improve the page
  for queries with many impressions but few clicks (title and description first).
- [ ] **Ask AI engines** once a month: "Who exports Sona Masoori rice from India?", "Tiptur ball copra supplier",
  "arecanut exporter Karnataka". Note whether GoodBiz Agri is mentioned. `/llms.txt` and `/llms-full.txt` are
  the summaries these engines read; they update automatically from the product files.
- [ ] Keep `npm test`, `npm run build` and the browser tests green after every edit.

---

### Reference: what was set up technically

- Unique title, meta description and meta keywords on every page in all 9 languages
  (keyword plan: `docs/seo/keyword-map.md`).
- Canonical + hreflang (with x-default) on every page, Open Graph and Twitter cards with image and alt text.
- Structured data: Organization (with contact point +91-8884799369), WebSite, ItemList of the 9 products,
  Product, FAQPage, BreadcrumbList and Article. Placeholder values are never published.
- `robots.txt` generated from `SITE_URL`, allowing Google, Bing and AI crawlers (GPTBot, OAI-SearchBot,
  ChatGPT-User, PerplexityBot, Google-Extended, ClaudeBot, Claude-Web, Applebot-Extended and others).
- Sitemap with all language versions and last-modified dates; favicon, Apple touch icon and web manifest.
