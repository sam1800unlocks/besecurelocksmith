import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import TrustStrip from '../../src/components/sections/TrustStrip.astro';

test('TrustStrip renders the confirmed trust facts', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(TrustStrip, { props: {} });
  expect(html).toContain('Licensed &amp; insured');     // single phrase, no license numbers here
  expect(html).toContain('Free security assessment');
  expect(html).toContain('30-min typical response');
  expect(html).toContain('from 2,544 Google reviews');
  // License/insurance numbers are consolidated to the footer only
  expect(html).not.toContain('HCLO18005');
  expect(html).not.toContain('BKS56465112');
});
