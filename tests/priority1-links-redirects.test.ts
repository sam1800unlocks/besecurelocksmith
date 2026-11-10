import { test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(__dirname, '..');
const dist = join(root, 'dist');
const htmlFiles = () => (readdirSync(dist, { withFileTypes: true, recursive: true }) as any[])
  .filter((e) => e.isFile() && e.name.endsWith('.html'))
  .map((e) => join(e.parentPath ?? e.path, e.name));

const rules = readFileSync(join(root, 'public/_redirects'), 'utf8').split('\n')
  .filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.trim().split(/\s+/));
const target = (from: string) => rules.find((r) => r[0] === from)?.[1];

test('the LSA tracking line is nowhere on the built site', () => {
  for (const f of htmlFiles()) {
    const h = readFileSync(f, 'utf8');
    expect(h, f).not.toMatch(/389-?5305/);
  }
  expect(readFileSync(join(dist, 'index.html'), 'utf8')).toContain('sms:+13528397610');
});

test('office page call links are E.164', () => {
  const h = readFileSync(join(dist, 'service-areas/locksmith-ocala-fl/index.html'), 'utf8');
  expect(h).toContain('href="tel:+13523257953"');
  expect(h).not.toContain('href="tel:13523257953"');
  expect(readFileSync(join(dist, 'service-areas/locksmith-gainesville-fl/index.html'), 'utf8')).not.toContain('href="tel:13522907035"');
});

const G = '/service-areas/locksmith-gainesville-fl/';
const O = '/service-areas/locksmith-ocala-fl/';
const n10 = (p: string) => Array.from({ length: 10 }, (_, i) => `/${p}-${i + 1}/`);
const expected: [string, string][] = [
  ['/service-areas/locksmith-northwood-gainesville-fl/', G], ['/gainesville/', G],
  ...n10('gainesville').map((u) => [u, G] as [string, string]),
  ...n10('ocala').map((u) => [u, O] as [string, string]),
  ['/service-areas/locksmith-gainesville-fl-2', G],
  ['/contact-us-3/', '/contact-us/'], ['/contact-us-3/thank-you/', '/contact-us/'], ['/contact-us/thank-you/', '/contact-us/'],
  ['/services/re-key-master-re-key-locks/', '/services/lock-rekeying/'],
  ['/thank-you-employment-application/', '/employment/'],
  ['/gallery/', '/about/'], ['/sitemap/', '/'],
  ...['admin', 'alex', 'besecure', 'webfx'].flatMap((a) => [[`/author/${a}/`, '/blog/'], [`/blog/author/${a}/`, '/blog/']] as [string, string][]),
  ['/blog/category/uncategorized/', '/blog/'],
  ['/blog/tag/commercial-auto-locksmith/', '/blog/category/commercial-locksmith/'],
];

test.each(expected)('%s redirects to %s', (from, to) => {
  expect(target(from)).toBe(to);
  expect(rules.find((r) => r[0] === from)?.[2]).toBe('301');
});

test('every new redirect lands on a page that exists and never shadows one', () => {
  for (const [from, to] of expected) {
    expect(existsSync(join(dist, to, 'index.html')), to).toBe(true);
    expect(existsSync(join(dist, from, 'index.html')), from).toBe(false);
  }
});

test('static rules stay ahead of splats, with no duplicate sources', () => {
  const lastStatic = rules.reduce((a, r, i) => (r[0].includes('*') ? a : i), -1);
  const firstSplat = rules.findIndex((r) => r[0].includes('*'));
  expect(lastStatic).toBeLessThan(firstSplat);
  const sources = rules.map((r) => r[0]);
  expect(new Set(sources).size).toBe(sources.length);
});

test('office addresses read exactly as the Google profiles do', () => {
  const gbp = ['901 NW 8th Ave c17', '217 SE 1st Ave Ste 200-50'];
  for (const a of gbp) expect(readFileSync(join(dist, 'locations/index.html'), 'utf8')).toContain(a);
  for (const f of htmlFiles()) {
    const h = readFileSync(f, 'utf8');
    expect(h, f).not.toMatch(/8th Ave\. C17|Suite 200-50/);
  }
});
