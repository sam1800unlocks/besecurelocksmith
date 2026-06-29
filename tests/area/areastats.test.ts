import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaStats from '../../src/components/sections/AreaStats.astro';

test('renders county, zips, response, rating', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaStats, { props: { area: { city: 'Hampton', county: 'Bradford County', zips: ['32044'], responseTime: '~30 min' } } });
  expect(html).toContain('Bradford County');
  expect(html).toContain('32044');
  expect(html).toContain('~30 min');
  expect(html).toContain('4.9');
});

test('hides the county card when county is absent', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaStats, { props: { area: { city: 'X', zips: [], responseTime: '~30 min' } } });
  expect(html).not.toContain('County');
});
