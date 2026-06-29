import { test, expect, vi } from 'vitest';
import { sendEmail } from '../../src/lib/contact/ses';
import type { ContactEnv, Submission } from '../../src/lib/contact/types';

const s: Submission = { firstName: 'Joe', lastName: 'D', phone: '', email: 'joe@x.com', message: 'hi' };
const baseEnv: ContactEnv = {
  AWS_ACCESS_KEY_ID: 'k', AWS_SECRET_ACCESS_KEY: 's', AWS_REGION: 'us-east-1',
  SES_FROM: 'noreply@besecurelocksmith.com', CONTACT_EMAIL_TO: 'a@biz.com, b@biz.com',
};

test('To = first recipient, CC = the rest; posts to SES v2', async () => {
  const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
  await sendEmail(s, baseEnv, { fetch: fetch as any });
  const [url, init] = fetch.mock.calls[0];
  expect(String(url)).toContain('email.us-east-1.amazonaws.com/v2/email/outbound-emails');
  const payload = JSON.parse((init as any).body);
  expect(payload.Destination.ToAddresses).toEqual(['a@biz.com']);
  expect(payload.Destination.CcAddresses).toEqual(['b@biz.com']);
  expect(payload.Content.Simple.Subject.Data).toContain('Joe');
});

test('DRY_RUN does not hit the network', async () => {
  const fetch = vi.fn();
  await sendEmail(s, { ...baseEnv, CONTACT_DRY_RUN: '1' }, { fetch: fetch as any });
  expect(fetch).not.toHaveBeenCalled();
});

test('throws when no recipients configured', async () => {
  await expect(sendEmail(s, { ...baseEnv, CONTACT_EMAIL_TO: '' }, { fetch: (async () => new Response()) as any })).rejects.toThrow();
});
