import { test, expect } from 'vitest';
import { fullName, emailSubject, emailText, emailHtml, smsText } from '../../src/lib/contact/format';

const s = { firstName: 'Joe', lastName: 'Diaz', phone: '352-706-5295', email: 'joe@x.com', message: 'Need a rekey <today>' };

test('fullName joins, falls back when empty', () => {
  expect(fullName(s)).toBe('Joe Diaz');
  expect(fullName({ ...s, firstName: '', lastName: '' })).toBe('Website visitor');
});

test('email text includes all fields', () => {
  const t = emailText(s);
  expect(t).toContain('joe@x.com');
  expect(t).toContain('352-706-5295');
  expect(t).toContain('Need a rekey');
});

test('email html escapes user input', () => {
  expect(emailHtml(s)).toContain('Need a rekey &lt;today&gt;');
});

test('sms is a single line with name, contact, message', () => {
  const t = smsText(s);
  expect(t).toContain('Joe Diaz');
  expect(t).toContain('joe@x.com');
  expect(t.length).toBeLessThanOrEqual(480);
});
