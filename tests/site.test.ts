import { test, expect } from 'vitest';
import { site, telHref, smsHref, e164 } from '../src/config/site';

test('telHref/smsHref normalize to E.164 with country code', () => {
  expect(telHref('352-706-5295')).toBe('tel:+13527065295');
  expect(smsHref('352-389-5305')).toBe('sms:+13523895305');
});

test('e164 prepends +1 to 10-digit numbers and is idempotent', () => {
  expect(e164('352-706-5295')).toBe('+13527065295');
  expect(e164('+13527065295')).toBe('+13527065295');
  expect(e164('13527065295')).toBe('+13527065295');
});

test('site carries verbatim brand facts', () => {
  expect(site.name).toBe('Be Secure Locksmith');
  expect(site.defaultPhone).toBe('352-706-5295');
  expect(site.smsPhone).toBe('352-389-5305');
  expect(site.license).toBe('HCLO18005');
  expect(site.ratingValue).toBe('4.9');
  expect(site.ratingCount).toBe('2544');
});
