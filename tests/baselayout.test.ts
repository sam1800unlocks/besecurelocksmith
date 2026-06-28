import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from '../src/layouts/BaseLayout.astro';
import { createSlotValueFromString } from 'astro/runtime/server/render/slot.js';

test('BaseLayout emits fonts and LocalBusiness JSON-LD with the resolved phone', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(BaseLayout, {
    props: { title: 'Home', location: 'main' },
    slots: { default: createSlotValueFromString('<main>x</main>') },
  });
  expect(html).toContain('family=Figtree');
  expect(html).toContain('"@type":"LocalBusiness"');
  expect(html).toContain('"telephone":"352-706-5295"');
  expect(html).toContain('<main>x</main>');
});
