/**
 * Content types for Ceylontro Kitchen.
 *
 * Rules that apply to every data file:
 * - Only the owner's own material goes in: the printed menu, the logo, and facts the owner sends.
 * - Anything not supplied yet is `null` (or an empty list). The site hides it; it is never guessed.
 * - Anything supplied but questionable keeps the owner's wording and gets a `confirm` note,
 *   which the missing-facts report lists until it is resolved.
 */

/** Markers the site may show. Only set one when the owner's menu or the owner confirms it. */
export type DietaryTag = 'spicy' | 'vegetarian';

/** Where a piece of copy came from. Drafts need the owner's approval before launch. */
export type CopySource = 'owner-menu' | 'owner' | 'draft';

export interface MenuItem {
  /** Stable, URL-safe id. Never change it once published (used for anchors and images). */
  id: string;
  /** Display name, in title case. */
  name: string;
  /** The name exactly as printed, when the display name differs only in letter case or spacing. */
  printedName?: string;
  /** Description exactly as printed on the owner's menu. */
  description?: string;
  /** Price as it should appear, e.g. "$14.99". `null` until the owner supplies it. */
  price: string | null;
  /** Key into the photo registry (`photos.ts`). */
  image?: string;
  /** Choices the guest picks from (e.g. proteins, sauces). */
  options?: readonly MenuOptionGroup[];
  /** Optional extras, e.g. "Add on cheese slice". */
  addOns?: readonly string[];
  tags: readonly DietaryTag[];
  /** Shown as the category's large featured card. At most one per category. */
  featured?: boolean;
  /** Open questions for the owner about this item. Listed by the missing-facts report. */
  confirm?: readonly string[];
}

export interface MenuOptionGroup {
  /** e.g. "Protein", "Sauce", "Side". */
  label: string;
  values: readonly string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  /** Short line shown under the category heading, as printed. */
  intro?: string;
  /** Options shared by every item in the category (e.g. the protein choice for Rice & Noodles). */
  sharedOptions?: readonly MenuOptionGroup[];
  /** Portion sizes that apply to the whole category (e.g. wings by the pound). */
  sizes?: readonly string[];
  /** Key into the photo registry for the category banner/arch. */
  image?: string;
  items: readonly MenuItem[];
  confirm?: readonly string[];
}

/** Flattened item with its category, matching the MenuItem shape in the project instructions. */
export interface MenuItemWithCategory extends MenuItem {
  category: string;
  categoryName: string;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  province: string;
  postalCode: string;
  country: 'CA';
  /** Link that opens directions (e.g. a Google Maps place URL). */
  directionsUrl?: string;
}

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** One opening period in 24-hour time, e.g. { opens: '11:30', closes: '21:00' }. */
export interface OpeningPeriod {
  opens: string;
  closes: string;
}

/**
 * Opening hours per day. `null` = not supplied yet; an empty array = closed that day.
 */
export type OpeningHours = Record<Weekday, readonly OpeningPeriod[] | null>;

export interface SocialLink {
  network: 'instagram' | 'facebook' | 'tiktok' | 'google' | 'x' | 'youtube' | 'other';
  label: string;
  url: string;
}

export interface OrderingInfo {
  /** The real online-ordering URL. */
  url: string | null;
  /** Platform or service name, e.g. the ordering provider. */
  platformName: string | null;
  /** Delivery partners the owner confirms, if any. */
  deliveryPartners: readonly { name: string; url: string }[];
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  address: Address | null;
  phone: string | null;
  email: string | null;
  hours: OpeningHours;
  ordering: OrderingInfo;
  social: readonly SocialLink[];
  /** Production domain, e.g. "https://www.example.ca". */
  domain: string | null;
  /** Only when the owner provides it; used for the map and JSON-LD. */
  geo: { latitude: number; longitude: number } | null;
  /** Only when the owner confirms these are accepted. */
  acceptsReservations: boolean | null;
}

export interface StoryChapter {
  id: string;
  number: string;
  /** Working title from the design; the owner may rename it. */
  title: string;
  titleIsWorking: boolean;
  /** Paragraphs from the owner. `null` hides the chapter. */
  body: readonly string[] | null;
  image?: string;
}

export interface StoryContent {
  intro: readonly string[] | null;
  chapters: readonly StoryChapter[];
}

export interface CopyLine {
  text: string;
  source: CopySource;
  /** Where it is used, for the owner's review. */
  usedIn: string;
}

export interface PhotoEntry {
  /** Descriptive alt text; describes the dish, never claims it is a photo when it is a placeholder. */
  alt: string;
  /**
   * File name under `src/assets/photos/`, e.g. "kottu-special.jpg".
   * `null` until the owner's real photograph is added.
   */
  file: string | null;
  /** Crop guidance for the photographer and for art direction. */
  ratio: string;
}
