// tests/e2e/layout.spec.ts
import { test, expect } from '@playwright/test';

const widths = [320, 375, 768, 1024, 1440];
const paths = ['/', '/ar/', '/ar/products/turmeric', '/zh/', '/products/turmeric', '/products', '/hsn/09103030', '/blog', '/contact', '/about'];
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
