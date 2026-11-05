/**
 * POST /api/clover-webhook — Clover tells us a Hosted Checkout payment was approved or declined.
 *
 * The request is trusted only if its `Clover-Signature` header (t=<unix seconds>,v1=<signature>)
 * matches HMAC-SHA256("<t>.<raw body>") with the webhook signing secret, and t is recent.
 * Clover's docs don't state the signature's encoding, so hex and base64 are both accepted.
 *
 * Clover docs: https://docs.clover.com/docs/ecomm-hosted-checkout-webhook
 *
 * Still to do once O1 shows how orders reach the kitchen: the kitchen hand-off (Clover Orders API
 * and the order printer, if a Hosted Checkout payment doesn't create a POS order) and the
 * order-alert email.
 */
import { json, type StoredOrder } from './checkout.ts';
import type { Env } from './env.ts';

const TOLERANCE_SECONDS = 5 * 60;

export function parseSignature(header: string | null): { t: string; v1: string } | null {
  if (!header) return null;
  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [key = '', ...value] = part.trim().split('=');
      return [key, value.join('=')];
    }),
  );
  return parts['t'] && parts['v1'] ? { t: parts['t'], v1: parts['v1'] } : null;
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

const toHex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));

/** Compares in time that doesn't depend on where the strings differ. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifySignature(
  header: string | null,
  body: string,
  secret: string,
  now: Date = new Date(),
): Promise<boolean> {
  const signature = parseSignature(header);
  if (!signature || !/^\d+$/.test(signature.t)) return false;
  if (Math.abs(now.getTime() / 1000 - Number(signature.t)) > TOLERANCE_SECONDS) return false;
  const digest = await hmac(secret, `${signature.t}.${body}`);
  return safeEqual(signature.v1, toHex(digest)) || safeEqual(signature.v1, toBase64(digest));
}

/** Reads a field whatever its capitalisation ("Status", "status"). */
const field = (event: Record<string, unknown>, name: string): unknown =>
  event[name] ?? event[name.toLowerCase()] ?? event[name.charAt(0).toLowerCase() + name.slice(1)];

export async function handleWebhook(request: Request, env: Env, now: Date = new Date()): Promise<Response> {
  if (!env.CLOVER_WEBHOOK_SECRET) {
    console.error('webhook: signing secret is not configured');
    return json({ error: 'unavailable' }, 503);
  }
  const body = await request.text();
  if (!(await verifySignature(request.headers.get('clover-signature'), body, env.CLOVER_WEBHOOK_SECRET, now))) {
    return json({ error: 'invalid_signature' }, 401);
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const type = String(field(event, 'Type') ?? '');
  const status = String(field(event, 'Status') ?? '');
  const sessionId = String(field(event, 'Data') ?? '');
  console.log(`webhook: ${type} ${status} session ${sessionId}`);
  if (type !== 'PAYMENT' || !sessionId) return json({ received: true });

  const raw = await env.ORDERS?.get(`order:${sessionId}`);
  if (!raw) {
    console.warn(`webhook: no stored order for session ${sessionId}`);
    return json({ received: true });
  }
  const order = JSON.parse(raw) as StoredOrder;
  order.status = status === 'APPROVED' ? 'paid' : 'declined';
  await env.ORDERS?.put(`order:${sessionId}`, JSON.stringify(order), { expirationTtl: 60 * 60 * 24 * 30 });
  console.log(`webhook: ${order.ref} is ${order.status}`);
  return json({ received: true });
}
