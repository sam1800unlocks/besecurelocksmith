import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NavBar from '../src/components/sections/NavBar.astro';
import PromoBar from '../src/components/sections/PromoBar.astro';

test('PromoBar shows the resolved phone as a tel link', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(PromoBar, { props: { location: 'main' } });
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('352-706-5295');
});

test('NavBar renders all eight nav tabs with real hrefs', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(NavBar, { props: { location: 'main' } });
  for (const href of ['/', '/about/', '/services/', '/price-list/', '/service-areas/', '/testimonials/', '/blog/', '/contact-us/']) {
    expect(html).toContain(`href="${href}"`);
  }
});
