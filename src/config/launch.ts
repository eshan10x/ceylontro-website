/**
 * The launch switch. While `false`, every page is `noindex`, robots.txt disallows everything
 * and the sitemap is empty, so previews (and the live domain before launch day) stay out of
 * search engines. Set to `true` on launch day, once the owner approves the site.
 *
 * Indexing also needs `domain` in `src/data/restaurant.ts`, because sitemap and canonical
 * URLs must be absolute.
 */
export const LAUNCHED = false;
