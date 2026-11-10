import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from '../src/layouts/BaseLayout.astro';
import { createSlotValueFromString } from 'astro/runtime/server/render/slot.js';

test('BaseLayout emits fonts and the brand Organization on every page', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(BaseLayout, {
    props: { title: 'Home', location: 'main' },
    slots: { default: createSlotValueFromString('<main>x</main>') },
  });
  // Figtree is self-hosted and preloaded; no Google Fonts request at all.
  expect(html).toMatch(/rel="preload"[^>]*figtree[^>]*\.woff2/i);
  expect(html).not.toContain('fonts.googleapis.com');
  expect(html).toContain('"@type":"Organization"');
  expect(html).not.toContain('"@type":"LocalBusiness"');
  expect(html).toContain('<main>x</main>');
});
