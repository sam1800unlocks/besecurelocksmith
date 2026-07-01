import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = (p: string) => {
  const f = resolve(__dirname, '..', 'dist', p);
  if (!existsSync(f)) throw new Error(`dist/${p} missing — run \`npm run build\` first`);
  return readFileSync(f, 'utf8');
};

test('robots.txt allows crawling and points at the sitemap', () => {
  const r = dist('robots.txt');
  expect(r).toMatch(/User-agent:\s*\*/);
  expect(r).toContain('Sitemap: https://besecurelocksmith.com/sitemap-index.xml');
});

test('sitemap includes key pages and excludes noindex pages', () => {
  const xml = dist('sitemap-0.xml');
  for (const u of [
    'https://besecurelocksmith.com/',
    'https://besecurelocksmith.com/services/residential-locksmith/',
    'https://besecurelocksmith.com/testimonials/',
    'https://besecurelocksmith.com/service-areas/locksmith-ocala-fl/',
  ]) {
    expect(xml).toContain(`<loc>${u}</loc>`);
  }
  // noindex / utility pages must NOT be in the sitemap
  for (const bad of ['/privacy-policy/', '/thank-you/', '/blog/page/', '/blog/category/']) {
    expect(xml).not.toContain(bad);
  }
  expect(dist('sitemap-index.xml')).toContain('sitemap-0.xml');
});

test('llms.txt is present with title, summary, and service links', () => {
  const t = dist('llms.txt');
  expect(t).toMatch(/^# Be Secure Locksmith/);
  expect(t).toContain('> ');
  expect(t).toContain('## Services');
  expect(t).toContain('](https://besecurelocksmith.com/services/residential-locksmith/)');
  expect(t).toContain('## Service Areas');
});
