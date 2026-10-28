import { test, expect, type Page } from '@playwright/test';

// site.yaml ships a placeholder lead endpoint, so tests inject one and route it.
const ENDPOINT = 'https://script.google.com/macros/s/test/exec';
async function open(page: Page, query = '', endpoint = true) {
  await page.goto(`/contact${query}`);
  await expect(page.locator('[data-quote-form][data-enhanced]')).toBeVisible();
  if (endpoint) await page.evaluate((u) => { document.querySelector<HTMLElement>('[data-quote-form]')!.dataset.endpoint = u; }, ENDPOINT);
}
const next = (page: Page) => page.locator('[data-next]').click();
const active = (page: Page) => page.locator('.qf__step[data-active]');
async function contact(page: Page) {
  await page.fill('input[name="name"]', 'Amal');
  await page.fill('input[name="email"]', 'amal@gulf.ae');
  await next(page);
}

test('starts with the contact step only, one step at a time', async ({ page }) => {
  await open(page);
  await expect(active(page)).toHaveAttribute('data-step', 'contact');
  await expect(page.locator('.qf__step:visible')).toHaveCount(1);
  await expect(page.locator('[data-step-count]')).toHaveText('Step 1 of 7');
  await expect(page.locator('[data-back]')).toBeHidden();
});

test('contact step needs a name and an email or WhatsApp', async ({ page }) => {
  await open(page);
  await next(page);
  await expect(page.locator('#err-name')).toHaveText('Required');
  await expect(page.locator('#err-email')).toHaveText('Add an email or a WhatsApp number');
  await page.fill('input[name="name"]', 'Amal');
  await page.fill('input[name="whatsapp"]', '+971 50 123 4567');
  await next(page);
  await expect(active(page)).toHaveAttribute('data-step', 'product');
});

test('contact details are sent as soon as the buyer leaves step 1', async ({ page }) => {
  const bodies: any[] = [];
  await page.route(ENDPOINT, async (r) => { bodies.push(JSON.parse(r.request().postData()!)); await r.fulfill({ json: { ok: true } }); });
  await open(page);
  await contact(page);
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toMatchObject({ stage: 'contact', name: 'Amal', email: 'amal@gulf.ae' });
  expect(bodies[0].leadId).toBeTruthy();
});

test('tapping a product card moves on by itself; back returns', async ({ page }) => {
  await open(page, '', false);
  await contact(page);
  await page.locator('.qf__tile', { hasText: 'Turmeric' }).click();
  await expect(active(page)).toHaveAttribute('data-step', 'variety');
  await expect(page.locator('.qf__chips[data-current] .qf__chip', { hasText: 'Turmeric powder' })).toBeVisible();
  await page.locator('[data-back]').click();
  await expect(active(page)).toHaveAttribute('data-step', 'product');
  await expect(page.locator('input[name="product"][value="turmeric"]')).toBeChecked();
});

test('"Quote this variety" links skip the product and variety steps', async ({ page }) => {
  await open(page, '?product=turmeric&variety=powder', false);
  await expect(page.locator('[data-step-count]')).toHaveText('Step 1 of 5');
  await contact(page);
  await expect(active(page)).toHaveAttribute('data-step', 'quantity');
});

test('hostile query params are ignored', async ({ page }) => {
  await open(page, '?product=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E', false);
  await expect(page.locator('[data-step-count]')).toHaveText('Step 1 of 7');
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

async function finish(page: Page) {
  await page.locator('.qf__chip', { hasText: '2–5 containers' }).click();
  await expect(active(page)).toHaveAttribute('data-step', 'destination');
  await page.fill('input[name="country"]', 'United Arab Emirates');
  await next(page);
  await page.locator('.qf__chip', { hasText: 'CIF' }).click();
  await expect(active(page)).toHaveAttribute('data-step', 'notes');
  await expect(page.locator('[data-next]')).toHaveText('Send quote request');
}

test('the full flow updates one lead row and ends on success', async ({ page }) => {
  const bodies: any[] = [];
  await page.route(ENDPOINT, async (r) => { bodies.push(JSON.parse(r.request().postData()!)); await r.fulfill({ json: { ok: true } }); });
  await open(page, '?product=turmeric&variety=powder');
  await contact(page);
  await finish(page);
  await page.fill('textarea[name="message"]', '25 kg bags');
  await next(page);
  await expect(page.locator('[data-form-state="success"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('[data-show="success"] h3')).toBeFocused();
  const final = bodies.find((b) => b.stage === 'submitted');
  expect(final).toMatchObject({ product: 'Turmeric', variety: 'Turmeric powder', quantity: '2–5 containers', incoterm: 'CIF', message: '25 kg bags' });
  expect(new Set(bodies.map((b) => b.leadId)).size).toBe(1);
});

test('double click on send posts the final request once', async ({ page }) => {
  let finals = 0;
  await page.route(ENDPOINT, async (r) => {
    if (JSON.parse(r.request().postData()!).stage === 'submitted') { finals++; await new Promise((res) => setTimeout(res, 500)); }
    await r.fulfill({ json: { ok: true } });
  });
  await open(page, '?product=turmeric&variety=powder');
  await contact(page);
  await finish(page);
  await page.locator('[data-next]').dblclick();
  await expect(page.locator('[data-form-state="success"]')).toBeVisible({ timeout: 8000 });
  expect(finals).toBe(1);
});

test('service failure shows WhatsApp fallback with the request written out', async ({ page }) => {
  await page.route(ENDPOINT, (r) => r.fulfill({ status: 500, body: 'err' }));
  await open(page, '?product=turmeric&variety=powder');
  await contact(page);
  await finish(page);
  await next(page);
  await expect(page.locator('[data-form-state="error"]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('[data-show="error"] h3')).toBeFocused();
  await expect(page.locator('[data-fallback="whatsapp"]')).toHaveAttribute('href', /text=Quote%20request/);
  await expect(page.locator('[data-fallback="email"]')).toHaveAttribute('href', /^mailto:agro@goodbizglobal\.com\?/);
});

test('placeholder endpoint skips the network and shows the error state', async ({ page }) => {
  let calls = 0;
  await page.route('https://script.google.com/**', async (r) => { calls++; await r.abort(); });
  await open(page, '?product=turmeric&variety=powder', false);
  await contact(page);
  await finish(page);
  await next(page);
  await expect(page.locator('[data-form-state="error"]')).toBeVisible({ timeout: 8000 });
  expect(calls).toBe(0);
});

test('"Something else" asks which product, skips varieties and sends the typed name', async ({ page }) => {
  const bodies: any[] = [];
  await page.route(ENDPOINT, async (r) => { bodies.push(JSON.parse(r.request().postData()!)); await r.fulfill({ json: { ok: true } }); });
  await open(page);
  await contact(page);
  await page.locator('.qf__tile--other').click();
  await expect(page.locator('input[name="productOther"]')).toBeFocused();
  await next(page);
  await expect(page.locator('#err-productOther')).toHaveText('Required');
  await page.fill('input[name="productOther"]', 'Black pepper');
  await next(page);
  await expect(active(page)).toHaveAttribute('data-step', 'quantity');
  await expect(page.locator('[data-step-count]')).toHaveText('Step 3 of 6');
  await expect.poll(() => bodies.find((b) => b.stage === 'product')?.product).toBe('Black pepper');
});
