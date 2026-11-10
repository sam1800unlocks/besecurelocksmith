import { test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const dist = resolve(__dirname, '..', 'dist');
const read = (p: string) => { const f = join(dist, p); if (!existsSync(f)) throw new Error(`dist ${p} missing — run \`npm run build\``); return readFileSync(f, 'utf8'); };
const blocks = (h: string) => [...h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const graph = (p: string) => {
  const b = blocks(read(p));
  expect(b, `${p}: one JSON-LD block`).toHaveLength(1);
  return b[0]['@graph'] as any[];
};
const ORG = 'https://besecurelocksmith.com/#organization';
const GNV = 'https://besecurelocksmith.com/service-areas/locksmith-gainesville-fl/#localbusiness';
const OCA = 'https://besecurelocksmith.com/service-areas/locksmith-ocala-fl/#localbusiness';
const byId = (g: any[], id: string) => g.filter((n) => n['@id'] === id && n['@type']);
const ofType = (g: any[], t: string) => g.filter((n) => n['@type'] === t);

const pages = ['index.html', 'about/index.html', 'contact-us/index.html', 'locations/index.html', 'price-list/index.html',
  'services/lock-rekeying/index.html', 'services/sliding-door-repair/index.html', 'products/deadbolts/index.html',
  'employment/index.html', 'blog/smart-locks-vs-traditional-deadbolts/index.html',
  'service-areas/locksmith-alachua-fl/index.html', 'service-areas/locksmith-gainesville-fl/index.html', 'service-areas/locksmith-ocala-fl/index.html'];

test('every page is one @graph with the brand Organization exactly once', () => {
  for (const p of pages) {
    const brand = byId(graph(p), ORG);
    expect(brand, p).toHaveLength(1);
    expect(brand[0]['@type'], p).toBe('Organization');
  }
});

test('no bare branch stub typed Locksmith appears anywhere (the Rich Results error)', () => {
  for (const p of pages) {
    for (const n of graph(p).filter((x) => x['@type'] === 'Locksmith')) {
      expect(n.name, p).toBeTruthy();
      expect(n.address, p).toBeTruthy();
    }
    const refs = byId(graph(p), ORG)[0].subOrganization;
    for (const r of refs) expect(r['@type'], p).toBeUndefined();
  }
});

test('nothing re-types the brand reference inline', () => {
  for (const p of pages) {
    const h = read(p);
    expect(h, p).not.toMatch(/"@type":"Locksmith","@id":"https:\/\/besecurelocksmith\.com\/#organization"/);
  }
});

test('homepage: brand only, no office address, rating or catalog', () => {
  const g = graph('index.html');
  const h = read('index.html');
  expect(ofType(g, 'Locksmith')).toHaveLength(0);
  expect(h).toContain('"telephone":"1-352-706-5295"');
  expect(h).not.toContain('"@type":"OfferCatalog"');
  expect(h).not.toContain('"aggregateRating"');
  expect(h).not.toContain('"streetAddress"');
});

test('Gainesville office page: one branch, no Service, GBP-exact address and rating', () => {
  const g = graph('service-areas/locksmith-gainesville-fl/index.html');
  const [b] = byId(g, GNV);
  expect(ofType(g, 'Locksmith')).toHaveLength(1);
  expect(ofType(g, 'Service')).toHaveLength(0);
  expect(b.address.streetAddress).toBe('901 NW 8th Ave c17');
  expect(b.aggregateRating).toMatchObject({ ratingValue: '4.9', reviewCount: '1371' });
  expect(b.hasMap).toContain('cid=1525264823828817691');
  expect(b.parentOrganization).toEqual({ '@id': ORG });
  expect(read('service-areas/locksmith-gainesville-fl/index.html')).toContain('maps.google.com/maps?cid=1525264823828817691&output=embed');
});

test('Ocala office page: one branch with the Ocala address, rating and own phone', () => {
  const g = graph('service-areas/locksmith-ocala-fl/index.html');
  const [b] = byId(g, OCA);
  expect(ofType(g, 'Locksmith')).toHaveLength(1);
  expect(ofType(g, 'Service')).toHaveLength(0);
  expect(b.address.streetAddress).toBe('217 SE 1st Ave Ste 200-50');
  expect(b.aggregateRating).toMatchObject({ ratingValue: '4.9', reviewCount: '1246' });
  expect(b.telephone).toBe('1-352-325-7953');
});

test('a non-office city page has one Service and no branch', () => {
  const g = graph('service-areas/locksmith-alachua-fl/index.html');
  expect(ofType(g, 'Locksmith')).toHaveLength(0);
  const s = ofType(g, 'Service');
  expect(s).toHaveLength(1);
  expect(s[0].areaServed).toBe('Alachua, Florida');
  expect(s[0].provider).toEqual({ '@id': ORG });
});

test('service pages have one Service with description and a bare provider', () => {
  for (const p of ['services/lock-rekeying/index.html', 'services/automotive-locksmith/index.html', 'services/sliding-door-repair/index.html']) {
    const s = ofType(graph(p), 'Service');
    expect(s, p).toHaveLength(1);
    expect(s[0].description, p).toBeTruthy();
    expect(s[0].provider, p).toEqual({ '@id': ORG });
  }
});

test('contact page shows both offices', () => {
  const h = read('contact-us/index.html');
  expect(h).toContain('Gainesville, FL 32601');
  expect(h).toContain('Ocala, FL 34471');
  expect(h).not.toContain('"@type":"LocalBusiness"');
});

test('rating display uses the combined 2,617', () => {
  const h = read('index.html');
  expect(h).toContain('2,617');            // formatted via toLocaleString
  expect(h).not.toContain('2,551');
});

test('About title covers both cities', () => {
  const h = read('about/index.html');
  const title = h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  expect(title).toContain('Gainesville');
  expect(title).toContain('Ocala');
});

test('every page has one WebSite and one page node tied to the brand', () => {
  for (const p of pages) {
    const g = graph(p);
    expect(ofType(g, 'WebSite'), p).toHaveLength(1);
    const pageNodes = g.filter((n) => ['WebPage', 'AboutPage', 'ContactPage'].includes(n['@type']));
    expect(pageNodes, p).toHaveLength(1);
    expect(pageNodes[0].isPartOf, p).toEqual({ '@id': 'https://besecurelocksmith.com/#website' });
    expect(pageNodes[0].about, p).toEqual({ '@id': ORG });
  }
  expect(ofType(graph('about/index.html'), 'AboutPage')).toHaveLength(1);
  expect(ofType(graph('contact-us/index.html'), 'ContactPage')).toHaveLength(1);
});

test('every blog post links its author to the founder and carries a real dateModified', () => {
  const dir = resolve(dist, 'blog');
  const slugs = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && !['page', 'category'].includes(e.name)).map((e) => e.name);
  expect(slugs.length).toBeGreaterThan(50);
  for (const s of slugs) {
    const [post] = ofType(graph(`blog/${s}/index.html`), 'BlogPosting');
    expect(post.author, s).toEqual({ '@type': 'Person', '@id': 'https://besecurelocksmith.com/about/#founder', name: 'Netta Kaiden' });
    expect(post.dateModified, s).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(post.dateModified.slice(0, 10) >= post.datePublished.slice(0, 10), `${s} modified before published`).toBe(true);
  }
});

test('the brand founder carries the @id blog authors point at', () => {
  expect(byId(graph('index.html'), ORG)[0].founder[0]['@id']).toBe('https://besecurelocksmith.com/about/#founder');
});

test('FAQPage schema appears only where the page shows those questions', () => {
  const norm = (s: string) => s.replace(/&#x27;|&#39;|’/g, "'").replace(/&amp;/g, '&');
  const dir = resolve(dist, 'services');
  for (const s of readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)) {
    const p = `services/${s}/index.html`;
    const body = norm(read(p).replace(/<script[\s\S]*?<\/script>/g, ''));
    for (const f of ofType(graph(p), 'FAQPage')) {
      for (const q of f.mainEntity) expect(body, `${s}: ${q.name}`).toContain(norm(q.name));
    }
  }
});
