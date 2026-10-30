/**
 * Photo registry: every image slot on the site, keyed by id.
 *
 * A slot with `file: null` shows the sand placeholder at the correct ratio. To add a photo:
 *   1. put it in `src/assets/photos/` (large JPG or PNG, at least 2000 px on the long side);
 *   2. set `file` below (site slots) or in `menuPhotoFiles` (dish and category slots).
 * Every file records its `source` (owner, licensed stock, or generated). Generated dish images
 * are owner-approved stand-ins until the restaurant's own photos arrive; the restaurant itself,
 * its kitchen and its people are never generated.
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
  'featured-overhead': {
    alt: 'Ceylontro Kottu Special from above',
    file: 'kottu-overhead.jpg',
    ratio: '1:1',
    source: 'generated',
  },
  'featured-detail': {
    alt: 'Close-up detail of Ceylontro Kottu Special',
    file: 'kottu-detail.jpg',
    ratio: '3:4 (arch crop)',
    source: 'generated',
  },
  // Menu intro: two plates cut out of their backgrounds (transparent PNG) so they sit on the linen.
  'menu-intro-plate-back': {
    alt: 'Ceylontro Kottu Special with a bowl of Sri Lankan curry gravy',
    file: 'cutout-kottu-special.png',
    ratio: 'Cut-out (transparent background), plate at about 45°',
    source: 'generated',
  },
  'menu-intro-plate-front': {
    alt: 'Special Nasi Goreng topped with a fried egg, with chicken satay',
    file: 'cutout-nasi-goreng.png',
    ratio: 'Cut-out (transparent background), plate at about 45°',
    source: 'generated',
  },
  // Our Story mural (Higgsfield, 2026-10-31): Sri Lanka on the left, the crossing, Canada on the right.
  'story-mural': {
    alt: 'Carved mural of a journey from Sri Lanka to Canada: tea hills, spices and an oruwa canoe, a ship crossing the ocean, a Canadian lake with autumn maples, and the Toronto skyline',
    file: 'story-mural.jpg',
    ratio: 'Wide panorama (21:9), centred; edges fade into the page',
    source: 'generated',
  },
  'story-origin': { alt: 'Ceylontro Kitchen', file: null, ratio: '3:2' },
  'story-kitchen': {
    alt: 'The kitchen at Ceylontro Kitchen',
    file: null,
    ratio: '3:2',
  },
  'story-canadian-journey': {
    alt: 'Ceylontro Kitchen in Canada',
    file: null,
    ratio: '3:2',
  },
  // Recreated at 3840 px from the owner's menu V1.2 mural (Higgsfield, 2026-10-31), composed for
  // this intro: quiet plaster on the left and at the edges, the landmarks in arched panels to the right.
  'contact-mural': {
    alt: 'Carved mural of Sri Lankan landmarks in arched panels: a ceremonial elephant, Sigiriya, the Nine Arches Bridge, a lighthouse and the Temple of the Tooth',
    file: 'contact-mural.jpg',
    ratio: 'Wide panorama (21:9); edges fade into the page',
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
const menuPhotoFiles: Record<string, { file: string; alt?: string; source?: PhotoEntry['source'] }> = {
  'fried-rice': { file: 'fried-rice.jpg' },
  'stir-fried-noodles': { file: 'stir-fried-noodles.jpg' },
  wings: {
    file: 'wings.jpg',
    alt: 'A platter of sauce-glazed chicken wings',
    source: 'licensed',
  },
  // Generated stand-ins approved by the owner (2026-10-28); replace with the restaurant's own photos.
  'ceylontro-kottu-special': {
    file: 'ceylontro-kottu-special.jpg',
    alt: 'Ceylontro Kottu Special: chopped roti stir-fried with vegetables and curry gravy',
    source: 'generated',
  },
  'pilawoos-cheese-kottu': {
    file: 'pilawoos-cheese-kottu.jpg',
    alt: 'Pilawoos Cheese Kottu with melted cheese',
    source: 'generated',
  },
  'special-nasi-goreng': {
    file: 'special-nasi-goreng.jpg',
    alt: 'Special Nasi Goreng topped with a fried egg, with chicken satay',
    source: 'generated',
  },
  'chilli-chicken': {
    file: 'chilli-chicken.jpg',
    alt: 'Chilli Chicken tossed with dry chilli and green onion',
    source: 'generated',
  },
  'hot-butter-cuttlefish': {
    file: 'hot-butter-cuttlefish.jpg',
    alt: 'Hot Butter Cuttlefish with dry chilli and green onion',
    source: 'generated',
  },
  'stir-fried-cuttlefish': {
    file: 'stir-fried-cuttlefish.jpg',
    alt: 'Stir-Fried Cuttlefish with ginger, garlic and dry chilli',
    source: 'generated',
  },
  'chefs-chilli-chicken-wings': {
    file: 'chefs-chilli-chicken-wings.jpg',
    alt: 'Chef’s Chilli Chicken Wings with spring onion',
    source: 'generated',
  },
  'wings-and-fries-combo': {
    file: 'wings-and-fries-combo.jpg',
    alt: 'Wings and fresh-cut fries with garden crunch sticks and dip',
    source: 'generated',
  },
  'ceylontro-classic-beef-burger': {
    file: 'ceylontro-classic-beef-burger.jpg',
    alt: 'Ceylontro Classic Beef Burger on a brioche bun with fries',
    source: 'generated',
  },
  'nashville-hot-chicken-burger': {
    file: 'nashville-hot-chicken-burger.jpg',
    alt: 'Nashville Hot Chicken Burger with pickles and coleslaw, with fries',
    source: 'generated',
  },
  quesadillas: {
    file: 'quesadillas.jpg',
    alt: 'Quesadillas with house-made salsa and sour cream',
    source: 'generated',
  },
  'category-devilled': {
    file: 'devilled.jpg',
    alt: 'A devilled dish tossed with onion, peppers and tomato',
  },
  // The owner's file is named Prawns_devilled, so it is the Shrimp Devilled dish.
  'shrimp-devilled': { file: 'devilled.jpg', alt: 'Shrimp Devilled tossed with onion, peppers and tomato' },
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
    return owner
      ? {
          alt: owner.alt ?? alt,
          file: owner.file,
          ratio,
          source: owner.source ?? 'owner',
        }
      : { alt, file: null, ratio };
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
  // A category without its own photo borrows one from its dishes, the featured dish first.
  for (const category of menu) {
    const slot = category.image ? entries[category.image] : undefined;
    if (!slot || slot.file) continue;
    const donor = [...category.items]
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .map((item) => (item.image ? entries[item.image] : undefined))
      .find((photo) => photo?.file);
    if (donor)
      entries[category.image!] = {
        ...slot,
        file: donor.file,
        alt: donor.alt,
        ...(donor.source ? { source: donor.source } : {}),
      };
  }
  return entries;
}

export const photos: Readonly<Record<string, PhotoEntry>> = {
  ...menuPhotos(),
  ...sitePhotos,
};
