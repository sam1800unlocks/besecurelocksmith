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
