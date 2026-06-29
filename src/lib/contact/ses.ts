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
