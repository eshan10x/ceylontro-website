/**
 * Menu ordering, second stage: the screens from the approved O2 design.
 *
 * - Options sheet: required choices (radio), optional extras (checkbox, priced), special
 *   instructions, quantity, and Add with the live price. Add stays disabled until every required
 *   choice is made. Dishes with nothing to choose go straight into the order with a toast.
 * - "Your order": the drawer below 1440 px and the panel beside the menu above it. Quantities,
 *   remove, pickup location, subtotal, 13% HST and total, then Checkout.
 *
 * Prices come from /order-catalog.json (built from the menu data). The stored order is re-priced
 * against it on start, so a changed menu price never reaches checkout unnoticed.
 */
import { ORDERING } from '@/ordering/config';
import { formatCents, priceLine, taxOn, type OrderLineInput } from '@/ordering/lines';
import type { CatalogItem } from '@/ordering/catalog';
import { addLine, getLines, itemCount, setLines, setQty, subtotal, type StoredLine } from '@/ordering/client/store';
import { orderingWindow } from '@/ordering/hours';
import { restaurant } from '@/data/restaurant';
import { addressQuery } from '@/lib/format';

type Item = CatalogItem & { thumb: string | null; photo: string | null; alt: string };

const catalog = new Map<string, Item>();
const sheet = document.getElementById('order-sheet') as HTMLDialogElement;
const sheetForm = sheet.querySelector<HTMLFormElement>('[data-order-sheet]')!;
const drawer = document.getElementById('order-drawer') as HTMLDialogElement;
const drawerBody = drawer.querySelector<HTMLElement>('[data-order-drawer]')!;
const panelBody = document.querySelector<HTMLElement>('[data-order-panel-body]');
const toastRegion = document.querySelector<HTMLElement>('[data-order-toast]');

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (text: string): string => text.replace(/[&<>"']/g, (c) => ESC[c] ?? c);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const priceTag = (cents: number) => `+${formatCents(cents).replace('.00', '')}`;

const X_ICON =
  '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const PIN_ICON =
  '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true" class="shrink-0 text-gold-deep"><path d="M8 17s6-5.2 6-9.5A6 6 0 0 0 2 7.5C2 11.8 8 17 8 17z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="7.5" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

const CLOSE_BTN = (label: string) =>
  `<button type="button" data-act="close" aria-label="${label}" class="grid size-11 shrink-0 place-content-center rounded-full bg-sand text-ink hover:bg-sand-hover">${X_ICON}</button>`;

const STEPPER = (label: string, qty: number, key = '', small = false) => {
  const size = small ? 'size-9 text-[1.0625rem]' : 'size-11 text-xl';
  const keyAttr = key ? ` data-key="${esc(key)}"` : '';
  return `<div role="group" aria-label="${esc(label)}" class="inline-flex items-center rounded-full border border-line bg-white">
    <button type="button" data-act="dec"${keyAttr} aria-label="One fewer" ${qty <= 1 ? 'disabled' : ''} class="grid ${size} place-content-center rounded-full text-espresso disabled:text-line">−</button>
    <span class="min-w-6 text-center text-[0.9375rem] font-semibold tabular-nums" aria-live="polite">${qty}</span>
    <button type="button" data-act="inc"${keyAttr} aria-label="One more" ${qty >= ORDERING.maxQuantityPerLine ? 'disabled' : ''} class="grid ${size} place-content-center rounded-full text-espresso disabled:text-line">+</button>
  </div>`;
};

/* ---------- Toast ---------- */

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function toast(html: string, withView = false): void {
  if (!toastRegion) return;
  clearTimeout(toastTimer);
  toastRegion.innerHTML = `<div class="pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-[0.875rem] leading-snug text-cream shadow-[0_18px_40px_-20px_rgb(26_23_20/0.7)]">
    <span class="grid size-6.5 shrink-0 place-content-center rounded-full bg-herb"><svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5l3.5 3.5L11 1" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <span class="grow">${html}</span>
    ${withView ? '<button type="button" data-order-open class="min-h-11 px-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-gold-light uppercase xl:hidden">View</button>' : ''}
  </div>`;
  toastTimer = setTimeout(() => (toastRegion.innerHTML = ''), 4000);
}

/* ---------- Options sheet ---------- */

let current: { item: Item; qty: number } | null = null;

function readSelection(item: Item): OrderLineInput {
  const data = new FormData(sheetForm);
  const choices: Record<string, string> = {};
  const extras: string[] = [];
  for (const group of item.groups) {
    if (group.kind === 'choice') {
      const value = data.get(group.id);
      if (typeof value === 'string') choices[group.id] = value;
    } else {
      for (const value of data.getAll(group.id)) extras.push(`${group.id}:${String(value)}`);
    }
  }
  const note = data.get('note');
  return { itemId: item.id, qty: current?.qty ?? 1, choices, extras, note: typeof note === 'string' ? note : '' };
}

function updateSheet(): void {
  if (!current) return;
  const { item } = current;
  const priced = priceLine(item, readSelection(item));
  const button = sheetForm.querySelector<HTMLButtonElement>('[data-sheet-add]')!;
  const missing = item.groups.find((g) => g.kind === 'choice' && !new FormData(sheetForm).get(g.id));
  button.disabled = 'error' in priced;
  button.innerHTML =
    'error' in priced
      ? `Choose ${missing ? esc(choosePhrase(missing.label)) : 'your options'}`
      : `Add to order <span class="tracking-normal text-[0.9375rem]">${formatCents(priced.line.lineCents)}</span>`;
  // Update the stepper in place: redrawing it between mousedown and click (a note field's
  // change event fires on blur) would swallow the tap.
  const stepper = sheetForm.querySelector<HTMLElement>('[data-sheet-qty]')!;
  if (!stepper.firstElementChild) stepper.innerHTML = STEPPER(`Quantity of ${item.name}`, current.qty);
  stepper.querySelector('span')!.textContent = String(current.qty);
  stepper.querySelector<HTMLButtonElement>('[data-act="dec"]')!.disabled = current.qty <= 1;
  stepper.querySelector<HTMLButtonElement>('[data-act="inc"]')!.disabled = current.qty >= ORDERING.maxQuantityPerLine;
}

/** "Side" → "a side", "Choose your flavour" → "a flavour", "Choice" → "an option". */
function choosePhrase(label: string): string {
  const noun = label.toLowerCase().replace(/^choose your /, '').replace(/^choice$/, 'option');
  return `${/^[aeiou]/.test(noun) ? 'an' : 'a'} ${noun}`;
}

function groupMarkup(group: CatalogItem['groups'][number]): string {
  const required = group.kind === 'choice';
  const badge = required
    ? '<span class="rounded-full bg-sand px-2.5 py-1.5 text-[0.625rem] font-semibold tracking-[0.14em] text-espresso uppercase">Required · choose 1</span>'
    : '<span class="text-[0.625rem] font-semibold tracking-[0.14em] text-stone uppercase">Optional</span>';
  const rows = group.values
    .map(
      (value) => `<label class="order-opt flex min-h-14 cursor-pointer items-center gap-3.5 border-b border-line-soft px-1">
        <input type="${required ? 'radio' : 'checkbox'}" name="${esc(group.id)}" value="${esc(value.id)}" ${required ? 'required' : ''}>
        <span class="grow text-[0.9375rem] font-medium">${esc(value.label)}</span>
        ${value.priceCents ? `<span class="text-[0.875rem] font-medium text-stone tabular-nums">${priceTag(value.priceCents)}</span>` : ''}
      </label>`,
    )
    .join('');
  return `<fieldset class="flex flex-col">
    <legend class="float-left flex w-full items-center justify-between pb-1.5"><span class="label text-ink">${esc(group.label)}</span>${badge}</legend>
    <div class="clear-both">${rows}</div>
  </fieldset>`;
}

function openSheet(item: Item): void {
  current = { item, qty: 1 };
  const photo = item.photo
    ? `<div class="relative px-4 pt-4"><img src="${item.photo}" alt="${esc(item.alt)}" width="800" height="450" class="block aspect-video w-full rounded-[1.25rem] object-cover">
        <div class="absolute top-7 right-7">${CLOSE_BTN('Close').replace('bg-sand', 'bg-white/90')}</div></div>`
    : `<div class="flex justify-end px-4 pt-4">${CLOSE_BTN('Close')}</div>`;
  const notes = ORDERING.notes.allowed
    ? `<div class="flex flex-col gap-2">
        <label for="order-note" class="text-[0.8125rem] font-semibold">Special instructions <span class="ml-1.5 text-[0.75rem] font-normal text-stone">Optional</span></label>
        <textarea id="order-note" name="note" maxlength="${ORDERING.notes.maxLength}" rows="2" class="order-field" placeholder="e.g. no onion"></textarea>
      </div>`
    : '';
  sheetForm.innerHTML = `
    <div class="min-h-0 grow overflow-y-auto overscroll-contain">
      ${photo}
      <div class="flex flex-col gap-6 px-5 pt-4.5 pb-8">
        <div class="flex flex-col gap-2">
          <h2 id="order-sheet-title" class="text-[2rem] leading-[1.02]">${esc(item.name)}</h2>
          ${item.description ? `<p class="text-small text-stone">${esc(item.description)}</p>` : ''}
          <p class="text-[1.0625rem] font-semibold tabular-nums">${formatCents(item.priceCents)}</p>
        </div>
        ${item.groups.map(groupMarkup).join('')}
        ${notes}
      </div>
    </div>
    <div class="flex items-center gap-3 border-t border-line-soft bg-white px-4 pt-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div data-sheet-qty></div>
      <button type="submit" data-sheet-add class="flex min-h-[3.375rem] grow items-center justify-between gap-3 rounded-full bg-espresso px-5.5 text-[0.75rem] font-semibold tracking-[0.12em] text-white uppercase shadow-button transition-colors hover:bg-espresso-hover disabled:justify-center disabled:bg-line disabled:text-stone disabled:shadow-none"></button>
    </div>`;
  updateSheet();
  sheet.showModal();
  sheetForm.querySelector<HTMLElement>('.overflow-y-auto')?.scrollTo(0, 0);
}

sheetForm.addEventListener('change', updateSheet);
sheetForm.addEventListener('click', (event) => {
  const act = (event.target as Element).closest<HTMLElement>('[data-act]')?.dataset['act'];
  if (!current || !act) return;
  if (act === 'close') sheet.close();
  if (act === 'inc' || act === 'dec') {
    current.qty = Math.max(1, Math.min(ORDERING.maxQuantityPerLine, current.qty + (act === 'inc' ? 1 : -1)));
    updateSheet();
  }
});
sheetForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!current) return;
  const priced = priceLine(current.item, readSelection(current.item));
  if ('error' in priced) return;
  const selection = readSelection(current.item);
  addLine({ ...selection, note: priced.line.note, name: priced.line.name, unitCents: priced.line.unitCents, details: priced.line.details });
  sheet.close();
  toast(`Added <b class="font-semibold">${esc(current.item.name)}</b>`, true);
});

/* ---------- Your order (drawer and panel) ---------- */

function lineMarkup(line: StoredLine, compact: boolean): string {
  const item = catalog.get(line.itemId);
  const thumb = item?.thumb
    ? `<img src="${item.thumb}" alt="" width="64" height="64" class="${compact ? 'size-14 rounded-xl' : 'size-16 rounded-[0.875rem]'} shrink-0 object-cover">`
    : '';
  const details = [...line.details, line.note ? `“${esc(line.note)}”` : ''].filter(Boolean).map((d) => (d.startsWith('“') ? d : esc(d)));
  return `<li class="flex gap-3.5 border-b border-line-soft py-4">
    ${thumb}
    <div class="flex min-w-0 grow flex-col gap-1">
      <div class="flex justify-between gap-3">
        <h3 class="${compact ? 'font-sans text-[0.875rem] font-semibold' : 'text-[1.375rem] leading-[1.08]'}">${esc(line.name)}</h3>
        <span class="shrink-0 pt-1 text-[0.9375rem] font-semibold tabular-nums">${formatCents(line.unitCents * line.qty)}</span>
      </div>
      ${details.length ? `<p class="text-[0.8125rem] leading-normal text-stone">${details.join(' · ')}</p>` : ''}
      <div class="flex items-center justify-between pt-1.5">
        ${STEPPER(`Quantity of ${line.name}`, line.qty, line.key, true)}
        <button type="button" data-act="remove" data-key="${esc(line.key)}" class="min-h-11 text-[0.6875rem] font-semibold tracking-[0.12em] text-stone uppercase underline decoration-line underline-offset-4 hover:text-ink">Remove<span class="sr-only"> ${esc(line.name)}</span></button>
      </div>
    </div>
  </li>`;
}

function orderMarkup(mode: 'drawer' | 'panel'): string {
  const lines = getLines();
  const count = itemCount(lines);
  const sub = subtotal(lines);
  const tax = taxOn(sub);
  const open = orderingWindow().open;
  const titleId = mode === 'drawer' ? 'order-drawer-title' : 'order-panel-title';
  const head = `<div class="flex items-start justify-between gap-4 ${mode === 'drawer' ? 'px-5 pt-5 pb-2' : ''}">
      <div class="flex flex-col gap-1.5"><p class="eyebrow text-[0.6875rem] text-gold-deep">Pickup order</p>
      <h2 id="${titleId}" class="${mode === 'drawer' ? 'text-[2.25rem]' : 'text-[2.375rem]'} leading-none">Your <i>order</i></h2></div>
      ${mode === 'drawer' ? CLOSE_BTN('Close your order') : ''}
    </div>`;

  if (!count) {
    return `${head}<div class="flex flex-col items-center gap-3.5 px-5 py-10 text-center">
      <span class="grid h-16 w-16 place-content-center rounded-arch bg-sand text-gold-deep"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 6h12l-1 10H4L3 6z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>
      <p class="font-display text-[1.75rem] leading-tight">Your order is <i>empty</i></p>
      <p class="text-small text-stone">Add a dish from the menu to get started.</p>
      ${mode === 'drawer' ? '<button type="button" data-act="close" class="mt-2 inline-flex min-h-[3.375rem] items-center rounded-full bg-espresso px-8 text-button font-semibold tracking-[0.12em] text-white uppercase">Browse the menu</button>' : ''}
    </div>`;
  }

  const address = restaurant.address ? addressQuery(restaurant.address) : '';
  const checkout = open
    ? `<a href="/checkout" class="flex min-h-[3.375rem] items-center justify-between rounded-full bg-espresso px-6 text-button font-semibold tracking-[0.12em] text-white uppercase no-underline shadow-button transition-colors hover:bg-espresso-hover">Checkout <span class="text-[0.9375rem] tracking-normal tabular-nums">${formatCents(sub + tax)}</span></a>`
    : '<p class="rounded-2xl bg-sand px-4 py-3 text-[0.875rem] text-ink">Online ordering is closed right now. Your order is saved for when we open.</p>';

  return `${head}
    <div class="${mode === 'drawer' ? 'min-h-0 grow overflow-y-auto overscroll-contain px-5' : ''}">
      <ul role="list">${lines.map((line) => lineMarkup(line, mode === 'panel')).join('')}</ul>
      ${mode === 'drawer' ? '<button type="button" data-act="close" class="inline-flex min-h-11 items-center gap-2.5 pt-3 text-[0.75rem] font-semibold tracking-[0.12em] text-espresso uppercase after:h-px after:w-6 after:bg-gold">Add more dishes</button>' : ''}
      ${
        address
          ? `<div class="mt-4 flex items-start gap-3 rounded-2xl border border-line-soft ${mode === 'panel' ? 'bg-white' : 'bg-linen'} px-4 py-3.5">${PIN_ICON}<div class="flex flex-col gap-0.5"><p class="text-[0.875rem] font-semibold">Pickup at ${esc(restaurant.name)}</p><p class="text-[0.8125rem] text-stone">${esc(address)}</p></div></div>`
          : ''
      }
      <dl class="flex flex-col gap-2 py-5 text-[0.9375rem] tabular-nums">
        <div class="flex justify-between"><dt>Subtotal · ${plural(count, 'item')}</dt><dd>${formatCents(sub)}</dd></div>
        <div class="flex justify-between text-stone"><dt>${ORDERING.tax.name} (${ORDERING.tax.percent}%)</dt><dd>${formatCents(tax)}</dd></div>
        <div class="flex justify-between pt-1 text-[1.0625rem] font-semibold"><dt>Total</dt><dd>${formatCents(sub + tax)}</dd></div>
      </dl>
    </div>
    <div class="${mode === 'drawer' ? 'border-t border-line-soft px-4 pt-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom))]' : ''}">${checkout}</div>`;
}

function render(): void {
  const focused = document.activeElement as HTMLElement | null;
  const focusAct = focused?.dataset['act'];
  const focusKey = focused?.dataset['key'];
  const inDrawer = drawer.contains(focused);

  if (drawer.open) drawerBody.innerHTML = orderMarkup('drawer');
  if (panelBody) panelBody.innerHTML = orderMarkup('panel');

  // Keep keyboard focus on the same control after a redraw.
  if (focusAct && focusKey) {
    const scope = inDrawer ? drawerBody : panelBody;
    const same = scope?.querySelector<HTMLElement>(`[data-act="${focusAct}"][data-key="${CSS.escape(focusKey)}"]`);
    (same && !(same as HTMLButtonElement).disabled ? same : scope?.querySelector<HTMLElement>('[data-act]'))?.focus();
  }
}

function onOrderClick(event: Event): void {
  const el = (event.target as Element).closest<HTMLElement>('[data-act]');
  if (!el) return;
  const key = el.dataset['key'] ?? '';
  const line = getLines().find((l) => l.key === key);
  switch (el.dataset['act']) {
    case 'close':
      drawer.close();
      break;
    case 'inc':
      if (line) setQty(key, line.qty + 1);
      break;
    case 'dec':
      if (line && line.qty > 1) setQty(key, line.qty - 1);
      break;
    case 'remove':
      setQty(key, 0);
      if (!getLines().length && drawer.open) drawer.querySelector<HTMLElement>('[data-act="close"]')?.focus();
      break;
  }
}

drawerBody.addEventListener('click', onOrderClick);
panelBody?.addEventListener('click', onOrderClick);

/* ---------- Public API (used by boot.ts) ---------- */

export function openItem(id: string): void {
  const item = catalog.get(id);
  if (!item) return;
  if (item.groups.length === 0) {
    const priced = priceLine(item, { itemId: id, qty: 1, choices: {}, extras: [] });
    if ('error' in priced) return;
    addLine({ itemId: id, qty: 1, choices: {}, extras: [], name: item.name, unitCents: priced.line.unitCents, details: [] });
    toast(`Added <b class="font-semibold">${esc(item.name)}</b>`, true);
    return;
  }
  openSheet(item);
}

export function openOrder(): void {
  if (sheet.open) sheet.close();
  drawerBody.innerHTML = orderMarkup('drawer');
  drawer.showModal();
}

/** Re-prices the stored order against today's menu; drops dishes no longer on it. */
function reprice(): void {
  const lines = getLines();
  let changed = false;
  const next: StoredLine[] = [];
  for (const line of lines) {
    const item = catalog.get(line.itemId);
    const priced = item ? priceLine(item, line) : null;
    if (!priced || 'error' in priced) {
      changed = true;
      continue;
    }
    if (priced.line.unitCents !== line.unitCents || priced.line.name !== line.name) changed = true;
    next.push({ ...line, name: priced.line.name, unitCents: priced.line.unitCents, details: priced.line.details });
  }
  if (changed) {
    setLines(next);
    toast('We’ve updated your order to today’s menu. Please check it before checkout.');
  }
}

let started = false;

export async function start(): Promise<void> {
  if (started) return;
  const response = await fetch('/order-catalog.json');
  if (!response.ok) throw new Error(`order catalog: ${response.status}`);
  const data = (await response.json()) as { items: Item[] };
  for (const item of data.items) catalog.set(item.id, item);
  started = true;
  reprice();
  render();
  window.addEventListener('order:change', render);
}
