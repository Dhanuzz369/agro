import { test, expect, type Page } from '@playwright/test';

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

test('hero has nine product panels in catalog order, each linking to its product page', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('[data-hero-panel] a');
  await expect(links).toHaveCount(9);
  const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  const range = await page.locator('#range a[href^="/products/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(range);
  for (const h of hrefs) expect(h).toMatch(/^\/products\/[a-z-]+$/);
  await expect(page.locator('[data-hero-panel] .panel__name')).toHaveCount(9);
});

test('headline, label, lede and both buttons point where they should', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('section.split');
  await expect(hero.locator('h1')).toBeVisible();
  await expect(hero.locator('h1')).toHaveText(/SOUTH INDIA'S HARVEST/);
  await expect(hero.locator('.split__label')).toHaveText(/70\+/);
  await expect(hero.locator('.split__btn')).toHaveCount(2);
  await expect(hero.locator('.split__btn').first()).toHaveAttribute('href', '/products');
  await expect(hero.locator('.split__btn--primary')).toHaveAttribute('href', '/contact');
});

test('localized hero links keep the locale prefix', async ({ page }) => {
  await page.goto('/fr');
  await expect(page.locator('.split__btn').first()).toHaveAttribute('href', '/fr/products');
  await expect(page.locator('.split__btn--primary')).toHaveAttribute('href', '/fr/contact');
  await expect(page.locator('[data-hero-panel] a').first()).toHaveAttribute('href', /^\/fr\/products\//);
});

test('only the first panel photo loads eagerly at high priority', async ({ page }) => {
  await page.goto('/');
  const imgs = page.locator('[data-hero-panel] img');
  await expect(imgs.first()).toHaveAttribute('loading', 'eager');
  await expect(imgs.first()).toHaveAttribute('fetchpriority', 'high');
  const rest = await imgs.evaluateAll((els) => els.slice(1).map((e) => e.getAttribute('loading')));
  expect(rest).toEqual(Array(8).fill('lazy'));
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

test('desktop: the text column stays pinned while the panels scroll, then releases', async ({ page }) => {
  test.skip(!isDesktop(page), 'sticky split is desktop only');
  await page.goto('/');
  const h1 = page.locator('section.split h1');
  await expect(page.locator('.split__text')).toHaveCSS('position', 'sticky');
  const vh = page.viewportSize()!.height;
  await page.evaluate((y) => window.scrollTo(0, y), vh * 3);
  await expect.poll(async () => (await h1.boundingBox())!.y).toBeGreaterThan(0);
  expect((await h1.boundingBox())!.y).toBeLessThan(vh);
  // once the panels end the column scrolls away with the section and the page continues
  await page.evaluate(() => window.scrollTo(0, document.querySelector<HTMLElement>('.certs')!.getBoundingClientRect().top + window.scrollY));
  await expect.poll(async () => { const b = (await h1.boundingBox())!; return b.y + b.height; }).toBeLessThanOrEqual(0);
});

test('desktop: panels sit on the inline-start half, text on the other (mirrored in Arabic)', async ({ page }) => {
  test.skip(!isDesktop(page), 'split columns are desktop only');
  const x = async (sel: string) => (await page.locator(sel).first().boundingBox())!.x;
  await page.goto('/');
  expect(await x('.split__panels')).toBeLessThan(await x('.split__text'));
  await page.goto('/ar');
  expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
  expect(await x('.split__panels')).toBeGreaterThan(await x('.split__text'));
});

test('phones: headline comes first, panels stack below, nothing overflows', async ({ page }) => {
  test.skip(isDesktop(page), 'stacked layout is below 1024px');
  await page.goto('/');
  const textBox = (await page.locator('.split__text').boundingBox())!;
  const panelBox = (await page.locator('[data-hero-panel]').first().boundingBox())!;
  expect(panelBox.y).toBeGreaterThanOrEqual(textBox.y + textBox.height - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});
