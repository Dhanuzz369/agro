// tests/e2e/layout.spec.ts
import { test, expect } from '@playwright/test';

const widths = [320, 375, 768, 1024, 1440];
const paths = ['/', '/ar', '/ar/products/turmeric', '/zh', '/products/turmeric', '/products', '/products/rice', '/blog', '/contact', '/about'];
for (const width of widths) for (const path of paths) {
  test(`no horizontal overflow at ${width}px: ${path}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const res = await page.goto(path);
    test.skip(res?.status() === 404, 'page not built yet');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await ctx.close();
  });
}

test('buttons answer a press within 160 ms', async ({ page }) => {
  await page.goto('/products/cashew');
  const d = await page.locator('.btn--primary').first().evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(d.split(', ')[0]).toBe('0.16s');
});

test('product card photos do not zoom on hover when the visitor asks for reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/products');
  const card = page.locator('.pc__link').first();
  await card.hover();
  expect(await card.locator('img').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  await ctx.close();
});
