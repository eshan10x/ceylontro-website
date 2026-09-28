/**
 * Schema.org structured data (JSON-LD), built only from verified data.
 *
 * Every property comes from `src/data/`: a fact the owner has not supplied is left out, never
 * guessed. The Restaurant node (Home and Contact) points to the menu with `hasMenu`; the Menu
 * node is on /menu.
 */
import { menu } from '@/data/menu';
import { restaurant } from '@/data/restaurant';
import type { DietaryTag, MenuItem, OpeningHours, Weekday } from '@/data/types';
import { WEEKDAYS, dayName } from '@/lib/format';

type Json = Record<string, unknown>;

const DIETS: Partial<Record<DietaryTag, string>> = {
  vegetarian: 'https://schema.org/VegetarianDiet',
};

/** Drops keys whose value is null, undefined or an empty array. */
function compact(object: Json): Json {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value != null && !(Array.isArray(value) && value.length === 0)),
  );
}

const absolute = (path: string, site: URL | undefined): string | undefined =>
  site ? new URL(path, site).href : undefined;

export const restaurantId = (site: URL | undefined): string | undefined => absolute('/#restaurant', site);

/** "$14.99" → "14.99". Anything that is not a single plain amount is left out. */
export function priceValue(price: string | null): string | undefined {
  const match = price?.trim().match(/^(?:CA)?\$\s?(\d+(?:\.\d{2})?)$/);
  return match?.[1];
}

function openingHours(hours: OpeningHours): Json[] {
  return WEEKDAYS.flatMap((day: Weekday) =>
    (hours[day] ?? []).map((period) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${dayName(day)}`,
      opens: period.opens,
      closes: period.closes,
    })),
  );
}

export function restaurantJsonLd(site: URL | undefined, images: { logo: string; social: string }): Json {
  const { address, geo, ordering } = restaurant;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': restaurantId(site),
    name: restaurant.name,
    slogan: restaurant.tagline,
    url: absolute('/', site),
    logo: absolute(images.logo, site),
    image: absolute(images.social, site),
    servesCuisine: restaurant.cuisines,
    hasMenu: absolute('/menu', site),
    telephone: restaurant.phone,
    email: restaurant.email,
    address: address && {
      '@type': 'PostalAddress',
      streetAddress: [address.street, address.unit].filter(Boolean).join(', '),
      addressLocality: address.city,
      addressRegion: address.province,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    geo: geo && { '@type': 'GeoCoordinates', latitude: geo.latitude, longitude: geo.longitude },
    openingHoursSpecification: openingHours(restaurant.hours),
    acceptsReservations: restaurant.acceptsReservations,
    sameAs: restaurant.social.map((link) => link.url),
    potentialAction: ordering.url && {
      '@type': 'OrderAction',
      target: { '@type': 'EntryPoint', urlTemplate: ordering.url },
    },
  });
}

function menuItem(item: MenuItem, site: URL | undefined): Json {
  const price = priceValue(item.price);
  const diets = item.tags.flatMap((tag) => DIETS[tag] ?? []);
  return compact({
    '@type': 'MenuItem',
    '@id': absolute(`/menu#${item.id}`, site),
    name: item.name,
    description: item.description,
    offers: price && { '@type': 'Offer', price, priceCurrency: 'CAD' },
    suitableForDiet: diets.length === 1 ? diets[0] : diets,
  });
}

export function menuJsonLd(site: URL | undefined): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': absolute('/menu#menu', site),
    name: `${restaurant.name} menu`,
    url: absolute('/menu', site),
    inLanguage: 'en-CA',
    hasMenuSection: menu.map((category) =>
      compact({
        '@type': 'MenuSection',
        '@id': absolute(`/menu#${category.id}`, site),
        name: category.name,
        description: category.intro,
        hasMenuItem: category.items.map((item) => menuItem(item, site)),
      }),
    ),
  });
}
