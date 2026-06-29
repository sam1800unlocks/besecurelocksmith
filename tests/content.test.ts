import { test, expect, describe } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const contentDir = join(fileURLToPath(import.meta.url), '../../src/content');

describe('content collections are seeded with homepage data', () => {
  test('services collection has 9 items', () => {
    const files = readdirSync(join(contentDir, 'services')).filter(f => f.endsWith('.json'));
    expect(files.length).toBe(9);
  });

  test('reviews collection has 5 items', () => {
    const files = readdirSync(join(contentDir, 'reviews')).filter(f => f.endsWith('.json'));
    expect(files.length).toBe(5);
  });

  test('faqs collection has 8 items', () => {
    const files = readdirSync(join(contentDir, 'faqs')).filter(f => f.endsWith('.json'));
    expect(files.length).toBe(8);
  });

  test('smart lock service has photo field set', () => {
    const raw = readFileSync(join(contentDir, 'services/08-smart-lock-installation.json'), 'utf-8');
    const data = JSON.parse(raw);
    expect(data.photo).toBe('/img/services/cards/smart-lock-installation.webp');
  });

  test('first review matches Riva Wallace verbatim', () => {
    const raw = readFileSync(join(contentDir, 'reviews/01-riva-wallace.json'), 'utf-8');
    const data = JSON.parse(raw);
    expect(data.name).toBe('Riva Wallace');
    expect(data.initial).toBe('R');
    expect(data.color).toBe('#0064e0');
    expect(data.quote).toBe('Highly recommend. Very professional and friendly to work with.');
    expect(data.order).toBe(1);
  });

  test('first faq matches verbatim', () => {
    const raw = readFileSync(join(contentDir, 'faqs/01-what-services.json'), 'utf-8');
    const data = JSON.parse(raw);
    expect(data.question).toBe('What types of locksmith services do you offer?');
    expect(data.answer).toBe(
      'Be Secure Locksmith provides a wide range of services including residential locksmith services, commercial locksmith services, and automotive locksmith solutions. This includes re-keying, lock installation, key programming, and emergency lockout assistance. We also offer lock repair services as well.'
    );
    expect(data.order).toBe(1);
  });
});
