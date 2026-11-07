/**
 * Pay at pickup: puts a website order straight onto the Clover POS as an Open order, then sends
 * it to the kitchen printer. The guest pays the cashier when they collect it.
 *
 * 1. Uses the merchant's 13% HST rate: CLOVER_TAX_RATE_ID (wrangler.jsonc), else looks it up
 *    (GET tax_rates, which needs Inventory read), so the POS charges the same tax.
 * 2. Creates the order: state "open", a title the staff can spot ("Web CK-7K2Q · Sam"), the pickup
 *    details in the order note, and the total including tax.
 * 3. Adds the dishes as line items (one per portion, as the POS does), each with its choices,
 *    extras and special instructions in the line note, and the HST rate.
 * 4. Asks Clover to print it on the order (kitchen) printer. A print failure doesn't undo the order:
 *    it is still on the POS, and the log says so.
 *
 * Needs a merchant API token (not the Ecommerce token) with Orders read and write.
 * Clover docs: https://docs.clover.com/docs/creating-custom-orders ·
 * https://docs.clover.com/docs/printing-orders-rest-api
 */
import { ORDERING } from '../src/ordering/config.ts';
import { formatCents, type PricedOrder } from '../src/ordering/pricing.ts';
import type { Customer } from '../src/ordering/customer.ts';
import type { Env } from './env.ts';

const CLOVER_API = 'https://api.clover.com';

export interface PosOrderInput {
  ref: string;
  customer: Customer;
  pickup: { label: string };
  kitchenNote: string;
  order: PricedOrder;
}

export class CloverError extends Error {
  readonly status: number;
  /** Which step failed: tax, order, items. Shown to staff in the error reference. */
  step = '';
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Runs one step, labelling any Clover error with the step's name. */
async function step<T>(name: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof CloverError) error.step = name;
    throw error;
  }
}

/** "4165550199" → "(416) 555-0199". */
const prettyPhone = (digits: string) => `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;

/** Clover's tax rate format: 13% is 1300000. */
const cloverRate = (percent: number): number => Math.round(percent * 100_000);

function client(env: Env) {
  const base = `${env.CLOVER_API_BASE ?? CLOVER_API}/v3/merchants/${env.CLOVER_MERCHANT_ID}`;
  return async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${env.CLOVER_API_TOKEN}`,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      throw new CloverError(`${method} ${path} → ${response.status}: ${(await response.text()).slice(0, 300)}`, response.status);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  };
}

let cachedTaxRateId: string | null = null;

/** The merchant's tax rate matching ORDERING.tax (13%), preferring the default one. */
async function taxRateId(call: ReturnType<typeof client>, env: Env): Promise<string> {
  if (env.CLOVER_TAX_RATE_ID) return env.CLOVER_TAX_RATE_ID;
  if (cachedTaxRateId) return cachedTaxRateId;
  const { elements = [] } = await call<{ elements?: { id: string; name?: string; rate?: number; isDefault?: boolean }[] }>(
    'GET',
    '/tax_rates',
  );
  const wanted = cloverRate(ORDERING.tax.percent);
  const match = elements.filter((t) => t.rate === wanted).sort((a, b) => Number(b.isDefault) - Number(a.isDefault))[0];
  if (!match) throw new CloverError(`no ${ORDERING.tax.percent}% tax rate in Clover`, 500);
  cachedTaxRateId = match.id;
  return match.id;
}

/** The order note the cashier and kitchen see. */
export function posOrderNote(input: PosOrderInput): string {
  return [
    `WEBSITE ORDER ${input.ref} — PAY AT PICKUP ${formatCents(input.order.totalCents)}`,
    `Pickup: ${input.pickup.label}`,
    `${input.customer.name} · ${prettyPhone(input.customer.phone)} · ${input.customer.email}`,
    input.kitchenNote ? `Note: ${input.kitchenNote}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Line items as Clover's bulk endpoint takes them: one entry per portion. */
export function posLineItems(order: PricedOrder, taxId: string) {
  return order.lines.flatMap((line) => {
    const note = [...line.details, line.note ? `“${line.note}”` : ''].filter(Boolean).join(' · ');
    return Array.from({ length: line.qty }, () => ({
      name: line.name,
      price: line.unitCents,
      ...(note ? { note: note.slice(0, 255) } : {}),
      taxRates: [{ id: taxId }],
    }));
  });
}

/** Creates the Open order on the POS and prints it. Returns Clover's order id. */
export async function createPosOrder(env: Env, input: PosOrderInput): Promise<{ orderId: string; printed: boolean }> {
  const call = client(env);
  const taxId = await step('tax', () => taxRateId(call, env));

  const created = await step('order', () => call<{ id?: string }>('POST', '/orders', {
    state: 'open',
    title: `Web ${input.ref} · ${input.customer.name}`.slice(0, 127),
    note: posOrderNote(input).slice(0, 2000),
    total: input.order.totalCents,
  }));
  if (!created.id) throw new CloverError('order created without an id', 502);

  try {
    await call('POST', `/orders/${created.id}/bulk_line_items`, { items: posLineItems(input.order, taxId) });
  } catch (error) {
    if (error instanceof CloverError) error.step = 'items';
    // Don't leave an empty order on the POS.
    await call('DELETE', `/orders/${created.id}`).catch(() => undefined);
    throw error;
  }

  let printed = true;
  try {
    await call('POST', '/print_event', { orderRef: { id: created.id } });
  } catch (error) {
    printed = false;
    console.warn(`pos-order: ${input.ref} is on the POS but did not print: ${String(error)}`);
  }
  return { orderId: created.id, printed };
}

/** For tests: forget the cached tax rate. */
export const resetPosCache = (): void => void (cachedTaxRateId = null);
