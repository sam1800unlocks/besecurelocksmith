import { test, expect, vi } from 'vitest';
import { appendToSheet } from '../../src/lib/contact/sheet';
import type { ContactEnv, Submission } from '../../src/lib/contact/types';

const s: Submission = { firstName: 'Joe', lastName: 'D', phone: '352', email: 'joe@x.com', message: 'hi' };
const env: ContactEnv = { SHEET_WEBHOOK_URL: 'https://script.google.com/macros/s/abc/exec', SHEET_WEBHOOK_SECRET: 'shh' };

test('posts a row with secret + fields', async () => {
  const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
  await appendToSheet(s, env, fetch as any, '2026-06-28T00:00:00Z');
  const [url, init] = fetch.mock.calls[0];
  expect(String(url)).toContain('script.google.com');
  const row = JSON.parse((init as any).body);
  expect(row.secret).toBe('shh');
  expect(row.email).toBe('joe@x.com');
  expect(row.timestamp).toBe('2026-06-28T00:00:00Z');
});

test('DRY_RUN skips network', async () => {
  const fetch = vi.fn();
  await appendToSheet(s, { ...env, CONTACT_DRY_RUN: '1' }, fetch as any);
  expect(fetch).not.toHaveBeenCalled();
});
