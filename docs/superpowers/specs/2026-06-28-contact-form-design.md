# Spec — Homepage Contact Form (Astro + Cloudflare, native SES/Twilio/Sheets)

**Date:** 2026-06-28
**Status:** Approved design, ready for implementation planning
**Project:** Be Secure Locksmith (WordPress → Astro replatform)

## Summary

Add a contact form to the homepage (reusable on a future `/contact-us/`) that replicates the live site's Gravity Forms pipeline **without WordPress**. On submit, a Cloudflare Worker validates + anti-spam-checks the data and fans out to three independent sinks:

1. **Email** via AWS SES (replaces Fluent SMTP→SES) to a configurable list of recipients (To + CC).
2. **SMS** via Twilio (replaces the GF Twilio add-on) to a configurable list of numbers.
3. **Storage** — append a row to a Google Sheet now; designed as a pluggable sink so **Nexus** can replace/augment it later.

Each sink is failure-isolated: one failing must not cost the lead or block the others.

## Goals

- A homepage contact form matching the live form's fields, in the design system.
- Native replacement of the GF pipeline: SES email + Twilio SMS, no WordPress.
- Multiple email recipients and multiple SMS recipients, configurable without code changes.
- Submissions recorded to a Google Sheet; storage swappable to Nexus later.
- Works with and without client JS (progressive enhancement).
- Spam protection (Cloudflare Turnstile + honeypot).

## Non-goals (this spec)

- The `/contact-us/` page itself (the component is built reusable; wiring that page is a later task).
- Nexus integration (storage is built behind an interface so Nexus drops in later — not implemented now).
- Auto-reply email to the submitter and file uploads (explicitly out per brainstorming; the architecture leaves room to add them).
- An admin UI for entries (the Google Sheet is the interim record).

## Decisions (from brainstorming)

- **Backend:** fully leave WordPress; replicate natively.
- **Host:** Cloudflare Pages; `@astrojs/cloudflare` adapter; project switches to `output: 'hybrid'` (all existing pages stay prerendered/static; only the form API route is server-rendered on the Worker).
- **Spam:** Cloudflare Turnstile (free) + hidden honeypot.
- **Fields (match live GF form):** First name, Last name, Phone, Email (required), Message (required).
- **Recipients:** multiple email + multiple SMS, configurable via env.
- **Storage:** Google Sheet via a Google Apps Script web-app webhook now; pluggable for Nexus.
- **Placement:** a section near the bottom of the homepage, above the footer.

## Architecture

```
src/
  components/sections/ContactForm.astro     # form UI (homepage section; reusable)
  pages/api/contact.ts                      # POST handler — prerender = false (Worker)
  pages/thank-you/index.astro               # no-JS fallback confirmation page
  lib/contact/
    schema.ts        # zod schema + parse/normalize of the submission
    turnstile.ts     # verifyTurnstile(token, secret, ip) -> boolean
    ses.ts           # sendEmail(submission, env) via SES v2 HTTPS + aws4fetch (SigV4)
    twilio.ts        # sendSms(submission, env) -> one message per recipient number
    sheet.ts         # appendToSheet(submission, env) -> POST to Apps Script webhook (the storage sink)
    sinks.ts         # dispatch(submission, env): runs email+sms+sheet independently, collects per-sink results
    format.ts        # renders the email body + SMS text from a submission (pure)
astro.config.mjs                            # add cloudflare adapter, output: 'hybrid'
```

### Request flow

1. **Client** submits `ContactForm`. With JS: `fetch('/api/contact', {method:'POST', body: FormData})`, then shows inline success/error. Without JS: native form POST; on success the Worker 303-redirects to `/thank-you/`.
2. **Worker (`/api/contact`)**:
   a. Parse form body → `schema.ts` validates (required: email, message; format checks). Reject honeypot-filled submissions silently as success.
   b. `turnstile.ts` verifies the Turnstile token against Cloudflare siteverify. Fail → 400 with an error the form shows.
   c. `sinks.dispatch()` runs the three sinks concurrently, each wrapped so its failure is captured, not thrown:
      - `ses.sendEmail` — SES v2 `SendEmail` over HTTPS, signed with `aws4fetch`. `ToAddresses` = first of the recipient list; `CcAddresses` = the rest.
      - `twilio.sendSms` — one Twilio Messages API POST per number in the SMS recipient list.
      - `sheet.appendToSheet` — POST the row JSON to the Apps Script webhook.
   d. Respond: JSON `{ok:true}` (JS path) or 303 → `/thank-you/` (no-JS). If **all** sinks fail, return 502 with a "couldn't send — call us" message that includes the phone number; if at least one delivery sink (email/sms) succeeds, treat as success and log the partial failure.

### Why these choices

- **`aws4fetch` for SES**, not the AWS Node SDK: the SDK is heavy and assumes Node APIs; Workers run a fetch/Web-Crypto runtime. `aws4fetch` is a tiny SigV4 fetch signer that works on Workers and lets us call the SES v2 HTTPS endpoint directly — this *is* SES, the same destination Fluent SMTP used.
- **Apps Script webhook for the Sheet**, not the Sheets API + service account: a deployed Apps Script web app appends rows on a simple authenticated POST (shared-secret in the payload/URL), avoiding JWT/service-account key handling inside the Worker. One secret (the script URL). The `sheet.ts` sink hides this so swapping to **Nexus** is a single-file change.
- **Sink interface:** every sink is `(submission, env) => Promise<{name, ok, error?}>`. `dispatch` runs them with `Promise.allSettled`. Adding Nexus = add a sink to the list.

## Configuration (Cloudflare env vars / secrets — provided at deploy)

- SES: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SES_FROM` (verified sender), `CONTACT_EMAIL_TO` (comma-separated; first = To, rest = CC).
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (Twilio number), `CONTACT_SMS_TO` (comma-separated numbers).
- Turnstile: `PUBLIC_TURNSTILE_SITE_KEY` (build-time public), `TURNSTILE_SECRET`.
- Storage: `SHEET_WEBHOOK_URL`, `SHEET_WEBHOOK_SECRET`.
- `CONTACT_DRY_RUN` (truthy): sinks log their payloads instead of sending — for safe local/dev testing.

Local dev uses `.dev.vars` (gitignored) with `CONTACT_DRY_RUN=1` by default. Real keys never touch the repo.

## Form fields & validation

| Field | Required | Validation |
|---|---|---|
| First name | no | trimmed string, ≤80 |
| Last name | no | trimmed string, ≤80 |
| Phone | no | trimmed; digits/() +- allowed; ≤32 |
| Email | **yes** | valid email; ≤160 |
| Message | **yes** | trimmed; 1–4000 chars |
| `bsl_hp` (honeypot) | n/a | must be empty; if filled → respond success, send nothing |
| Turnstile token | **yes** | verified server-side |

Client adds HTML `required` + types for UX; the server is the source of truth.

## Error handling

- Validation/Turnstile failure → 400; the form shows field/summary errors and re-renders entered values (no-JS path) or inline messages (JS path).
- Sink failures are isolated via `Promise.allSettled`; logged with the sink name. Success is returned if any of email/SMS delivered. The Sheet failing alone never blocks success (but is logged loudly).
- Total delivery failure (email AND sms both fail) → 502 with a message telling the visitor to call `352-706-5295`.
- No secrets or PII in client-visible error messages.

## Testing

- `schema.test.ts` — valid/invalid submissions, honeypot, length bounds, normalization.
- `format.test.ts` — email body + SMS text rendered correctly from a submission.
- `ses.test.ts`, `twilio.test.ts`, `sheet.test.ts` — payload/URL/headers built correctly; `fetch` mocked; multi-recipient handling (To+CC, N SMS sends); `CONTACT_DRY_RUN` skips network.
- `turnstile.test.ts` — pass/fail against a mocked siteverify.
- `sinks.test.ts` — fan-out runs all sinks; one throwing doesn't stop others; result aggregation + success rule (any email/sms ok = success).
- `contact.endpoint.test.ts` — POST handler with a mocked env: happy path, validation error, turnstile fail, partial sink failure. No live network.
- Existing homepage tests updated to assert the ContactForm section renders (e.g. the form + Email/Message fields).

## Success criteria

1. Homepage shows a styled contact form (First, Last, Phone, Email*, Message* + Turnstile) above the footer.
2. A valid submission triggers: SES email to all configured recipients (To+CC), a Twilio SMS to every configured number, and a new Google Sheet row.
3. Each sink is failure-isolated; a single sink failure neither blocks the others nor the user's success state.
4. Works with JS (inline result) and without JS (POST → `/thank-you/`).
5. Spam: honeypot + Turnstile reject bots; no false success leaks data.
6. Recipients (email + SMS) are changed via env vars without code edits.
7. Storage sink is swappable to Nexus by editing one file; the form/email/SMS are untouched.
8. `CONTACT_DRY_RUN` lets the whole flow run locally without sending. Vitest suite green; build (hybrid + cloudflare adapter) succeeds.

## Open items (provided at deploy, not blockers to building)

- Verified SES sender identity + the destination inbox(es).
- Twilio number + the owner/staff cell number(s).
- Turnstile site/secret keys.
- The Google Sheet + its Apps Script web-app URL/secret.
- Exact notification wording (email subject/body, SMS text) — sensible defaults built; easy to tweak.

## Future

- Replace/augment the Sheet sink with **Nexus** for submission history.
- Optional later: auto-reply email to the submitter; file uploads (R2); `/contact-us/` page using the same component; an entries view.
