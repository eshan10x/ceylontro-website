/**
 * Photo registry: every image slot on the site, keyed by id.
 *
 * A slot with `file: null` shows the sand placeholder at the correct ratio. To add a photo:
 *   1. put it in `src/assets/photos/` (large JPG or PNG, at least 2000 px on the long side);
 *   2. set `file` below (site slots) or in `menuPhotoFiles` (dish and category slots).
 * Dishes and the restaurant itself: the owner's own photographs only, never stock or AI.
 * AI-generated images are allowed only for atmosphere (ingredients, spices, surfaces) and are
 * marked `source: 'generated'`.
 */
import type { PhotoEntry } from './types.ts';
import { menu } from './menu.ts';

const sitePhotos: Record<string, PhotoEntry> = {
  'hero-dish': {
    alt: 'Stir-Fried Noodles with egg, carrot and long-cut green onion',
    file: 'stir-fried-noodles.jpg',
    ratio: '3:4 (arch crop)',
    source: 'owner',
  },
  'hero-side-dish': {
    alt: 'Fried Rice with diced carrot and green onion, served with chilli sauce and chilli flakes',
    file: 'fried-rice.jpg',
    ratio: '1:1 (round crop)',
    source: 'owner',
  },
  'featured-overhead': { alt: 'Ceylontro Kottu Special from above', file: null, ratio: '1:1' },
  'featured-detail': { alt: 'Close-up detail of Ceylontro Kottu Special', file: null, ratio: '3:4 (arch crop)' },
  'menu-intro': {
    alt: 'Whole spices: dried red chillies, curry leaves, cinnamon and cardamom',
    file: null, // mood image generated, awaiting download
    ratio: '4:5 (arch crop)',
    source: 'generated',
  },
  'menu-intro-side': {
    alt: 'Stir-fried vegetables: cauliflower, carrot, green beans and cabbage',
    file: 'stir-fried-vegetables.jpg',
    ratio: '1:1 (round crop)',
    source: 'owner',
  },
  'story-hero': {
    alt: 'Fresh leeks, carrots, chillies, tomatoes and cabbage on a chopping board',
    file: null, // mood image generated, awaiting download
    ratio: '4:5 (arch crop)',
    source: 'generated',
  },
  'story-origin': { alt: 'Ceylontro Kitchen', file: null, ratio: '3:2' },
  'story-kitchen': { alt: 'The kitchen at Ceylontro Kitchen', file: null, ratio: '3:2' },
  'story-canadian-journey': { alt: 'Ceylontro Kitchen in Canada', file: null, ratio: '3:2' },
  'contact-arch': {
    alt: 'Fresh limes, curry leaves and green chillies in a woven basket',
    file: null, // mood image generated, awaiting download
    ratio: '4:5 (arch crop)',
    source: 'generated',
  },
  'nav-dish': {
    alt: 'Fried Rice from Ceylontro Kitchen',
    file: 'fried-rice.jpg',
    ratio: '3:4 (small arch in the mobile menu)',
    source: 'owner',
  },
};

/** The owner's photographs for dish and category slots, by slot key. */
const menuPhotoFiles: Record<string, { file: string; alt?: string }> = {
  'fried-rice': { file: 'fried-rice.jpg' },
  'stir-fried-noodles': { file: 'stir-fried-noodles.jpg' },
  'category-devilled': { file: 'devilled.jpg', alt: 'A devilled dish tossed with onion, peppers and tomato' },
  'category-set-menus': {
    file: 'stir-fried-vegetables.jpg',
    alt: 'Stir-fried vegetable chop suey, served with every set menu',
  },
};

/** One entry per menu item and category, derived from the menu so nothing is forgotten. */
function menuPhotos(): Record<string, PhotoEntry> {
  const entries: Record<string, PhotoEntry> = {};
  const entry = (key: string, alt: string, ratio: string): PhotoEntry => {
    const owner = menuPhotoFiles[key];
    return owner ? { alt: owner.alt ?? alt, file: owner.file, ratio, source: 'owner' } : { alt, file: null, ratio };
  };
  for (const category of menu) {
    if (category.image) {
      entries[category.image] = entry(category.image, `${category.name} at Ceylontro Kitchen`, '4:5 (arch crop)');
    }
    for (const item of category.items) {
      if (item.image) {
        const ratio = item.combo ? '4:5 (arch crop)' : item.featured ? '4:3' : '1:1';
        entries[item.image] = entry(item.image, item.name, ratio);
      }
    }
  }
  return entries;
}

export const photos: Readonly<Record<string, PhotoEntry>> = { ...menuPhotos(), ...sitePhotos };
