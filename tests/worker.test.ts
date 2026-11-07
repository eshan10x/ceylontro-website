/**
 * The /api Worker: checkout and Clover's webhook, with Clover mocked. Run with `npm test`.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ORDERING } from '../src/ordering/config.ts';
import worker from '../worker/index.ts';
import { cleanPhone, cloverCheckoutBody } from '../worker/checkout.ts';
import { verifySignature } from '../worker/webhook.ts';
import { resetPosCache } from '../worker/pos-order.ts';
import type { Env } from '../worker/env.ts';


// Opening-hours rules are tested as they will run live, whatever the test-mode switch says.
(ORDERING as { enforceHours: boolean }).enforceHours = true;

type Payment = typeof ORDERING.payment;
/** Runs one test in a payment mode, then puts the configured mode back. */
function inMode(t: { after(fn: () => void): void }, mode: Payment): void {
  const before = ORDERING.payment;
  (ORDERING as { payment: Payment }).payment = mode;
  t.after(() => ((ORDERING as { payment: Payment }).payment = before));
}

const ORIGIN = 'https://preview.ceylontrokitchen.com';
// 18:22 in Toronto on a Thursday: open, ASAP ready 18:42.
const OPEN_NOW = new Date('2026-11-05T23:22:00Z');

function memoryStore() {
  const data = new Map<string, string>();
  return { data, get: async (k: string) => data.get(k) ?? null, put: async (k: string, v: string) => void data.set(k, v) };
}

function env(overrides: { [K in keyof Env]?: Env[K] | undefined } = {}): Env & { ORDERS: ReturnType<typeof memoryStore> } {
  return {
    ASSETS: { fetch: async () => new Response('page') },
    CLOVER_PRIVATE_TOKEN: 'test-token',
    CLOVER_API_TOKEN: 'api-token',
    CLOVER_MERCHANT_ID: 'MERCHANT1',
    CLOVER_WEBHOOK_SECRET: 'whsec',
    ORDERS: memoryStore(),
    ...overrides,
  } as Env & { ORDERS: ReturnType<typeof memoryStore> };
}

const goodBody = {
  lines: [
    { itemId: 'wings', qty: 1, choices: { 'choice-choose-your-flavour': 'honey-garlic' }, extras: [] },
    { itemId: 'fried-rice', qty: 2, choices: {}, extras: ['extra-add:chicken'], note: 'extra spicy' },
  ],
  expectedSubtotalCents: 1699 + 2 * 1799,
  customer: { name: 'Sam Perera', phone: '(416) 555-0199', email: 'sam@example.com' },
  pickup: { type: 'asap' },
  note: 'Peanut allergy',
};

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { origin: ORIGIN, 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('pages are served from static assets; unknown /api paths are 404', async () => {
  const res = await worker.fetch(new Request(`${ORIGIN}/menu`), env());
  assert.equal(await res.text(), 'page');
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/nope`), env())).status, 404);
  assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/checkout`), env())).status, 405);
});

test('online payment: checkout creates a Clover session from menu prices', async (t) => {
  inMode(t, 'online');
  t.mock.timers.enable({ apis: ['Date'], now: OPEN_NOW });
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchMock = mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Response.json({ href: 'https://checkout.clover.com/abc', checkoutSessionId: 'sess-1', expirationTime: 1 });
  });
  t.after(() => fetchMock.mock.restore());

  const e = env();
  const res = await worker.fetch(post('/api/checkout', goodBody), e);
  assert.equal(res.status, 200, await res.clone().text());
  const data = (await res.json()) as { href: string; ref: string; order: { totalCents: number } };
  assert.equal(data.href, 'https://checkout.clover.com/abc');
  assert.match(data.ref, /^CK-[2-9A-Z]{4}$/);
  assert.equal(data.order.totalCents, 5297 + 689);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, 'https://api.clover.com/invoicingcheckoutservice/v1/checkouts');
  const headers = calls[0]?.init.headers as Record<string, string>;
  assert.equal(headers['authorization'], 'Bearer test-token');
  assert.equal(headers['X-Clover-Merchant-Id'], 'MERCHANT1');
  const sent = JSON.parse(String(calls[0]?.init.body));
  assert.deepEqual(sent.shoppingCart.lineItems[1].price, 1799);
  assert.deepEqual(sent.shoppingCart.lineItems[1].unitQty, 2);
  assert.deepEqual(sent.shoppingCart.lineItems[0].taxRates, [{ name: 'HST', rate: 1300000 }]);
  assert.match(sent.shoppingCart.lineItems[0].note, /CK-.... · Pickup ASAP, about 6:42 p\.m\. · Note: Peanut allergy/);
  assert.match(sent.shoppingCart.lineItems[1].note, /Chicken \(\+\$2\) · “extra spicy”/);
  assert.equal(sent.customer.phoneNumber, '4165550199');
  assert.equal(sent.redirectUrls.success, `${ORIGIN}/order-confirmed`);
  assert.equal(sent.tips, undefined);

  const stored = JSON.parse(e.ORDERS.data.get('order:sess-1') ?? '{}');
  assert.equal(stored.status, 'awaiting_payment');
  assert.equal(stored.pickup.time, '18:42');
});

test('checkout refuses tampered totals, closed hours, bad details and other sites', async (t) => {
  inMode(t, 'online');
  const fetchMock = mock.method(globalThis, 'fetch', async () => {
    throw new Error('Clover must not be called');
  });
  t.after(() => fetchMock.mock.restore());
  t.mock.timers.enable({ apis: ['Date'], now: OPEN_NOW });

  const tampered = await worker.fetch(post('/api/checkout', { ...goodBody, expectedSubtotalCents: 100 }), env());
  assert.equal(tampered.status, 409);

  const badPhone = await worker.fetch(
    post('/api/checkout', { ...goodBody, customer: { ...goodBody.customer, phone: '555' } }),
    env(),
  );
  assert.equal(badPhone.status, 422);
  assert.deepEqual(((await badPhone.json()) as { fields: string[] }).fields, ['phone']);

  const badSlot = await worker.fetch(post('/api/checkout', { ...goodBody, pickup: { type: 'scheduled', time: '18:30' } }), env());
  assert.equal(badSlot.status, 422);

  const foreign = await worker.fetch(post('/api/checkout', goodBody, { origin: 'https://evil.example' }), env());
  assert.equal(foreign.status, 403);

  const unconfigured = await worker.fetch(post('/api/checkout', goodBody), env({ CLOVER_PRIVATE_TOKEN: undefined }));
  assert.equal(unconfigured.status, 503);

  t.mock.timers.setTime(new Date('2026-11-06T04:30:00Z').getTime()); // 23:30 in Toronto
  const closed = await worker.fetch(post('/api/checkout', goodBody), env());
  assert.equal(closed.status, 403);
  assert.equal(((await closed.json()) as { error: string }).error, 'closed');
});

test('phone numbers are normalised to 10 digits', () => {
  assert.equal(cleanPhone('+1 (416) 783-8872'), '4167838872');
  assert.equal(cleanPhone('416 78'), null);
  assert.equal(cleanPhone('0167838872'), null);
});

test('a single-word name still gives Clover a first name', () => {
  const body = cloverCheckoutBody(
    {
      ref: 'CK-AAAA',
      createdAt: '',
      customer: { name: 'Sam', phone: '4165550199', email: 's@example.com' },
      pickup: { type: 'asap', time: '18:42', label: 'ASAP', date: '2026-11-05' },
      kitchenNote: '',
      order: { lines: [], itemCount: 0, subtotalCents: 0, taxCents: 0, totalCents: 0 },
    },
    ORIGIN,
  );
  assert.equal(body.customer.firstName, 'Sam');
  assert.equal(body.customer.lastName, undefined);
});

async function sign(secret: string, t: number, body: string, encoding: 'hex' | 'base64' = 'hex') {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)));
  const v1 =
    encoding === 'hex'
      ? Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      : btoa(String.fromCharCode(...bytes));
  return `t=${t},v1=${v1}`;
}

test('webhook signatures: valid hex or base64 pass; wrong, old or missing fail', async () => {
  const now = new Date('2026-11-05T23:30:00Z');
  const t = Math.floor(now.getTime() / 1000);
  const body = '{"Type":"PAYMENT"}';
  assert.equal(await verifySignature(await sign('whsec', t, body), body, 'whsec', now), true);
  assert.equal(await verifySignature(await sign('whsec', t, body, 'base64'), body, 'whsec', now), true);
  assert.equal(await verifySignature(await sign('other', t, body), body, 'whsec', now), false);
  assert.equal(await verifySignature(await sign('whsec', t, body), `${body} `, 'whsec', now), false);
  assert.equal(await verifySignature(await sign('whsec', t - 3600, body), body, 'whsec', now), false);
  assert.equal(await verifySignature(null, body, 'whsec', now), false);
});

test('an approved payment marks the stored order paid', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: OPEN_NOW });
  const e = env();
  e.ORDERS.data.set('order:sess-9', JSON.stringify({ ref: 'CK-TEST', status: 'awaiting_payment' }));
  const body = JSON.stringify({ Type: 'PAYMENT', Status: 'APPROVED', Data: 'sess-9', Id: 'pay-1' });
  const signature = await sign('whsec', Math.floor(OPEN_NOW.getTime() / 1000), body);

  const res = await worker.fetch(post('/api/clover-webhook', body, { 'clover-signature': signature }), e);
  assert.equal(res.status, 200);
  assert.equal(JSON.parse(e.ORDERS.data.get('order:sess-9') ?? '{}').status, 'paid');

  const forged = await worker.fetch(post('/api/clover-webhook', body, { 'clover-signature': 't=1,v1=abc' }), e);
  assert.equal(forged.status, 401);
});

test('status shows which settings are present, never their values', async () => {
  const res = await worker.fetch(new Request(`${ORIGIN}/api/status`), env());
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.doesNotMatch(body, /test-token|api-token|MERCHANT1|whsec/);
  assert.deepEqual(JSON.parse(body), {
    ordering: true,
    cloverApi: null,
    merchantId: true,
    payment: ORDERING.payment,
    apiToken: true,
    privateToken: true,
    webhookSecret: true,
    orderStore: true,
  });
});

test('pay at pickup: the order goes onto the Clover POS with items, tax and total, then prints', async (t) => {
  inMode(t, 'at_pickup');
  resetPosCache();
  t.mock.timers.enable({ apis: ['Date'], now: OPEN_NOW });
  const calls: { method: string; url: string; body: any; auth: string }[] = [];
  const fetchMock = mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    const method = init.method ?? 'GET';
    calls.push({ method, url, body: init.body ? JSON.parse(String(init.body)) : undefined, auth: (init.headers as Record<string, string>)['authorization'] ?? '' });
    if (url.endsWith('/tax_rates')) {
      return Response.json({ elements: [{ id: 'GST5', rate: 500000 }, { id: 'HST13', name: 'HST', rate: 1300000, isDefault: true }] });
    }
    if (url.endsWith('/orders') && method === 'POST') return Response.json({ id: 'ORDER1' });
    return Response.json({});
  });
  t.after(() => fetchMock.mock.restore());

  const e = env();
  const res = await worker.fetch(post('/api/checkout', goodBody), e);
  assert.equal(res.status, 200, await res.clone().text());
  const data = (await res.json()) as { ref: string; payAt: string; href?: string; order: { totalCents: number } };
  assert.equal(data.payAt, 'pickup');
  assert.equal(data.href, undefined);
  assert.equal(data.order.totalCents, 5297 + 689);

  const base = 'https://api.clover.com/v3/merchants/MERCHANT1';
  assert.deepEqual(
    calls.map((c) => `${c.method} ${c.url.replace(base, '')}`),
    ['GET /tax_rates', 'POST /orders', 'POST /orders/ORDER1/line_items', 'POST /orders/ORDER1/line_items', 'POST /orders/ORDER1/line_items', 'POST /print_event'],
  );
  assert.ok(calls.every((c) => c.auth === 'Bearer api-token'));

  const order = calls[1]!.body;
  assert.equal(order.state, 'open');
  assert.match(order.title, /^Web CK-.... · Sam Perera$/);
  assert.equal(order.total, 5986);
  assert.match(order.note, /PAY AT PICKUP \$59\.86/);
  assert.match(order.note, /Pickup: ASAP, about 6:42 p\.m\./);
  assert.match(order.note, /Sam Perera · \(416\) 555-0199 · sam@example\.com/);
  assert.match(order.note, /Note: Peanut allergy/);

  const items = calls.slice(2, 5).map((c) => c.body) as { name: string; price: number; note?: string; taxRates: unknown[] }[];
  const hst = { id: 'HST13', name: 'HST', rate: 1300000 };
  assert.deepEqual(items[0], { name: 'Wings (1 lb)', price: 1699, note: 'Flavour: Honey garlic', taxRates: [hst] });
  assert.deepEqual(items[1], items[2]);
  assert.equal(items[1]!.price, 1799);
  assert.equal(items[1]!.note, 'Chicken (+$2) · “extra spicy”');

  assert.deepEqual(calls[5]!.body, { orderRef: { id: 'ORDER1' } });
  assert.equal(JSON.parse(e.ORDERS.data.get('order:ORDER1') ?? '{}').status, 'pay_at_pickup');
});

test('pay at pickup: a failed line-item step removes the empty order; a print failure keeps it', async (t) => {
  inMode(t, 'at_pickup');
  resetPosCache();
  t.mock.timers.enable({ apis: ['Date'], now: OPEN_NOW });
  let failItems = true;
  const seen: string[] = [];
  const fetchMock = mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    const method = init.method ?? 'GET';
    seen.push(`${method} ${url.split('/MERCHANT1')[1]}`);
    if (url.endsWith('/tax_rates')) return Response.json({ elements: [{ id: 'HST13', rate: 1300000 }] });
    if (url.endsWith('/orders') && method === 'POST') return Response.json({ id: 'ORDER2' });
    if (url.endsWith('/line_items') && failItems) return new Response('nope', { status: 500 });
    if (url.endsWith('/print_event')) return new Response('offline', { status: 503 });
    return Response.json({});
  });
  t.after(() => fetchMock.mock.restore());

  const failed = await worker.fetch(post('/api/checkout', goodBody), env());
  assert.equal(failed.status, 502);
  assert.equal(((await failed.json()) as { error: string }).error, 'order_unavailable_items_500');
  assert.ok(seen.includes('DELETE /orders/ORDER2'));

  failItems = false;
  const ok = await worker.fetch(post('/api/checkout', goodBody), env());
  assert.equal(ok.status, 200, 'still placed when the printer is offline');
});

test('pay at pickup: needs the API token; bots filling the hidden field get no order', async (t) => {
  inMode(t, 'at_pickup');
  t.mock.timers.enable({ apis: ['Date'], now: OPEN_NOW });
  const fetchMock = mock.method(globalThis, 'fetch', async () => {
    throw new Error('Clover must not be called');
  });
  t.after(() => fetchMock.mock.restore());
  assert.equal((await worker.fetch(post('/api/checkout', goodBody), env({ CLOVER_API_TOKEN: undefined }))).status, 503);
  assert.equal((await worker.fetch(post('/api/checkout', { ...goodBody, website: 'spam.example' }), env())).status, 503);
});

test('pay at pickup: a configured tax rate skips the lookup; refusals name the step', async (t) => {
  inMode(t, 'at_pickup');
  resetPosCache();
  t.mock.timers.enable({ apis: ['Date'], now: OPEN_NOW });
  const seen: string[] = [];
  const fetchMock = mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    seen.push(`${init.method ?? 'GET'} ${url.split('/MERCHANT1')[1]}`);
    return new Response('{"message":"401 Unauthorized"}', { status: 401 });
  });
  t.after(() => fetchMock.mock.restore());

  const configured = await worker.fetch(post('/api/checkout', goodBody), env({ CLOVER_TAX_RATE_ID: 'HST13' }));
  assert.equal(((await configured.json()) as { error: string }).error, 'order_unavailable_order_401');
  assert.deepEqual(seen, ['POST /orders']);

  const lookedUp = await worker.fetch(post('/api/checkout', goodBody), env());
  assert.equal(((await lookedUp.json()) as { error: string }).error, 'order_unavailable_tax_401');
});
