import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ContactMethods from '../src/components/sections/ContactMethods.astro';
import { site } from '../src/config/site';

test('renders Call, Text, and Book Online methods with correct hrefs', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(ContactMethods, { props: {} });
  expect(html).toContain('Call Us');
  expect(html).toContain('Text Us');
  expect(html).toContain('Book Online');
  expect(html).toContain('href="tel:+13527065295"');   // Call → E.164
  expect(html).toContain('href="sms:+13523895305"');   // Text → E.164
  expect(html).toContain(`href="${site.bookingUrl}"`); // Book → Workiz
  expect(html).toContain('target="_blank"');            // Book opens in new tab
});
