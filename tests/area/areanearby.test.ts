import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaNearby from '../../src/components/sections/AreaNearby.astro';

test('renders neighborhoods + nearby cross-links', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaNearby, { props: {
    area: { city: 'Hampton', neighborhoods: ['Downtown Hampton'] },
    nearby: [{ city: 'Alachua', slug: 'locksmith-alachua-fl' }],
  } });
  expect(html).toContain('Downtown Hampton');
  expect(html).toContain('href="/service-areas/locksmith-alachua-fl/"');
  expect(html).toContain('Alachua');
});

test('renders nothing when both lists are empty', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaNearby, { props: { area: { city: 'Hampton', neighborhoods: [] }, nearby: [] } });
  expect(html.trim()).toBe('');
});
