/**
 * Site-wide configuration.
 *
 * Business facts (address, hours, phone, prices, story) arrive in phase B2 as typed
 * data files. Anything not yet supplied by the owner is `null` and is never shown
 * on the live site — never replace a `null` with a guess.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface OrderingConfig {
  /** The real online-ordering URL, once the owner supplies it. */
  url: string | null;
  /** Where Order Online points until `url` exists. */
  fallbackHref: string;
}

export const site = {
  name: 'Ceylontro Kitchen',
  tagline: 'Flavours Beyond Borders',
  /** Default meta description. Draft copy — awaiting owner approval. */
  description:
    'Ceylontro Kitchen — Sri Lankan, Asian and Western flavours, made with fresh ingredients. Flavours Beyond Borders.',
  locale: 'en_CA',
  lang: 'en-CA',
} as const;

export const navigation: readonly NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Menu', href: '/menu' },
  { label: 'Contact', href: '/contact' },
];

export const ordering: OrderingConfig = {
  url: null,
  fallbackHref: '/contact#order',
};

/** Resolved Order Online destination and whether it leaves the site. */
export function orderLink(): { href: string; external: boolean } {
  return ordering.url
    ? { href: ordering.url, external: true }
    : { href: ordering.fallbackHref, external: false };
}
