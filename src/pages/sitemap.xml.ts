/**
 * /sitemap.xml — the indexable public pages. Empty until the owner's domain is set, because
 * sitemap URLs must be absolute and nothing is indexed before launch.
 */
import type { APIRoute } from 'astro';
import { launched, publicPages } from '@/lib/seo';

export const GET: APIRoute = ({ site }) => {
  const urls =
    launched && site
      ? publicPages()
          .filter((page) => page.indexable)
          .map(
            (page) =>
              `  <url>\n    <loc>${new URL(page.path, site).href}</loc>\n` +
              `    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority.toFixed(1)}</priority>\n  </url>`,
          )
      : [];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
