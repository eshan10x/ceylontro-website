/**
 * Restaurant facts. Everything here must come from the owner.
 * `null` / empty = not supplied yet → hidden on the site and listed by the missing-facts report.
 *
 * To fill in a fact, replace its `null` with the owner's value, e.g.
 *   phone: '+1 416 555 0123',
 *   hours: { ...hours, monday: [{ opens: '11:30', closes: '21:00' }] },
 */
import type { OpeningHours, RestaurantInfo } from './types.ts';

const hours: OpeningHours = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

export const restaurant: RestaurantInfo = {
  name: 'Ceylontro Kitchen',
  tagline: 'Flavours Beyond Borders',
  address: null,
  phone: null,
  email: null,
  hours,
  ordering: {
    url: null,
    platformName: null,
    deliveryPartners: [],
  },
  social: [],
  domain: null,
  geo: null,
  acceptsReservations: null,
};
