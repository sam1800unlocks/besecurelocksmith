import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const lp = () => readFileSync(resolve(__dirname, '../dist/new-home/index.html'), 'utf8');

test('the landing page ships at /new-home/ with its images', () => {
  const dist = resolve(__dirname, '../dist/new-home');
  expect(existsSync(resolve(dist, 'index.html'))).toBe(true);
  for (const img of ['hero.jpg', 'team.jpg', 'logo.png', 'icon-180.png']) {
    expect(existsSync(resolve(dist, 'img', img))).toBe(true);
  }
});

// It is an ads-only page: never indexed, never linked, never in the sitemap.
test('is noindex and stays out of the sitemap', () => {
  expect(lp()).toContain('<meta name="robots" content="noindex, nofollow">');
  const sitemap = readFileSync(resolve(__dirname, '../dist/sitemap-0.xml'), 'utf8');
  expect(sitemap).not.toContain('/new-home/');
});

test('is standalone — no site header, footer, nav or layout', () => {
  const html = lp();
  for (const marker of ['Powered by The Locksmith Agency', 'id="reviews"', 'bsl-recent-jobs', 'data-astro-cid']) {
    expect(html).not.toContain(marker);
  }
});

// The page carries its own Google Ads tag; adding the site-wide one would
// double-count conversions.
test('carries only its own ads tag, not the site-wide one', () => {
  const html = lp();
  expect(html).toContain('AW-1003919115');
  expect(html).not.toContain('G-CJ59FQS2T4');
});

// One tracking line on purpose — that is how the client attributes ad calls.
test('shows only the ads tracking number', () => {
  const html = lp();
  expect(html).toContain('tel:+13527130078');
  for (const other of ['3522907035', '3523257953', '3527065295']) {
    expect(html).not.toContain(other);
  }
});

// --- the parts we changed ---------------------------------------------------

test('posts to our own same-origin endpoint, not Netlify', () => {
  const html = lp();
  expect(html).toContain("var FORM_ENDPOINT = '/api/quote';");
  expect(html).not.toContain('be-secure-rekey.netlify.app');
  expect(html).not.toContain('data-netlify');
  expect(html).not.toContain('name="form-name"');
});

// An opaque no-cors POST reports success even when the lead is rejected.
test('reads the response instead of assuming success', () => {
  const html = lp();
  expect(html).not.toContain("mode: 'no-cors'");
  expect(html).toContain('res.json()');
  expect(html).toContain('!res.ok');
});

test('is protected by Turnstile', () => {
  const html = lp();
  expect(html).toContain('class="cf-turnstile"');
  expect(html).toContain('data-sitekey="0x4AAAAAADyGNYjgOoL-BQLJ"');
  expect(html).toContain('challenges.cloudflare.com/turnstile/v0/api.js');
  expect(html).toContain("d.get('cf-turnstile-response')");
});

test('keeps the honeypot field', () => {
  expect(lp()).toContain('name="website"');
});

test('the worker serves /api/quote and verifies Turnstile', () => {
  const w = readFileSync(resolve(__dirname, '../contact-worker/src/index.js'), 'utf8');
  expect(w).toContain('if (pathname === "/api/quote") return handleQuote(request, env);');
  expect(w).toContain('async function handleQuote');
  expect(w).toContain('turnstile/v0/siteverify');
  expect(w).toContain('bsl_hp');
  const cfg = readFileSync(resolve(__dirname, '../contact-worker/wrangler.jsonc'), 'utf8');
  expect(cfg).toContain('besecurelocksmith.com/api/quote');
});
