import { test, expect } from '@playwright/test';

test('registered-with strip shows each registration, with official logos where supplied', async ({ page }) => {
  await page.goto('/');
  const strip = page.locator('.certs');
  for (const id of ['apeda', 'spices-board', 'fieo', 'fssai', 'cdb']) await expect(strip.locator(`[data-reg="${id}"]`)).toHaveCount(1);
  await expect(strip.locator('[data-reg="iec"]')).toHaveCount(0); // DGFT logo removed at the owner's request
  const logos = strip.locator('img');
  await expect(logos).toHaveCount(5);
  await strip.scrollIntoViewIfNeeded(); // the logos are lazy and sit below the nine hero panels
  for (const img of await logos.all()) await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test('placeholder registration numbers are not shown', async ({ page }) => {
  await page.goto('/');
  const strip = page.locator('.certs');
  await expect(strip.locator('.certs__no')).toHaveCount(0); // every number in site.yaml is still REPLACE:
  await expect(strip).not.toContainText('Number on request');
  await expect(strip).not.toContainText('Reg. no.');
});
