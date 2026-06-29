# Contact Form – Production Setup

This document walks the site owner through every credential and service needed to make the contact form send emails, SMS alerts, and log submissions to Google Sheets.

---

## 1. Cloudflare Pages Environment Variables

In the Cloudflare dashboard → **Pages → be-secure → Settings → Environment variables**, add the following for the **Production** environment (and optionally Preview):

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user access key for SES |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret for SES |
| `AWS_REGION` | SES region, e.g. `us-east-1` |
| `SES_FROM` | Verified sender address, e.g. `noreply@besecurelocksmith.com` |
| `CONTACT_EMAIL_TO` | Comma-separated recipients — first = To, rest = CC, e.g. `owner@besecurelocksmith.com, office@besecurelocksmith.com` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_FROM` | Your Twilio phone number, e.g. `+13525551234` |
| `CONTACT_SMS_TO` | Comma-separated numbers to receive SMS alerts |
| `TURNSTILE_SECRET` | Cloudflare Turnstile **secret** key |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile **site** key (also in the Astro build env) |
| `SHEET_WEBHOOK_URL` | Google Apps Script Web App deployment URL |
| `SHEET_WEBHOOK_SECRET` | Shared secret for the Apps Script (must match `SECRET` in the script) |
| `CONTACT_DRY_RUN` | Set to `1` to disable all real sends (for testing/staging only) |

For local development: copy `.dev.vars.example` to `.dev.vars` (gitignored), fill in values, then run:

```bash
npm run build
npx wrangler pages dev dist --compatibility-flag nodejs_compat
```

---

## 2. AWS SES — Email Delivery

### Verify the sender domain / address

1. In the AWS Console → **SES → Verified identities**, add `besecurelocksmith.com` (or the `SES_FROM` address).
2. Follow the DNS verification steps Cloudflare will show you for DKIM/DMARC records.
3. Also verify each recipient address in `CONTACT_EMAIL_TO` **if your SES account is still in the Sandbox**. (Request production access to remove this restriction.)

### IAM policy for the API key

Create an IAM user with programmatic access and attach this inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "*"
    }
  ]
}
```

Copy the generated Access Key ID and Secret into the Cloudflare env vars above.

---

## 3. Twilio — SMS Alerts

1. In the [Twilio Console](https://console.twilio.com), find your **Account SID** and **Auth Token** on the dashboard.
2. Under **Phone Numbers → Manage → Active numbers**, note the number to use as `TWILIO_FROM` (must be SMS-capable).
3. Set `CONTACT_SMS_TO` to the mobile number(s) that should receive submission alerts (comma-separated, E.164 format, e.g. `+13525556789`).

---

## 4. Cloudflare Turnstile — Bot Protection

1. In the Cloudflare dashboard → **Turnstile**, click **Add widget**.
2. Enter the site's hostname (e.g. `besecurelocksmith.com`).
3. Copy the **Site Key** → set as `PUBLIC_TURNSTILE_SITE_KEY` (both in Cloudflare Pages env vars and in your `.env` file for `npm run build`).
4. Copy the **Secret Key** → set as `TURNSTILE_SECRET` in Cloudflare Pages env vars.

For local testing without a real token, use Cloudflare's always-pass test credentials:
- Site key: `1x00000000000000000000AA`
- Secret key: `1x0000000000000000000000000000000AA`

---

## 5. Google Apps Script — Submissions Sheet

### Create the Sheet

1. Open Google Sheets and create a new spreadsheet named **Be Secure Locksmith – Contact Submissions**.
2. In row 1 add headers: `Timestamp`, `Name`, `Email`, `Phone`, `Message`.

### Deploy the Web App

1. In the sheet, open **Extensions → Apps Script**.
2. Replace the default `Code.gs` content with the script below.
3. Change `'CHANGE_ME'` to a long random secret (e.g. output of `openssl rand -hex 32`).
4. Click **Deploy → New deployment**, choose **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Copy the deployment URL → set as `SHEET_WEBHOOK_URL` in Cloudflare env vars.
6. Set the same secret you chose in step 3 as `SHEET_WEBHOOK_SECRET`.

### Apps Script Code

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

---

## 6. Local Function Testing

After filling `.dev.vars`:

```bash
npm run build                                                    # static Astro build
npx wrangler pages dev dist --compatibility-flag nodejs_compat   # serves site + function at localhost:8788
```

The unit and integration tests (`npm test`) cover all logic without Wrangler — use `CONTACT_DRY_RUN=1` (default in `.dev.vars.example`) to avoid real sends during development.
