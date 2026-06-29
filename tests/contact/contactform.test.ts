import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ContactForm from '../../src/components/sections/ContactForm.astro';

test('renders the form with required fields, honeypot, turnstile, and action', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(ContactForm, { props: {} });
  expect(html).toContain('action="/api/contact"');
  expect(html).toContain('name="email"');
  expect(html).toContain('name="message"');
  expect(html).toContain('name="bsl_hp"');
  expect(html).toContain('cf-turnstile');
});
