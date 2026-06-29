import { test, expect } from 'vitest';
import { site } from '../../src/config/site';

test('site.bookingUrl is the Workiz booking URL', () => {
  expect(site.bookingUrl).toBe('https://online-booking.workiz.com/?ac=744610670459142e62f3f47913956e45311c10147d3f5224d2489d7eab57c2a7');
});
