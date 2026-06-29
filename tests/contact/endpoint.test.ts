import { test, expect } from 'vitest';
import { onRequestPost } from '../../functions/api/contact';
import { TURNSTILE_FIELD } from '../../src/lib/contact/handle';

function ctx(form: Record<string, string>, env: Record<string, string>, accept = 'application/json') {
  const body = new URLSearchParams(form);
  const request = new Request('https://x/api/contact', {
    method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded', accept },
  });
  return { request, env, params: {}, waitUntil() {}, passThroughOnException() {}, next: async () => new Response() } as any;
}

const env = { CONTACT_DRY_RUN: '1', CONTACT_EMAIL_TO: 'a@b.com', CONTACT_SMS_TO: '+1', SHEET_WEBHOOK_URL: 'https://s/exec', TURNSTILE_SECRET: 'x' };
// Turnstile is verified for real; in DRY_RUN tests we bypass by using the honeypot-free valid path with a stubbed secret:
// the function calls the real verifyTurnstile, so point it at the always-pass test secret via a mocked global fetch.

test('valid JSON submission returns 200 ok (DRY_RUN, turnstile mocked)', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as any;
  try {
    const res = await onRequestPost(ctx({ email: 'a@b.com', message: 'hello', [TURNSTILE_FIELD]: 'tok' }, env));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  } finally { globalThis.fetch = orig; }
});

test('no-JS submission (Accept: text/html) redirects to /thank-you/ on success', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as any;
  try {
    const res = await onRequestPost(ctx({ email: 'a@b.com', message: 'hi', [TURNSTILE_FIELD]: 'tok' }, env, 'text/html'));
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/thank-you/');
  } finally { globalThis.fetch = orig; }
});

test('invalid submission returns 400', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as any;
  try {
    const res = await onRequestPost(ctx({ email: 'bad', message: '', [TURNSTILE_FIELD]: 'tok' }, env));
    expect(res.status).toBe(400);
  } finally { globalThis.fetch = orig; }
});
