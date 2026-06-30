import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('mobile drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await page.click('[data-drawer-toggle]');
  await expect(page.locator('[data-drawer][data-open]')).toBeVisible();
  // Click the dedicated close button (aria-label="Close") in the drawer header
  await page.click('button[data-drawer-close]');
  await expect(page.locator('[data-drawer][data-open]')).toHaveCount(0);
});

test('FAQ accordion toggles', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('[data-faq]').first();
  // First FAQ starts open (open={i===0}); clicking closes it
  await first.locator('summary').click();
  await expect(first).toHaveJSProperty('open', false);
});

test('no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    // Exclude third-party iframes (e.g. YouTube) we cannot control
    .exclude('iframe')
    .analyze();
  const serious = results.violations.filter(
    (v) => ['serious', 'critical'].includes(v.impact ?? '')
  );
  expect(serious).toEqual([]);
});
