import { test, expect } from '@playwright/test';

test('reduced motion: below-fold content is visible without scrolling animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const revealed = page.locator('[data-reveal]').last();
  await revealed.scrollIntoViewIfNeeded();
  await expect(revealed).toHaveCSS('opacity', '1');
  await ctx.close();
});

test('counters end at their target value', async ({ page }) => {
  await page.goto('/');
  const counter = page.locator('[data-counter]').first();
  await counter.scrollIntoViewIfNeeded();
  const target = await counter.getAttribute('data-counter');
  await expect(counter).toContainText(target!, { timeout: 5000 });
});
