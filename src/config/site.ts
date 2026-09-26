/**
 * Site-wide configuration. Restaurant facts live in `src/data/`; this file only wires them
 * into navigation, metadata and the Order Online destination.
 */
import { copy } from '@/data/copy';
import { restaurant } from '@/data/restaurant';

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

/** Resolved Order Online destination and whether it leaves the site. */
export function orderLink(): { href: string; external: boolean } {
  const url = restaurant.ordering.url;
  return url ? { href: url, external: true } : { href: ORDER_FALLBACK_HREF, external: false };
}
