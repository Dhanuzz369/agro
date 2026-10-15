import { test, expect } from '@playwright/test';

test('robots.txt allows AI crawlers and lists sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  for (const bot of ['GPTBot', 'PerplexityBot', 'Google-Extended', 'ClaudeBot']) expect(body).toContain(`User-agent: ${bot}`);
  expect(body).toContain('Sitemap:');
});

test('llms.txt lists products and HSN codes', async ({ request }) => {
  const body = await (await request.get('/llms.txt')).text();
  expect(body).toContain('# GoodBiz Agri');
  expect(body).toContain('09103030');
  expect(body).toContain('/products/turmeric');
});

test('sitemap includes localized URLs', async ({ request }) => {
  const idx = await (await request.get('/sitemap-index.xml')).text();
  const first = idx.match(/<loc>(.*?)<\/loc>/)![1];
  const map = await (await request.get(new URL(first).pathname)).text();
  expect(map).toContain('/fr/products/turmeric');
  expect(map).toContain('hreflang="ar"');
});

test('og image and spec sheet are served', async ({ request }) => {
  const og = await request.get('/og/products/turmeric.png');
  expect(og.headers()['content-type']).toContain('image/png');
  const pdf = await request.get('/spec-sheets/turmeric/powder.pdf');
  expect(pdf.ok()).toBe(true);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
});

test('every page has exactly one h1, a description and a canonical', async ({ page }) => {
  for (const path of ['/', '/products', '/products/turmeric', '/hsn/1701', '/blog', '/about', '/contact', '/ar/products/rice']) {
    await page.goto(path);
    await expect(page.locator('h1'), path).toHaveCount(1);
    await expect(page.locator('meta[name="description"]'), path).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]'), path).toHaveCount(1);
  }
});

test('sitemap <loc> values equal each page canonical (no trailing slash)', async ({ page, request }) => {
  const map = await (await request.get('/sitemap-0.xml')).text();
  const locs = [...map.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  for (const l of locs) if (new URL(l).pathname !== '/') expect(l.endsWith('/'), l).toBe(false);
  const wanted = ['/', '/ar', '/zh', '/fr', '/products', '/products/turmeric', '/zh/products/turmeric', '/hsn/1701', '/blog', '/about', '/contact', '/de/contact'];
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
