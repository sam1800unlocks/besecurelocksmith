# Homepage Contact Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a homepage contact form that replicates the live Gravity Forms pipeline without WordPress — submissions fan out to AWS SES email (multi-recipient), Twilio SMS (multi-recipient), and a Google Sheet, with Cloudflare Turnstile spam protection.

**Architecture:** Astro stays **static** (`output: 'static'`, no adapter). The form posts to a **Cloudflare Pages Function** at `functions/api/contact.ts` (served by Cloudflare Pages at `/api/contact`). The function reads `context.env`, validates + anti-spam-checks, and calls shared pure modules in `src/lib/contact/*` that fan out to three failure-isolated sinks. (This realizes the spec's "static pages + one Worker endpoint" via Pages Functions instead of the `@astrojs/cloudflare` adapter, so `astro build`/`preview`/the e2e suite are untouched.)

**Tech Stack:** Astro 4 (static), Cloudflare Pages Functions, `zod` (validation), `aws4fetch` (SES SigV4 over fetch), Twilio Messages API, Google Apps Script webhook, Cloudflare Turnstile, Vitest.

## Global Constraints

- **No WordPress.** Native SES + Twilio + Sheet only.
- **Multiple recipients, configurable via env (no code edits):** `CONTACT_EMAIL_TO` and `CONTACT_SMS_TO` are comma-separated lists. Email: first = To, rest = CC. SMS: one message per number.
- **Failure isolation:** sinks run independently (`Promise.allSettled` semantics); one failing must not block the others. Success = at least one of email/SMS delivered. Total email+SMS failure → user sees "call 352-706-5295".
- **Honeypot** field `bsl_hp`: if filled, respond success and send nothing. **Turnstile** token field `cf-turnstile-response` verified server-side.
- **Fields (match live form):** firstName, lastName, phone (all optional), email (required, valid), message (required, 1–4000).
- **`CONTACT_DRY_RUN` truthy** → every sink logs instead of sending (safe local/dev/test).
- **Secrets never in the repo.** `.dev.vars` is gitignored; `.dev.vars.example` documents the keys.
- **Storage is a pluggable sink** (`sheet.ts`) so Nexus can replace it later with a one-file change.
- Phone for the "call us" fallback: **352-706-5295**.

---

## File Structure

```
src/lib/contact/
  types.ts        # Submission, ContactEnv, SinkResult
  schema.ts       # zod schema + parseSubmission()
  format.ts       # fullName / emailSubject / emailText / emailHtml / smsText
  turnstile.ts    # verifyTurnstile()
  ses.ts          # sendEmail() — SES v2 HTTPS + aws4fetch
  twilio.ts       # sendSms() — one POST per recipient number
  sheet.ts        # appendToSheet() — POST to Apps Script webhook (the storage sink)
  sinks.ts        # dispatch() — run email+sms+sheet isolated; compute `delivered`
  handle.ts       # handleContact(form, env, ip, deps) — honeypot/validate/turnstile/dispatch
functions/api/contact.ts   # Cloudflare Pages Function (onRequestPost) -> handleContact
src/components/sections/ContactForm.astro   # form UI (homepage section, reusable)
src/pages/thank-you/index.astro             # no-JS confirmation page
src/pages/index.astro                       # add <ContactForm/> above <Footer/>
.dev.vars.example                           # documents env vars
docs/contact-form-setup.md                  # Apps Script code + Cloudflare/SES/Twilio setup
tests/contact/*.test.ts
```

---

## Task 1: Types + validation schema

**Files:**
- Create: `src/lib/contact/types.ts`, `src/lib/contact/schema.ts`, `tests/contact/schema.test.ts`

**Interfaces:**
- Produces:
  - `interface Submission { firstName: string; lastName: string; phone: string; email: string; message: string }`
  - `interface ContactEnv { AWS_ACCESS_KEY_ID?, AWS_SECRET_ACCESS_KEY?, AWS_REGION?, SES_FROM?, CONTACT_EMAIL_TO?, TWILIO_ACCOUNT_SID?, TWILIO_AUTH_TOKEN?, TWILIO_FROM?, CONTACT_SMS_TO?, TURNSTILE_SECRET?, SHEET_WEBHOOK_URL?, SHEET_WEBHOOK_SECRET?, CONTACT_DRY_RUN? }` (all `string | undefined`)
  - `interface SinkResult { name: string; ok: boolean; error?: string }`
  - `parseSubmission(input: Record<string, unknown>): { success: true; data: Submission } | { success: false; errors: Record<string, string> }`

- [ ] **Step 1: Install zod**

Run: `npm install zod`

- [ ] **Step 2: Write `src/lib/contact/types.ts`**

```ts
export interface Submission {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
}

export interface ContactEnv {
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  SES_FROM?: string;
  CONTACT_EMAIL_TO?: string; // comma-separated; first = To, rest = CC
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
  CONTACT_SMS_TO?: string; // comma-separated numbers
  TURNSTILE_SECRET?: string;
  SHEET_WEBHOOK_URL?: string;
  SHEET_WEBHOOK_SECRET?: string;
  CONTACT_DRY_RUN?: string;
}

export interface SinkResult { name: string; ok: boolean; error?: string }
```

- [ ] **Step 3: Write the failing test `tests/contact/schema.test.ts`**

```ts
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
```

- [ ] **Step 4: Run — expect FAIL** (`npm test -- tests/contact/schema.test.ts`; module missing).

- [ ] **Step 5: Write `src/lib/contact/schema.ts`**

```ts
import { z } from 'zod';
import type { Submission } from './types';

const schema = z.object({
  firstName: z.string().trim().max(80).default(''),
  lastName: z.string().trim().max(80).default(''),
  phone: z.string().trim().max(32).regex(/^[0-9 ()+\-.]*$/, 'Enter a valid phone').default(''),
  email: z.string().trim().max(160).email('Enter a valid email'),
  message: z.string().trim().min(1, 'Please enter a message').max(4000),
});

export function parseSubmission(
  input: Record<string, unknown>,
): { success: true; data: Submission } | { success: false; errors: Record<string, string> } {
  const r = schema.safeParse(input);
  if (r.success) return { success: true, data: r.data };
  const errors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const k = String(issue.path[0] ?? 'form');
    if (!errors[k]) errors[k] = issue.message;
  }
  return { success: false, errors };
}
```

- [ ] **Step 6: Run — expect PASS.**

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(contact): submission types + zod validation"`

---

## Task 2: Message formatting

**Files:**
- Create: `src/lib/contact/format.ts`, `tests/contact/format.test.ts`

**Interfaces:**
- Consumes: `Submission` (Task 1).
- Produces: `fullName(s)`, `emailSubject(s)`, `emailText(s)`, `emailHtml(s)`, `smsText(s)` — all `(s: Submission) => string`, pure.

- [ ] **Step 1: Write failing test `tests/contact/format.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/lib/contact/format.ts`**

```ts
import type { Submission } from './types';

export function fullName(s: Submission): string {
  const n = [s.firstName, s.lastName].filter(Boolean).join(' ').trim();
  return n || 'Website visitor';
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function emailSubject(s: Submission): string {
  return `New website contact from ${fullName(s)}`;
}

export function emailText(s: Submission): string {
  return [
    `Name: ${fullName(s)}`,
    `Email: ${s.email}`,
    `Phone: ${s.phone || '—'}`,
    '',
    'Message:',
    s.message,
  ].join('\n');
}

export function emailHtml(s: Submission): string {
  return [
    `<p><strong>Name:</strong> ${esc(fullName(s))}</p>`,
    `<p><strong>Email:</strong> ${esc(s.email)}</p>`,
    `<p><strong>Phone:</strong> ${esc(s.phone || '—')}</p>`,
    `<p><strong>Message:</strong></p>`,
    `<p>${esc(s.message).replace(/\n/g, '<br>')}</p>`,
  ].join('\n');
}

export function smsText(s: Submission): string {
  const contact = [s.email, s.phone].filter(Boolean).join(' ');
  return `New website lead: ${fullName(s)} (${contact}) — ${s.message}`.slice(0, 480);
}
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(contact): email/SMS message formatting"`

---

## Task 3: Turnstile verification

**Files:**
- Create: `src/lib/contact/turnstile.ts`, `tests/contact/turnstile.test.ts`

**Interfaces:**
- Produces: `verifyTurnstile(token: string, secret: string, remoteip?: string, fetchImpl?: typeof fetch): Promise<boolean>`

- [ ] **Step 1: Write failing test `tests/contact/turnstile.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/lib/contact/turnstile.ts`**

```ts
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteip?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!token || !secret) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set('remoteip', remoteip);
  try {
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(contact): Turnstile verification"`

---

## Task 4: SES email sink

**Files:**
- Create: `src/lib/contact/ses.ts`, `tests/contact/ses.test.ts`

**Interfaces:**
- Consumes: `Submission`, `ContactEnv`, `format.ts`.
- Produces: `sendEmail(s: Submission, env: ContactEnv, client?: { fetch: typeof fetch }): Promise<void>` — throws on failure/misconfig. `client` is injectable (defaults to a real `aws4fetch` `AwsClient`). `CONTACT_DRY_RUN` skips network.

- [ ] **Step 1: Install aws4fetch** — `npm install aws4fetch`

- [ ] **Step 2: Write failing test `tests/contact/ses.test.ts`**

```ts
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
```

- [ ] **Step 3: Run — FAIL.**

- [ ] **Step 4: Write `src/lib/contact/ses.ts`**

```ts
import { AwsClient } from 'aws4fetch';
import type { ContactEnv, Submission } from './types';
import { emailSubject, emailText, emailHtml } from './format';

function recipients(env: ContactEnv): string[] {
  return (env.CONTACT_EMAIL_TO ?? '').split(',').map((x) => x.trim()).filter(Boolean);
}

export async function sendEmail(
  s: Submission,
  env: ContactEnv,
  client?: { fetch: typeof fetch },
): Promise<void> {
  const to = recipients(env);
  if (!to.length) throw new Error('No email recipients configured (CONTACT_EMAIL_TO)');
  if (env.CONTACT_DRY_RUN) { console.log('[DRY_RUN] SES email →', to, '|', emailSubject(s)); return; }

  const region = env.AWS_REGION!;
  const aws = client ?? new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID!, secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    region, service: 'ses',
  });
  const payload = {
    FromEmailAddress: env.SES_FROM,
    Destination: { ToAddresses: [to[0]], CcAddresses: to.slice(1) },
    ReplyToAddresses: [s.email],
    Content: { Simple: {
      Subject: { Data: emailSubject(s) },
      Body: { Text: { Data: emailText(s) }, Html: { Data: emailHtml(s) } },
    } },
  };
  const res = await aws.fetch(`https://email.${region}.amazonaws.com/v2/email/outbound-emails`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`SES ${res.status}: ${await res.text()}`);
}
```

- [ ] **Step 5: Run — PASS. Step 6: Commit** `git add -A && git commit -m "feat(contact): SES email sink (multi-recipient To/CC)"`

---

## Task 5: Twilio SMS sink

**Files:**
- Create: `src/lib/contact/twilio.ts`, `tests/contact/twilio.test.ts`

**Interfaces:**
- Produces: `sendSms(s: Submission, env: ContactEnv, fetchImpl?: typeof fetch): Promise<void>` — one POST per number in `CONTACT_SMS_TO`; throws only if ALL fail or none configured. `CONTACT_DRY_RUN` skips.

- [ ] **Step 1: Write failing test `tests/contact/twilio.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/lib/contact/twilio.ts`**

```ts
import type { ContactEnv, Submission } from './types';
import { smsText } from './format';

function recipients(env: ContactEnv): string[] {
  return (env.CONTACT_SMS_TO ?? '').split(',').map((x) => x.trim()).filter(Boolean);
}

export async function sendSms(
  s: Submission,
  env: ContactEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const to = recipients(env);
  if (!to.length) throw new Error('No SMS recipients configured (CONTACT_SMS_TO)');
  const text = smsText(s);
  if (env.CONTACT_DRY_RUN) { console.log('[DRY_RUN] Twilio SMS →', to, '|', text); return; }

  const sid = env.TWILIO_ACCOUNT_SID!;
  const auth = 'Basic ' + btoa(`${sid}:${env.TWILIO_AUTH_TOKEN}`);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const results = await Promise.allSettled(
    to.map((num) => {
      const body = new URLSearchParams({ From: env.TWILIO_FROM!, To: num, Body: text });
      return fetchImpl(url, {
        method: 'POST',
        headers: { Authorization: auth, 'content-type': 'application/x-www-form-urlencoded' },
        body,
      }).then(async (r) => { if (!r.ok) throw new Error(`Twilio ${r.status}: ${await r.text()}`); });
    }),
  );
  if (results.every((r) => r.status === 'rejected')) throw new Error('All SMS sends failed');
}
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(contact): Twilio SMS sink (multi-recipient)"`

---

## Task 6: Google Sheet storage sink

**Files:**
- Create: `src/lib/contact/sheet.ts`, `tests/contact/sheet.test.ts`

**Interfaces:**
- Produces: `appendToSheet(s: Submission, env: ContactEnv, fetchImpl?: typeof fetch, now?: string): Promise<void>` — POST JSON row to `SHEET_WEBHOOK_URL`. `CONTACT_DRY_RUN` skips. This is the swap point for Nexus.

- [ ] **Step 1: Write failing test `tests/contact/sheet.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/lib/contact/sheet.ts`**

```ts
import type { ContactEnv, Submission } from './types';
import { fullName } from './format';

export async function appendToSheet(
  s: Submission,
  env: ContactEnv,
  fetchImpl: typeof fetch = fetch,
  now: string = new Date().toISOString(),
): Promise<void> {
  if (!env.SHEET_WEBHOOK_URL) throw new Error('No sheet webhook configured (SHEET_WEBHOOK_URL)');
  const row = {
    secret: env.SHEET_WEBHOOK_SECRET ?? '',
    timestamp: now,
    name: fullName(s),
    firstName: s.firstName, lastName: s.lastName,
    email: s.email, phone: s.phone, message: s.message,
  };
  if (env.CONTACT_DRY_RUN) { console.log('[DRY_RUN] Sheet row →', row); return; }
  const res = await fetchImpl(env.SHEET_WEBHOOK_URL, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Sheet webhook ${res.status}`);
}
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(contact): Google Sheet storage sink (Nexus-ready)"`

---

## Task 7: Sink fan-out

**Files:**
- Create: `src/lib/contact/sinks.ts`, `tests/contact/sinks.test.ts`

**Interfaces:**
- Consumes: `sendEmail`, `sendSms`, `appendToSheet`.
- Produces: `dispatch(s: Submission, env: ContactEnv, deps?: SinkDeps): Promise<{ results: SinkResult[]; delivered: boolean }>` where `interface SinkDeps { email?, sms?, sheet?: (s,env)=>Promise<void> }`. `delivered` = email OR sms succeeded. Never throws.

- [ ] **Step 1: Write failing test `tests/contact/sinks.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/lib/contact/sinks.ts`**

```ts
import type { ContactEnv, Submission, SinkResult } from './types';
import { sendEmail } from './ses';
import { sendSms } from './twilio';
import { appendToSheet } from './sheet';

export interface SinkDeps {
  email?: (s: Submission, env: ContactEnv) => Promise<void>;
  sms?: (s: Submission, env: ContactEnv) => Promise<void>;
  sheet?: (s: Submission, env: ContactEnv) => Promise<void>;
}

export async function dispatch(
  s: Submission,
  env: ContactEnv,
  deps: SinkDeps = {},
): Promise<{ results: SinkResult[]; delivered: boolean }> {
  const email = deps.email ?? sendEmail;
  const sms = deps.sms ?? sendSms;
  const sheet = deps.sheet ?? appendToSheet;
  const run = async (name: string, fn: () => Promise<void>): Promise<SinkResult> => {
    try { await fn(); return { name, ok: true }; }
    catch (e) { return { name, ok: false, error: e instanceof Error ? e.message : String(e) }; }
  };
  const results = await Promise.all([
    run('email', () => email(s, env)),
    run('sms', () => sms(s, env)),
    run('sheet', () => sheet(s, env)),
  ]);
  const delivered = results.some((r) => (r.name === 'email' || r.name === 'sms') && r.ok);
  return { results, delivered };
}
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(contact): failure-isolated sink fan-out"`

---

## Task 8: Request handler

**Files:**
- Create: `src/lib/contact/handle.ts`, `tests/contact/handle.test.ts`

**Interfaces:**
- Consumes: `parseSubmission`, `verifyTurnstile`, `dispatch`.
- Produces:
  - `const HONEYPOT_FIELD = 'bsl_hp'`, `const TURNSTILE_FIELD = 'cf-turnstile-response'`
  - `handleContact(form: Record<string,string>, env: ContactEnv, ip?: string, deps?: HandleDeps): Promise<{ status: number; body: { ok: boolean; errors?: Record<string,string>; error?: string } }>` where `interface HandleDeps { parse?, verify?, dispatch? }`.

- [ ] **Step 1: Write failing test `tests/contact/handle.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/lib/contact/handle.ts`**

```ts
import type { ContactEnv } from './types';
import { parseSubmission } from './schema';
import { verifyTurnstile } from './turnstile';
import { dispatch } from './sinks';

export const HONEYPOT_FIELD = 'bsl_hp';
export const TURNSTILE_FIELD = 'cf-turnstile-response';

export interface HandleDeps {
  parse?: typeof parseSubmission;
  verify?: (token: string, secret: string, ip?: string) => Promise<boolean>;
  dispatch?: typeof dispatch;
}

export async function handleContact(
  form: Record<string, string>,
  env: ContactEnv,
  ip?: string,
  deps: HandleDeps = {},
): Promise<{ status: number; body: { ok: boolean; errors?: Record<string, string>; error?: string } }> {
  const parse = deps.parse ?? parseSubmission;
  const verify = deps.verify ?? ((t, sec, i) => verifyTurnstile(t, sec, i));
  const dsp = deps.dispatch ?? dispatch;

  if (form[HONEYPOT_FIELD]) return { status: 200, body: { ok: true } };

  const parsed = parse(form);
  if (!parsed.success) return { status: 400, body: { ok: false, errors: parsed.errors } };

  const passed = await verify(form[TURNSTILE_FIELD] ?? '', env.TURNSTILE_SECRET ?? '', ip);
  if (!passed) return { status: 400, body: { ok: false, errors: { turnstile: 'Please complete the verification and try again.' } } };

  const { delivered } = await dsp(parsed.data, env);
  if (!delivered) return { status: 502, body: { ok: false, error: 'Sorry — we couldn’t send your message. Please call us at 352-706-5295.' } };
  return { status: 200, body: { ok: true } };
}
```

- [ ] **Step 4: Run — PASS. Step 5: Commit** `git add -A && git commit -m "feat(contact): request handler (honeypot/validate/turnstile/dispatch)"`

---

## Task 9: Contact form UI + thank-you page + homepage placement

**Files:**
- Create: `src/components/sections/ContactForm.astro`, `src/pages/thank-you/index.astro`, `tests/contact/contactform.test.ts`
- Modify: `src/pages/index.astro` (add `<ContactForm/>` above `<Footer/>`), `tests/homepage.test.ts`

**Interfaces:**
- Consumes: `BaseLayout`, `Container`, `Section`, `Button`, `handle.ts` constants (field names `bsl_hp`, `cf-turnstile-response`).
- Produces: a homepage section posting to `/api/contact`.

- [ ] **Step 1: Write failing test `tests/contact/contactform.test.ts`**

```ts
import { test, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ContactForm from '../../src/components/sections/ContactForm.astro';

test('renders the form with required fields, honeypot, turnstile, and action', async () => {
  const c = await AstroContainer.create();
  const html = await c.renderToString(ContactForm, { props: {} });
  expect(html).toContain('action="/api/contact"');
  expect(html).toContain('name="email"');
  expect(html).toContain('name="message"');
  expect(html).toContain('name="bsl_hp"');
  expect(html).toContain('cf-turnstile');
});
```

- [ ] **Step 2: Run — FAIL.**

- [ ] **Step 3: Write `src/components/sections/ContactForm.astro`**

```astro
---
import Section from '../primitives/Section.astro';
import Container from '../primitives/Container.astro';
import Button from '../primitives/Button.astro';
const siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'; // CF "always passes" test key
---
<Section id="contact" class="bg-surface">
  <Container>
    <div class="max-w-[760px] mx-auto py-14 md:py-20">
      <h2 class="m-0 text-ink font-medium tracking-[-0.6px]" style="font-size:clamp(26px,3.4vw,34px);line-height:1.2;">Contact Be Secure Locksmith</h2>
      <div class="mt-3 mb-6 h-1 w-12 rounded-full bg-primary"></div>
      <p class="m-0 mb-8 text-[16px] leading-[1.6] text-secondary">Send us a message and we’ll get right back to you. For immediate help, call <a href="tel:3527065295" class="text-primary font-semibold">352-706-5295</a>.</p>

      <form action="/api/contact" method="POST" data-contact-form class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-[13px] font-semibold text-ink">First name</span>
          <input type="text" name="firstName" autocomplete="given-name" class="rounded-[12px] border border-border bg-white px-4 py-3 text-[15px]" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[13px] font-semibold text-ink">Last name</span>
          <input type="text" name="lastName" autocomplete="family-name" class="rounded-[12px] border border-border bg-white px-4 py-3 text-[15px]" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[13px] font-semibold text-ink">Phone</span>
          <input type="tel" name="phone" autocomplete="tel" class="rounded-[12px] border border-border bg-white px-4 py-3 text-[15px]" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[13px] font-semibold text-ink">Email <span class="text-alert">*</span></span>
          <input type="email" name="email" required autocomplete="email" class="rounded-[12px] border border-border bg-white px-4 py-3 text-[15px]" />
        </label>
        <label class="flex flex-col gap-1.5 sm:col-span-2">
          <span class="text-[13px] font-semibold text-ink">Message <span class="text-alert">*</span></span>
          <textarea name="message" required rows="5" class="rounded-[12px] border border-border bg-white px-4 py-3 text-[15px]"></textarea>
        </label>

        <!-- Honeypot: visually hidden, must stay empty -->
        <input type="text" name="bsl_hp" tabindex="-1" autocomplete="off" aria-hidden="true" class="hidden" />

        <div class="sm:col-span-2 cf-turnstile" data-sitekey={siteKey}></div>

        <div class="sm:col-span-2 flex items-center gap-4">
          <Button href="#" variant="primary" class="!cursor-pointer" type="submit">Send message</Button>
          <p data-contact-status role="status" aria-live="polite" class="m-0 text-[14px]"></p>
        </div>
      </form>
    </div>
  </Container>
</Section>

<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<script>
  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-contact-status]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (status) { status.textContent = 'Sending…'; status.className = 'm-0 text-[14px] text-muted'; }
    try {
      const res = await fetch('/api/contact', { method: 'POST', body: new FormData(form), headers: { 'x-requested-with': 'fetch' } });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        form.reset();
        if (status) { status.textContent = 'Thanks! We’ll be in touch shortly.'; status.className = 'm-0 text-[14px] text-success-2 font-semibold'; }
        window.turnstile && window.turnstile.reset();
      } else {
        const msg = data.error || (data.errors && Object.values(data.errors)[0]) || 'Something went wrong. Please call 352-706-5295.';
        if (status) { status.textContent = msg; status.className = 'm-0 text-[14px] text-alert font-semibold'; }
      }
    } catch {
      if (status) { status.textContent = 'Network error. Please call 352-706-5295.'; status.className = 'm-0 text-[14px] text-alert font-semibold'; }
    }
  });
</script>
```

> Note: `Button` is an `<a>`; for a real submit control, render a native button instead. Implementer: replace the `<Button>` line with `<button type="submit" class="inline-flex items-center gap-2 text-[15px] font-bold px-[30px] py-[15px] rounded-[100px] bg-primary text-white cursor-pointer">Send message</button>` (the design-system primary styles inline) so the form submits natively in the no-JS path. Keep the markup test assertions valid.

- [ ] **Step 4: Write `src/pages/thank-you/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PromoBar from '../../components/sections/PromoBar.astro';
import NavBar from '../../components/sections/NavBar.astro';
import Footer from '../../components/sections/Footer.astro';
import Container from '../../components/primitives/Container.astro';
import Button from '../../components/primitives/Button.astro';
import { telHref } from '../../config/site';
---
<BaseLayout title="Thank you | Be Secure Locksmith" description="Your message was sent." robots="noindex, follow">
  <PromoBar location="main" />
  <NavBar location="main" />
  <main>
    <Container>
      <div class="max-w-[760px] mx-auto py-24 text-center">
        <h1 class="m-0 mb-4 text-ink font-medium" style="font-size:clamp(30px,5vw,48px);">Thank you — message sent</h1>
        <p class="m-0 mb-8 text-[18px] text-secondary">We’ve received your message and will get back to you shortly. For immediate help, give us a call.</p>
        <div class="flex flex-wrap gap-3 justify-center">
          <Button href={telHref('352-706-5295')} variant="primary">Call 352-706-5295</Button>
          <Button href="/" variant="dark">Back to home</Button>
        </div>
      </div>
    </main>
  </Container>
  <Footer location="main" />
</BaseLayout>
```

- [ ] **Step 5: Add to homepage** — in `src/pages/index.astro`, import `ContactForm` and render `<ContactForm />` immediately before `<Footer location={location} />`.

- [ ] **Step 6: Update `tests/homepage.test.ts`** — add to the marker list: `'action="/api/contact"'` and `'Contact Be Secure Locksmith'`.

- [ ] **Step 7: Run + build** — `npm test -- tests/contact/contactform.test.ts` PASS; `npm run build` then `npm test -- tests/homepage.test.ts` PASS.

- [ ] **Step 8: Commit** `git add -A && git commit -m "feat(contact): homepage contact form UI + thank-you page"`

---

## Task 10: Cloudflare Pages Function + setup docs + verification

**Files:**
- Create: `functions/api/contact.ts`, `tests/contact/endpoint.test.ts`, `.dev.vars.example`, `docs/contact-form-setup.md`
- Modify: `.gitignore` (add `.dev.vars`), `package.json` (devDep types)

**Interfaces:**
- Consumes: `handleContact`, `ContactEnv`.
- Produces: `onRequestPost` Pages Function serving `POST /api/contact`.

- [ ] **Step 1: Install Cloudflare types** — `npm install -D @cloudflare/workers-types`

- [ ] **Step 2: Write failing integration test `tests/contact/endpoint.test.ts`** (drives the function end-to-end in DRY_RUN — no network)

```ts
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
```

- [ ] **Step 3: Run — FAIL.**

- [ ] **Step 4: Write `functions/api/contact.ts`**

```ts
import { handleContact } from '../../src/lib/contact/handle';
import type { ContactEnv } from '../../src/lib/contact/types';

export const onRequestPost: PagesFunction<ContactEnv> = async (context) => {
  const { request, env } = context;
  const fd = await request.formData();
  const form: Record<string, string> = {};
  for (const [k, v] of fd.entries()) form[k] = typeof v === 'string' ? v : '';
  const ip = request.headers.get('CF-Connecting-IP') ?? undefined;

  const { status, body } = await handleContact(form, env, ip);

  const wantsJson =
    (request.headers.get('accept') ?? '').includes('application/json') ||
    request.headers.get('x-requested-with') === 'fetch';

  if (wantsJson) {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }
  const location = status === 200 ? '/thank-you/' : '/?contact=error#contact';
  return new Response(null, { status: 303, headers: { Location: location } });
};
```

Add `"types": ["@cloudflare/workers-types", ...]` consideration: create `functions/tsconfig.json` extending the root with `{"compilerOptions":{"types":["@cloudflare/workers-types"]}}` so `PagesFunction` resolves. (Vitest runs the TS directly; the type is erased at runtime.)

- [ ] **Step 5: Run — PASS.**

- [ ] **Step 6: `.gitignore` + `.dev.vars.example`** — add `.dev.vars` to `.gitignore`. Create `.dev.vars.example`:

```
# Copy to .dev.vars (gitignored) for local `wrangler pages dev`. Use CONTACT_DRY_RUN=1 to avoid real sends.
CONTACT_DRY_RUN=1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
SES_FROM=noreply@besecurelocksmith.com
CONTACT_EMAIL_TO=owner@besecurelocksmith.com, office@besecurelocksmith.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=+1XXXXXXXXXX
CONTACT_SMS_TO=+1XXXXXXXXXX
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
SHEET_WEBHOOK_URL=
SHEET_WEBHOOK_SECRET=
```

- [ ] **Step 7: Write `docs/contact-form-setup.md`** — document, with exact steps: (a) Cloudflare Pages env vars (the keys above), (b) verifying the SES sender + recipients and the SES IAM policy (`ses:SendEmail`), (c) Twilio number + auth token, (d) Turnstile site/secret keys, (e) the **Google Apps Script** web app:

```js
// Apps Script bound to the submissions Google Sheet. Deploy as Web App (Execute as: Me; Who has access: Anyone).
// Put the deployment URL in SHEET_WEBHOOK_URL and a shared secret in SHEET_WEBHOOK_SECRET.
const SECRET = 'CHANGE_ME'; // must equal SHEET_WEBHOOK_SECRET
function doPost(e) {
  const row = JSON.parse(e.postData.contents);
  if (row.secret !== SECRET) return ContentService.createTextOutput('forbidden').setResponseCode(403);
  const sh = SpreadsheetApp.getActiveSheet();
  sh.appendRow([row.timestamp, row.name, row.email, row.phone, row.message]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
```

Also note: for local function testing run `npx wrangler pages dev dist --compatibility-flag nodejs_compat` after `npm run build` (with `.dev.vars` present); the unit + integration tests already cover the logic without wrangler.

- [ ] **Step 8: Full verification** — `npm test` (all green incl. the new contact suite), `npm run build` (static build unchanged), `npm run test:e2e` (3 e2e still pass — homepage now includes the form section). Confirm `dist/index.html` contains `action="/api/contact"`.

- [ ] **Step 9: Commit** `git add -A && git commit -m "feat(contact): Cloudflare Pages Function endpoint + setup docs + dev vars"`

---

## Self-Review

**1. Spec coverage:**
- Worker endpoint + fan-out → T7/T8/T10. Multi-recipient email To/CC → T4. Multi-recipient SMS → T5. Google Sheet sink (Nexus-ready) → T6. Turnstile + honeypot → T3/T8/T9. Fields match live form → T1/T9. Progressive enhancement (JS + no-JS redirect) → T9/T10. Failure isolation + partial-success rule + "call 352-706-5295" → T7/T8. DRY_RUN → T4/T5/T6 + exercised in T10. Config/secrets + `.dev.vars` → T10. Placement above footer → T9. Testing per module → T1–T10. All spec sections mapped.
- Deviation from spec wording: spec said `output:'hybrid'` + `@astrojs/cloudflare`; plan uses Cloudflare **Pages Functions** to achieve the same static-pages-+-worker outcome without disrupting build/preview/e2e. Flagged for the user at handoff.

**2. Placeholder scan:** No TBD/TODO; every code/test step has real content. The one prose instruction (T9 Step 3 note about swapping `<Button>` for a native `<button>`) includes the exact replacement markup — not a placeholder.

**3. Type consistency:** `Submission`/`ContactEnv`/`SinkResult` defined in T1 and used verbatim through T4–T10. `parseSubmission` return shape consistent (T1↔T8). `dispatch` return `{results, delivered}` consistent (T7↔T8). Field constants `bsl_hp`/`cf-turnstile-response` consistent (T8↔T9). `sendEmail(s, env, client?)`, `sendSms(s, env, fetchImpl?)`, `appendToSheet(s, env, fetchImpl?, now?)` signatures consistent with their `SinkDeps` usage in T7 (deps wrap them as `(s, env) => Promise<void>`).
