import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const home = () => readFileSync(resolve(__dirname, '../dist/index.html'), 'utf8');

test('the recent-jobs card is on the homepage, after the reviews section', () => {
  const html = home();
  expect(html).toContain('id="recent-jobs"');
  expect(html).toContain('Recent Jobs Across Gainesville &amp; Ocala');
  expect(html.indexOf('id="reviews"')).toBeLessThan(html.indexOf('id="recent-jobs"'));
});

// We render the feeds ourselves at build time. No third-party script reaches the
// page, so nothing outside the repo can execute in a visitor's browser.
test('ships no remote widget script', () => {
  const html = home();
  expect(html).not.toContain('jobs-widget.js');
  expect(html).not.toContain('bsl-recent-jobs');
});

test('renders a full card of recent jobs', () => {
  const html = home();
  expect(html.match(/rounded-\[16px\] flex items-center/g)?.length).toBe(12);
});

// Photos are far sparser than jobs, so the jobs carrying one must be selected
// across the whole feed — not just whichever happen to fall in the top slice.
test('every consented photo in the feed reaches the page', () => {
  const html = home();
  for (const id of ['p-167bc346e5', 'p-6fd5b62ab0']) {
    expect(html).toContain(`/p/${id}.jpg`);
  }
});

test('photos carry their caption as alt text and a visible caption line', () => {
  const html = home();
  expect(html).toContain('Rim cylinder rekey below a cast-iron thumb-latch handle set');
  expect(html).toContain('Mortise cylinder rekey on an aluminum storefront door');
  // no photo is rendered without descriptive alt text
  expect(html).not.toMatch(/<img[^>]*\/p\/p-[0-9a-f]+\.jpg[^>]*alt=""/);
});

// Images are fixed-size and lazy so the card cannot shift the page as it loads.
test('photos are lazy and dimensioned', () => {
  const html = home();
  const imgs = html.match(/<img[^>]*\/p\/p-[0-9a-f]+\.jpg[^>]*>/g) ?? [];
  expect(imgs.length).toBeGreaterThan(0);
  for (const img of imgs) {
    expect(img).toContain('loading="lazy"');
    expect(img).toContain('width="300"');
    expect(img).toContain('height="300"');
  }
});

// Only jobs that actually have a photo get an image block; the rest render as a
// compact row rather than a large empty placeholder.
test('renders exactly one image per consented photo, and no placeholder tiles', () => {
  const html = home();
  const card = html.slice(html.indexOf('id="recent-jobs"'));
  expect((card.match(/<img[^>]*\/p\/p-[0-9a-f]+\.jpg/g) ?? []).length).toBe(2);
  expect(card.slice(0, card.indexOf('</ul>'))).not.toContain('aria-hidden="true"');
});

test('city names link to their service-area page where one exists', () => {
  const html = home();
  const card = html.slice(html.indexOf('id="recent-jobs"'));
  expect(card).toContain('/service-areas/locksmith-gainesville-fl/');
});

// The card must never imply more precision than the feed carries.
test('publishes nothing finer than city level, and no client phone', () => {
  const html = home();
  const card = html.slice(html.indexOf('id="recent-jobs"'), html.indexOf('id="recent-jobs"') + 20000);
  expect(card).toContain('city level only');
  expect(card).not.toMatch(/\b\d{1,5}\s+[A-Z][a-z]+\s+(St|Ave|Rd|Dr|Ln|Blvd)\b/); // no street addresses
  expect(html).not.toContain('414-5351');
});
