import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Hero from '../src/components/sections/Hero.astro';

test('Hero shows headline, license badge, resolved call CTA, and rating', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Hero, { props: { location: 'main' } });
  expect(html).toContain('Top Local Locksmith in Gainesville');
  expect(html).toContain('HCLO18005');
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('2,551');
  expect(html).toContain('Top Local Locksmith in Gainesville &amp; Ocala, FL');
  expect(html).toContain('href="/services/"');
});
