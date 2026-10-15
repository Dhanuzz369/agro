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

// site.yaml ships a placeholder Web3Forms key (form then goes straight to the fallback state), so tests inject a test key.
async function fill(page: import('@playwright/test').Page, wait = true) {
  await page.goto('/contact?product=turmeric&variety=powder');
  await page.evaluate(() => { document.querySelector<HTMLElement>('[data-quote-form]')!.dataset.key = 'test-key'; });
  await page.fill('input[name="quantity"]', '20');
  await page.fill('input[name="country"]', 'UAE');
  await page.fill('input[name="name"]', 'Amal');
  await page.fill('input[name="email"]', 'amal@gulf.ae');
  if (wait) await page.waitForTimeout(3100);
}

test('double click sends exactly one request and shows success', async ({ page }) => {
  let calls = 0;
  await page.route('https://api.web3forms.com/submit', async (r) => { calls++; await new Promise((res) => setTimeout(res, 500)); await r.fulfill({ json: { success: true } }); });
  await fill(page);
  const btn = page.getByRole('button', { name: 'Send quote request' });
  await btn.dblclick();
  await expect(page.locator('[data-form-state="success"]')).toBeVisible();
  await expect(page.locator('[data-show="success"] h3')).toBeFocused();
  expect(calls).toBe(1);
});

test('service failure shows the error state (no dead fallback links while contact values are placeholders)', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', (r) => r.fulfill({ status: 500, body: 'err' }));
  await fill(page);
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.locator('[data-form-state="error"]')).toBeVisible();
  await expect(page.locator('[data-show="error"] h3')).toBeFocused();
  await expect(page.locator('[data-fallback="email"]')).toHaveCount(0); // site.yaml email is a placeholder
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
});

test('a valid quote submitted immediately is delayed, not dropped', async ({ page }) => {
  let calls = 0;
  await page.route('https://api.web3forms.com/submit', async (r) => { calls++; await r.fulfill({ json: { success: true } }); });
  await fill(page, false);
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.locator('[data-form-state="success"]')).toBeVisible({ timeout: 8000 });
  expect(calls).toBe(1);
});

test('placeholder key skips the network and shows the error state', async ({ page }) => {
  let calls = 0;
  await page.route('https://api.web3forms.com/submit', async (r) => { calls++; await r.abort(); });
  await page.goto('/contact?product=turmeric');
  await expect(page.locator('input[name="access_key"]')).toHaveCount(0);
  await page.fill('input[name="quantity"]', '20');
  await page.fill('input[name="country"]', 'UAE');
  await page.fill('input[name="name"]', 'Amal');
  await page.fill('input[name="email"]', 'amal@gulf.ae');
  await page.getByRole('button', { name: 'Send quote request' }).click();
  await expect(page.locator('[data-form-state="error"]')).toBeVisible();
  expect(calls).toBe(0);
});
