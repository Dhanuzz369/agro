// tests/e2e/about.spec.ts
import { test, expect } from '@playwright/test';
test('about page shows story, sourcing markets and quality steps', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-markets] li').first()).toBeVisible();
  await expect(page.locator('[data-quality-step]')).toHaveCount(5);
});
