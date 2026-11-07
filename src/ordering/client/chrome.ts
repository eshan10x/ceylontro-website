/**
 * Keeps the page's order "chrome" in step with the stored order, without loading the ordering
 * screens: the count on every Order Online button (which then opens the order), the Menu's
 * "View order" bar and the "1 in your order" notes beside Add buttons.
 */
import { ORDERING } from '../config.ts';
import { formatCents } from '../lines.ts';
import { getLines, itemCount, subtotal } from './store.ts';

export const YOUR_ORDER_HREF = '/menu#your-order';

export function syncChrome(): void {
  if (!ORDERING.enabled) return;
  const lines = getLines();
  const count = itemCount(lines);

  for (const label of document.querySelectorAll<HTMLElement>('[data-order-cta]')) {
    const link = label.closest('a');
    if (!link) continue;
    link.dataset['orderHref'] ??= link.getAttribute('href') ?? '';
    if (count > 0) {
      label.innerHTML = `Your order <span class="order-cta-count">${count}</span>`;
      link.setAttribute('aria-label', `Your order, ${count} ${count === 1 ? 'item' : 'items'}`);
      link.setAttribute('href', YOUR_ORDER_HREF);
    } else {
      label.textContent = 'Order Online';
      link.removeAttribute('aria-label');
      link.setAttribute('href', link.dataset['orderHref']);
    }
  }

  for (const bar of document.querySelectorAll<HTMLElement>('[data-order-bar]')) {
    bar.hidden = count === 0 || document.documentElement.dataset['ordering'] !== 'open';
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-order-count]')) el.textContent = String(count);
  for (const el of document.querySelectorAll<HTMLElement>('[data-order-subtotal]')) el.textContent = formatCents(subtotal(lines));

  const perItem = new Map<string, number>();
  for (const line of lines) perItem.set(line.itemId, (perItem.get(line.itemId) ?? 0) + line.qty);
  for (const el of document.querySelectorAll<HTMLElement>('[data-order-in]')) {
    const n = perItem.get(el.dataset['orderIn'] ?? '') ?? 0;
    el.textContent = n ? `${n} in your order` : '';
  }
}
