import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Hero from '../src/components/sections/Hero.astro';

test('Hero shows headline, trust badge, resolved call CTA, and brands', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Hero, { props: { location: 'main' } });
  expect(html).toContain('Top Local Locksmith in Gainesville');
  expect(html).toContain('Family-owned');                 // badge no longer repeats license/insured
  expect(html).not.toContain('HCLO18005');                // license # consolidated to the footer
  expect(html).toContain('href="tel:+13527065295"');
  expect(html).toContain('Featured Lock Brands:');       // brands row replaces the rating row
  expect(html).toContain('Kwikset');
  expect(html).toContain('Upfront pricing');             // reassurance row
  expect(html).toContain('Same-day service');
  expect(html).toContain('Top Local Locksmith in Gainesville &amp; Ocala, FL');
  expect(html).toContain('href="#services"');   // Explore Our Services → jump to services section
});

test('hero photo carries the $97 sliding door offer as text and links to the page', async () => {
  const { experimental_AstroContainer: AC } = await import('astro/container');
  const Hero = (await import('../src/components/sections/Hero.astro')).default;
  const html = await (await AC.create()).renderToString(Hero, { props: { location: 'main' } });
  const link = html.split('href="/services/sliding-door-repair/"')[1].split('</a>')[0];
  expect(link).toContain('$97');
  expect(link).toMatch(/Sliding Glass Door<br[^>]*>Track Clean &amp; Tune/);
});
