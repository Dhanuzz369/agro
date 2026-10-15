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

test('a saved machine language is re-applied on page load', async ({ context, page, baseURL }) => {
  await context.addCookies([{ name: 'googtrans', value: '/en/tr', url: baseURL! }]);
  let fallbackUrl = '';
  await page.route('https://translate.google.com/translate?**', (r) => { fallbackUrl = r.request().url(); return r.fulfill({ body: 'ok' }); });
  await page.goto('/about');
  await expect.poll(() => fallbackUrl, { timeout: 8000 }).toContain('tl=tr');
});

test('core pages with no machine choice never load element.js', async ({ page }) => {
  let loaded = false;
  await page.unroute('**/translate_a/element.js*');
  await page.route('**/translate_a/element.js*', (r) => { loaded = true; return r.abort(); });
  await page.goto('/about');
  await page.waitForTimeout(500);
  expect(loaded).toBe(false);
});

test('re-picking a machine language reloads with the new language, one element.js per load', async ({ page, context }) => {
  await page.unroute('**/translate_a/element.js*');
  let requests = 0;
  await page.route('**/translate_a/element.js*', (r) => {
    requests++;
    return r.fulfill({ contentType: 'text/javascript', body: 'window.google={translate:{TranslateElement:function(){}}}; window.gbTranslateInit && window.gbTranslateInit();' });
  });
  const cookie = async () => (await context.cookies()).find((c) => c.name === 'googtrans')?.value ?? '';
  await page.goto('/about');
  await page.locator('[data-lang-open]').click();
  await page.locator('[data-lang-option][data-code="tr"]').click();
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await cookie()).toMatch(/\/tr$/);
  expect(requests).toBe(1);
  await page.locator('[data-lang-open]').click();
  const reloaded = page.waitForEvent('load');
  await page.locator('[data-lang-option][data-code="sw"]').click();
  await reloaded;
  expect(await cookie()).toMatch(/\/sw$/);
  await expect.poll(() => requests).toBe(2); // one per page load
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

test('suggestion banner offers French to a French browser and never redirects', async ({ browser }) => {
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
  await expect(banner.locator('[data-yes]')).toHaveAttribute('href', '/fr');
  await banner.locator('[data-dismiss]').click();
  await page.reload();
  await expect(banner).toBeHidden();
  await ctx.close();
});

test('script-specific fonts apply on zh, ar and ru pages', async ({ page }) => {
  const h1Font = async (path: string) => {
    await page.goto(path);
    return page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily);
  };
  expect(await h1Font('/zh')).toContain('Noto Sans SC');
  expect(await h1Font('/ar')).toContain('IBM Plex Sans Arabic');
  expect(await h1Font('/ru')).toContain('Noto Serif');
  expect(await h1Font('/')).not.toContain('Noto Sans SC');
});

test('zh pages load only the 400 Noto Sans SC stylesheet', async ({ page }) => {
  await page.goto('/zh');
  const sheets = await page.locator('link[rel="stylesheet"][href^="/fonts/sc/"]').evaluateAll((ls) => ls.map((l) => l.getAttribute('href')));
  expect(sheets).toEqual(['/fonts/sc/400.css']);
});
