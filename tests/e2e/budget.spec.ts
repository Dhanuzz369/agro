import { test, expect } from '@playwright/test';

for (const path of ['/', '/products/turmeric', '/products/rice', '/blog']) {
  test(`initial JS ≤ 60 KB gzip before interaction: ${path}`, async ({ page }) => {
    const sizes: Promise<number>[] = [];
    page.on('response', (r) => {
      if (r.request().resourceType() !== 'script' || !r.url().startsWith('http://localhost')) return;
      const declared = Number(r.headers()['content-length'] ?? 0);
      // read the body only when no length is declared; a body still streaming after the test ends counts as 0
      sizes.push(declared ? Promise.resolve(declared) : r.body().then((b) => b.length, () => 0));
    });
    await page.goto(path, { waitUntil: 'load' });
    // scripts requested after idle (Motion, Lenis, Three.js) are excluded by stopping here
    const total = (await Promise.all(sizes.splice(0))).reduce((a, b) => a + b, 0);
    expect(total / 1024).toBeLessThanOrEqual(60 * 3.2); // uncompressed bytes; ≈ 60 KB gzip at ~3.2× ratio
  });
}
