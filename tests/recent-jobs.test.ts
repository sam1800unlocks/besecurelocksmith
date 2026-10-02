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

// Count real <li> elements inside the list, not class strings: the refresh
// script contains the same class names as literals.
const listMarkup = () => {
  const html = home();
  const start = html.indexOf('<ul id="recent-jobs-list"');
  return html.slice(start, html.indexOf('</ul>', start));
};

test('renders a full card of recent jobs', () => {
  expect(listMarkup().match(/<li\b/g)?.length).toBe(12);
});

// Photos arrive attached to their own job (bound by Workiz id on the client's
// side), so there is no matching here. Photos used to be far sparser than jobs,
// so the jobs carrying one win a slot in the twelve rows first. Now the feed
// holds more photos than rows, so the card should come out all photos. Counted
// against the live feed rather than fixed ids, which age out of the twelve.
test('jobs with photos fill the card before jobs without', async () => {
  const r = await fetch('https://be-secure-receptionist.fly.dev/jobs-feed.json').catch(() => null);
  if (!r?.ok) return;
  const { jobs } = await r.json();
  const withPhoto = jobs.filter((j: { photo?: { url?: string } }) => j.photo?.url).length;
  const shown = (listMarkup().match(/<img\b/g) ?? []).length;
  expect(shown).toBe(Math.min(withPhoto, 12));
});

test('photos carry their caption as alt text and a visible caption line', () => {
  const list = listMarkup();
  const imgs = list.match(/<img[^>]*>/g) ?? [];
  expect(imgs.length).toBeGreaterThan(0);
  for (const img of imgs) {
    const alt = img.match(/alt="([^"]*)"/)?.[1] ?? '';
    expect(alt.length, 'no photo without descriptive alt text').toBeGreaterThan(10);
    expect(list).toContain(`>${alt}</div>`);
  }
});

// Images are fixed-size and lazy so the card cannot shift the page as it loads.
test('photos are lazy and dimensioned', () => {
  const html = home();
  const imgs = html.match(/<img[^>]*\/p\/p-[0-9a-f]+-600\.webp[^>]*>/g) ?? [];
  expect(imgs.length).toBeGreaterThan(0);
  for (const img of imgs) {
    expect(img).toContain('loading="lazy"');
    expect(img).toContain('width="300"');
    expect(img).toContain('height="300"');
  }
});

// The gallery shows the client's 600px WebP, never the 1500x2000 original
// (~95% smaller); the original stays the fallback for a photo without one.
test('photos use the small WebP rendition, not the full-size original', () => {
  const card = listMarkup();
  expect(card).toMatch(/<img[^>]*\/p\/p-[0-9a-f]+-600\.webp/);
  expect(card).not.toMatch(/<img[^>]*src="[^"]*\/p\/p-[0-9a-f]+\.jpg"/);
  const src = readFileSync(resolve(__dirname, '../src/components/sections/RecentJobs.astro'), 'utf8');
  expect(src).toContain('photo.thumbUrl ?? photo.url');
  expect(src).toContain('photo.thumbUrl || photo.url');
});

// Only jobs that actually carry a photo get an image block; the rest render as a
// compact row rather than a large empty placeholder.
// The photo count is whatever the client has uploaded by build time, so this
// counts the card's own markup rather than a fixed number that goes stale with
// every upload: one image per photo, each photo once, never more than the rows.
test('renders exactly one image per consented photo, and no placeholder tiles', () => {
  const html = home();
  const card = html.slice(html.indexOf('id="recent-jobs"'));
  const list = card.slice(0, card.indexOf('</ul>'));
  const ids = [...list.matchAll(/\/p\/(p-[0-9a-f]+)-600\.webp/g)].map((m) => m[1]);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.length).toBeLessThanOrEqual((list.match(/<li\b/g) ?? []).length);
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

// The separate photo feed is retired: photos now ride on the job record, so
// nothing here should reach for jobs-photos.json or try to re-match them.
test('reads photos from the jobs feed, not the retired photo feed', () => {
  const src = readFileSync(resolve(__dirname, '../src/components/sections/RecentJobs.astro'), 'utf8');
  expect(src).toContain('jobs-feed.json');
  expect(src).not.toContain('jobs-photos.json');
  expect(src).toContain('job.photo');
});
