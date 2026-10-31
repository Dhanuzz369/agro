import { test, expect } from '@playwright/test';

const slugs = ['rice', 'non-basmati-rice', 'broken-rice', 'jaggery', 'arecanut', 'groundnuts', 'coconut-copra', 'ginger', 'turmeric', 'coco-pith', 'cashew'];

for (const slug of slugs) {
  test(`product page renders: ${slug}`, async ({ page }) => {
    await page.goto(`/products/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-variety]').first()).toBeVisible();
  });
}

test('turmeric page has varieties, specs, quote prefill link and JSON-LD', async ({ page }) => {
  await page.goto('/products/turmeric');
  await expect(page.locator('[data-variety]')).toHaveCount(5);
  await expect(page.locator('[data-variety="powder"] table')).toHaveCount(1);
  const quote = page.locator('[data-variety="powder"] a', { hasText: 'Quote this variety' });
  await expect(quote).toHaveAttribute('href', '/contact?product=turmeric&variety=powder');
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent!)['@type']));
  expect(types).toEqual(expect.arrayContaining(['Organization', 'Product', 'FAQPage', 'BreadcrumbList']));
});

test('product pages show no HSN codes or harvest season', async ({ page }) => {
  for (const path of ['/products/turmeric', '/products/arecanut', '/zh/products/rice']) {
    await page.goto(path);
    const html = await page.content();
    expect(html, path).not.toMatch(/HSN|0910 ?30|harvest season|harvest calendar/i);
    await expect(page.locator('.cal, [data-month]'), path).toHaveCount(0);
  }
  await expect(page).toHaveTitle(/^印度/);
});

test('products index lists 11 products and no HSN table', async ({ page }) => {
  await page.goto('/products');
  await expect(page.locator('main article')).toHaveCount(11);
  expect(await page.content()).not.toMatch(/HSN/);
});

test('localized product page links back with locale prefix', async ({ page }) => {
  await page.goto('/fr/products/turmeric');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('[data-variety="powder"] a[href^="/fr/contact?product=turmeric"]')).toHaveCount(1);
});

test('product hero poster is preloaded with the exact srcset the img uses', async ({ page }) => {
  await page.goto('/products/turmeric');
  const preload = page.locator('head link[rel="preload"][as="image"]');
  await expect(preload).toHaveCount(1);
  const img = page.locator('img[data-product-hero]');
  expect(await preload.getAttribute('imagesrcset')).toBe(await img.getAttribute('srcset'));
  expect(await preload.getAttribute('imagesizes')).toBe(await img.getAttribute('sizes'));
  await expect(preload).toHaveAttribute('fetchpriority', 'high');
});

test('related insights list published posts about the product', async ({ page }) => {
  await page.goto('/products/arecanut');
  const section = page.locator('[data-related-posts]');
  await expect(section.getByRole('heading', { name: 'Related insights' })).toBeVisible();
  await expect(section.locator('a[href="/blog/arecanut-grades-chali-vs-kempu"]')).toBeVisible();
  await expect(section.locator('a[href*="market-report"]')).toHaveCount(0); // draft
  await page.goto('/fr/products/arecanut');
  await expect(page.locator('[data-related-posts] a[href="/blog/arecanut-grades-chali-vs-kempu"]')).toBeVisible(); // English fallback
  await page.goto('/products/jaggery');
  await expect(page.locator('[data-related-posts]')).toHaveCount(0);
});

test('coco pith page: formats, no region line, no FSSAI doc, RTL spec cells', async ({ page }) => {
  await page.goto('/products/coco-pith');
  await expect(page.locator('[data-variety]')).toHaveCount(5);
  await expect(page.locator('.var__where')).toHaveCount(0);
  await expect(page.locator('.pv__docs')).not.toContainText('FSSAI');
  await page.goto('/ar/products/coco-pith');
  await expect(page.locator('.var td[dir="auto"]').first()).toBeVisible();
});

test('cashew page names every grade and fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/products/cashew');
  await expect(page.locator('[data-variety]')).toHaveCount(4);
  const text = await page.locator('main').innerText();
  for (const g of ['W180', 'W210', 'W240', 'W320', 'W450', 'SW', 'LWP', 'SWP', 'BB']) expect(text, g).toContain(g);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('cashew and coco pith pages claim no APEDA or Spices Board registration', async ({ page }) => {
  for (const slug of ['cashew', 'coco-pith']) {
    await page.goto(`/products/${slug}`);
    await expect(page.locator('.pv__docs'), slug).not.toContainText('APEDA');
  }
});
