import { test, expect, type Page } from '@playwright/test';

// dataLayer holds gtag's `arguments` objects; copy them out as plain arrays.
const layer = (page: Page) => page.evaluate(() => (window as any).dataLayer.map((a: IArguments) => Array.from(a)));
const consentUpdates = async (page: Page) => (await layer(page)).filter((a: any[]) => a[0] === 'consent' && a[1] === 'update');
const banner = (page: Page) => page.locator('[data-consent]');

test('consent defaults: analytics off in Europe, on elsewhere, ad storage always off', async ({ page }) => {
  await page.goto('/');
  const defaults = (await layer(page)).filter((a: any[]) => a[0] === 'consent' && a[1] === 'default').map((a: any[]) => a[2]);
  expect(defaults).toHaveLength(2);
  const eu = defaults.find((d: any) => d.region);
  const rest = defaults.find((d: any) => !d.region);
  expect(eu.region).toEqual(expect.arrayContaining(['DE', 'FR', 'GB', 'CH']));
  expect(eu.analytics_storage).toBe('denied');
  expect(rest.analytics_storage).toBe('granted');
  for (const d of defaults) for (const k of ['ad_storage', 'ad_user_data', 'ad_personalization']) expect(d[k]).toBe('denied');
  expect(await layer(page)).toContainEqual(['config', 'G-XPRPV7VPW5']);
});

test('the gtag.js library is never fetched outside the production deploy', async ({ page }) => {
  const hits: string[] = [];
  page.on('request', (r) => { if (r.url().includes('googletagmanager.com')) hits.push(r.url()); });
  await page.goto('/products/cashew', { waitUntil: 'load' });
  expect(hits).toEqual([]);
});

test.describe('a visitor on a European clock', () => {
  test.use({ timezoneId: 'Europe/Berlin' });

  test('sees the banner; Allow turns analytics on and is remembered', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    await page.locator('[data-consent-allow]').click();
    await expect(banner(page)).toBeHidden();
    expect(await consentUpdates(page)).toContainEqual(['consent', 'update', { analytics_storage: 'granted' }]);
    await page.reload();
    await expect(banner(page)).toBeHidden();
    expect(await consentUpdates(page)).toContainEqual(['consent', 'update', { analytics_storage: 'granted' }]);
  });

  test('Decline keeps analytics off and is remembered', async ({ page }) => {
    await page.goto('/de');
    await expect(banner(page)).toBeVisible();
    await page.locator('[data-consent-decline]').click();
    await expect(banner(page)).toBeHidden();
    expect(await consentUpdates(page)).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    await page.reload();
    await expect(banner(page)).toBeHidden();
  });

  test('the banner fits a phone screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    await page.goto('/ar');
    await expect(banner(page)).toBeVisible();
    const box = (await banner(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});

test('the language suggestion waits until the consent question is answered', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'fr-FR', timezoneId: 'Europe/Paris' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(banner(page)).toBeVisible();
  await expect(page.locator('[data-lang-suggest]')).toBeHidden();
  await page.locator('[data-consent-decline]').click();
  await expect(page.locator('[data-lang-suggest]')).toBeVisible();
  await ctx.close();
});

test.describe('a visitor outside Europe', () => {
  test.use({ timezoneId: 'Asia/Dubai' });

  test('sees no banner until they open cookie settings in the footer', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeHidden();
    await page.locator('[data-consent-open]').click();
    await expect(banner(page)).toBeVisible();
    await page.locator('[data-consent-decline]').click();
    expect(await consentUpdates(page)).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);
  });
});

test('a WhatsApp click is recorded', async ({ page, context }) => {
  await context.route('https://wa.me/**', (r) => r.fulfill({ body: '' }));
  await page.goto('/products/turmeric');
  await page.locator('.wa').click();
  await expect.poll(async () => (await layer(page)).some((a: any[]) => a[0] === 'event' && a[1] === 'whatsapp_click')).toBe(true);
});
