import { test, expect } from '@playwright/test';

test('hero poster is visible immediately and is the LCP candidate', async ({ page }) => {
  await page.goto('/');
  const poster = page.locator('[data-hero-poster]');
  await expect(poster).toBeVisible();
  await expect(poster).toHaveAttribute('fetchpriority', 'high');
});

test('without WebGL the poster stays and no errors are logged', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test override
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      // @ts-expect-error passthrough
      return orig.call(this, type, ...rest);
    };
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await page.waitForTimeout(2500);
  await expect(page.locator('[data-hero-poster]')).toBeVisible();
  await expect(page.locator('[data-hero-canvas]')).toHaveAttribute('data-state', 'off');
  expect(errors).toEqual([]);
  await ctx.close();
});
