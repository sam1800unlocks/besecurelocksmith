import { test, expect } from 'vitest';
import { site, telHref, smsHref } from '../src/config/site';

test('telHref strips non-digits', () => {
  expect(telHref('352-706-5295')).toBe('tel:3527065295');
  expect(smsHref('352-389-5305')).toBe('sms:3523895305');
});

test('site carries verbatim brand facts', () => {
  expect(site.name).toBe('Be Secure Locksmith');
  expect(site.defaultPhone).toBe('352-706-5295');
  expect(site.smsPhone).toBe('352-389-5305');
  expect(site.license).toBe('HCLO18005');
  expect(site.ratingValue).toBe('4.9');
  expect(site.ratingCount).toBe('2551');
});
