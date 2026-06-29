import { test, expect } from 'vitest';
import { parseSubmission } from '../../src/lib/contact/schema';

test('accepts a valid submission and trims', () => {
  const r = parseSubmission({ firstName: ' Joe ', lastName: 'D', phone: '(352) 706-5295', email: 'a@b.com', message: 'Need a rekey' });
  expect(r.success).toBe(true);
  if (r.success) { expect(r.data.firstName).toBe('Joe'); expect(r.data.email).toBe('a@b.com'); }
});

test('requires email and message', () => {
  const r = parseSubmission({ email: 'nope', message: '' });
  expect(r.success).toBe(false);
  if (!r.success) { expect(r.errors.email).toBeTruthy(); expect(r.errors.message).toBeTruthy(); }
});

test('name/phone are optional and default to empty', () => {
  const r = parseSubmission({ email: 'a@b.com', message: 'hi' });
  expect(r.success).toBe(true);
  if (r.success) { expect(r.data.firstName).toBe(''); expect(r.data.phone).toBe(''); }
});
