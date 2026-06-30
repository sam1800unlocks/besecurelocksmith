import { test, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(__dirname, '../dist/blog');
const slug = 'transponder-key-vs-remote-head-key-vs-smart-key-in-dunnellon-fl-what-your-car-actually-uses';
const p = resolve(dir, slug, 'index.html');

test('Blog post page builds with content, byline, and SEO', () => {
  if (!existsSync(p)) throw new Error('dist blog post missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>Transponder vs Remote Head vs Smart Key in Dunnellon FL | Be Secure Locksmith</title>');
  expect(html).toContain('What Your Car Actually Uses');         // H1 (post title)
  expect(html).toContain('Netta Kaiden');                        // author byline
  expect(html).toContain('min read');
  expect(html).toContain('What Is a Transponder Key?');          // a body section heading
  expect(html).toContain('"@type":"BlogPosting"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('Back to all posts');
});

test('every post with body content gets an internal page', () => {
  const data = readdirSync(resolve(__dirname, '../src/content/blog')).filter((f) => f.endsWith('.json'));
  const withBody = data.filter((f) =>
    Array.isArray(JSON.parse(readFileSync(resolve(__dirname, '../src/content/blog', f), 'utf8')).body));
  const built = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
  expect(built).toBe(withBody.length);   // one built page per body-bearing post
});
