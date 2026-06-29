import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (f: string) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));

test('Alachua carries county + zips and no variant (single template)', () => {
  const d = read('../../src/content/service-areas/locksmith-alachua-fl.json');
  expect(d.variant).toBeUndefined();
  expect(d.county).toBe('Alachua County');
  expect(d.zips).toContain('32615');
});
