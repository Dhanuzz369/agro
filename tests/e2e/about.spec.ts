// tests/e2e/about.spec.ts
import { test, expect } from '@playwright/test';
test('about page shows story, network map and quality steps', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('svg[role="img"]')).toBeVisible();
  await expect(page.locator('[data-quality-step]')).toHaveCount(5);
});
