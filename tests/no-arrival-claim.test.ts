import { test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const htmlFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [p] : [];
  });

// Arrival-time promises only. Job lengths and customer reviews may mention minutes.
const CLAIM = /on-site in (about |~)?\d|typical response|(typically|usually) (arriv|reach)[^.<]{0,40}\b\d+[ -]?min|(arrives?|arriving|reach you)[^.<]{0,40}\b\d+[ -]?min/i;

test('no page or llms.txt promises an arrival time', () => {
  const hits = [...htmlFiles('dist'), 'dist/llms.txt'].filter((f) => {
    const text = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, (m) => (m.includes('ld+json') ? m : ''));
    return CLAIM.test(text);
  });
  expect(hits).toEqual([]);
});
