import { test, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const p = resolve(__dirname, '../dist/about/index.html');

test('About page builds with mission, team, credentials, reviews, SEO', () => {
  if (!existsSync(p)) throw new Error('dist about page missing — run `npm run build` first');
  const html = readFileSync(p, 'utf8');
  expect(html).toContain('<title>About Our Gainesville &amp; Ocala, FL Locksmith Team | Be Secure Locksmith</title>');
  expect(html).toContain('About Be Secure Locksmith');             // H1
  expect(html).toContain('Our Mission');
  expect(html).toContain('Since 2012');                            // mission copy
  expect(html).toContain('Meet the Be Secure Locksmith Team');
  // Joe (mission) + sample team members with roles
  expect(html).toContain('General Manager');                       // Joe's role
  expect(html).toContain('Commercial Relationship Manager');       // Britney
  expect(html).toContain('Dispatcher');                            // Courtney
  expect(html).toContain('/img/team/');                            // team photos
  // reused sections
  expect(html).toContain('ALOA');                                  // Credentials
  expect(html).toContain('Google reviews');                        // Reviews
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"AboutPage"');
  // About page carries no business schema — only BreadcrumbList + AboutPage nodes
  expect(html).not.toContain('"@type":"LocalBusiness"');
});
