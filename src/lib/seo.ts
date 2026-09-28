/**
 * Search-engine rules shared by the pages, the sitemap and robots.txt, so they always agree.
 *
 * - Launch gate: until the owner's domain is set in `restaurant.ts`, every page is `noindex`
 *   and robots.txt disallows everything, so test and preview deployments are never indexed.
 * - A page with none of the owner's content yet (Our Story, Contact) stays `noindex`, and out
 *   of the sitemap, until that content exists.
 */
import { restaurant } from '@/data/restaurant';
import { story } from '@/data/story';
import { hasAnyHours } from '@/lib/format';

export const launched = restaurant.domain !== null;

/** Our Story has the owner's introduction or at least one written chapter. */
export const storyHasContent = (): boolean =>
  Boolean(story.intro) || story.chapters.some((chapter) => chapter.body !== null);

/** Contact has at least one of the owner's contact or ordering facts. */
export function contactHasFacts(): boolean {
  const { address, phone, email, social, ordering, hours } = restaurant;
  return Boolean(address || phone || email || social.length || ordering.url || hasAnyHours(hours));
}

export interface PublicPage {
  path: string;
  /** Crawl hint for the sitemap: the menu changes more often than the story. */
  changefreq: 'weekly' | 'monthly';
  priority: number;
  indexable: boolean;
}

/** Public pages in navigation order. The style guide and 404 are never listed. */
export function publicPages(): PublicPage[] {
  return [
    { path: '/', changefreq: 'weekly', priority: 1, indexable: true },
    { path: '/menu', changefreq: 'weekly', priority: 0.9, indexable: true },
    { path: '/our-story', changefreq: 'monthly', priority: 0.6, indexable: storyHasContent() },
    { path: '/contact', changefreq: 'monthly', priority: 0.8, indexable: contactHasFacts() },
  ];
}

/** Social sharing image (1200 × 630): the supplied logo on linen with the name and tagline. */
export const DEFAULT_OG_IMAGE = {
  path: '/og/ceylontro-kitchen.jpg',
  width: 1200,
  height: 630,
  alt: `${restaurant.name} logo — ${restaurant.tagline}`,
} as const;

/**
 * Clean public path for canonical and Open Graph URLs. The build writes `menu.html`, so during
 * the build `Astro.url.pathname` can be "/menu.html" or "/index.html"; the live URLs are
 * "/menu" and "/" (trailingSlash: 'never').
 */
export function cleanPath(pathname: string): string {
  const path = pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');
  return path || '/';
}
