import { test, expect, vi, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import worker from '../contact-worker/src/index.js';

// Second Google Ads landing page, same standalone setup as /new-home/.
const lp = () => readFileSync(resolve(__dirname, '../dist/commercial/index.html'), 'utf8');

test('the landing page ships at /commercial/ and its borrowed images exist', () => {
  expect(existsSync(resolve(__dirname, '../dist/commercial/index.html'))).toBe(true);
  // The page carries no images of its own; it points at files already on the
  // site. Moving any of these breaks it, so pin them.
  const html = lp();
  for (const src of [
    '/new-home/img/logo.png',
    '/new-home/img/icon-180.png',
    '/img/services/commercial/commercial-locksmith-services.webp',
  ]) {
    expect(html).toContain(src);
    expect(existsSync(resolve(__dirname, '../dist' + src))).toBe(true);
  }
});

test('is noindex and stays out of the sitemap', () => {
  expect(lp()).toContain('<meta name="robots" content="noindex, nofollow">');
  const sitemap = readFileSync(resolve(__dirname, '../dist/sitemap-0.xml'), 'utf8');
  expect(sitemap).not.toMatch(/besecurelocksmith\.com\/commercial\//);
});

test('is standalone — no site header, footer, nav or layout', () => {
  const html = lp();
  for (const marker of ['Powered by The Locksmith Agency', 'id="reviews"', 'bsl-recent-jobs', 'data-astro-cid', 'be-secure-receptionist.fly.dev/widget']) {
    expect(html).not.toContain(marker);
  }
});

test('carries only its own ads tag, not the site-wide one', () => {
  const html = lp();
  expect(html).toContain('AW-1003919115');
  expect(html).not.toContain('G-CJ59FQS2T4');
});

test('shows only the ads tracking number', () => {
  const html = lp();
  expect(html).toContain('tel:+13527130078');
  for (const other of ['3522907035', '3523257953', '3527065295']) {
    expect(html).not.toContain(other);
  }
});

test('posts same-origin to /api/quote behind Turnstile and a honeypot', () => {
  const html = lp();
  expect(html).toContain("var FORM_ENDPOINT = '/api/quote';");
  expect(html).not.toContain("mode: 'no-cors'");
  expect(html).toContain('!res.ok');
  expect(html).toContain('data-sitekey="0x4AAAAAADyGNYjgOoL-BQLJ"');
  expect(html).toContain('name="website"');
  expect(html).toContain('name="company"');
});

// /commercial used to 301 to the service page (an old WordPress URL). It was
// removed so both /commercial and /commercial/ reach the landing page, via the
// assets layer's auto-trailing-slash. Any rule for either path would hide it.
test('no redirect rule shadows /commercial or /commercial/', () => {
  const rules = readFileSync(resolve(__dirname, '../public/_redirects'), 'utf8')
    .split('\n').map((l) => l.trim().split(/\s+/)[0]);
  for (const path of ['/commercial', '/commercial/', '/commercial/*']) {
    expect(rules).not.toContain(path);
  }
  const cfg = readFileSync(resolve(__dirname, '../wrangler.jsonc'), 'utf8');
  expect(cfg).toContain('"html_handling": "auto-trailing-slash"');
});

test('/services/commercial redirects to the commercial service page', () => {
  const rules = readFileSync(resolve(__dirname, '../public/_redirects'), 'utf8');
  expect(rules).toMatch(/^\/services\/commercial\/\s+\/services\/commercial-locksmith\/\s+301$/m);
  expect(rules).toMatch(/^\/services\/commercial\s+\/services\/commercial-locksmith\/\s+301$/m);
});

// --- the worker's lead email ------------------------------------------------

afterEach(() => vi.unstubAllGlobals());

async function submit(fields: Record<string, string>, referer: string) {
  const sent: any[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => {
    if (url.includes('siteverify')) return new Response(JSON.stringify({ success: true }));
    sent.push(JSON.parse(init.body));
    return new Response('{}');
  }));
  const body = new FormData();
  for (const [k, v] of Object.entries({ 'cf-turnstile-response': 't', ...fields })) body.append(k, v);
  const res = await worker.fetch(
    new Request('https://besecurelocksmith.com/api/quote', { method: 'POST', body, headers: { Referer: referer } }),
    { TURNSTILE_SECRET_KEY: 's', RESEND_API_KEY: 'r' },
  );
  return { res, email: sent[0] };
}

const lead = { name: 'Pat', phone: '(352) 555-0123', service: 'Storefront lock repair', city: 'Ocala' };

test('a commercial lead email names the business and its page', async () => {
  const { res, email } = await submit({ ...lead, company: 'Acme <Dental>' }, 'https://besecurelocksmith.com/commercial/?gclid=x');
  expect(res.status).toBe(200);
  expect(email.subject).toBe('Commercial lead — Acme <Dental>, Pat (Ocala)');
  expect(email.html).toContain('<strong>Business:</strong> Acme &lt;Dental&gt;');
  expect(email.html).toContain('Source: /commercial/ Google Ads landing page');
});

test('business name is optional', async () => {
  const { res, email } = await submit(lead, 'https://besecurelocksmith.com/commercial/');
  expect(res.status).toBe(200);
  expect(email.subject).toBe('Commercial lead — Pat (Ocala)');
  expect(email.html).not.toContain('Business:');
});

test('new-home leads keep their label', async () => {
  const { email } = await submit(lead, 'https://besecurelocksmith.com/new-home/');
  expect(email.subject).toBe('New movers lead — Pat (Ocala)');
  expect(email.html).toContain('Source: /new-home/ Google Ads landing page');
});

test('an unknown or missing referer still delivers, unlabelled', async () => {
  const { res, email } = await submit(lead, 'https://evil.example/<script>');
  expect(res.status).toBe(200);
  expect(email.subject).toBe('Landing page lead — Pat (Ocala)');
  expect(email.html).toContain('Source: unknown page');
});
