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
  if (!delivered) return { status: 502, body: { ok: false, error: 'Sorry - we couldn\'t send your message. Please call us at 352-706-5295.' } };
  return { status: 200, body: { ok: true } };
}
