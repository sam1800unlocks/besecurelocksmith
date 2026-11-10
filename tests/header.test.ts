import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NavBar from '../src/components/sections/NavBar.astro';
import PromoBar from '../src/components/sections/PromoBar.astro';

test('PromoBar shows the resolved phone as a tel link', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(PromoBar, { props: { location: 'main' } });
  expect(html).toContain('href="tel:+13527065295"');
  expect(html).toContain('352-706-5295');
});

test('NavBar renders all eight nav tabs with real hrefs', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(NavBar, { props: { location: 'main' } });
  for (const href of ['/', '/about/', '/price-list/', '/service-areas/', '/testimonials/', '/blog/', '/contact-us/']) {
    expect(html).toContain(`href="${href}"`);
  }
  // "Services" is a non-clickable dropdown trigger (no /services/ page exists)
  expect(html).toContain('Services');
  expect(html).not.toContain('href="/#services"');
});

test('NavBar Services dropdown renders crawlable service links (server-rendered)', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(NavBar, { props: { location: 'main' } });
  for (const href of [
    '/services/automotive-locksmith/', '/services/commercial-locksmith/',
    '/services/car-key-replacement/', '/services/master-key-systems/',
    '/services/emergency-lockouts/', '/services/smart-lock-installation/',
    '/services/residential-locksmith/', '/services/safe-locksmith/',
  ]) {
    expect(html).toContain(`href="${href}"`);
  }
});

test('Offices strip shows both offices + hours above the promo on non-location pages', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(PromoBar, { props: { location: 'main' } });
  expect(html).toContain('901 NW 8th Ave c17, Gainesville, FL 32601');
  expect(html).toContain('217 SE 1st Ave Ste 200-50, Ocala, FL 34471');
  expect(html).toContain('Mon–Fri 8 am–9 pm · Sat 9 am–7 pm');
  expect(html).toContain('maps.google.com/?cid=1525264823828817691');
  expect(html).toContain('maps.google.com/?cid=4138983982412980004');
  expect(html.indexOf('Office locations and hours')).toBeLessThan(html.indexOf('Sliding door repair promotion'));
});

test('Offices strip lists wheelchair accessibility for each office', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(PromoBar, { props: { location: 'main' } });
  expect(html.match(/Wheelchair accessible entrance, parking lot, restroom &amp; seating/g)?.length).toBe(2);
});

test('Offices strip shows only that office on a location page', async () => {
  const c = await AstroContainer.create();
  const ocala = await c.renderToString(PromoBar, { props: { location: 'ocala' } });
  expect(ocala).toContain('217 SE 1st Ave Ste 200-50');
  expect(ocala).not.toContain('901 NW 8th Ave c17');
  const gnv = await c.renderToString(PromoBar, { props: { location: 'gainesville' } });
  expect(gnv).toContain('901 NW 8th Ave c17');
  expect(gnv).not.toContain('217 SE 1st Ave.');
});

test('PromoBar promotes sliding door repair on both breakpoints', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(PromoBar, { props: { location: 'main' } });
  expect(html.match(/href="\/services\/sliding-door-repair\/"/g)?.length).toBe(2);
  expect(html).toContain('$97');
});
