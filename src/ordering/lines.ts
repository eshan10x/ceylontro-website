/**
 * Order lines: types, money formatting, tax and the price of one line. Pure functions with no
 * menu import, so the browser can load them without the whole menu module.
 */
import { ORDERING } from './config.ts';
import type { CatalogItem } from './catalog.ts';

/** One line of an order as the browser stores and sends it. */
export interface OrderLineInput {
  itemId: string;
  qty: number;
  /** Choice group id → chosen value id. */
  choices: Record<string, string>;
  /** Chosen extras as "groupId:valueId". */
  extras: string[];
  /** Special instructions for this dish (optional). */
  note?: string;
}

export interface PricedLine {
  itemId: string;
  name: string;
  qty: number;
  unitCents: number;
  lineCents: number;
  /** "Side: Fresh-cut fries", "Cheese slice (+$1)" — in menu order. */
  details: string[];
  note: string;
}

export interface PricedOrder {
  lines: PricedLine[];
  itemCount: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}


export const formatCents = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

/** Tax on the subtotal, rounded to the nearest cent. */
export const taxOn = (subtotalCents: number): number => Math.round((subtotalCents * ORDERING.tax.percent) / 100);

/** Collapses whitespace and trims a free-text note to the allowed length. */
export function cleanNote(note: unknown): string {
  if (typeof note !== 'string') return '';
  return note.replace(/\s+/g, ' ').trim().slice(0, ORDERING.notes.maxLength);
}

/** Identical dishes with identical choices and notes share one line in the order. */
export function lineKey(line: OrderLineInput): string {
  const choices = Object.entries(line.choices)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, value]) => `${group}=${value}`)
    .join('&');
  return [line.itemId, choices, [...line.extras].sort().join('&'), cleanNote(line.note)].join('|');
}

/** "Choose your flavour" → "Flavour", for order summaries and the kitchen. */
export function detailLabel(label: string): string {
  const short = label.replace(/^choose your /i, '');
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** Checks one line against its dish; returns the price and readable details, or an error. */
export function priceLine(item: CatalogItem, line: OrderLineInput): { line: PricedLine } | { error: string } {
  const where = `"${item.name}"`;
  if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > ORDERING.maxQuantityPerLine) {
    return { error: `${where}: quantity must be between 1 and ${ORDERING.maxQuantityPerLine}.` };
  }

  const choices = line.choices && typeof line.choices === 'object' ? line.choices : {};
  const extras = Array.isArray(line.extras) ? line.extras : [];
  const known = new Set(item.groups.map((group) => group.id));
  for (const groupId of Object.keys(choices)) {
    if (!known.has(groupId)) return { error: `${where}: unknown choice "${groupId}".` };
  }
  if (new Set(extras).size !== extras.length) return { error: `${where}: an extra is listed twice.` };

  let unitCents = item.priceCents;
  const details: string[] = [];

  for (const group of item.groups) {
    if (group.kind === 'choice') {
      const chosen = choices[group.id];
      const value = group.values.find((v) => v.id === chosen);
      if (!value) return { error: `${where}: choose a ${group.label.toLowerCase()}.` };
      details.push(`${detailLabel(group.label)}: ${value.label}`);
    } else {
      for (const value of group.values) {
        if (!extras.includes(`${group.id}:${value.id}`)) continue;
        unitCents += value.priceCents;
        details.push(`${value.label} (+${formatCents(value.priceCents).replace('.00', '')})`);
      }
    }
  }

  const validExtras = new Set(
    item.groups.filter((g) => g.kind === 'extra').flatMap((g) => g.values.map((v) => `${g.id}:${v.id}`)),
  );
  const unknown = extras.find((extra) => typeof extra !== 'string' || !validExtras.has(extra));
  if (unknown !== undefined) return { error: `${where}: unknown extra "${String(unknown)}".` };

  const note = ORDERING.notes.allowed ? cleanNote(line.note) : '';

  return {
    line: {
      itemId: item.id,
      name: item.name,
      qty: line.qty,
      unitCents,
      lineCents: unitCents * line.qty,
      details,
      note,
    },
  };
}
