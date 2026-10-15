import { test, expect } from '@playwright/test';

test('grain product mounts a canvas when WebGL is available', async ({ page }) => {
  await page.goto('/products/rice');
  const canvas = page.locator('[data-object-canvas]');
  await expect(canvas).toHaveAttribute('data-state', /on|off/, { timeout: 8000 });
});

test('missing GLB keeps the poster and logs no page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/models/*.glb', (r) => r.abort());
  await page.goto('/products/ginger');
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-object-poster]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('absent GLB is never requested and logs no console errors', async ({ page }) => {
  const errors: string[] = [];
  const modelRequests: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('request', (r) => r.url().includes('/models/') && modelRequests.push(r.url()));
  await page.goto('/products/ginger');
  await page.locator('[data-object-canvas]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-object-canvas]')).toHaveAttribute('data-state', /on|off/, { timeout: 8000 });
  expect(modelRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('reduced motion: no 3D, poster only', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/products/turmeric');
  await expect(page.locator('[data-object-canvas]')).toHaveAttribute('data-state', 'off');
  await ctx.close();
});
