import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../dist/services/commercial-locksmith/index.html');

test('Commercial page renders the lock-types chip section', () => {
  if (!existsSync(p)) throw new Error('dist commercial page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('Commercial Lock Types We Service');
  // A sampling of the chips (split out + alphabetized)
  for (const t of ['Mortise locks', 'Panic devices', 'Exit devices (crash bars)', 'Cabinet locks', 'Desk locks', 'File locks', 'Electric strikes', 'High-security padlocks']) {
    expect(html).toContain(t);
  }
  // old combined entries are gone
  expect(html).not.toContain('Panic / exit devices');
  expect(html).not.toContain('File / desk / cabinet');
});
