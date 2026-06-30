import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../dist/services/commercial-locksmith/index.html');

test('Commercial page renders the lock-types chip section', () => {
  if (!existsSync(p)) throw new Error('dist commercial page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('Commercial Lock Types We Service');
  // A sampling of the chips
  for (const t of ['Mortise locks', 'Panic / exit devices (crash bars)', 'Electric strikes', 'Magnetic locks (maglocks)', 'High-security padlocks', 'Exit alarm devices']) {
    expect(html).toContain(t);
  }
  expect(html).not.toContain('Panic / exit bars door'); // de-duped
});
