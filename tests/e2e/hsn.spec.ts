import { test, expect } from '@playwright/test';
const codes = ['09101110','09101120','09101130','09101190','09103010','09103020','09103030','100640','1006','10063099','120242','1701','80280','8011220'];

for (const code of codes) {
  test(`hsn page ${code}`, async ({ page }) => {
    const res = await page.goto(`/hsn/${code}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('HSN');
  });
}

test('turmeric powder HSN page answers first and links to product', async ({ page }) => {
  await page.goto('/hsn/09103030');
  await expect(page.locator('[data-answer]')).toContainText('09103030');
  await expect(page.locator('a[href="/contact?product=turmeric&variety=powder"]')).toHaveCount(1);
  await expect(page.locator('a[href="/products/turmeric"]').first()).toBeVisible();
});

test('unverified HSN page shows the verification note', async ({ page }) => {
  await page.goto('/hsn/80280');
  await expect(page.locator('[data-unverified]')).toBeVisible();
});
