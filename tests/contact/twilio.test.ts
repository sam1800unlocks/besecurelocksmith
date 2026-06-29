import { test, expect, vi } from 'vitest';
import { sendSms } from '../../src/lib/contact/twilio';
import type { ContactEnv, Submission } from '../../src/lib/contact/types';

const s: Submission = { firstName: 'Joe', lastName: 'D', phone: '', email: 'joe@x.com', message: 'hi' };
const env: ContactEnv = { TWILIO_ACCOUNT_SID: 'ACxxx', TWILIO_AUTH_TOKEN: 'tok', TWILIO_FROM: '+1999', CONTACT_SMS_TO: '+1111, +1222' };

test('sends one message per recipient with basic auth', async () => {
  const fetch = vi.fn(async () => new Response('{}', { status: 201 }));
  await sendSms(s, env, fetch as any);
  expect(fetch).toHaveBeenCalledTimes(2);
  const [url, init] = fetch.mock.calls[0];
  expect(String(url)).toContain('/Accounts/ACxxx/Messages.json');
  expect((init as any).headers.Authorization).toContain('Basic ');
  expect(String((init as any).body)).toContain('To=%2B1111');
});

test('DRY_RUN skips network', async () => {
  const fetch = vi.fn();
  await sendSms(s, { ...env, CONTACT_DRY_RUN: '1' }, fetch as any);
  expect(fetch).not.toHaveBeenCalled();
});

test('throws only when every send fails', async () => {
  const fetch = vi.fn(async () => new Response('bad', { status: 400 }));
  await expect(sendSms(s, env, fetch as any)).rejects.toThrow();
});
