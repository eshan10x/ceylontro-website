/**
 * Restaurant facts. Everything here must come from the owner.
 * `null` / empty = not supplied yet → hidden on the site and listed by the missing-facts report.
 *
 * To fill in a fact, replace its `null` with the owner's value, e.g.
 *   phone: '+1 416 555 0123',
 *   hours: { ...hours, monday: [{ opens: '11:30', closes: '21:00' }] },
 */
import type { OpeningHours, RestaurantInfo } from './types.ts';

// From the owner (2026-10-31): open 11 a.m. – 11 p.m., every day.
const hours: OpeningHours = {
  monday: [{ opens: '11:00', closes: '23:00' }],
  tuesday: [{ opens: '11:00', closes: '23:00' }],
  wednesday: [{ opens: '11:00', closes: '23:00' }],
  thursday: [{ opens: '11:00', closes: '23:00' }],
  friday: [{ opens: '11:00', closes: '23:00' }],
  saturday: [{ opens: '11:00', closes: '23:00' }],
  sunday: [{ opens: '11:00', closes: '23:00' }],
};

export const restaurant: RestaurantInfo = {
  name: 'Ceylontro Kitchen',
  tagline: 'Flavours Beyond Borders',
  // From the owner's menu V1.2. The postal code is not printed yet.
  address: {
    street: '1708 Eglinton Avenue West',
    city: 'York',
    province: 'ON',
    postalCode: null,
    country: 'CA',
  },
  phone: '(416) 783-8872',
  email: 'ceylontrokitchen@gmail.com',
  hours,
  ordering: {
    url: null,
    platformName: null,
    deliveryPartners: [],
  },
  social: [
    { network: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/ceylontro_kitchen.ca/' },
    { network: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/people/Ceylontro-Kitchen/61594937559596/' },
  ],
  // Printed on the menu V1.2 as "ceylontrokitchen.com".
  domain: 'https://ceylontrokitchen.com',
  // From the owner's brief: a fusion menu with strong Sri Lankan, Asian and Western influences.
  cuisines: ['Sri Lankan', 'Asian', 'Western'],
  geo: null,
  acceptsReservations: null,
};
