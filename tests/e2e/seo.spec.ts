import { test, expect, type APIRequestContext } from '@playwright/test';

test('robots.txt allows AI crawlers and lists the sitemap on the build domain', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Google-Extended', 'ClaudeBot', 'Claude-Web', 'Applebot-Extended', 'Bingbot'];
  for (const bot of bots) expect(body).toMatch(new RegExp(`User-agent: ${bot}\\nAllow: /`));
  expect(body).not.toMatch(/Disallow: \/\s*$/m);
  expect(body).toMatch(/^Sitemap: https?:\/\/[^/]+\/sitemap-index\.xml$/m);
});

test('llms.txt and llms-full.txt summarise the business for AI engines', async ({ request }) => {
  const body = await (await request.get('/llms.txt')).text();
  for (const s of ['GoodBiz Agri', 'Bengaluru', 'Sona Masoori', 'IR64', 'broken rice', 'betel nut', 'Tiptur ball copra', 'turmeric', 'New Mangalore', 'FOB', '## How to order', '## Contact', '+91 88847 99369', '## Languages'])
    expect(body, s).toContain(s);
  for (const slug of ['rice', 'non-basmati-rice', 'broken-rice', 'jaggery', 'arecanut', 'groundnuts', 'coconut-copra', 'ginger', 'turmeric']) expect(body).toContain(`/products/${slug})`);
  expect(body).not.toMatch(/REPLACE:|HSN|harvest season|harvest months|minimum order/i);
  const fullText = await (await request.get('/llms-full.txt')).text();
  expect(fullText).toContain('# Product detail');
  expect(fullText).toContain('Erode dried finger');
  expect(fullText).not.toMatch(/REPLACE:|HSN|harvest season|harvest months|minimum order/i);
});

test('llms.txt lists products without HSN codes', async ({ request }) => {
  const body = await (await request.get('/llms.txt')).text();
  expect(body).toContain('# GoodBiz Agri');
  expect(body).not.toContain('09103030');
  expect(body).toContain('/products/turmeric');
});

// Every child sitemap listed in sitemap-index.xml, joined into one string
async function sitemaps(request: APIRequestContext) {
  const idx = await (await request.get('/sitemap-index.xml')).text();
  const files = [...idx.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const maps = await Promise.all(files.map(async (f) => {
    const res = await request.get(f);
    expect(res.ok(), f).toBe(true);
    return res.text();
  }));
  return { files, all: maps.join('\n') };
}

test('sitemap index splits products, blog and other pages, with localized URLs', async ({ request }) => {
  const { files, all } = await sitemaps(request);
  expect(files).toEqual(['/sitemap-products-0.xml', '/sitemap-blog-0.xml', '/sitemap-pages-0.xml']);
  expect(all).toContain('/fr/products/turmeric');
  expect(all).toContain('hreflang="ar"');
});

test('product sitemap lists each product page photos for Google Images', async ({ request }) => {
  const map = await (await request.get('/sitemap-products-0.xml')).text();
  const turmeric = map.match(/<url><loc>[^<]*\/products\/turmeric<\/loc>.*?<\/url>/)![0];
  const imgs = [...turmeric.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map((m) => m[1]);
  expect(imgs.length).toBeGreaterThan(1);
  for (const i of imgs) expect((await request.get(new URL(i).pathname)).headers()['content-type'], i).toContain('image/');
});

test('og image and spec sheet are served', async ({ request }) => {
  const og = await request.get('/og/products/turmeric.png');
  expect(og.headers()['content-type']).toContain('image/png');
  const pdf = await request.get('/spec-sheets/turmeric/powder.pdf');
  expect(pdf.ok()).toBe(true);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
});

test('every page has exactly one h1, a description and a canonical', async ({ page }) => {
  for (const path of ['/', '/products', '/products/turmeric', '/products/rice', '/blog', '/about', '/contact', '/ar/products/rice']) {
    await page.goto(path);
    await expect(page.locator('h1'), path).toHaveCount(1);
    await expect(page.locator('meta[name="description"]'), path).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]'), path).toHaveCount(1);
  }
});

test('sitemap <loc> values equal each page canonical (no trailing slash)', async ({ page, request }) => {
  const { all } = await sitemaps(request);
  const locs = [...all.matchAll(/<url><loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  for (const l of locs) if (new URL(l).pathname !== '/') expect(l.endsWith('/'), l).toBe(false);
  const wanted = ['/', '/ar', '/zh', '/fr', '/products', '/products/turmeric', '/zh/products/turmeric', '/products/rice', '/blog', '/about', '/contact', '/de/contact'];
  const sample = wanted.map((p) => locs.find((l) => new URL(l).pathname === p));
  expect(sample.every(Boolean), JSON.stringify(sample)).toBe(true);
  for (const loc of sample as string[]) {
    await page.goto(new URL(loc).pathname);
    await expect(page.locator('link[rel="canonical"]'), loc).toHaveAttribute('href', loc);
  }
});

test('links to locale homes resolve without a redirect', async ({ page, request }) => {
  await page.goto('/ar/products/turmeric');
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  const homes = [...new Set(hrefs.filter((h) => /^\/(ar|fr|es|pt|ru|zh|id|de)\/?$/.test(h)))];
  expect(homes).toContain('/ar');
  for (const h of homes) {
    expect(h.endsWith('/'), h).toBe(false);
    const res = await request.get(h, { maxRedirects: 0 });
    expect(res.status(), h).toBe(200);
  }
});

test('og:locale uses language_TERRITORY values', async ({ page }) => {
  for (const [path, value] of [['/', 'en_US'], ['/zh', 'zh_CN'], ['/pt/products', 'pt_BR'], ['/ar/about', 'ar_AR']]) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:locale"]'), path).toHaveAttribute('content', value);
  }
});

test('HSN reference pages and the HSN blog post are gone', async ({ request }) => {
  for (const path of ['/hsn/1701', '/ar/hsn/1701', '/blog/turmeric-hsn-codes-explained', '/og/hsn/1701.png']) expect((await request.get(path)).status(), path).toBe(404);
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).not.toMatch(/HSN|\/hsn\//);
  expect((await sitemaps(request)).all).not.toMatch(/\/hsn\/|hsn-codes/);
});

const productSlugs = ['rice', 'non-basmati-rice', 'broken-rice', 'jaggery', 'arecanut', 'groundnuts', 'coconut-copra', 'ginger', 'turmeric'];
const len = (s: string) => [...s].length;

test('product pages have unique, keyword-first titles within 60 characters', async ({ page }) => {
  for (const prefix of ['', '/fr', '/zh']) {
    const titles = new Set<string>();
    for (const slug of productSlugs) {
      await page.goto(`${prefix}/products/${slug}`);
      const title = await page.title();
      expect(len(title), title).toBeLessThanOrEqual(60);
      expect(title.endsWith(' | GoodBiz Agri'), title).toBe(true);
      titles.add(title);
    }
    expect(titles.size, prefix).toBe(productSlugs.length);
  }
});

const sample = ['/', '/products', '/products/turmeric', '/products/arecanut', '/about', '/contact', '/blog', '/blog/arecanut-grades-chali-vs-kempu',
  '/ar', '/ar/products/rice', '/de/products/ginger', '/ru/about', '/zh/products/jaggery', '/es/contact', '/id/products', '/pt/blog', '/fr'];

test('titles, descriptions, keywords and robots meta fit their budgets', async ({ page }) => {
  for (const path of sample) {
    await page.goto(path);
    const title = await page.title();
    expect(len(title), `${path} ${title}`).toBeLessThanOrEqual(60);
    const d = (await page.locator('meta[name="description"]').getAttribute('content'))!;
    const [lo, hi] = path.startsWith('/zh') ? [50, 110] : [140, 160];
    expect(len(d), `${path} ${d}`).toBeGreaterThanOrEqual(lo);
    expect(len(d), `${path} ${d}`).toBeLessThanOrEqual(hi);
    const kw = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(kw?.split(',').length ?? 0, `${path} keywords`).toBeGreaterThanOrEqual(3);
    await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute('content', /^index, follow/);
    await expect(page.locator('meta[property="og:image:alt"]'), path).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:title"]'), path).toHaveAttribute('content', title);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]'), path).toHaveCount(1);
  }
});

test('every image has non-empty alt text', async ({ page }) => {
  for (const path of sample) {
    await page.goto(path);
    const missing = await page.locator('img').evaluateAll((imgs) => imgs.filter((i) => !(i.getAttribute('alt') ?? '').trim()).map((i) => i.getAttribute('src')));
    expect(missing, path).toEqual([]);
  }
});

async function ldTypes(page: import('@playwright/test').Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((b) => JSON.parse(b)['@type'] as string);
}

test('JSON-LD types match the page type and never carry placeholders or HSN', async ({ page }) => {
  const want: [string, string[]][] = [
    ['/', ['Organization', 'WebSite', 'ItemList', 'FAQPage']],
    ['/ar', ['Organization', 'WebSite', 'ItemList', 'FAQPage']],
    ['/products', ['Organization', 'ItemList', 'BreadcrumbList']],
    ['/products/turmeric', ['Organization', 'Product', 'FAQPage', 'BreadcrumbList']],
    ['/de/products/coconut-copra', ['Organization', 'Product', 'FAQPage', 'BreadcrumbList']],
    ['/about', ['Organization', 'BreadcrumbList']],
    ['/contact', ['Organization', 'BreadcrumbList']],
    ['/blog', ['Organization', 'BreadcrumbList']],
    ['/blog/arecanut-grades-chali-vs-kempu', ['Organization', 'Article', 'BreadcrumbList']],
  ];
  for (const [path, types] of want) {
    await page.goto(path);
    expect((await ldTypes(page)).sort(), path).toEqual([...types].sort());
    const raw = (await page.locator('script[type="application/ld+json"]').allTextContents()).join('');
    expect(raw, path).not.toMatch(/REPLACE:|HSN|hsn/);
  }
  await page.goto('/');
  const org = JSON.parse((await page.locator('script[type="application/ld+json"]').allTextContents()).find((b) => b.includes('"Organization"'))!);
  expect(org.contactPoint[0].telephone).toBe('+91-8884799369');
  expect(org.contactPoint[0].availableLanguage.length).toBe(9);
  const list = JSON.parse((await page.locator('script[type="application/ld+json"]').allTextContents()).find((b) => b.includes('"ItemList"'))!);
  expect(list.itemListElement).toHaveLength(9);
  await page.goto('/products/rice');
  const product = JSON.parse((await page.locator('script[type="application/ld+json"]').allTextContents()).find((b) => b.includes('"Product"'))!);
  expect(product).toMatchObject({ brand: { name: 'GoodBiz Agri' }, countryOfOrigin: { name: 'India' } });
  expect(product.keywords).toContain('Sona Masoori');
  expect(product.offers).toBeUndefined();
  expect(product.aggregateRating).toBeUndefined();
});

test('product pages open with a direct answer naming the exporter', async ({ page }) => {
  for (const slug of productSlugs) {
    await page.goto(`/products/${slug}`);
    await expect(page.locator('.pv__summary'), slug).toHaveText(/^GoodBiz Agri exports .+ from .+/);
  }
});

test('icons, manifest and theme colour are served', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#1F3D2B');
  for (const href of ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/site.webmanifest', '/icon-512.png']) expect((await request.get(href)).status(), href).toBe(200);
  const manifest = await (await request.get('/site.webmanifest')).json();
  expect(manifest.name).toBe('GoodBiz Agri');
});

test('every image and link carries a descriptive title', async ({ page }) => {
  for (const path of ['/', '/products', '/products/turmeric', '/blog', '/blog/arecanut-grades-chali-vs-kempu', '/about', '/contact', '/ar/products/rice']) {
    await page.goto(path);
    const missing = await page.locator('img, a[href]').evaluateAll((els) =>
      els.filter((e) => !(e.getAttribute('title') ?? '').trim()).map((e) => e.outerHTML.slice(0, 80)));
    expect(missing, path).toEqual([]);
  }
});
