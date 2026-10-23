import { test, expect } from '@playwright/test';

test('english home has header, footer and quote CTA; no dead WhatsApp button while the number is a placeholder', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request a quote' }).first()).toBeVisible();
  await expect(page.locator('[data-whatsapp]')).toHaveCount(0); // site.yaml whatsapp is still REPLACE:
  await expect(page.locator('a[href^="#contact-whatsapp"]')).toHaveCount(0);
});

test('arabic home is rtl', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('home has hreflang for all 9 locales plus x-default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(10);
});

test('every ld+json block parses', async ({ page }) => {
  await page.goto('/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks.length).toBeGreaterThan(0);
  for (const b of blocks) expect(() => JSON.parse(b)).not.toThrow();
});

test('mobile menu opens with visible toggle and closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.locator('.hdr__toggle');
  const link = page.locator('#main-nav ul a').first();
  await expect(link).toBeHidden();
  await toggle.click();
  await expect(link).toBeVisible();
  await expect(toggle).toHaveCSS('color', 'rgb(247, 241, 232)');
  await page.keyboard.press('Escape');
  await expect(link).toBeHidden();
});

test('focus rings: ink on light surfaces, turmeric on forest, ink on form inputs', async ({ page }) => {
  const INK = 'rgb(28, 27, 26)';
  const TURMERIC = 'rgb(217, 154, 30)';
  const ring = (sel: string) => page.locator(sel).first().evaluate((el) => { (el as HTMLElement).focus(); return getComputedStyle(el).outlineColor; });
  await page.goto('/products');
  await page.keyboard.press('Tab'); // keyboard modality so programmatic focus is :focus-visible
  expect(await ring('main a')).toBe(INK);
  expect(await ring('footer a')).toBe(TURMERIC);
  await page.goto('/');
  await page.keyboard.press('Tab');
  expect(await ring('.split a')).toBe(INK);
  expect(await ring('#world a, footer a')).toBe(TURMERIC);
  await page.goto('/contact');
  expect(await ring('form input:not([type="hidden"]):not([name="botcheck"])')).toBe(INK);
});
