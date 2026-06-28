import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PM from '../src/components/sections/PropertyManagement.astro';
test('PM band shows the heading and four features', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(PM, { props: {} });
  expect(html).toContain('Commercial Property Management Solutions');
  expect(html).toContain('High-Security Locks');
});
