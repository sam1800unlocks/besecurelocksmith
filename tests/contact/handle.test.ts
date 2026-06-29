import { test, expect, vi } from 'vitest';
import { handleContact, HONEYPOT_FIELD, TURNSTILE_FIELD } from '../../src/lib/contact/handle';

const good = { firstName: 'A', lastName: 'B', phone: '', email: 'a@b.com', message: 'hi', [TURNSTILE_FIELD]: 'tok' };
const env = {};
const okVerify = async () => true;
const okDispatch = async () => ({ results: [], delivered: true });

test('happy path returns 200 ok', async () => {
  const r = await handleContact(good, env, '1.2.3.4', { verify: okVerify, dispatch: okDispatch as any });
  expect(r.status).toBe(200); expect(r.body.ok).toBe(true);
});

test('honeypot filled → silent success, no dispatch', async () => {
  const dispatch = vi.fn();
  const r = await handleContact({ ...good, [HONEYPOT_FIELD]: 'bot' }, env, undefined, { verify: okVerify, dispatch: dispatch as any });
  expect(r.status).toBe(200); expect(dispatch).not.toHaveBeenCalled();
});

test('validation error → 400 with errors', async () => {
  const r = await handleContact({ ...good, email: 'bad', message: '' }, env, undefined, { verify: okVerify, dispatch: okDispatch as any });
  expect(r.status).toBe(400); expect(r.body.errors).toBeTruthy();
});

test('turnstile fail → 400', async () => {
  const r = await handleContact(good, env, undefined, { verify: async () => false, dispatch: okDispatch as any });
  expect(r.status).toBe(400); expect(r.body.errors?.turnstile).toBeTruthy();
});

test('total delivery failure → 502 with phone', async () => {
  const r = await handleContact(good, env, undefined, { verify: okVerify, dispatch: (async () => ({ results: [], delivered: false })) as any });
  expect(r.status).toBe(502); expect(r.body.error).toContain('352-706-5295');
});
