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
