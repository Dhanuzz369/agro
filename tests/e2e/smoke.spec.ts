import { test, expect } from '@playwright/test';
test('home renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('unknown paths get the 404 page with ways back, never indexed', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('We could not find that page');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  for (const href of ['/', '/products', '/contact']) await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(1);
});
