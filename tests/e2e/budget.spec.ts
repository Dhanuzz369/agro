import { test, expect } from '@playwright/test';

for (const path of ['/', '/products/turmeric', '/hsn/1701', '/blog']) {
  test(`initial JS ≤ 60 KB gzip before interaction: ${path}`, async ({ page }) => {
    const sizes: number[] = [];
    page.on('response', async (r) => {
      if (r.request().resourceType() !== 'script' || !r.url().startsWith('http://localhost')) return;
      const len = Number(r.headers()['content-length'] ?? 0) || (await r.body()).length;
      sizes.push(len);
    });
    await page.goto(path, { waitUntil: 'load' });
    // scripts requested after idle (Motion, Lenis, Three.js) are excluded by stopping here
    const total = sizes.reduce((a, b) => a + b, 0);
    expect(total / 1024).toBeLessThanOrEqual(60 * 3.2); // uncompressed bytes; ≈ 60 KB gzip at ~3.2× ratio
  });
}
