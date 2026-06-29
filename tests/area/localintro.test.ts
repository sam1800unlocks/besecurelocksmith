import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import LocalIntro from '../../src/components/sections/LocalIntro.astro';

test('renders the city heading and HTML intro blocks incl. inline links', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(LocalIntro, { props: { city: 'Hampton', intro: [
    '<p>We serve <a href="/services/lock-rekeying/">rekeying</a> in Hampton.</p>',
    '<ul><li>Lockouts</li></ul>',
  ] } });
  expect(html).toContain('Your Local, Mobile Locksmith in Hampton, FL');
  expect(html).toContain('href="/services/lock-rekeying/"');   // real anchor, not escaped
  expect(html).toContain('<li>Lockouts</li>');
  expect(html).toContain('max-w-[1180px]');                    // body matches service-page width
});
