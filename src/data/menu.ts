/**
 * The Ceylontro Kitchen menu, transcribed from the owner's printed menu.
 *
 * - Wording is kept exactly as printed (only letter case is normalised for display).
 *   Suspected typos are NOT corrected: they carry a `confirm` note instead.
 * - `spicy` is set only where the printed menu shows a chilli icon.
 * - `vegetarian` is set only when the owner confirms it (the printed leaf icon is still unconfirmed).
 * - Prices are `null` until the owner supplies them.
 */
import type { MenuCategory, MenuItemWithCategory } from './types.ts';

const PROTEIN = { label: 'Protein', values: ['Chicken', 'Beef', 'Seafood', 'Mix or Seafood'] } as const;
const PROTEIN_NOTE = '"Mix or Seafood" protein option: what does it mean?';

export const menu: readonly MenuCategory[] = [
  {
    id: 'appetizers',
    name: 'Appetizers',
    image: 'category-appetizers',
    items: [
      {
        id: 'vegetable-spring-rolls',
        name: 'Vegetable Spring Rolls',
        description: 'Spring roll sheet, carrots, cabbage, onion, mushroom',
        price: null,
        image: 'vegetable-spring-rolls',
        tags: [],
        confirm: ['Printed menu shows a leaf icon: does it mean vegetarian?'],
      },
      {
        id: 'chinese-rolls',
        name: 'Chinese Rolls',
        description: 'Potato with onion and spicy mix with roll on pancake',
        price: null,
        image: 'chinese-rolls',
        options: [{ label: 'Filling', values: ['Chicken', 'Fish'] }],
        tags: [],
      },
      {
        id: 'prawn-toast',
        name: 'Prawn Toast',
        description: 'White bread and chopped shrimps with egg whites and sesame seed',
        price: null,
        image: 'prawn-toast',
        tags: [],
      },
      {
        id: 'french-fries',
        name: 'French Fries',
        price: null,
        image: 'french-fries',
        tags: [],
        confirm: ['Printed menu shows a leaf icon: does it mean vegetarian?'],
      },
    ],
  },
  {
    id: 'rice-noodles',
    name: 'Rice & Noodles',
    image: 'category-rice-noodles',
    confirm: [PROTEIN_NOTE],
    items: [
      {
        id: 'ceylontro-kottu-special',
        name: 'Sri Lankan Style Ceylontro Kottu Special',
        printedName: 'SRILANKAN STYLE CEYLONTRO KOTTU SPECIAL',
        description: 'Carrots/leeks/onions/chillis/tomatos/Srilankanju herbs/shredded cabbage',
        price: null,
        image: 'ceylontro-kottu-special',
        tags: [],
        featured: true,
        confirm: [
          '"Srilankanju herbs": typo for "Sri Lankan herbs"?',
          'No protein choice is printed under the Kottu dishes: do they come with one?',
        ],
      },
      {
        id: 'fried-rice',
        name: 'Fried Rice',
        description: 'Basmati rice/eggs/dice carrot/green onion/leeks',
        price: null,
        image: 'fried-rice',
        options: [PROTEIN],
        tags: [],
      },
      {
        id: 'special-nasi-goreng',
        name: 'Special Nasi Goreng',
        description:
          'With fried egg. Basmati rice/eggs/dice carrot/green onion/thai chilli/tossed in flavour full sauce and chilli sauce',
        price: null,
        image: 'special-nasi-goreng',
        options: [PROTEIN],
        tags: ['spicy'],
      },
      {
        id: 'chopsay-rice',
        name: 'Chopsay Rice',
        description: 'Basmati garlic rice/eggs/green onion/carrot/beans/cabbage/broccoli/cauliflower',
        price: null,
        image: 'chopsay-rice',
        options: [PROTEIN],
        tags: [],
        confirm: ['Spelling: "Chopsay" (as printed), "Chopsuey" or "Chop Suey"?'],
      },
      {
        id: 'chinese-style-fried-noodles',
        name: 'Stir Fried Chinese Style Fried Noodles',
        description: '(Eggs/julienne carrot/green onion/shredded cabbage) tossed chilli paste and ketchup',
        price: null,
        image: 'chinese-style-fried-noodles',
        options: [PROTEIN],
        tags: [],
      },
      {
        id: 'pilawoos-cheese-kottu',
        name: 'Special Pilawoos Style Cheese Kottu',
        description: 'Carrots/leeks/onions/chillis/tomatos/srilankan herbs/shredded cabbage',
        price: null,
        image: 'pilawoos-cheese-kottu',
        tags: [],
      },
    ],
  },
  {
    id: 'pasta',
    name: 'Pasta',
    image: 'category-pasta',
    items: [
      {
        id: 'penne-pasta-special',
        name: 'Penne Pasta Special',
        price: null,
        image: 'penne-pasta-special',
        options: [{ label: 'Sauce', values: ['Alfredo', 'Rose'] }, PROTEIN],
        tags: [],
        featured: true,
        confirm: [PROTEIN_NOTE],
      },
    ],
  },
  {
    id: 'devilled-items',
    name: 'Devilled Items',
    intro: 'Onion/peppers/tomato/green onions',
    image: 'category-devilled-items',
    items: [
      { id: 'chicken-devilled', name: 'Chicken Devilled', price: null, image: 'chicken-devilled', tags: [], featured: true },
      { id: 'chilli-chicken', name: 'Chilli Chicken', price: null, image: 'chilli-chicken', tags: ['spicy'] },
      { id: 'fish-devilled', name: 'Fish Devilled', price: null, image: 'fish-devilled', tags: [] },
      { id: 'fish-sweet-and-sour', name: 'Fish Sweet and Sour', price: null, image: 'fish-sweet-and-sour', tags: ['spicy'] },
      { id: 'hot-buttered-cuttlefish', name: 'Hot Buttered Cuttlefish', price: null, image: 'hot-buttered-cuttlefish', tags: [] },
      { id: 'devilled-pork', name: 'Devilled Pork', price: null, image: 'devilled-pork', tags: [] },
      {
        id: 'chef-specials-stir-fried-cuttlefish',
        name: 'Chef Specials Stir Fried Cuttlefish',
        price: null,
        image: 'chef-specials-stir-fried-cuttlefish',
        tags: [],
      },
    ],
  },
  {
    id: 'wings-special',
    name: 'Wings Special',
    sizes: ['1 LB', '2 LB'],
    image: 'category-wings-special',
    items: [
      { id: 'ceylontro-chef-specials-wings', name: 'Ceylontro Chef Specials', price: null, image: 'ceylontro-chef-specials-wings', tags: [] },
      { id: 'chicken-chilli-wings', name: 'Chicken Chilli Wings', price: null, image: 'chicken-chilli-wings', tags: ['spicy'] },
      { id: 'honey-garlic-wings', name: 'Honey Garlic Wings', price: null, image: 'honey-garlic-wings', tags: [], featured: true },
      { id: 'parmesan-caesar-wings', name: 'Parmesan Caesar Wings', price: null, image: 'parmesan-caesar-wings', tags: [] },
      { id: 'hot-sauce-wings', name: 'Hot Sauce Wings', price: null, image: 'hot-sauce-wings', tags: ['spicy'] },
      {
        id: 'cajun-dry-rub-wings',
        name: 'Cajun Dry Rub Wings',
        printedName: 'Cajun DRY RUB Wings',
        price: null,
        image: 'cajun-dry-rub-wings',
        tags: [],
      },
      {
        id: 'wings-and-fries-combo',
        name: 'Wings & Fries Combo (1 LB)',
        printedName: 'WINGS & FRIES COMBO (1 LBS)',
        description: 'A single order of our wings tossed in your choice of sauce with a side of fresh cut fries.',
        price: null,
        image: 'wings-and-fries-combo',
        tags: [],
      },
    ],
  },
  {
    id: 'vegetarian-dishes',
    name: 'Vegetarian Dishes',
    image: 'category-vegetarian-dishes',
    items: [
      { id: 'stir-fried-vegetables', name: 'Stir Fried Vegetables', price: null, image: 'stir-fried-vegetables', tags: [] },
      {
        id: 'chilli-garlic-eggplant',
        name: 'Chilli Garlic Eggplant',
        printedName: 'Chili Garlic Egg Plant',
        price: null,
        image: 'chilli-garlic-eggplant',
        tags: ['spicy'],
        featured: true,
        confirm: ['Standardise "Chili" or "Chilli" across the menu.'],
      },
      {
        id: 'caesar-salad',
        name: 'Caesar Salad',
        price: null,
        image: 'caesar-salad',
        tags: [],
        confirm: ['Listed under Vegetarian Dishes: is the dressing anchovy-free?'],
      },
      { id: 'greek-salad', name: 'Greek Salad', price: null, image: 'greek-salad', tags: [] },
    ],
  },
  {
    id: 'handhelds',
    name: 'Handhelds',
    intro: 'Island special burgers with choice of side',
    image: 'category-handhelds',
    sharedOptions: [{ label: 'Side', values: ['French fries', 'Salad', 'Poutine'] }],
    items: [
      {
        id: 'ceylontro-classic-beef-burger',
        name: 'Ceylontro Classic Beef Burger',
        description: 'Brioche bun/beef patty/lettuce/tomato/onion/86sauce',
        price: null,
        image: 'ceylontro-classic-beef-burger',
        addOns: ['Add on cheese slice'],
        tags: [],
        featured: true,
        confirm: ['"86sauce": house sauce name (how should it be written?) or typo?'],
      },
      {
        id: 'crispy-chicken-burger',
        name: 'Crispy Chicken Burger',
        description: 'Brioche bun/crispy chicken/lettuce/tomato/onion/86sauce',
        price: null,
        image: 'crispy-chicken-burger',
        tags: [],
        confirm: ['"86sauce": house sauce name (how should it be written?) or typo?'],
      },
      {
        id: 'nashville-hot-chicken',
        name: 'Nashville Hot Chicken',
        description:
          'Crispy marinated chicken breast tossed in our Nashville HOT sauce, pickles & creamy coleslaw, served on a brioche bun.',
        price: null,
        image: 'nashville-hot-chicken',
        tags: [],
        confirm: ['No chilli icon is printed: should Nashville Hot Chicken be marked spicy?'],
      },
    ],
  },
  {
    id: 'quesadillas',
    name: 'Quesadillas',
    image: 'category-quesadillas',
    items: [
      {
        id: 'quesadilla',
        name: 'Quesadilla',
        description:
          'Blend of corn, black beans, veggies, & tex mex cheese. With house-made salsa & sour cream.',
        price: null,
        image: 'quesadilla',
        options: [{ label: 'Filling', values: ['Chicken', 'Vege', 'Seafood'] }],
        tags: [],
        featured: true,
        confirm: ['Item name: the printed menu shows only the category "Quesadillas". Is "Quesadilla" right?'],
      },
    ],
  },
  {
    id: 'set-menus-special',
    name: 'Set Menus Special',
    image: 'category-set-menus-special',
    items: [
      {
        id: 'fried-rice-set-menu',
        name: 'Fried Rice Set Menu',
        description: 'With chicken and veggies',
        price: null,
        image: 'fried-rice-set-menu',
        tags: [],
        featured: true,
      },
      {
        id: 'noodles-set-menu',
        name: 'Noodles Set Menu',
        description: 'With chicken and veggies',
        price: null,
        image: 'noodles-set-menu',
        tags: [],
      },
    ],
  },
];

/** Every item with its category attached (the flat shape from the project instructions). */
export function allMenuItems(): MenuItemWithCategory[] {
  return menu.flatMap((category) =>
    category.items.map((item) => ({ ...item, category: category.id, categoryName: category.name })),
  );
}

/** Items shown in the Home page "House favourites" rail, in order. */
export const houseFavourites: readonly string[] = [
  'ceylontro-kottu-special',
  'special-nasi-goreng',
  'fried-rice',
  'pilawoos-cheese-kottu',
];

/** Featured dish on the Home page. */
export const homeFeaturedItem = 'ceylontro-kottu-special';

export function findMenuItem(id: string): MenuItemWithCategory | undefined {
  return allMenuItems().find((item) => item.id === id);
}
