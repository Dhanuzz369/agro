import { test, expect } from '@playwright/test';

// Never let tests reach the real Google Translate.
test.beforeEach(async ({ page }) => {
  await page.route('**/translate_a/element.js*', (r) => r.abort());
});

test('switcher lists 104 languages and filters by search', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-lang-open]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-lang-option]')).toHaveCount(104);
  await dialog.getByRole('searchbox').fill('fran');
  await expect(dialog.locator('[data-lang-option]:visible')).toHaveCount(1);
});

test('Escape closes the dialog and focus returns to the pill', async ({ page }) => {
  await page.goto('/');
  const pill = page.locator('[data-lang-open]');
  await pill.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(pill).toBeFocused();
});

test('pill and open dialog cause no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.locator('[data-lang-open]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await page.getByRole('dialog').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
});

test('choosing a core language navigates to the localized page', async ({ page }) => {
  await page.goto('/products/turmeric');
  await page.locator('[data-lang-open]').click();
  await page.locator('[data-lang-option][data-code="es"]').click();
  await expect(page).toHaveURL(/\/es\/products\/turmeric\/?$/);
});

test('blocked translate script falls back to translate.google.com', async ({ page }) => {
  let fallbackUrl = '';
  await page.route('https://translate.google.com/translate?**', (r) => { fallbackUrl = r.request().url(); return r.fulfill({ body: 'ok' }); });
  await page.goto('/about');
  await page.locator('[data-lang-open]').click();
  await page.locator('[data-lang-option][data-code="tr"]').click();
  await expect.poll(() => fallbackUrl, { timeout: 8000 }).toContain('tl=tr');
});

test('switcher works when storage is blocked', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.route('**/translate_a/element.js*', (r) => r.abort());
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.locator('[data-lang-open]').click();
  await page.locator('[data-lang-option][data-code="fr"]').click();
  await expect(page).toHaveURL(/\/fr\/?$/);
  expect(errors).toEqual([]);
  await ctx.close();
});

// enabled in Task 17 (needs the French lang.suggestion string)
test.fixme('suggestion banner offers French to a French browser and never redirects', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  const banner = page.locator('[data-lang-suggest]');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('français');
  await banner.locator('[data-dismiss]').click();
  await page.reload();
  await expect(banner).toBeHidden();
  await ctx.close();
});

test('suggestion banner appears for a French browser without redirecting, and dismissal persists', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  const banner = page.locator('[data-lang-suggest]');
  await expect(banner).toBeVisible();
  await expect(banner.locator('[data-yes]')).toHaveAttribute('href', '/fr/');
  await banner.locator('[data-dismiss]').click();
  await page.reload();
  await expect(banner).toBeHidden();
  await ctx.close();
});
