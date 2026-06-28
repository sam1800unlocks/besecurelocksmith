import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

test('brand color tokens are defined in @theme', () => {
  for (const [name, hex] of [
    ['--color-primary', '#0064e0'],
    ['--color-primary-hover', '#0457cb'],
    ['--color-ink', '#0a1317'],
    ['--color-body', '#1c1e21'],
    ['--color-muted', '#5d6c7b'],
    ['--color-border', '#dee3e9'],
    ['--color-amber', '#f7b928'],
    ['--color-success', '#31a24c'],
    ['--color-success-bg', '#eaf7ee'],
    ['--color-alert', '#f0284a'],
  ] as const) {
    expect(css).toContain(`${name}: ${hex}`);
  }
});

test('font family tokens are defined', () => {
  expect(css).toContain('--font-figtree');
  expect(css).toContain('--font-inter');
});
