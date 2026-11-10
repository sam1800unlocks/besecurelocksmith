import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const pages: [string, number][] = [
  ['lock-rekeying', 7], ['emergency-lockouts', 7], ['car-key-programming', 6],
  ['commercial-locksmith', 7], ['ignition-repair', 6], ['interchangeable-core-locks', 6],
  ['key-duplication', 6], ['lock-repair', 7], ['master-key-systems', 7],
  ['new-lock-installation', 6], ['property-management', 5], ['smart-lock-installation', 7],
];

const read = (slug: string) => readFileSync(`dist/services/${slug}/index.html`, 'utf8');
const graph = (html: string) => {
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)];
  expect(blocks.length).toBe(1);
  return JSON.parse(blocks[0][1])['@graph'] as any[];
};
const decode = (s: string) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const BANNED = /24\/7|24 hour|any time|at night|after hours|on call|never stranded|licensed|fastest/i;

test.each(pages)('%s shows the FAQs its schema declares', (slug, count) => {
  const html = read(slug);
  const faq = graph(html).filter((n) => n['@type'] === 'FAQPage');
  expect(faq.length).toBe(1);
  expect(faq[0].mainEntity.length).toBe(count);
  const visible = decode(html.replace(/<script[\s\S]*?<\/script>/g, ''));
  for (const q of faq[0].mainEntity) {
    expect(visible).toContain(q.name);
    expect(visible).toContain(q.acceptedAnswer.text);
    expect(`${q.name} ${q.acceptedAnswer.text}`).not.toMatch(BANNED);
  }
  expect(faq[0].mainEntity[0].name).toContain('Be Secure Locksmith');
});

test('car key programming has no duplicate inline Q&A left in the body', () => {
  const html = read('car-key-programming');
  expect(html).not.toContain('Common Questions About Car Key Programming');
  expect(html).not.toContain('<strong>Q:');
});

test('safe page stays without FAQs', () => {
  expect(graph(read('safe-locksmith')).some((n) => n['@type'] === 'FAQPage')).toBe(false);
});
