/**
 * Short brand lines used across the site.
 * - `owner-menu`: printed on the owner's menu — approved.
 * - `draft`: written during design — needs the owner's approval before launch
 *   (the missing-facts report lists every draft line).
 */
import type { CopyLine } from './types.ts';

export const copy = {
  // From the owner's printed menu
  goodFood: { text: 'Good food brings people together', source: 'owner-menu', usedIn: 'Home hero, order band' },
  freshBold: { text: 'Fresh Ingredients · Bold Flavours · Always', source: 'owner-menu', usedIn: 'Menu intro' },
  freshlyFried: { text: 'Freshly fried · Freshly served', source: 'owner-menu', usedIn: 'Order band' },
  everythingFresh: { text: 'Everything is freshly fried and served', source: 'owner-menu', usedIn: 'Available for future use' },
  hotCrispy: { text: 'Hot · Crispy · Delicious', source: 'owner-menu', usedIn: 'Devilled Items card' },
  authentic: { text: 'Authentic Flavours', source: 'owner-menu', usedIn: 'Available for future use' },

  // Drafts awaiting owner approval
  heroSupport: {
    text: 'Sri Lankan heart, Asian fire, Western comfort — fresh ingredients and bold flavours, always.',
    source: 'draft',
    usedIn: 'Home hero support line',
  },
  favouritesHeading: { text: 'Made to be shared', source: 'draft', usedIn: 'Home "House favourites" heading' },
  storyHeading: {
    text: 'A table where cultures come together',
    source: 'draft',
    usedIn: 'Home story teaser, Our Story hero',
  },
  storyCta: { text: 'Taste the story', source: 'draft', usedIn: 'Our Story closing band' },
  contactHeading: { text: 'Say hello', source: 'draft', usedIn: 'Contact page title' },
  contactOrder: { text: 'Hungry already?', source: 'draft', usedIn: 'Contact ordering card' },
  menuIntro: {
    text: 'Nine categories — Sri Lankan, Asian and Western.',
    source: 'draft',
    usedIn: 'Menu intro',
  },
  metaDescription: {
    text: 'Ceylontro Kitchen — Sri Lankan, Asian and Western flavours, made with fresh ingredients. Flavours Beyond Borders.',
    source: 'draft',
    usedIn: 'Default search and social description',
  },
} as const satisfies Record<string, CopyLine>;
