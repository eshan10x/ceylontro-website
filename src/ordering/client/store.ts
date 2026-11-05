/**
 * The guest's order in the browser, kept in localStorage so it survives a refresh or a visit to
 * another page. Lines keep a copy of the name and price for quick display; they are re-priced
 * against the catalog when the ordering screens open, and again by the server at checkout.
 */
import { lineKey, type OrderLineInput } from '../lines.ts';

export const ORDER_KEY = 'ceylontro-order-v1';
export const PENDING_KEY = 'ceylontro-order-pending-v1';
/** An order left untouched this long is cleared, so yesterday's order doesn't greet the guest. */
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export interface StoredLine extends OrderLineInput {
  key: string;
  name: string;
  unitCents: number;
  details: string[];
}

interface Saved {
  v: 1;
  updatedAt: number;
  lines: StoredLine[];
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private mode or storage full: the order still works for this page view. */
  }
}

let memory: StoredLine[] | null = null;

export function getLines(): StoredLine[] {
  if (memory) return memory;
  const saved = read<Saved>(ORDER_KEY);
  memory = saved?.v === 1 && Date.now() - saved.updatedAt < MAX_AGE_MS && Array.isArray(saved.lines) ? saved.lines : [];
  return memory;
}

export function setLines(lines: StoredLine[]): void {
  memory = lines;
  write(ORDER_KEY, lines.length ? ({ v: 1, updatedAt: Date.now(), lines } satisfies Saved) : null);
  window.dispatchEvent(new CustomEvent('order:change'));
}

export const itemCount = (lines: readonly StoredLine[] = getLines()): number =>
  lines.reduce((sum, line) => sum + line.qty, 0);

export const subtotal = (lines: readonly StoredLine[] = getLines()): number =>
  lines.reduce((sum, line) => sum + line.unitCents * line.qty, 0);

/** Adds a line, or raises the quantity of an identical one. */
export function addLine(line: Omit<StoredLine, 'key'>): void {
  const key = lineKey(line);
  const lines = getLines();
  const existing = lines.find((l) => l.key === key);
  setLines(
    existing
      ? lines.map((l) => (l === existing ? { ...l, qty: Math.min(l.qty + line.qty, 20) } : l))
      : [...lines, { ...line, key }],
  );
}

export function setQty(key: string, qty: number): void {
  const lines = getLines();
  setLines(qty <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 20) } : l)));
}

export const clearOrder = (): void => setLines([]);

/** What the confirmation page shows after Clover sends the guest back. */
export interface PendingOrder {
  ref: string;
  createdAt: number;
  name: string;
  email: string;
  pickup: { type: 'asap' | 'scheduled'; time: string; label: string };
  order: {
    lines: { name: string; qty: number; lineCents: number; details: string[]; note: string }[];
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
  };
}

export const getPending = (): PendingOrder | null => read<PendingOrder>(PENDING_KEY);
export const setPending = (pending: PendingOrder | null): void => write(PENDING_KEY, pending);
