import { test, expect } from 'vitest';
import { existsSync } from 'node:fs';
const need = [
  'public/img/besecure-logo-100h.png',
  'public/img/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg',
  'public/img/social/google-g-icon.svg',
];
test('core homepage images are present locally', () => {
  for (const p of need) expect(existsSync(new URL('../' + p, import.meta.url))).toBe(true);
});
