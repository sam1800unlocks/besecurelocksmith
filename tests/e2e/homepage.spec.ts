import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('mobile drawer opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await page.click('[data-drawer-toggle]');
  await expect(page.locator('[data-drawer][data-open]')).toBeVisible();
  // Click the dedicated close button (aria-label="Close menu") in the drawer header
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

test('mobile drawer: focus moves in, Escape closes and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const toggle = page.locator('[data-drawer-toggle]');
  await toggle.click();
  await expect(page.locator('button[data-drawer-close]')).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-drawer][data-open]')).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('skip link is the first tab stop and targets main', async ({ page }) => {
  await page.goto('/about/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await expect(page.locator('main#main-content')).toHaveCount(1);
});

// One page of each template. The client's "Talk to Ava" widget is blocked:
// it's their script (be-secure-receptionist.fly.dev) and its shadow-DOM
// <header> trips landmark rules we can't fix from this repo.
const A11Y_PAGES = [
  '/', '/about/', '/services/', '/services/automotive-locksmith/', '/services/lock-rekeying/',
  '/service-areas/', '/service-areas/locksmith-ocala-fl/', '/locations/', '/products/',
  '/blog/', '/blog/benefits-of-having-keyless-entry-for-residential-apartment-buildings/',
  '/contact-us/', '/employment/', '/price-list/', '/testimonials/',
];
for (const path of A11Y_PAGES) {
  test(`no WCAG 2.2 AA violations: ${path}`, async ({ page }) => {
    await page.route('**/be-secure-receptionist.fly.dev/**', (r) => r.abort());
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      // Third-party embeds (Google Maps iframes + the Maps JS widget) we cannot control
      .exclude('iframe')
      .exclude('[aria-roledescription="map"]')
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}
