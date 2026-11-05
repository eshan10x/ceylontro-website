/**
 * The orderable menu: `src/data/menu.ts` turned into items with prices in cents and stable ids for
 * every choice and extra. The browser uses it to build orders; the server uses the same function
 * to rebuild every order from the website's own prices, so a price sent by a browser is never
 * trusted.
 *
 * - Choices (`options`, `sharedOptions`) are required: pick exactly one, included in the price.
 * - Extras (`extras`, `sharedExtras`) are optional: any number, each adds its printed price.
 * - A dish without a printed price cannot be ordered.
 */
import { menu } from '../data/menu.ts';
import type { MenuCategory, MenuExtraGroup, MenuItem, MenuOptionGroup } from '../data/types.ts';

export interface CatalogValue {
  id: string;
  label: string;
  /** 0 for choices; the printed price for extras. */
  priceCents: number;
}

export interface CatalogGroup {
  id: string;
  label: string;
  kind: 'choice' | 'extra';
  values: readonly CatalogValue[];
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  priceCents: number;
  groups: readonly CatalogGroup[];
  /** Key into the photo registry. */
  image: string | null;
}

/** "$13.99" → 1399, "+$2" → 200. Returns null for anything that is not a plain dollar amount. */
export function parsePrice(price: string | null | undefined): number | null {
  if (!price) return null;
  const match = /^\+?\$(\d{1,4})(?:\.(\d{2}))?$/.exec(price.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number(match[2] ?? 0);
}

/** "Fresh-cut fries" → "fresh-cut-fries", "Chicken & shrimp" → "chicken-shrimp". */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function choiceGroup(group: MenuOptionGroup): CatalogGroup {
  return {
    id: `choice-${slug(group.label)}`,
    label: group.label,
    kind: 'choice',
    values: group.values.map((value) => ({ id: slug(value), label: value, priceCents: 0 })),
  };
}

function extraGroup(group: MenuExtraGroup): CatalogGroup {
  return {
    id: `extra-${slug(group.label)}`,
    label: group.label,
    kind: 'extra',
    values: group.values.map((value) => {
      const priceCents = parsePrice(value.price);
      if (priceCents === null) throw new Error(`Extra "${value.name}" has an unreadable price "${value.price}".`);
      return { id: slug(value.name), label: value.name, priceCents };
    }),
  };
}

function toItem(category: MenuCategory, item: MenuItem): CatalogItem | null {
  const priceCents = parsePrice(item.price);
  if (priceCents === null) return null;

  // Item choices first, then the category's shared ones; required choices before optional extras.
  const groups = [
    ...(item.options ?? []).map(choiceGroup),
    ...(category.sharedOptions ?? []).map(choiceGroup),
    ...(item.extras ?? []).map(extraGroup),
    ...(category.sharedExtras ?? []).map(extraGroup),
  ];
  const ids = new Set<string>();
  for (const group of groups) {
    if (ids.has(group.id)) throw new Error(`Dish "${item.id}" has two option groups called "${group.label}".`);
    ids.add(group.id);
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    categoryId: category.id,
    categoryName: category.name,
    priceCents,
    groups,
    image: item.image ?? null,
  };
}

/** Every orderable dish, in menu order. */
export function buildCatalog(categories: readonly MenuCategory[] = menu): CatalogItem[] {
  return categories.flatMap((category) =>
    category.items.map((item) => toItem(category, item)).filter((item): item is CatalogItem => item !== null),
  );
}

let cached: Map<string, CatalogItem> | null = null;

/** The live catalog, keyed by dish id. */
export function catalogById(): Map<string, CatalogItem> {
  cached ??= new Map(buildCatalog().map((item) => [item.id, item]));
  return cached;
}
