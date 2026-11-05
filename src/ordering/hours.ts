/**
 * When online orders are taken, and the pickup times on offer, in the restaurant's time zone.
 *
 * - Orders are taken from opening time until the last order time (closing minus
 *   `lastOrderBeforeCloseMinutes`): 11:00 – 22:50 with the current hours.
 * - "As soon as possible" is ready about `prepMinutes` after the order.
 * - Scheduled pickup is later the same day, every `slotStepMinutes`, from the first slot at least
 *   `prepMinutes` away until the last order time plus `prepMinutes`.
 * - No pre-ordering while closed.
 *
 * Opening periods that run past midnight are not supported (the owner's hours don't).
 */
import { ORDERING } from './config.ts';
import { restaurant } from '../data/restaurant.ts';
import type { OpeningHours, Weekday } from '../data/types.ts';

const DAYS: readonly Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export interface ZonedNow {
  weekday: Weekday;
  /** Minutes since local midnight. */
  minutes: number;
  /** Local calendar date, "2026-11-05". */
  date: string;
}

const toMinutes = (time: string): number => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};

/** "18:45" from minutes since midnight. */
export const toClock = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** The current weekday, time and date in the restaurant's time zone. */
export function zonedNow(now: Date = new Date(), timeZone: string = ORDERING.timeZone): ZonedNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    weekday: String(parts['weekday']).toLowerCase() as Weekday,
    minutes: Number(parts['hour']) * 60 + Number(parts['minute']),
    date: `${parts['year']}-${parts['month']}-${parts['day']}`,
  };
}

export interface OrderingWindow {
  /** Orders can be placed right now. */
  open: boolean;
  /** Today's ordering period, if the restaurant opens today. */
  today: { opens: number; lastOrder: number; closes: number } | null;
  /** When ordering opens next: today later, or the next day with hours. */
  next: { weekday: Weekday; minutes: number; isToday: boolean } | null;
}

function periodsFor(hours: OpeningHours, weekday: Weekday) {
  return (hours[weekday] ?? [])
    .map((p) => ({ opens: toMinutes(p.opens), closes: toMinutes(p.closes) }))
    .filter((p) => p.closes > p.opens)
    .map((p) => ({ ...p, lastOrder: p.closes - ORDERING.lastOrderBeforeCloseMinutes }));
}

export function orderingWindow(now: Date = new Date(), hours: OpeningHours = restaurant.hours): OrderingWindow {
  const local = zonedNow(now);
  const periods = periodsFor(hours, local.weekday);
  const current = periods.find((p) => local.minutes >= p.opens && local.minutes <= p.lastOrder) ?? null;
  const laterToday = periods.find((p) => p.opens > local.minutes) ?? null;

  let next: OrderingWindow['next'] = null;
  if (laterToday) next = { weekday: local.weekday, minutes: laterToday.opens, isToday: true };
  else {
    const start = DAYS.indexOf(local.weekday);
    for (let i = 1; i <= 7 && !next; i++) {
      const weekday = DAYS[(start + i) % 7] as Weekday;
      const first = periodsFor(hours, weekday)[0];
      if (first) next = { weekday, minutes: first.opens, isToday: false };
    }
  }

  return {
    open: ORDERING.enabled && current !== null,
    today: current ?? laterToday ?? periods[0] ?? null,
    next,
  };
}

export interface PickupOptions {
  /** Ready time for "as soon as possible", minutes since midnight. */
  asap: number;
  /** Scheduled pickup times, minutes since midnight. */
  slots: number[];
}

/** Pickup times on offer right now, or null while ordering is closed. */
export function pickupOptions(now: Date = new Date(), hours: OpeningHours = restaurant.hours): PickupOptions | null {
  const window = orderingWindow(now, hours);
  if (!window.open || !window.today) return null;
  const { minutes } = zonedNow(now);
  const step = ORDERING.slotStepMinutes;
  const asap = minutes + ORDERING.prepMinutes;
  const latest = window.today.lastOrder + ORDERING.prepMinutes;
  const slots: number[] = [];
  for (let t = Math.ceil((asap + 1) / step) * step; t <= latest && t < 24 * 60; t += step) slots.push(t);
  return { asap, slots };
}

export type PickupRequest = { type: 'asap' } | { type: 'scheduled'; time: string };

/** Server-side check of the guest's pickup choice. Returns the ready time in minutes, or an error. */
export function checkPickup(
  request: unknown,
  now: Date = new Date(),
  hours: OpeningHours = restaurant.hours,
): { ok: true; minutes: number; type: 'asap' | 'scheduled' } | { ok: false; error: 'closed' | 'invalid_pickup' } {
  const options = pickupOptions(now, hours);
  if (!options) return { ok: false, error: 'closed' };
  const req = request as Partial<{ type: string; time: string }> | null;
  if (req?.type === 'asap') return { ok: true, minutes: options.asap, type: 'asap' };
  if (req?.type === 'scheduled' && typeof req.time === 'string' && /^\d{2}:\d{2}$/.test(req.time)) {
    const minutes = toMinutes(req.time);
    if (options.slots.includes(minutes)) return { ok: true, minutes, type: 'scheduled' };
  }
  return { ok: false, error: 'invalid_pickup' };
}
