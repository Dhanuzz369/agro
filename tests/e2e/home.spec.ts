// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test('landing has all sections in order', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section[id], main > div > section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['range', 'journey', 'why', 'sourcing', 'faq', 'world', 'cta']);
});

test('range lists 9 products linking to product pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#range a[href^="/products/"]')).toHaveCount(9);
});

test('faq has FAQPage JSON-LD', async ({ page }) => {
  await page.goto('/');
  const types = await page.locator('script[type="application/ld+json"]').evaluateAll((s) => s.map((x) => JSON.parse(x.textContent!)['@type']));
  expect(types).toContain('FAQPage');
});

test('sourcing map highlights districts for the chosen product', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sourcing').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Arecanut' }).click();
  await expect(page.getByRole('button', { name: 'Arecanut' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Turmeric' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#sourcing [data-place="shivamogga"]')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('#sourcing [data-place="erode"]')).toHaveAttribute('data-active', 'false');
});
