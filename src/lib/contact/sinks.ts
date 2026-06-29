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
