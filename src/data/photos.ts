/**
 * Photo registry: every image slot on the site, keyed by id.
 *
 * All `file` values are `null` until the owner's real photography arrives; the site then
 * shows the sand placeholder at the correct ratio. To add a photo:
 *   1. put it in `src/assets/photos/` (large JPG or PNG, at least 2000 px on the long side);
 *   2. set `file` to its file name below.
 * Never use stock or AI images as Ceylontro's own food.
 */
import type { PhotoEntry } from './types.ts';
import { menu } from './menu.ts';

const sitePhotos: Record<string, PhotoEntry> = {
  'hero-dish': { alt: 'Ceylontro Kottu Special, close up', file: null, ratio: '3:4 (arch crop)' },
  'hero-side-dish': { alt: 'A side dish from Ceylontro Kitchen', file: null, ratio: '1:1 (round crop)' },
  'featured-overhead': { alt: 'Ceylontro Kottu Special from above', file: null, ratio: '1:1' },
  'featured-detail': { alt: 'Close-up detail of Ceylontro Kottu Special', file: null, ratio: '3:4 (arch crop)' },
  'menu-intro': { alt: 'A spread of Ceylontro Kitchen dishes', file: null, ratio: '4:5 (arch crop)' },
  'story-hero': { alt: 'Inside Ceylontro Kitchen', file: null, ratio: '4:5 (arch crop)' },
  'story-origin': { alt: 'Ceylontro Kitchen', file: null, ratio: '3:2' },
  'story-kitchen': { alt: 'The kitchen at Ceylontro Kitchen', file: null, ratio: '3:2' },
  'story-canadian-journey': { alt: 'Ceylontro Kitchen in Canada', file: null, ratio: '3:2' },
  'contact-dining-room': { alt: 'The Ceylontro Kitchen dining room', file: null, ratio: '4:5 (arch crop)' },
};

/** One entry per menu item and category, derived from the menu so nothing is forgotten. */
function menuPhotos(): Record<string, PhotoEntry> {
  const entries: Record<string, PhotoEntry> = {};
  for (const category of menu) {
    if (category.image) {
      entries[category.image] = { alt: `${category.name} at Ceylontro Kitchen`, file: null, ratio: '4:5 (arch crop)' };
    }
    for (const item of category.items) {
      if (item.image) {
        entries[item.image] = { alt: item.name, file: null, ratio: item.featured ? '4:3' : '1:1' };
      }
    }
  }
  return entries;
}

export const photos: Readonly<Record<string, PhotoEntry>> = { ...menuPhotos(), ...sitePhotos };
