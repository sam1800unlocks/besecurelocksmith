import { test, expect, vi } from 'vitest';
import { verifyTurnstile } from '../../src/lib/contact/turnstile';

const okFetch = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
const badFetch = vi.fn(async () => new Response(JSON.stringify({ success: false }), { status: 200 }));

test('returns false for empty token without calling network', async () => {
  const f = vi.fn();
  expect(await verifyTurnstile('', 'sec', undefined, f as any)).toBe(false);
  expect(f).not.toHaveBeenCalled();
});

test('returns true when siteverify succeeds', async () => {
  expect(await verifyTurnstile('tok', 'sec', '1.2.3.4', okFetch as any)).toBe(true);
  const [, init] = okFetch.mock.calls[0];
  expect(String((init as any).body)).toContain('response=tok');
});

test('returns false when siteverify rejects', async () => {
  expect(await verifyTurnstile('tok', 'sec', undefined, badFetch as any)).toBe(false);
});
