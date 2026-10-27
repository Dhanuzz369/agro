import { test, expect, type Page } from '@playwright/test';

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

test('hero frames the headline with 28 product photos, each linking to a product page', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('[data-hero-photo]');
  await expect(links).toHaveCount(28);
  const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const h of hrefs) expect(h).toMatch(/^\/products\/[a-z-]+$/);
  // every product appears at least once
  const range = await page.locator('#range a[href^="/products/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  for (const r of range) expect(hrefs).toContain(r);
  const alts = await links.locator('img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('alt') ?? ''));
  for (const a of alts) expect(a.trim().length).toBeGreaterThan(0);
});

test('headline, label, lede and both buttons point where they should', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('section.frame');
  await expect(hero.locator('h1')).toBeVisible();
  await expect(hero.locator('h1')).toHaveText(/South India's harvest/i);
  await expect(hero.locator('.frame__label')).toHaveText(/70\+/);
  await expect(hero.locator('.frame__ctas a')).toHaveCount(2);
  await expect(hero.locator('.frame__ctas .btn--primary')).toHaveAttribute('href', '/contact');
  await expect(hero.locator('.frame__ctas .btn--ghost')).toHaveAttribute('href', '/products');
});

test('localized hero links keep the locale prefix', async ({ page }) => {
  await page.goto('/fr');
  await expect(page.locator('.frame__ctas .btn--primary')).toHaveAttribute('href', '/fr/contact');
  await expect(page.locator('.frame__ctas .btn--ghost')).toHaveAttribute('href', '/fr/products');
  await expect(page.locator('[data-hero-photo]').first()).toHaveAttribute('href', /^\/fr\/products\//);
});

test('no WebGL or canvas code runs on the home page', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __gl: number }).__gl = 0;
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test override
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) (window as unknown as { __gl: number }).__gl++;
      // @ts-expect-error passthrough
      return orig.call(this, type, ...rest);
    };
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForTimeout(2500);
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __gl: number }).__gl)).toBe(0);
  expect(errors).toEqual([]);
});

test('desktop: photos ring the headline, which sits in the middle of the first screen', async ({ page }) => {
  test.skip(!isDesktop(page), 'ring layout is desktop only');
  await page.goto('/');
  await expect(page.locator('[data-hero-photo]:visible')).toHaveCount(28);
  const h1 = (await page.locator('section.frame h1').boundingBox())!;
  const vw = page.viewportSize()!.width, vh = page.viewportSize()!.height;
  expect(Math.abs(h1.x + h1.width / 2 - vw / 2)).toBeLessThan(40);
  expect(h1.y + h1.height).toBeLessThan(vh);
  const first = (await page.locator('[data-hero-photo]').first().boundingBox())!;
  expect(first.y).toBeLessThan(h1.y);
});

test('phones: a strip of photos, then the headline, then more photos; nothing overflows', async ({ page }) => {
  test.skip(isDesktop(page), 'stacked layout is below 1024px');
  await page.goto('/');
  const text = (await page.locator('.frame__text').boundingBox())!;
  const first = (await page.locator('[data-hero-photo]').first().boundingBox())!;
  const fifth = (await page.locator('[data-hero-photo]').nth(4).boundingBox())!;
  expect(first.y + first.height).toBeLessThanOrEqual(text.y + 1);
  expect(fifth.y).toBeGreaterThanOrEqual(text.y + text.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});
