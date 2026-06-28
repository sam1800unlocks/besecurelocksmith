import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Button from '../src/components/primitives/Button.astro';
import Stars from '../src/components/primitives/Stars.astro';

test('Button renders an anchor with the given href and primary styling', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Button, { props: { href: 'tel:3527065295', variant: 'primary' }, slots: { default: 'Call' } });
  expect(html).toContain('href="tel:3527065295"');
  expect(html).toContain('Call');
});

test('Stars renders 5 stars with an accessible label', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Stars, { props: {} });
  expect((html.match(/★/g) || []).length).toBe(5);
  expect(html).toContain('out of 5 stars');
});
