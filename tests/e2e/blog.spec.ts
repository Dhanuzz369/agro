import { test, expect } from '@playwright/test';

test('blog index lists 3 posts', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.locator('[data-post]')).toHaveCount(3);
});

test('category filter narrows the list', async ({ page }) => {
  await page.goto('/blog');
  await page.getByRole('button', { name: 'Market updates' }).click();
  await expect(page.locator('[data-post]:visible')).toHaveCount(1);
});

test('post has Article JSON-LD and related product link', async ({ page }) => {
  await page.goto('/blog/turmeric-hsn-codes-explained');
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent!)['@type']));
  expect(types).toContain('Article');
  await expect(page.locator('a[href="/products/turmeric"]').first()).toBeVisible();
});

test('english posts appear on the french index marked In English', async ({ page }) => {
  await page.goto('/fr/blog');
  await expect(page.locator('[data-post] [data-fallback]').first()).toBeVisible();
});

test('rss feed is valid xml with items', async ({ request }) => {
  const res = await request.get('/rss.xml');
  expect(res.ok()).toBe(true);
  expect(await res.text()).toContain('<item>');
});
