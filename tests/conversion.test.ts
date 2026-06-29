import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Conversion from '../src/components/sections/ConversionBand.astro';
import ServiceAreas from '../src/components/sections/ServiceAreas.astro';

test('ConversionBand has call and text actions with the right numbers', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Conversion, { props: { location: 'main' } });
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('href="sms:3523895305"');
});

test('ServiceAreas shows both office locations', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(ServiceAreas, { props: { location: 'main' } });
  expect(html).toContain('901 NW 8th Ave');
  expect(html).toContain('Ocala, FL 34471');
});
