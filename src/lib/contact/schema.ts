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
