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
