import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Credentials from '../src/components/sections/Credentials.astro';
import BusinessesWorkedWith from '../src/components/sections/BusinessesWorkedWith.astro';
import AsSeenIn from '../src/components/sections/AsSeenIn.astro';
import LogoWall from '../src/components/sections/LogoWall.astro';

test('Credentials renders all five credential titles', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Credentials, { props: {} });
  for (const t of ['ALOA Member', 'BNI Member', '1-800-Unlocks', 'Fair Trade Locksmith', 'Chamber Member']) {
    expect(html).toContain(t);
  }
});

test('Credentials renders logo images for all five credentials', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Credentials, { props: {} });
  for (const src of [
    '/img/credentials/ALOA-300wx200h.jpg',
    '/img/credentials/BNI-logo-300x200-1.png',
    '/img/credentials/1-800-unlocks-300x200-1.png',
    '/img/credentials/fair-trade-300x200-1.png',
    '/img/credentials/Gainesville-Chamber-of-Commerce.png',
  ]) {
    expect(html).toContain(src);
  }
});

test('Credentials renders all five blurbs', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(Credentials, { props: {} });
  expect(html).toContain('Associated Locksmiths of America certified.');
  expect(html).toContain('Trusted local business networking community.');
  expect(html).toContain('Verified member of the national directory.');
  expect(html).toContain('Listed in the Fair Trade Locksmith Directory.');
  expect(html).toContain('Greater Gainesville Chamber of Commerce.');
});

test('BusinessesWorkedWith lists the brand pills', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(BusinessesWorkedWith, { props: {} });
  expect(html).toContain('Publix');
  expect(html).toContain('Crunch Fitness');
});

test('BusinessesWorkedWith lists all nine businesses', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(BusinessesWorkedWith, { props: {} });
  expect(html).toContain('Home Depot');
  expect(html).toContain('Lowe’s');
  expect(html).toContain('McDonald’s');
  expect(html).toContain('Outback Steakhouse');
  expect(html).toContain('Walmart');
  expect(html).toContain('Rural King');
  expect(html).toContain('Carrabba’s');
});

test('AsSeenIn renders press outlet names', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(AsSeenIn, { props: {} });
  expect(html).toContain('Markets Insider');
  expect(html).toContain('Associated Press');
  expect(html).toContain('Benzinga');
  expect(html).toContain('Apple News');
  expect(html).toContain('As featured in');
});

test('LogoWall renders heading and client logo images', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(LogoWall, { props: {} });
  expect(html).toContain('Our Gainesville Property Management Clients');
  expect(html).toContain('/img/clients/');
});
