/**
 * Resolves photo registry entries to optimised images. Photos live in `src/assets/photos/`.
 * Returns `image: null` when no file is set, so <Photo> renders the sized placeholder.
 */
import type { ImageMetadata } from 'astro';
import { photos } from './photos.ts';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/photos/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

export interface ResolvedPhoto {
  image: ImageMetadata | null;
  alt: string;
}

export function getPhoto(key: string | undefined): ResolvedPhoto {
  const entry = key ? photos[key] : undefined;
  if (!entry) return { image: null, alt: '' };
  const module = entry.file ? files[`/src/assets/photos/${entry.file}`] : undefined;
  if (entry.file && !module) {
    throw new Error(`Photo "${key}" points to "${entry.file}", which is not in src/assets/photos/.`);
  }
  return { image: module?.default ?? null, alt: entry.alt };
}
