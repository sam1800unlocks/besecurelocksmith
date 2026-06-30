import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { resolveLocation, resolvePhone, resolveSocials } from '../../src/lib/locations';
import NavBar from '../../src/components/sections/NavBar.astro';
import Footer from '../../src/components/sections/Footer.astro';

test('location records resolve their tracking phone numbers', () => {
  expect(resolvePhone(resolveLocation('gainesville'))).toBe('352-290-7035');
  expect(resolvePhone(resolveLocation('ocala'))).toBe('352-325-7953');
  expect(resolvePhone(resolveLocation('lake-city'))).toBe('386-251-6901');
  expect(resolvePhone(resolveLocation('main'))).toBe('352-706-5295');
});

test('Ocala overrides the Yelp social; others use the global Yelp', () => {
  const ocalaYelp = resolveSocials(resolveLocation('ocala')).find((s) => s.name === 'Yelp');
  expect(ocalaYelp?.href).toContain('be-secure-locksmith-ocala');
  const mainYelp = resolveSocials(resolveLocation('main')).find((s) => s.name === 'Yelp');
  expect(mainYelp?.href).toContain('be-secure-locksmith-gainesville-2');
});

test('NavBar with a location shows its tracking number', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(NavBar, { props: { location: 'ocala' } });
  expect(html).toContain('href="tel:+13523257953"');          // Ocala tracking number
  // (the header shows only the first 3 socials — FB/YT/IG — so the Yelp override
  //  is exercised by the Footer test, which renders the full social set.)
});

test('Footer with a location uses that location socials', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Footer, { props: { location: 'ocala' } });
  expect(html).toContain('be-secure-locksmith-ocala');
});
