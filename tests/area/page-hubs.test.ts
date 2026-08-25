import { test, expect, describe } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The two hub (office) pages get the full homepage-grade trust stack; the other
// 11 area pages stay lean. `officeBySlug` is what scopes it — these tests pin
// that boundary so a future template edit can't leak the sections everywhere.
const read = (slug: string) => {
  const p = resolve(__dirname, `../../dist/service-areas/${slug}/index.html`);
  if (!existsSync(p)) throw new Error(`dist page missing (${slug}) — run \`npm run build\` first`);
  return readFileSync(p, 'utf8');
};

const read2 = (name: string) => {
  const p = resolve(__dirname, `../../dist/${name}.html`);
  if (!existsSync(p)) throw new Error(`dist page missing (${name}) — run \`npm run build\` first`);
  return readFileSync(p, 'utf8');
};

const HUB_SECTIONS = [
  ['PropertyManagement', 'Commercial Property Management Solutions'],
  ['WhyChoose',          'Why Choose Be Secure Locksmith?'],
  ['Reviews',            'id="reviews"'],
  ['Credentials',        'Trust Our Credentials'],
] as const;

describe.each(['locksmith-gainesville-fl', 'locksmith-ocala-fl'])('hub page %s', (slug) => {
  const html = () => read(slug);

  test.each(HUB_SECTIONS)('renders the %s section', (_name, marker) => {
    expect(html()).toContain(marker);
  });

  test('links the published price list from the office strip', () => {
    expect(html()).toContain('View our price list');
  });

  test('property management section links its service page', () => {
    expect(html()).toContain('href="/services/property-management/"');
  });
});

// Hub metas are keyword-led and come from the content files; the template used to
// generate them for office pages, which discarded whatever was written there.
test.each([
  ['locksmith-gainesville-fl', 'Locksmith Gainesville FL | Car Keys, Rekeys &amp; Lockouts', 'lock rekeying, lock repair'],
  ['locksmith-ocala-fl',       'Locksmith Ocala FL | Car Keys, Rekeys &amp; Lockouts',       'new lock installation and master key systems'],
])('%s serves its content-file title and description', (slug, title, descFragment) => {
  const html = read(slug);
  expect(html).toContain(`<title>${title}</title>`);
  expect(html).toContain(descFragment);
  expect(html).not.toContain('office — mobile locksmith for car, home &amp; business');
});

// Pre-encoded entities double-escape through Astro into a literal "&#039;" in the
// SERP snippet — the content files must store characters, not entities.
test.each(['locksmith-gainesville-fl', 'locksmith-ocala-fl'])('%s meta carries no double-escaped entity', (slug) => {
  const desc = read(slug).match(/name="description" content="([^"]*)"/)?.[1] ?? '';
  expect(desc).not.toContain('&#38;#');
});

// Be Secure is Mon–Fri 8am–5pm; availability claims must never enter a meta.
test.each(['locksmith-gainesville-fl', 'locksmith-ocala-fl'])('%s meta makes no 24/7 claim', (slug) => {
  const html = read(slug);
  const head = html.slice(0, html.indexOf('</head>'));
  expect(head).not.toMatch(/24\/7|24-hour|around the clock|day or night/i);
});

// Each hub shows its own listing's reviews and its own Google figures, never the blend.
test.each([
  ['locksmith-gainesville-fl', 'Gainesville', '1354', '1525264823828817691', 'Shirelle Godwin', 'Ellen Perrone'],
  ['locksmith-ocala-fl',       'Ocala',       '1225', '4138983982412980004', 'Ellen Perrone',   'Shirelle Godwin'],
])('%s scopes reviews and rating to its own office', (slug, label, count, cid, own, other) => {
  const html = read(slug);
  expect(html).toContain(`Google Reviews for Our ${label} Office`);
  expect(html).toContain(`<span data-countup="${count}">`);   // that listing's own count
  expect(html).toContain(`cid=${cid}`);                        // badge links that listing
  expect(html).toContain(own);
  expect(html).not.toContain(other);
});

// The TrustStrip at the top of a hub page must agree with the reviews section below it.
test.each([
  ['locksmith-gainesville-fl', '1354'],
  ['locksmith-ocala-fl',       '1225'],
])('%s TrustStrip shows its own office rating, not the blend', (slug, count) => {
  const html = read(slug);
  expect(html).toContain(`<span data-countup="${count}">`);
  expect(html).not.toContain('data-countup="2579"');
});

test('non-office area pages keep the blended TrustStrip rating', () => {
  expect(read('locksmith-alachua-fl')).toContain('data-countup="2579"');
});

test('Ocala renames its in-copy heading so it does not collide with WhyChoose', () => {
  const html = read('locksmith-ocala-fl');
  expect(html).toContain('Benefits to Choosing Be Secure Locksmith');
  expect((html.match(/Why Choose Be Secure Locksmith\?/g) || []).length).toBe(1);
});

test('the homepage keeps the blended review set', () => {
  const html = read2('index');
  expect(html).toContain('Check Out Our Google Reviews');
  expect(html).toContain('<span data-countup="2579">');
});

test('non-office area pages carry none of the hub sections', () => {
  const html = read('locksmith-alachua-fl');
  for (const [, marker] of HUB_SECTIONS) expect(html).not.toContain(marker);
  expect(html).not.toContain('View our price list');
});
