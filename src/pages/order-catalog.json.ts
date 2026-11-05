/**
 * /order-catalog.json — the orderable menu for the ordering screens: dishes, choices, extras and
 * prices in cents (from `src/ordering/catalog.ts`), plus small optimised photos. Fetched only
 * when a guest starts an order. The server never trusts these prices; it rebuilds every order.
 */
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { buildCatalog } from '@/ordering/catalog';
import { getPhoto } from '@/data/images';

export const GET: APIRoute = async () => {
  const items = await Promise.all(
    buildCatalog().map(async (item) => {
      const photo = getPhoto(item.image ?? undefined);
      const [thumb, wide] = photo.image
        ? await Promise.all([
            getImage({ src: photo.image, width: 160, height: 160, fit: 'cover', format: 'webp', quality: 70 }),
            getImage({ src: photo.image, width: 800, height: 450, fit: 'cover', format: 'webp', quality: 72 }),
          ])
        : [null, null];
      return { ...item, thumb: thumb?.src ?? null, photo: wide?.src ?? null, alt: photo.alt };
    }),
  );
  return new Response(JSON.stringify({ items }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
