/**
 * Formatting helpers for restaurant facts (hours, address, phone).
 * Pure functions with no Astro imports, shared by the shell, Home and Contact.
 * Output follows Canadian English style: "11:30 a.m. – 9 p.m.", "Mon – Thu".
 */
import type { Address, OpeningHours, OpeningPeriod, Weekday } from '@/data/types';

export const WEEKDAYS: readonly Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const SHORT: Record<Weekday, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const LONG: Record<Weekday, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/** JavaScript's Date#getDay() number for each weekday (Sunday = 0). */
export const JS_DAY: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const dayName = (day: Weekday, style: 'short' | 'long' = 'long'): string =>
  style === 'short' ? SHORT[day] : LONG[day];

/** "11:30" → "11:30 a.m.", "21:00" → "9 p.m.", "12:00" → "noon", "00:00" → "midnight". */
export function formatTime(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  if (m === 0 && h === 12) return 'noon';
  if (m === 0 && (h === 0 || h === 24)) return 'midnight';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 || h === 24 ? 'a.m.' : 'p.m.';
  return `${hour12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${suffix}`;
}

/** Periods for one day as text, e.g. "11:30 a.m. – 2 p.m., 5 – 9 p.m."; empty list = "Closed". */
export function formatPeriods(periods: readonly OpeningPeriod[]): string {
  if (!periods.length) return 'Closed';
  return periods.map((p) => `${formatTime(p.opens)} – ${formatTime(p.closes)}`).join(', ');
}

export const hasAnyHours = (hours: OpeningHours): boolean => WEEKDAYS.some((day) => hours[day] !== null);

export interface HoursRow {
  /** "Mon – Thu", "Fri" */
  label: string;
  /** Screen-reader friendly label, "Monday to Thursday". */
  longLabel: string;
  text: string;
  days: readonly Weekday[];
}

/**
 * Groups consecutive days with identical hours. Days not supplied yet (null) are skipped,
 * so a partial timetable never shows a guessed value.
 */
export function groupHours(hours: OpeningHours): HoursRow[] {
  const rows: HoursRow[] = [];
  let run: Weekday[] = [];
  let runText = '';

  const flush = () => {
    const first = run[0];
    const last = run[run.length - 1];
    if (!first || !last) return;
    const multi = run.length > 1;
    rows.push({
      label: multi ? `${SHORT[first]} – ${SHORT[last]}` : SHORT[first],
      longLabel: multi ? `${LONG[first]} to ${LONG[last]}` : LONG[first],
      text: runText,
      days: run,
    });
    run = [];
  };

  for (const day of WEEKDAYS) {
    const periods = hours[day];
    if (periods === null) {
      flush();
      continue;
    }
    const text = formatPeriods(periods);
    if (run.length && text !== runText) flush();
    runText = text;
    run.push(day);
  }
  flush();
  return rows;
}

/** Postal address as display lines. */
export function addressLines(address: Address): string[] {
  const street = address.unit ? `${address.unit} – ${address.street}` : address.street;
  return [street, `${address.city}, ${address.province} ${address.postalCode}`];
}

/** "+1 (416) 555-0123" → "tel:+14165550123" */
export const phoneHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** Normalises a path for "current page" checks: no ".html", no trailing slash. */
export function normalisePath(path: string): string {
  const clean = path.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

export function isCurrent(href: string, pathname: string): boolean {
  const path = normalisePath(pathname);
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
}
