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

test('only posts with body content get an internal page', () => {
  // The body-less seeded posts must NOT have a built directory under dist/blog/
  const bodyless = 'moving-to-gainesville-fl-rekey-your-locks';
  expect(existsSync(resolve(dir, bodyless, 'index.html'))).toBe(false);
  // Exactly the post directories that exist correspond to posts with body.
  const built = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
  expect(built).toBe(1);
});
