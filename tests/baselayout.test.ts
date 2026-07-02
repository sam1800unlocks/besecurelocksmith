import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from '../src/layouts/BaseLayout.astro';
import { createSlotValueFromString } from 'astro/runtime/server/render/slot.js';

test('BaseLayout emits fonts and Locksmith org JSON-LD when schema=org-home', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(BaseLayout, {
    props: { title: 'Home', location: 'main', schema: 'org-home' },
    slots: { default: createSlotValueFromString('<main>x</main>') },
  });
  expect(html).toContain('family=Figtree');
  // Schema is now conditional on the `schema` prop; org-home emits a Locksmith node
  expect(html).toContain('"@type":"Locksmith"');
  expect(html).not.toContain('"@type":"LocalBusiness"');
  expect(html).toContain('<main>x</main>');
});
