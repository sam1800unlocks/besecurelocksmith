import { test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const dist = resolve(__dirname, '../dist');
// Standalone ads landing pages carry their own copy of the tag (see their tests).
const standalone = ['new-home/index.html', 'commercial/index.html'];

const htmlFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []);

// The client asked for the Google Ads tag on every page, configured exactly once.
test('every layout page configures the Google Ads tag exactly once', () => {
  const pages = htmlFiles(dist).filter((f) => !standalone.includes(relative(dist, f)));
  expect(pages.length).toBeGreaterThan(100);
  for (const file of pages) {
    const configs = readFileSync(file, 'utf8').match(/gtag\('config', ["']AW-1003919115["']\)/g) ?? [];
    expect(configs.length, relative(dist, file)).toBe(1);
  }
});
