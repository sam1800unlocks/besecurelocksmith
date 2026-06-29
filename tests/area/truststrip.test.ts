import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import TrustStrip from '../../src/components/sections/TrustStrip.astro';

test('TrustStrip renders the confirmed trust facts', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(TrustStrip, { props: {} });
  expect(html).toContain('HCLO18005');
  expect(html).toContain('BKS56465112');
  expect(html).toContain('Since 2012');
  expect(html).toContain('Family-operated');
  expect(html).toContain('Free security assessment');
  expect(html).toContain('30-min typical response');
  expect(html).toContain('from 2,551 Google reviews');
});
