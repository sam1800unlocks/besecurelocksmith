import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CtaCard from '../../src/components/sections/CtaCard.astro';

test('CtaCard renders heading, resolved Call, and Book Now to Workiz', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(CtaCard, { props: { location: 'main', heading: 'Contact Be Secure in Alachua', body: 'Body <a href="/contact-us/">text</a>.' } });
  expect(html).toContain('Contact Be Secure in Alachua');
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('online-booking.workiz.com');
  expect(html).toContain('Book Now');
});
