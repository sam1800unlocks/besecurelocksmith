import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import LocalIntro from '../../src/components/sections/LocalIntro.astro';

test('LocalIntro renders the city heading and intro paragraphs', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(LocalIntro, { props: { city: 'Alachua', intro: ['First para about Alachua.', 'Second para.'] } });
  expect(html).toContain('Your Local, Mobile Locksmith in Alachua, FL');
  expect(html).toContain('First para about Alachua.');
  expect(html).toContain('Second para.');
});
