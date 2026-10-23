import { test, expect } from '@playwright/test';

test('registered-with strip shows each registration, with official logos where supplied', async ({ page }) => {
  await page.goto('/');
  const strip = page.locator('.certs');
  for (const id of ['apeda', 'spices-board', 'fieo', 'fssai', 'iec', 'cdb']) await expect(strip.locator(`[data-reg="${id}"]`)).toHaveCount(1);
  const logos = strip.locator('img');
  await expect(logos).toHaveCount(5);
  for (const img of await logos.all()) expect(await img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});
