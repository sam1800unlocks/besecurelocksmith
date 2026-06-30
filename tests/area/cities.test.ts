import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Footer from '../../src/components/sections/Footer.astro';

const dir = resolve(__dirname, '../../src/content/service-areas');

test('every service-area data file has the required fields and internal related blogs', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  expect(files.length).toBeGreaterThanOrEqual(10);
  for (const f of files) {
    const d = JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
    expect(typeof d.city).toBe('string');
    expect(d.title.length).toBeGreaterThan(0);
    expect(['gainesville', 'ocala']).toContain(d.office);
    expect(Array.isArray(d.intro) && d.intro.length).toBeGreaterThan(0);
    expect(Array.isArray(d.relatedBlogs)).toBe(true);
    for (const rb of d.relatedBlogs) {
      expect(rb.url.startsWith('/blog/')).toBe(true);     // internal links (posts are migrated)
    }
    expect(d.intro.join('')).not.toContain('besecurelocksmith.com'); // relativized body
  }
});

test('Footer lists the newly-added city chips', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Footer, { props: {} });
  expect(html).toContain('Marion Oaks, FL');
  expect(html).toContain('Silver Springs Shores, FL');
});

test('new city pages build with the unified stack', () => {
  for (const slug of ['locksmith-newberry-fl', 'locksmith-the-villages-fl', 'locksmith-williston-fl']) {
    const p = resolve(__dirname, '../../dist/service-areas', slug, 'index.html');
    if (!existsSync(p)) throw new Error(`${slug} not built — run \`npm run build\` first`);
    const html = readFileSync(p, 'utf8');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('Service Area');                 // AreaMap heading
    expect((html.match(/"@type":"LocalBusiness"/g) || []).length).toBe(1);
  }
});
