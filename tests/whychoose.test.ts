import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import WhyChoose from '../src/components/sections/WhyChoose.astro';
test('WhyChoose lists reassurances and the video', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(WhyChoose, { props: {} });
  expect(html).toContain('15+ years of experience');
  // Lazy facade: the id is wired to the play button, the iframe is built on click.
  expect(html).toContain('data-yt="HIdYUZ33DO0"');
});
