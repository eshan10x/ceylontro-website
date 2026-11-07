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
  if (restaurant.phone) {
    $('[data-confirm-help]')!.textContent = `Need to change something? Call us on ${restaurant.phone} and quote order ${pending.ref}.`;
  }
} else if (pending) {
  setPending(null);
}
