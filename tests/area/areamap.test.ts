import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import AreaMap from '../../src/components/sections/AreaMap.astro';

test('frames the city service area with map + business NAP', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AreaMap, { props: { area: { city: 'Hampton', office: 'gainesville', responseTime: '~30 min' } } });
  expect(html).toContain('Our Hampton Service Area');        // reframed heading
  expect(html).toContain('Be Secure Locksmith');             // business Name (NAP)
  expect(html).toContain('Hampton%2C%20FL');                 // map query encodes "Hampton, FL"
  expect(html).toContain('901 NW 8th Ave');                  // serving office Address (NAP)
  expect(html).toContain('href="tel:+13527065295"');         // office Phone (NAP)
  expect(html).toContain('kgmid=/g/1ptx2pkfg');              // office GBP link
});
