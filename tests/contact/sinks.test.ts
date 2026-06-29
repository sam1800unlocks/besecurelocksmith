import { test, expect, vi } from 'vitest';
import { dispatch } from '../../src/lib/contact/sinks';
import type { Submission, ContactEnv } from '../../src/lib/contact/types';

const s: Submission = { firstName: 'A', lastName: 'B', phone: '', email: 'a@b.com', message: 'hi' };
const env: ContactEnv = {};

test('runs all sinks; one failing does not stop the others', async () => {
  const email = vi.fn(async () => {});
  const sms = vi.fn(async () => {});
  const sheet = vi.fn(async () => { throw new Error('sheet down'); });
  const { results, delivered } = await dispatch(s, env, { email, sms, sheet });
  expect(email).toHaveBeenCalled(); expect(sms).toHaveBeenCalled(); expect(sheet).toHaveBeenCalled();
  expect(delivered).toBe(true);
  expect(results.find((r) => r.name === 'sheet')!.ok).toBe(false);
});

test('delivered is false only when both email and sms fail', async () => {
  const fail = async () => { throw new Error('x'); };
  const { delivered } = await dispatch(s, env, { email: fail, sms: fail, sheet: async () => {} });
  expect(delivered).toBe(false);
});
