/**
 * Checkout (/checkout): pickup time slots, field checks, the summary, and the hand-off to
 * Clover. The server re-checks everything; this script only explains problems early and clearly.
 */
import { ORDERING } from '@/ordering/config';
import { formatCents, taxOn } from '@/ordering/lines';
import { pickupOptions, toClock } from '@/ordering/hours';
import { checkCustomer, FIELD_ERRORS, type CustomerField } from '@/ordering/customer';
import { getLines, itemCount, setLines, setPending, subtotal } from '@/ordering/client/store';
import { formatTime } from '@/lib/format';
import { restaurant } from '@/data/restaurant';

const form = document.querySelector<HTMLFormElement>('[data-checkout]')!;
const alertBox = form.querySelector<HTMLElement>('[data-checkout-alert]')!;
const summary = form.querySelector<HTMLElement>('[data-summary]')!;
const submit = form.querySelector<HTMLButtonElement>('[data-checkout-submit]')!;
const slotsBox = form.querySelector<HTMLElement>('[data-slots]')!;

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (text: string): string => text.replace(/[&<>"']/g, (c) => ESC[c] ?? c);
const clock = (minutes: number) => formatTime(toClock(minutes));
const call = restaurant.phone ? ` or call us on ${esc(restaurant.phone)}` : '';

function showAlert(title: string, body: string, tone: 'warn' | 'error' = 'error'): void {
  alertBox.innerHTML = `<div class="flex flex-col gap-1 rounded-2xl border px-4 py-3.5 ${tone === 'warn' ? 'border-[#ebd7ae] bg-[#f9eeda]' : 'border-[#e8c4bd] bg-[#fbebeb]'}">
    <p class="text-[0.9375rem] font-semibold">${title}</p><p class="text-[0.8125rem] leading-normal">${body}</p></div>`;
  alertBox.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function renderSummary(): void {
  const lines = getLines();
  const sub = subtotal(lines);
  const tax = taxOn(sub);
  summary.innerHTML = `${lines
    .map(
      (line) => `<div class="flex justify-between gap-4"><span>${line.qty} × ${esc(line.name)}${
        line.details.length || line.note
          ? `<span class="block text-[0.75rem] text-stone">${[...line.details, line.note ? `“${line.note}”` : ''].filter(Boolean).map(esc).join(' · ')}</span>`
          : ''
      }</span><span>${formatCents(line.unitCents * line.qty)}</span></div>`,
    )
    .join('')}
    <div class="my-1.5 h-px bg-line"></div>
    <div class="flex justify-between text-[0.9375rem]"><span>Subtotal · ${itemCount(lines)} ${itemCount(lines) === 1 ? 'item' : 'items'}</span><span>${formatCents(sub)}</span></div>
    <div class="flex justify-between text-[0.9375rem] text-stone"><span>${ORDERING.tax.name} (${ORDERING.tax.percent}%)</span><span>${formatCents(tax)}</span></div>
    <div class="flex justify-between pt-1 text-[1.0625rem] font-semibold"><span>Total</span><span>${formatCents(sub + tax)}</span></div>`;
  form.querySelector('[data-submit-total]')!.textContent = formatCents(sub + tax);
}

function renderPickup(): boolean {
  const options = pickupOptions();
  const scheduled = form.querySelector<HTMLInputElement>('input[name="when"][value="scheduled"]')!;
  if (!options) {
    submit.disabled = true;
    form.querySelector<HTMLElement>('[data-pickup]')!.hidden = true;
    showAlert('Online ordering is closed right now', `Your order is saved. Please come back during opening hours${call}.`);
    return false;
  }
  form.querySelector('[data-asap-text]')!.textContent = `Ready around ${clock(options.asap)} (about ${ORDERING.prepMinutes} minutes)`;
  const chosen = slotsBox.querySelector<HTMLInputElement>('input:checked')?.value;
  slotsBox.innerHTML = options.slots
    .map(
      (m) => `<label class="relative inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line bg-white px-4 text-[0.875rem] font-medium tabular-nums">
        <input type="radio" name="slot" value="${toClock(m)}" ${toClock(m) === chosen ? 'checked' : ''}>${clock(m)}</label>`,
    )
    .join('');
  scheduled.disabled = options.slots.length === 0;
  form.querySelector('[data-slots-hint]')!.textContent = options.slots.length
    ? `From ${clock(options.slots[0]!)} to ${clock(options.slots.at(-1)!)}`
    : 'No later times are left today.';
  slotsBox.hidden = !scheduled.checked || options.slots.length === 0;
  return true;
}

function fieldError(field: CustomerField, message: string): void {
  const input = form.querySelector<HTMLInputElement>(`[name="${field}"]`)!;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  form.querySelector(`#co-${field}-error`)!.textContent = message;
}

function readCustomer() {
  const data = new FormData(form);
  return { name: String(data.get('name') ?? ''), phone: String(data.get('phone') ?? ''), email: String(data.get('email') ?? '') };
}

function validate(): boolean {
  const result = checkCustomer(readCustomer());
  const bad = result.ok ? [] : result.fields;
  for (const field of ['name', 'phone', 'email'] as const) fieldError(field, bad.includes(field) ? FIELD_ERRORS[field] : '');
  if (bad[0]) form.querySelector<HTMLElement>(`[name="${bad[0]}"]`)?.focus();
  return result.ok;
}

// Re-check a field when the guest leaves it, once it has been flagged.
form.addEventListener('focusout', (event) => {
  const input = event.target as HTMLInputElement;
  const field = input.name as CustomerField;
  if (!(field in FIELD_ERRORS) || input.getAttribute('aria-invalid') !== 'true') return;
  const result = checkCustomer(readCustomer());
  fieldError(field, !result.ok && result.fields.includes(field) ? FIELD_ERRORS[field] : '');
});

form.addEventListener('change', (event) => {
  if ((event.target as HTMLInputElement).name === 'when') {
    renderPickup();
    if ((event.target as HTMLInputElement).value === 'scheduled') slotsBox.querySelector<HTMLInputElement>('input')?.focus();
  }
});

function busy(on: boolean): void {
  submit.disabled = on;
  form.querySelector('[data-submit-label]')!.textContent = on ? 'Opening secure payment…' : 'Continue to payment';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  alertBox.innerHTML = '';
  if (!renderPickup()) return;
  if (!validate()) return;

  const data = new FormData(form);
  const when = data.get('when');
  const slot = data.get('slot');
  if (when === 'scheduled' && typeof slot !== 'string') {
    showAlert('Choose a pickup time', 'Pick one of the times under “Schedule for later today”, or choose “As soon as possible”.');
    return;
  }

  const lines = getLines();
  busy(true);
  let response: Response;
  try {
    response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        lines: lines.map(({ itemId, qty, choices, extras, note }) => ({ itemId, qty, choices, extras, note })),
        expectedSubtotalCents: subtotal(lines),
        customer: readCustomer(),
        pickup: when === 'scheduled' ? { type: 'scheduled', time: slot } : { type: 'asap' },
        note: String(data.get('note') ?? ''),
      }),
    });
  } catch {
    busy(false);
    showAlert('We couldn’t reach our ordering system', `Please check your connection and try again${call}.`);
    return;
  }

  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (response.ok && typeof result['href'] === 'string') {
    const order = result['order'] as { lines: { name: string; qty: number; lineCents: number; details: string[]; note: string }[]; subtotalCents: number; taxCents: number; totalCents: number };
    const pickup = result['pickup'] as { type: 'asap' | 'scheduled'; time: string; label: string };
    setPending({ ref: String(result['ref']), createdAt: Date.now(), name: readCustomer().name.trim(), email: readCustomer().email.trim(), pickup, order });
    location.assign(result['href']);
    return;
  }

  busy(false);
  switch (result['error']) {
    case 'prices_changed': {
      // The menu changed since this order was built: take the server's prices and show them.
      const fresh = (result['order'] as { lines: { name: string; unitCents: number; details: string[] }[] }).lines;
      setLines(lines.map((line, i) => ({ ...line, name: fresh[i]?.name ?? line.name, unitCents: fresh[i]?.unitCents ?? line.unitCents, details: fresh[i]?.details ?? line.details })));
      renderSummary();
      showAlert('Our menu prices have changed', 'We’ve updated your order. Please check the total, then continue to payment.', 'warn');
      break;
    }
    case 'closed':
      renderPickup();
      showAlert('Online ordering has just closed', `Your order is saved for when we open${call}.`);
      break;
    case 'invalid_pickup':
      renderPickup();
      showAlert('That pickup time is no longer available', 'Please choose another time.');
      break;
    case 'invalid_customer':
      validate();
      break;
    case 'invalid_order':
      showAlert('Something in your order needs a look', `${((result['messages'] as string[]) ?? []).map(esc).join(' ')} <a href="/menu#your-order" class="underline">Edit your order</a>.`);
      break;
    default:
      showAlert('Payment isn’t available right now', `Nothing was charged. Please try again in a few minutes${call}.`);
  }
});

/* ---------- Start ---------- */

if (!getLines().length) {
  form.innerHTML = `<div class="col-span-full flex flex-col items-center gap-4 py-16 text-center">
    <h1 class="text-[2.5rem] leading-none">Your order is <i>empty</i></h1>
    <p class="text-small text-stone">Add a dish from the menu to get started.</p>
    <a href="/menu" class="mt-2 inline-flex min-h-[3.375rem] items-center rounded-full bg-espresso px-8 text-button font-semibold tracking-[0.12em] text-white uppercase">Browse the menu</a></div>`;
} else {
  renderSummary();
  renderPickup();
  setInterval(renderPickup, 60_000);
  if (new URLSearchParams(location.search).get('payment') === 'failed') {
    history.replaceState(null, '', location.pathname);
    showAlert('Payment wasn’t completed', 'No money was taken. Your order is still here, so you can try again.', 'warn');
  }
}
