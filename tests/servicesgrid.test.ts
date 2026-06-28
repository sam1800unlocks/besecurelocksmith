import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServicesGrid from '../src/components/sections/ServicesGrid.astro';

const fixtures = [
  { title: 'Residential Locksmith',  desc: 'Lock installation, rekeying, high-security upgrades, and fast lockout help for your home.',                                 order: 1 },
  { title: 'Commercial Locksmith',   desc: 'Keypad locks, panic devices, master key systems, and high-security locks for your business.',                               order: 2 },
  { title: 'Automotive Locksmith',   desc: 'Lockouts, key replacement, and broken-key extraction for most makes and models.',                                           order: 3 },
  { title: 'Key Duplication',        desc: 'Keys for homes, businesses, vehicles, mailboxes, safes, and high-security systems.',                                        order: 4 },
  { title: 'Car Key Replacement',    desc: 'Standard keys, smart keys, and fobs for domestic and foreign vehicles.',                                                    order: 5 },
  { title: 'Ignition Repair',        desc: 'Stuck keys, faulty switches, and cylinder problems diagnosed and repaired.',                                                 order: 6 },
  { title: 'Lock Rekeying',          desc: 'Budget-friendly pin reconfiguration as an alternative to full lock replacement.',                                            order: 7 },
  { title: 'Smart Lock Installation',desc: 'Keyless convenience and smartphone access management, professionally installed.',                                            order: 8, photo: '/img/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg' },
  { title: 'Master Key Systems',     desc: 'Simplified key control for offices and multi-unit buildings.',                                                              order: 9 },
];

test('ServicesGrid renders all nine service cards', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(ServicesGrid, { props: { services: fixtures } });
  expect(html).toContain('Residential Locksmith');
  expect(html).toContain('Master Key Systems');
  expect((html.match(/Learn more/g) || []).length).toBe(9);
});

test('ServicesGrid renders an <img> for the photo service', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(ServicesGrid, { props: { services: fixtures } });
  // Smart Lock Installation (order 8) has a photo — expect an <img> tag
  expect(html).toContain('<img');
  expect(html).toContain('/img/smart-lock-installation-Be-Secure-Locksmith-1024x768.jpeg');
});
