import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaHero from '../../src/components/sections/AreaHero.astro';

test('AreaHero renders city H1, breadcrumb, resolved Call, Book Now', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaHero, { props: { city: 'Alachua', heroSubhead: 'Fast local locksmith.', location: 'main' } });
  expect(html).toContain('Locksmith in Alachua, FL');
  expect(html).toContain('href="/service-areas/"');           // breadcrumb
  expect(html).toContain('Service Area');                       // eyebrow/badge
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('online-booking.workiz.com');
});
