/**
 * Prices a whole order from the website's menu data alone. The server runs it on every checkout;
 * the tests run it against the real menu. Line-level rules live in `lines.ts`.
 */
import { ORDERING } from './config.ts';
import { catalogById } from './catalog.ts';
import { priceLine, taxOn, type OrderLineInput, type PricedLine, type PricedOrder } from './lines.ts';

export * from './lines.ts';

export type PriceResult = { ok: true; order: PricedOrder } | { ok: false; errors: string[] };

/** Validates and prices a whole order. Anything unexpected is an error, never silently dropped. */
export function priceOrder(input: unknown): PriceResult {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, errors: ['The order is empty.'] };
  if (input.length > ORDERING.maxLines) return { ok: false, errors: ['The order has too many lines.'] };

  const catalog = catalogById();
  const errors: string[] = [];
  const lines: PricedLine[] = [];

  for (const raw of input as Partial<OrderLineInput>[]) {
    const item = typeof raw?.itemId === 'string' ? catalog.get(raw.itemId) : undefined;
    if (!item) {
      errors.push(`A dish in the order is no longer on the menu.`);
      continue;
    }
    const result = priceLine(item, {
      itemId: item.id,
      qty: Number(raw.qty),
      choices: (raw.choices ?? {}) as Record<string, string>,
      extras: (raw.extras ?? []) as string[],
      note: raw.note ?? '',
    });
    if ('error' in result) errors.push(result.error);
    else lines.push(result.line);
  }

  if (errors.length) return { ok: false, errors };

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0);
  const taxCents = taxOn(subtotalCents);
  return {
    ok: true,
    order: {
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
    },
  };
}
