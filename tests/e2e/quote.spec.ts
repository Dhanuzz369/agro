import { test, expect } from '@playwright/test';

test('prefills product and variety from query', async ({ page }) => {
  await page.goto('/contact?product=turmeric&variety=powder');
  await expect(page.locator('select[name="product"]')).toHaveValue('turmeric');
  await expect(page.locator('select[name="variety"]')).toHaveValue('powder');
});

test('hostile query params are ignored', async ({ page }) => {
  await page.goto('/contact?product=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');
  await expect(page.locator('select[name="product"]')).toHaveValue('');
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test('shows inline errors on empty submit', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.locator('#err-email')).toHaveText('Required');
  await expect(page.locator('#err-product')).toHaveText('Choose a product');
});

async function fill(page: import('@playwright/test').Page) {
  await page.goto('/contact?product=turmeric&variety=powder');
  await page.fill('input[name="quantity"]', '20');
  await page.fill('input[name="country"]', 'UAE');
  await page.fill('input[name="name"]', 'Amal');
  await page.fill('input[name="email"]', 'amal@gulf.ae');
  await page.waitForTimeout(3100);
}

test('double click sends exactly one request and shows success', async ({ page }) => {
  let calls = 0;
  await page.route('https://api.web3forms.com/submit', async (r) => { calls++; await new Promise((res) => setTimeout(res, 500)); await r.fulfill({ json: { success: true } }); });
  await fill(page);
  const btn = page.getByRole('button', { name: 'Send quote request' });
  await btn.dblclick();
  await expect(page.locator('[data-form-state="success"]')).toBeVisible();
  expect(calls).toBe(1);
});

test('service failure shows WhatsApp and email fallbacks', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', (r) => r.fulfill({ status: 500, body: 'err' }));
  await fill(page);
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.locator('[data-form-state="error"]')).toBeVisible();
  await expect(page.locator('[data-fallback="email"]')).toBeVisible();
});
