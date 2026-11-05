/**
 * Site-wide configuration. Restaurant facts live in `src/data/`; this file only wires them
 * into navigation, metadata and the Order Online destination.
 */
import { copy } from '@/data/copy';
import { restaurant } from '@/data/restaurant';
import { ORDERING } from '@/ordering/config';

export interface NavLink {
  label: string;
  href: string;
}

export const site = {
  name: restaurant.name,
  tagline: restaurant.tagline,
  description: copy.metaDescription.text,
  locale: 'en_CA',
  lang: 'en-CA',
} as const;

export const navigation: readonly NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Menu', href: '/menu' },
  { label: 'Contact', href: '/contact' },
];

/** Where Order Online points until the owner supplies the real ordering URL. */
export const ORDER_FALLBACK_HREF = '/contact#order';

/** Where Order Online points while the website's own ordering is on (B9): the top of the Menu. */
export const ORDER_ON_SITE_HREF = '/menu#order-start';

/** Resolved Order Online destination and whether it leaves the site. */
export function orderLink(): { href: string; external: boolean } {
  if (ORDERING.enabled) return { href: ORDER_ON_SITE_HREF, external: false };
  const url = restaurant.ordering.url;
  return url ? { href: url, external: true } : { href: ORDER_FALLBACK_HREF, external: false };
}
