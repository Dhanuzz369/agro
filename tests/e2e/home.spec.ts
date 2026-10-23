// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test('landing has all sections in order', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section[id], main > div > section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['range', 'journey', 'why', 'faq', 'world', 'cta']);
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

