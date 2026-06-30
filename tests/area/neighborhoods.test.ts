import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaNeighborhoods from '../../src/components/sections/AreaNeighborhoods.astro';

test('renders neighborhood chips under a city heading', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaNeighborhoods, { props: { city: 'Gainesville', neighborhoods: ['Haile Plantation', 'Duckpond'] } });
  expect(html).toContain('Neighborhoods We Serve in Gainesville, FL');
  expect(html).toContain('Haile Plantation');
  expect(html).toContain('Duckpond');
});

test('renders nothing when there are no neighborhoods', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaNeighborhoods, { props: { city: 'Newberry', neighborhoods: [] } });
  expect(html.trim()).toBe('');
});
