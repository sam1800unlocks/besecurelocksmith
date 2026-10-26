import { test, expect, vi, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import worker from '../contact-worker/src/index.js';
import { serviceMenu } from '../src/config/site';

// Client-built page served from public/ like /new-home/ and /commercial/, but
// ORGANIC: indexable, in the sitemap and the Services menu, GA4 only.
const page = () => readFileSync(resolve(__dirname, '../dist/sliding-door-repair/index.html'), 'utf8');

test('ships at /sliding-door-repair/ with its images and the borrowed logo/icon', () => {
  const html = page();
  for (const src of [
    '/new-home/img/logo.png',
    '/new-home/img/icon-180.png',
    '/sliding-door-repair/img/hero-slider.jpg',
    '/sliding-door-repair/img/rollers.jpg',
    '/sliding-door-repair/img/slider-latch.jpg',
    '/sliding-door-repair/img/keys-slider.jpg',
  ]) {
    expect(html).toContain(src);
    expect(existsSync(resolve(__dirname, '../dist' + src))).toBe(true);
  }
});

test('is indexable with a self-canonical, and listed in the sitemap', () => {
  const html = page();
  expect(html).toContain('<meta name="robots" content="index, follow">');
  expect(html).toContain('<link rel="canonical" href="https://besecurelocksmith.com/sliding-door-repair/">');
  const sitemap = readFileSync(resolve(__dirname, '../dist/sitemap-0.xml'), 'utf8');
  expect(sitemap).toContain('<loc>https://besecurelocksmith.com/sliding-door-repair/</loc>');
});

test('is in the Services menu', () => {
  const items = serviceMenu.flatMap((g) => g.items.map((i) => i.href));
  expect(items).toContain('/sliding-door-repair/');
});

test('carries GA4 but not the Google Ads tag', () => {
  const html = page();
  expect(html).toContain("gtag('config', 'G-CJ59FQS2T4')");
  expect(html).not.toContain('AW-1003919115');
});

test('Service schema points at the site-wide business entity', () => {
  const html = page();
  expect(html).toContain('"@id": "https://besecurelocksmith.com/#organization"');
  expect(html).toContain('"@type": "FAQPage"');
});

test('shows only the main number', () => {
  const html = page();
  expect(html).toContain('tel:+13527065295');
  for (const other of ['3522907035', '3523257953', '3527130078']) {
    expect(html).not.toContain(other);
  }
});

test('makes no availability claims', () => {
  expect(page()).not.toMatch(/24\/7|24-hour|around the clock|day or night|all hours|anytime/i);
});

test('posts same-origin to /api/quote behind Turnstile and a honeypot', () => {
  const html = page();
  expect(html).toContain("var FORM_ENDPOINT = '/api/quote';");
  expect(html).toContain('data-sitekey="0x4AAAAAADyGNYjgOoL-BQLJ"');
  expect(html).toContain('name="website"');
});

afterEach(() => vi.unstubAllGlobals());

test('a lead from the page is labelled as a sliding door service-page lead', async () => {
  const sent: any[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
    if (url.includes('siteverify')) return new Response(JSON.stringify({ success: true }));
    sent.push(JSON.parse(init.body));
    return new Response('{}');
  }));
  const body = new FormData();
  for (const [k, v] of Object.entries({ 'cf-turnstile-response': 't', name: 'Pat', phone: '(352) 555-0123', service: '$97 Track Clean & Tune', city: 'Gainesville' })) body.append(k, v);
  const res = await worker.fetch(
    new Request('https://besecurelocksmith.com/api/quote', { method: 'POST', body, headers: { Referer: 'https://besecurelocksmith.com/sliding-door-repair/' } }),
    { TURNSTILE_SECRET_KEY: 's', RESEND_API_KEY: 'r' },
  );
  expect(res.status).toBe(200);
  expect(sent[0].subject).toBe('Sliding door lead — Pat (Gainesville)');
  expect(sent[0].html).toContain('Source: /sliding-door-repair/ service page');
  expect(sent[0].html).toContain('$97 Track Clean &amp; Tune');
});
