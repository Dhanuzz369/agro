import { test, expect } from '@playwright/test';

test('english home has header, footer, quote CTA and WhatsApp', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request a quote' }).first()).toBeVisible();
  await expect(page.locator('[data-whatsapp]')).toHaveCount(1);
});

test('arabic home is rtl', async ({ page }) => {
  await page.goto('/ar/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('home has hreflang for all 9 locales plus x-default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(10);
});

test('every ld+json block parses', async ({ page }) => {
  await page.goto('/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks.length).toBeGreaterThan(0);
  for (const b of blocks) expect(() => JSON.parse(b)).not.toThrow();
});
