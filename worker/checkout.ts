/**
 * POST /api/checkout — places the guest's order.
 *
 * Pay at pickup (ORDERING.payment = 'at_pickup', the current mode): the order goes onto the Clover
 * POS as an Open order and prints in the kitchen (`pos-order.ts`); the guest pays on collection.
 * Online (later): the order becomes a Clover Hosted Checkout session, as below.
 *
 * 1. Checks the request came from this site and is a reasonable size.
 * 2. Checks ordering is open and the pickup time is one we offer (Toronto time).
 * 3. Rebuilds every line and price from the website's menu data; browser prices are ignored.
 *    If the guest's total differs (the menu changed), answers 409 with the fresh order.
 * 4. Asks Clover for a checkout page and returns its address. Card details are only ever
 *    entered on Clover's page.
 *
 * Clover docs: https://docs.clover.com/docs/creating-a-hosted-checkout-session
 */
import { ORDERING } from '../src/ordering/config.ts';
import { priceOrder, formatCents, type PricedOrder } from '../src/ordering/pricing.ts';
import { checkPickup, toClock, zonedNow } from '../src/ordering/hours.ts';
import { formatTime } from '../src/lib/format.ts';
import { checkCustomer, type Customer } from '../src/ordering/customer.ts';
import { createPosOrder, CloverError } from './pos-order.ts';
import type { Env } from './env.ts';

export { cleanPhone } from '../src/ordering/customer.ts';

const MAX_BODY_BYTES = 20_000;
const CLOVER_API = 'https://api.clover.com';

/** What is kept for the kitchen hand-off and the webhook, keyed by Clover's session id. */
export interface StoredOrder {
  ref: string;
  sessionId: string;
  createdAt: string;
  status: 'awaiting_payment' | 'paid' | 'declined' | 'pay_at_pickup';
  customer: Customer;
  pickup: { type: 'asap' | 'scheduled'; time: string; label: string; date: string };
  kitchenNote: string;
  order: PricedOrder;
}

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Short, readable order reference for the guest and the kitchen, e.g. "CK-7K2Q". */
export function orderRef(): string {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `CK-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
}

/** Clover's tax rate format: 10% is 1000000. */
const cloverRate = (percent: number): number => Math.round(percent * 100_000);

/** The Clover request body. Pickup details ride on the first line's note so they reach Clover. */
export function cloverCheckoutBody(stored: Omit<StoredOrder, 'sessionId' | 'status'>, origin: string) {
  const [first = '', ...rest] = stored.customer.name.split(' ');
  const header = `${stored.ref} · Pickup ${stored.pickup.label}${stored.kitchenNote ? ` · Note: ${stored.kitchenNote}` : ''}`;
  return {
    customer: {
      firstName: first,
      lastName: rest.join(' ') || undefined,
      email: stored.customer.email,
      phoneNumber: stored.customer.phone,
    },
    shoppingCart: {
      lineItems: stored.order.lines.map((line, index) => ({
        name: line.name,
        price: line.unitCents,
        unitQty: line.qty,
        note: [index === 0 ? header : '', ...line.details, line.note ? `“${line.note}”` : '']
          .filter(Boolean)
          .join(' · ')
          .slice(0, 500),
        taxRates: [{ name: ORDERING.tax.name, rate: cloverRate(ORDERING.tax.percent) }],
      })),
    },
    redirectUrls: {
      success: `${origin}/order-confirmed`,
      failure: `${origin}/checkout?payment=failed`,
    },
    ...(ORDERING.tips ? { tips: { enabled: true } } : {}),
  };
}

export async function handleCheckout(request: Request, env: Env, now: Date = new Date()): Promise<Response> {
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') !== origin) return json({ error: 'forbidden' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'bad_request' }, 415);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  if (!ORDERING.enabled) return json({ error: 'closed' }, 403);
  const pickup = checkPickup(body['pickup'], now);
  if (!pickup.ok) return json({ error: pickup.error }, pickup.error === 'closed' ? 403 : 422);

  const customer = checkCustomer(body['customer']);
  if (!customer.ok) return json({ error: 'invalid_customer', fields: customer.fields }, 422);

  const priced = priceOrder(body['lines']);
  if (!priced.ok) return json({ error: 'invalid_order', messages: priced.errors }, 422);
  if (body['expectedSubtotalCents'] !== priced.order.subtotalCents) {
    return json({ error: 'prices_changed', order: priced.order }, 409);
  }

  // Honeypot: a field people never see. Bots that fill it get a polite answer and no order.
  if (typeof body['website'] === 'string' && body['website'] !== '') return json({ error: 'unavailable' }, 503);

  const payAtPickup = ORDERING.payment === 'at_pickup';
  if (!env.CLOVER_MERCHANT_ID || !(payAtPickup ? env.CLOVER_API_TOKEN : env.CLOVER_PRIVATE_TOKEN)) {
    console.error(`checkout: Clover credentials are not configured (${payAtPickup ? 'CLOVER_API_TOKEN' : 'CLOVER_PRIVATE_TOKEN'})`);
    return json({ error: 'unavailable' }, 503);
  }

  const kitchenNote =
    typeof body['note'] === 'string' ? body['note'].replace(/\s+/g, ' ').trim().slice(0, ORDERING.notes.maxLength) : '';
  const clock = toClock(pickup.minutes);
  const label = pickup.type === 'asap' ? `ASAP, about ${formatTime(clock)}` : formatTime(clock);
  const draft: Omit<StoredOrder, 'sessionId' | 'status'> = {
    ref: orderRef(),
    createdAt: now.toISOString(),
    customer: customer.customer,
    pickup: { type: pickup.type, time: clock, label, date: zonedNow(now).date },
    kitchenNote,
    order: priced.order,
  };

  if (payAtPickup) {
    try {
      const { orderId, printed } = await createPosOrder(env, draft);
      const stored: StoredOrder = { ...draft, sessionId: orderId, status: 'pay_at_pickup' };
      await env.ORDERS?.put(`order:${orderId}`, JSON.stringify(stored), { expirationTtl: 60 * 60 * 24 * 30 });
      console.log(`checkout: ${draft.ref} on POS as ${orderId}${printed ? '' : ' (NOT printed)'} ${formatCents(draft.order.totalCents)} pickup ${label}`);
      return json({ ref: draft.ref, payAt: 'pickup', pickup: draft.pickup, order: draft.order });
    } catch (error) {
      console.error(`checkout: POS order failed for ${draft.ref}: ${String(error)}`);
      const status = error instanceof CloverError ? error.status : 0;
      return json({ error: `order_unavailable_${status}` }, 502);
    }
  }

  let session: { href?: string; checkoutSessionId?: string; expirationTime?: number };
  try {
    const response = await fetch(`${env.CLOVER_API_BASE ?? CLOVER_API}/invoicingcheckoutservice/v1/checkouts`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${env.CLOVER_PRIVATE_TOKEN}`,
        'X-Clover-Merchant-Id': env.CLOVER_MERCHANT_ID,
      },
      body: JSON.stringify(cloverCheckoutBody(draft, origin)),
    });
    if (!response.ok) {
      console.error(`checkout: Clover answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
      // The status (e.g. 401 = token not accepted) helps diagnose; Clover's message stays in the logs.
      return json({ error: `payment_unavailable_${response.status}` }, 502);
    }
    session = (await response.json()) as typeof session;
  } catch (error) {
    console.error('checkout: Clover request failed', error);
    return json({ error: 'payment_unavailable' }, 502);
  }

  if (!session.href || !session.checkoutSessionId || !session.href.startsWith('https://')) {
    console.error('checkout: unexpected Clover response');
    return json({ error: 'payment_unavailable' }, 502);
  }

  const stored: StoredOrder = { ...draft, sessionId: session.checkoutSessionId, status: 'awaiting_payment' };
  await env.ORDERS?.put(`order:${stored.sessionId}`, JSON.stringify(stored), { expirationTtl: 60 * 60 * 24 * 30 });
  console.log(`checkout: ${stored.ref} ${formatCents(stored.order.subtotalCents)} pickup ${label}`);

  return json({
    href: session.href,
    ref: stored.ref,
    expiresAt: session.expirationTime ?? null,
    pickup: stored.pickup,
    order: stored.order,
  });
}
