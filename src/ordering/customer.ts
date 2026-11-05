/**
 * The guest's pickup details: name, mobile number and email. Shared by the checkout form and the
 * server, so both accept exactly the same input.
 */

export interface Customer {
  name: string;
  /** 10 digits, e.g. "4167838872". */
  phone: string;
  email: string;
}

export type CustomerField = 'name' | 'phone' | 'email';

/** Normalises a North American phone number to 10 digits, or null. */
export function cleanPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(digits) ? digits : null;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function checkCustomer(raw: unknown): { ok: true; customer: Customer } | { ok: false; fields: CustomerField[] } {
  const c = (raw ?? {}) as Record<string, unknown>;
  const name = typeof c['name'] === 'string' ? c['name'].replace(/\s+/g, ' ').trim() : '';
  const phone = cleanPhone(c['phone']);
  const email = typeof c['email'] === 'string' ? c['email'].trim() : '';
  const fields: CustomerField[] = [];
  if (name.length < 1 || name.length > 60) fields.push('name');
  if (!phone) fields.push('phone');
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) fields.push('email');
  return fields.length || !phone ? { ok: false, fields } : { ok: true, customer: { name, phone, email } };
}

export const FIELD_ERRORS: Record<CustomerField, string> = {
  name: 'Enter your name so we know whose order it is.',
  phone: 'Enter a 10-digit phone number so we can reach you about your order.',
  email: 'Enter an email address for your receipt, like name@example.com.',
};
