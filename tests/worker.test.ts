/**
 * The /api Worker: checkout and Clover's webhook, with Clover mocked. Run with `npm test`.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ORDERING } from '../src/ordering/config.ts';
import worker from '../worker/index.ts';
import { cleanPhone, cloverCheckoutBody } from '../worker/checkout.ts';
import { verifySignature } from '../worker/webhook.ts';
import type { Env } from '../worker/env.ts';


// Opening-hours rules are tested as they will run live, whatever the test-mode switch says.
(ORDERING as { enforceHours: boolean }).enforceHours = true;

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

test('checkout creates a Clover session from menu prices', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: OPEN_NOW });
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchMock = mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Response.json({ href: 'https://sandbox.dev.clover.com/checkout/abc', checkoutSessionId: 'sess-1', expirationTime: 1 });
  });
  t.after(() => fetchMock.mock.restore());

  const e = env();
  const res = await worker.fetch(post('/api/checkout', goodBody), e);
  assert.equal(res.status, 200, await res.clone().text());
  const data = (await res.json()) as { href: string; ref: string; order: { totalCents: number } };
  assert.equal(data.href, 'https://sandbox.dev.clover.com/checkout/abc');
  assert.match(data.ref, /^CK-[2-9A-Z]{4}$/);
  assert.equal(data.order.totalCents, 5297 + 689);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, 'https://apisandbox.dev.clover.com/invoicingcheckoutservice/v1/checkouts');
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
