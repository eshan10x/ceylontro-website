/**
 * /robots.txt. Before launch (`src/config/launch.ts`) it disallows everything, so previews stay
 * out of search engines; after launch it points to the sitemap.
 */
import type { APIRoute } from 'astro';
import { launched } from '@/lib/seo';

export const GET: APIRoute = ({ site }) => {
  const lines =
    launched && site
      ? ['User-agent: *', 'Disallow: /styleguide', '', `Sitemap: ${new URL('/sitemap.xml', site).href}`]
      : ['# Not launched yet: see src/config/launch.ts.', 'User-agent: *', 'Disallow: /'];

  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
