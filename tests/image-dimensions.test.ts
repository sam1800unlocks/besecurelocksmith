import { test, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Lighthouse flags any <img> without both width and height, since the browser
// can't reserve its space before it loads. src/integrations/image-dimensions.mjs
// fills them in for local images after the build; remote images (YouTube
// thumbnails, the BBB seal) must carry their sizes in the source.
const dist = resolve(__dirname, '../dist');
const pages = (dir = dist): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '_astro' ? [] : pages(full);
    return entry.endsWith('.html') ? [full] : [];
  });

test('every image on every page has an explicit width and height', () => {
  const missing = pages().flatMap((file) =>
    (readFileSync(file, 'utf8').match(/<img\b[^>]*>/g) ?? [])
      .filter((tag) => !/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag))
      .map((tag) => `${file.slice(dist.length)}: ${tag.slice(0, 100)}`));
  expect(missing).toEqual([]);
});

// The derived width must follow the image's own ratio, not override CSS sizing.
test('a logo sized by height alone gets a width in proportion', () => {
  const tag = readFileSync(join(dist, 'index.html'), 'utf8').match(/<img[^>]*press\/markets-insider\.png[^>]*>/)![0];
  expect(tag).toContain('height="26"');
  expect(tag).toMatch(/\swidth="\d+"/);
  expect(tag).toContain('h-[26px] w-auto');
});
