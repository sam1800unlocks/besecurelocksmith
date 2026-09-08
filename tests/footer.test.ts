import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Footer from '../src/components/sections/Footer.astro';
import { offices } from '../src/config/offices';
import { telHref } from '../src/config/site';

test('Footer shows license, agency credit, and resolved phone', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Footer, { props: { location: 'main' } });
  expect(html).toContain('HCLO18005');
  expect(html).toContain('Powered by The Locksmith Agency');
  // Each office lists its own tracked line.
  expect(html).toContain(`href="${telHref(offices.gainesville.phone)}"`);
  expect(html).toContain(`href="${telHref(offices.ocala.phone)}"`);
  expect(html).toContain('href="/privacy-policy/"');
});

test('Footer lists service-area links', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Footer, { props: { location: 'main' } });
  expect(html).toContain('and other areas near Gainesville, FL');
  expect(html).toContain('href="/service-areas/locksmith-the-villages-fl/"');
  expect(html).toContain('href="/service-areas/"');
});
