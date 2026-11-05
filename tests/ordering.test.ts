/**
 * Ordering rules: catalog, prices and hours. Run with `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ORDERING } from '../src/ordering/config.ts';
import { buildCatalog, catalogById, parsePrice } from '../src/ordering/catalog.ts';
import { lineKey, priceOrder, taxOn } from '../src/ordering/pricing.ts';
import { checkPickup, orderingWindow, pickupOptions, zonedNow } from '../src/ordering/hours.ts';

/** A moment in Toronto (EST in November, UTC−5). */

// Opening-hours rules are tested as they will run live, whatever the test-mode switch says.
(ORDERING as { enforceHours: boolean }).enforceHours = true;

const toronto = (date: string, time: string) => new Date(`${date}T${time}:00-05:00`);

test('parses printed prices into cents', () => {
  assert.equal(parsePrice('$13.99'), 1399);
  assert.equal(parsePrice('+$2'), 200);
  assert.equal(parsePrice('$5'), 500);
  assert.equal(parsePrice(null), null);
  assert.equal(parsePrice('Market price'), null);
});

test('every dish on the menu is orderable, with unique ids', () => {
  const items = buildCatalog();
  assert.ok(items.length >= 30, `only ${items.length} dishes`);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  for (const item of items) {
    assert.ok(item.priceCents > 0, item.id);
    for (const group of item.groups) {
      assert.equal(new Set(group.values.map((v) => v.id)).size, group.values.length, `${item.id}/${group.id}`);
    }
  }
});

test('category choices and extras reach their dishes', () => {
  const burger = catalogById().get('ceylontro-classic-beef-burger');
  assert.ok(burger);
  assert.deepEqual(
    burger.groups.map((g) => [g.id, g.kind]),
    [
      ['choice-side', 'choice'],
      ['extra-add', 'extra'],
      ['extra-upgrade', 'extra'],
    ],
  );
  const wings = catalogById().get('wings');
  assert.equal(wings?.groups[0]?.id, 'choice-choose-your-flavour');
});

test('prices a burger with a side, cheese and poutine from menu data', () => {
  const result = priceOrder([
    {
      itemId: 'ceylontro-classic-beef-burger',
      qty: 2,
      choices: { 'choice-side': 'fresh-cut-fries' },
      extras: ['extra-add:cheese-slice', 'extra-upgrade:poutine'],
      note: '  no   onion ',
    },
  ]);
  assert.ok(result.ok, JSON.stringify(result));
  const [line] = result.order.lines;
  assert.equal(line?.unitCents, 1599 + 100 + 200);
  assert.equal(line?.lineCents, 2 * 1899);
  assert.equal(line?.note, 'no onion');
  assert.deepEqual(line?.details, ['Side: Fresh-cut fries', 'Cheese slice (+$1)', 'Poutine (+$2)']);
  assert.equal(result.order.subtotalCents, 3798);
  assert.equal(result.order.taxCents, 494);
  assert.equal(result.order.totalCents, 4292);
});

test('a missing required choice, unknown extra or bad quantity is refused', () => {
  assert.equal(priceOrder([{ itemId: 'wings', qty: 1, choices: {}, extras: [] }]).ok, false);
  assert.equal(
    priceOrder([{ itemId: 'fried-rice', qty: 1, choices: {}, extras: ['extra-add:lobster'] }]).ok,
    false,
  );
  assert.equal(priceOrder([{ itemId: 'fried-rice', qty: 0, choices: {}, extras: [] }]).ok, false);
  assert.equal(priceOrder([{ itemId: 'fried-rice', qty: 1.5, choices: {}, extras: [] }]).ok, false);
  assert.equal(priceOrder([{ itemId: 'not-a-dish', qty: 1, choices: {}, extras: [] }]).ok, false);
  assert.equal(priceOrder([]).ok, false);
  assert.equal(priceOrder('nope').ok, false);
});

test('a price sent by the browser is ignored', () => {
  const result = priceOrder([{ itemId: 'mango-mousse', qty: 1, choices: {}, extras: [], priceCents: 1 }]);
  assert.ok(result.ok);
  assert.equal(result.order.subtotalCents, 799);
});

test('13% tax rounds to the nearest cent', () => {
  assert.equal(taxOn(4997), 650);
  assert.equal(taxOn(1599), 208);
});

test('the same dish with the same choices shares a line', () => {
  const a = { itemId: 'wings', qty: 1, choices: { 'choice-choose-your-flavour': 'honey-garlic' }, extras: [] };
  assert.equal(lineKey(a), lineKey({ ...a, qty: 3 }));
  assert.notEqual(lineKey(a), lineKey({ ...a, note: 'extra crispy' }));
});

test('reads the time in Toronto', () => {
  const now = zonedNow(new Date('2026-11-05T23:30:00Z'));
  assert.deepEqual(now, { weekday: 'thursday', minutes: 18 * 60 + 30, date: '2026-11-05' });
});

test('orders are taken from 11:00 until 22:50', () => {
  assert.equal(orderingWindow(toronto('2026-11-05', '10:59')).open, false);
  assert.equal(orderingWindow(toronto('2026-11-05', '11:00')).open, true);
  assert.equal(orderingWindow(toronto('2026-11-05', '22:50')).open, true);
  assert.equal(orderingWindow(toronto('2026-11-05', '22:51')).open, false);
  const late = orderingWindow(toronto('2026-11-05', '23:30'));
  assert.deepEqual(late.next, { weekday: 'friday', minutes: 11 * 60, isToday: false });
  const early = orderingWindow(toronto('2026-11-05', '09:00'));
  assert.deepEqual(early.next, { weekday: 'thursday', minutes: 11 * 60, isToday: true });
});

test('pickup: ASAP is 20 minutes out; slots every 15 minutes until 23:10', () => {
  const options = pickupOptions(toronto('2026-11-05', '18:22'));
  assert.ok(options);
  assert.equal(options.asap, 18 * 60 + 42);
  assert.equal(options.slots[0], 18 * 60 + 45);
  assert.equal(options.slots.at(-1), 23 * 60);
  assert.equal(pickupOptions(toronto('2026-11-05', '23:00')), null);
  const last = pickupOptions(toronto('2026-11-05', '22:50'));
  assert.equal(last?.asap, 23 * 60 + 10);
  assert.deepEqual(last?.slots, []);
});

test('the server accepts only offered pickup times', () => {
  const now = toronto('2026-11-05', '18:22');
  assert.deepEqual(checkPickup({ type: 'asap' }, now), { ok: true, minutes: 18 * 60 + 42, type: 'asap' });
  assert.equal(checkPickup({ type: 'scheduled', time: '19:00' }, now).ok, true);
  assert.equal(checkPickup({ type: 'scheduled', time: '18:30' }, now).ok, false);
  assert.equal(checkPickup({ type: 'scheduled', time: '19:07' }, now).ok, false);
  assert.deepEqual(checkPickup({ type: 'asap' }, toronto('2026-11-05', '23:05')), { ok: false, error: 'closed' });
});

test('test mode: with opening hours off, ordering is open all day', (t) => {
  (ORDERING as { enforceHours: boolean }).enforceHours = false;
  t.after(() => ((ORDERING as { enforceHours: boolean }).enforceHours = true));
  assert.equal(orderingWindow(toronto('2026-11-06', '01:30')).open, true);
  const options = pickupOptions(toronto('2026-11-06', '01:30'));
  assert.equal(options?.asap, 1 * 60 + 50);
  assert.equal(options?.slots.at(-1), 23 * 60 + 45);
  assert.equal(checkPickup({ type: 'asap' }, toronto('2026-11-06', '03:00')).ok, true);
});
