import { test, expect } from '@playwright/test';

const slugs = ['rice', 'non-basmati-rice', 'broken-rice', 'jaggery', 'arecanut', 'groundnuts', 'coconut-copra', 'ginger', 'turmeric'];

for (const slug of slugs) {
  test(`product page renders: ${slug}`, async ({ page }) => {
    await page.goto(`/products/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-variety]').first()).toBeVisible();
  });
}

test('turmeric page has varieties, specs, HSN, quote prefill link and JSON-LD', async ({ page }) => {
  await page.goto('/products/turmeric');
  await expect(page.locator('[data-variety]')).toHaveCount(5);
  await expect(page.getByText('0910 30 30').first()).toBeVisible();
  const quote = page.locator('[data-variety="powder"] a', { hasText: 'Quote this variety' });
  await expect(quote).toHaveAttribute('href', '/contact?product=turmeric&variety=powder');
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent!)['@type']));
  expect(types).toEqual(expect.arrayContaining(['Organization', 'Product', 'FAQPage', 'BreadcrumbList']));
});

test('unverified HSN is flagged on arecanut', async ({ page }) => {
  await page.goto('/products/arecanut');
  await expect(page.locator('.hsn__flag').first()).toBeVisible();
});

test('products index lists 9 products and 14 HSN rows', async ({ page }) => {
  await page.goto('/products');
  await expect(page.locator('main article')).toHaveCount(9);
  await expect(page.locator('[data-hsn-row]')).toHaveCount(14);
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
  const img = page.locator('img[data-object-poster]');
  expect(await preload.getAttribute('imagesrcset')).toBe(await img.getAttribute('srcset'));
  expect(await preload.getAttribute('imagesizes')).toBe(await img.getAttribute('sizes'));
  await expect(preload).toHaveAttribute('fetchpriority', 'high');
});

test('related insights list published posts about the product', async ({ page }) => {
  await page.goto('/products/turmeric');
  const section = page.locator('[data-related-posts]');
  await expect(section.getByRole('heading', { name: 'Related insights' })).toBeVisible();
  await expect(section.locator('a[href="/blog/turmeric-hsn-codes-explained"]')).toBeVisible();
  await expect(section.locator('a[href*="market-report"]')).toHaveCount(0); // draft
  await page.goto('/fr/products/turmeric');
  await expect(page.locator('[data-related-posts] a[href="/blog/turmeric-hsn-codes-explained"]')).toBeVisible(); // English fallback
  await page.goto('/products/jaggery');
  await expect(page.locator('[data-related-posts]')).toHaveCount(0);
});
