/**
 * Order confirmed (/order-confirmed): fills in the order saved on this device just before payment,
 * then empties the order so the next visit starts fresh. The saved details stay for a day so a
 * refresh still shows them.
 */
import { ORDERING } from '@/ordering/config';
import { formatCents } from '@/ordering/lines';
import { clearOrder, getPending, setPending } from '@/ordering/client/store';
import { restaurant } from '@/data/restaurant';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (text: string): string => text.replace(/[&<>"']/g, (c) => ESC[c] ?? c);
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);

/** The printed receipt (shown only when printing): order, date, pickup, items, totals, status. */
function fillReceipt(p: NonNullable<ReturnType<typeof getPending>>, atPickup: boolean): void {
  const placed = new Date(p.createdAt).toLocaleString('en-CA', {
    timeZone: ORDERING.timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const row = (left: string, right: string, cls = '') => `<div class="row ${cls}"><span>${left}</span><span>${right}</span></div>`;
  const lines = p.order.lines
    .map((line) => {
      const details = [...line.details, line.note ? `“${line.note}”` : ''].filter(Boolean).map(esc).join(' · ');
      return row(`${line.qty} × ${esc(line.name)}`, formatCents(line.lineCents)) + (details ? `<div class="detail">${details}</div>` : '');
    })
    .join('');
  $('[data-receipt-body]')!.innerHTML = `
    <h2>Order ${esc(p.ref)}</h2>
    ${row('Placed', esc(placed))}
    ${row('Name', esc(p.name))}
    ${row('Pickup', esc(p.pickup.type === 'asap' ? p.pickup.label.replace(/^ASAP, /, 'As soon as possible, ') : p.pickup.label))}
    <h2>Items</h2>
    ${lines}
    <div class="rule"></div>
    ${row('Subtotal', formatCents(p.order.subtotalCents))}
    ${row(`${ORDERING.tax.name} (${ORDERING.tax.percent}%)`, formatCents(p.order.taxCents))}
    ${row(atPickup ? 'Amount due' : 'Total paid', formatCents(p.order.totalCents), 'total')}
    <p class="status">${atPickup ? 'NOT PAID — pay at pickup' : 'PAID ONLINE'}</p>`;
  const button = $<HTMLButtonElement>('[data-print-receipt]')!;
  button.hidden = false;
  button.addEventListener('click', () => window.print());
}

const pending = getPending();
const fresh = pending && Date.now() - pending.createdAt < 24 * 60 * 60 * 1000;

clearOrder();

if (pending && fresh) {
  const first = pending.name.split(' ')[0] ?? '';
  const atPickup = pending.payAt === 'pickup';
  $('[data-confirm-ref]')!.textContent = atPickup ? `Order ${pending.ref} · Pay at pickup` : `Order ${pending.ref}`;
  $('[data-confirm-title]')!.innerHTML = first ? `Thank you, <i>${esc(first)}</i>` : 'Thank <i>you</i>';
  $('[data-confirm-lead]')!.textContent = atPickup
    ? `Your order is in the kitchen. Please pay ${formatCents(pending.order.totalCents)} at the counter when you pick it up.`
    : `Your order is in the kitchen. Your receipt is on its way to ${pending.email}.`;
  $('[data-confirm-time]')!.textContent = pending.pickup.type === 'asap' ? pending.pickup.label.replace(/^ASAP, /, '') : pending.pickup.label;
  $('[data-confirm-pickup]')!.hidden = false;

  const { order } = pending;
  $('[data-confirm-lines]')!.innerHTML = `${order.lines
    .map(
      (line) => `<div class="flex justify-between gap-4"><span>${line.qty} × ${esc(line.name)}${
        line.details.length || line.note
          ? `<span class="block text-[0.75rem] text-stone">${[...line.details, line.note ? `“${line.note}”` : ''].filter(Boolean).map(esc).join(' · ')}</span>`
          : ''
      }</span><span>${formatCents(line.lineCents)}</span></div>`,
    )
    .join('')}
    <div class="my-1.5 h-px bg-line"></div>
    <div class="flex justify-between"><span>Subtotal</span><span>${formatCents(order.subtotalCents)}</span></div>
    <div class="flex justify-between text-stone"><span>${ORDERING.tax.name} (${ORDERING.tax.percent}%)</span><span>${formatCents(order.taxCents)}</span></div>
    <div class="flex justify-between pt-1 text-[1.0625rem] font-semibold"><span>${atPickup ? 'To pay at pickup' : 'Total paid'}</span><span>${formatCents(order.totalCents)}</span></div>`;
  $('[data-confirm-order]')!.hidden = false;
  fillReceipt(pending, atPickup);
  if (restaurant.phone) {
    $('[data-confirm-help]')!.textContent = `Need to change something? Call us on ${restaurant.phone} and quote order ${pending.ref}.`;
  }
} else if (pending) {
  setPending(null);
}
