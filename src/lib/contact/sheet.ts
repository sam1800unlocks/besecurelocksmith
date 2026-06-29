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
