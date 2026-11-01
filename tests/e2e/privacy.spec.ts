import { test, expect } from '@playwright/test';

const locales = ['en', 'ar', 'fr', 'es', 'pt', 'ru', 'zh', 'id', 'de'];
const path = (l: string) => (l === 'en' ? '/privacy' : `/${l}/privacy`);

test('the English policy reads as a page with a date and the contact address', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('h1')).toHaveText('Privacy policy');
  await expect(page.locator('main time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}/);
  await expect(page.locator('main a[href^="mailto:agro@goodbizglobal.com"]').first()).toBeVisible();
  expect(await page.locator('main h2').count()).toBeGreaterThanOrEqual(9);
});

for (const l of locales) {
  test(`policy page in ${l} is linked from the footer`, async ({ page }) => {
    await page.goto(l === 'en' ? '/' : `/${l}`);
    const link = page.locator(`footer a[href="${path(l)}"]`);
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${path(l)}$`));
    await expect(page.locator('html')).toHaveAttribute('lang', l === 'zh' ? 'zh-Hans' : l);
  });
}

test.describe('on a European clock', () => {
  test.use({ timezoneId: 'Europe/Madrid' });
  test('the consent banner links to the policy in the page language', async ({ page }) => {
    await page.goto('/es');
    await expect(page.locator('[data-consent] a[href="/es/privacy"]')).toBeVisible();
  });
});

test('the policy page offers the cookie choice inline', async ({ page }) => {
  await page.goto('/privacy');
  await page.locator('main [data-consent-open]').click();
  await expect(page.locator('[data-consent]')).toBeVisible();
});

test('the sitemap lists every language of the policy with its date', async ({ request }) => {
  const xml = await (await request.get('/sitemap-pages-0.xml')).text();
  for (const l of locales) expect(xml).toMatch(new RegExp(`<loc>https://goodbizagro.com${path(l)}</loc><lastmod>\\d{4}-`));
});
