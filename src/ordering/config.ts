/**
 * Online ordering settings (B9). Every value is an owner decision, recorded in the project plan
 * ("B9 Online ordering — Decisions needed", 2026-11-05). Change them here only.
 *
 * Shared by the browser (Menu, checkout) and the server (`worker/`), so both apply the same rules.
 */
interface OrderingSettings {
  readonly enabled: boolean;
  readonly enforceHours: boolean;
  readonly mode: 'pickup';
  readonly payment: 'at_pickup' | 'online';
  readonly prepMinutes: number;
  readonly lastOrderBeforeCloseMinutes: number;
  readonly slotStepMinutes: number;
  readonly timeZone: string;
  readonly tax: { readonly name: string; readonly percent: number };
  readonly tips: boolean;
  readonly notes: { readonly allowed: boolean; readonly maxLength: number };
  readonly maxQuantityPerLine: number;
  readonly maxLines: number;
}

export const ORDERING: OrderingSettings = {
  /** Master switch. `false` hides every Add button and the order UI; Order Online goes to Contact. */
  enabled: true,
  /** Pickup only for now (owner, 2026-11-05). Delivery is not built. */
  mode: 'pickup',
  /**
   * How guests pay. 'at_pickup' (owner, 2026-11-07): the order goes straight onto the Clover POS
   * and prints in the kitchen; the guest pays the cashier on collection. 'online': pay first on
   * Clover's Hosted Checkout page (built, waiting for Clover to enable online card payments).
   */
  payment: 'at_pickup',
  /**
   * Take orders only during opening hours (11:00 – 22:50). TESTING: off while the owner tests on
   * the `feature/online-ordering` branch, so ordering is open around the clock.
   * MUST be `true` before going live (O5); the build warns while it is off.
   */
  enforceHours: false,
  /** Usual preparation time, used for "as soon as possible" and the first pickup slot. */
  prepMinutes: 20,
  /** Last order is 10 minutes before closing: 22:50 with the current 11 a.m. – 11 p.m. hours. */
  lastOrderBeforeCloseMinutes: 10,
  /** Spacing of scheduled pickup times. */
  slotStepMinutes: 15,
  /** The restaurant's time zone; all hours are read in it, wherever the guest is. */
  timeZone: 'America/Toronto',
  /** Ontario HST, 13% on food (owner, 2026-11-05). */
  tax: { name: 'HST', percent: 13 },
  /** Tips are off for now. */
  tips: false,
  /** Optional special instructions per dish (owner: allowed), and one note for the kitchen. */
  notes: { allowed: true, maxLength: 140 },
  maxQuantityPerLine: 20,
  maxLines: 30,
};
