/**
 * The Ceylontro Kitchen menu, transcribed from the owner's menu V1.2 (October 2026).
 *
 * - Names, descriptions, prices and extras are exactly as printed.
 * - Questions about the printed menu carry a `confirm` note; the missing-facts report lists them.
 * - V1.2 prints no chilli or leaf icons, so no dish carries a `spicy` or `vegetarian` marker.
 *   Add one only when the owner confirms it.
 */
import type { MenuCategory, MenuExtraGroup, MenuItemWithCategory, MenuOptionGroup } from './types.ts';

/** "Add: chicken $2 · beef $3 · seafood $5 · mix $5", printed under Fried Rice and Stir-Fried Noodles. */
const ADD_RICE_NOODLES: MenuExtraGroup = {
  label: 'Add',
  values: [
    { name: 'Chicken', price: '$2' },
    { name: 'Beef', price: '$3' },
    { name: 'Seafood', price: '$5' },
    { name: 'Mix', price: '$5' },
  ],
};

/** "Add: chicken $3 · seafood $5", printed under Quesadillas and Pasta. */
const ADD_CHICKEN_SEAFOOD: MenuExtraGroup = {
  label: 'Add',
  values: [
    { name: 'Chicken', price: '$3' },
    { name: 'Seafood', price: '$5' },
  ],
};

/** "Choose your flavour", printed under the Best Wings heading. */
const WING_FLAVOUR: MenuOptionGroup = {
  label: 'Choose your flavour',
  values: ['Honey garlic', 'Parmesan Caesar', 'Hot sauce', 'Honey-hot', 'Thai sweet chilli', 'Cajun dry rub'],
};

export const menu: readonly MenuCategory[] = [
  {
    id: 'appetizers',
    name: 'Appetizers',
    intro: 'Freshly fried to golden perfection & served hot and crispy.',
    image: 'category-appetizers',
    items: [
      {
        id: 'spring-rolls',
        name: 'Spring Rolls',
        description: 'Cabbage, carrot & mushroom wrapped in a crispy sheet, served with sweet chilli sauce.',
        price: '$9.99',
        image: 'spring-rolls',
        tags: [],
      },
      {
        id: 'chicken-chinese-roll',
        name: 'Chicken Chinese Roll',
        description:
          'A savoury blend of seasoned potatoes and minced chicken, wrapped in a delicate pancake, coated in golden breadcrumbs. Served with house sauce.',
        price: '$9.99',
        image: 'chicken-chinese-roll',
        tags: [],
      },
      {
        id: 'shrimp-toast',
        name: 'Shrimp Toast',
        description:
          'Succulent prawns, aromatic garlic and savoury seasonings spread over crispy bread, topped with sesame seeds. Served with Thai sweet chilli.',
        price: '$11.99',
        image: 'shrimp-toast',
        tags: [],
      },
      {
        id: 'golden-crispy-mozzarella-planks',
        name: 'Golden Crispy Mozzarella Planks',
        description:
          'Crispy-coated planks with a gooey, cheesy centre, finished with Parmesan and fresh parsley. Served with rich marinara.',
        price: '$11.99',
        image: 'golden-crispy-mozzarella-planks',
        tags: [],
      },
      {
        id: 'poutine',
        name: 'Poutine',
        price: '$9.99',
        image: 'poutine',
        tags: [],
        confirm: ['No description is printed: add one (e.g. what the gravy and curds are)?'],
      },
    ],
  },
  {
    id: 'salads',
    name: 'Salads',
    image: 'category-salads',
    items: [
      {
        id: 'caesar-salad',
        name: 'Caesar Salad',
        description: 'Romaine, Parmesan, garlic croutons and creamy Caesar dressing.',
        price: '$12.99',
        image: 'caesar-salad',
        tags: [],
      },
      {
        id: 'house-salad',
        name: 'House Salad',
        description: 'Mixed greens, cherry tomatoes, cucumber, red onion & carrot with balsamic dressing.',
        price: '$10.99',
        image: 'house-salad',
        tags: [],
      },
      {
        id: 'greek-salad',
        name: 'Greek Salad',
        description: 'Romaine & iceberg, grape tomatoes, cucumber, Kalamata olives, onion, feta & mixed peppers.',
        price: '$14.99',
        image: 'greek-salad',
        tags: [],
      },
    ],
  },
  {
    id: 'devilled',
    name: 'Devilled',
    intro: 'Tossed with onion, peppers, tomato & green onion.',
    image: 'category-devilled',
    items: [
      { id: 'chicken-devilled', name: 'Chicken Devilled', price: '$17.99', image: 'chicken-devilled', tags: [] },
      { id: 'fish-devilled', name: 'Fish Devilled', price: '$18.99', image: 'fish-devilled', tags: [] },
      { id: 'shrimp-devilled', name: 'Shrimp Devilled', price: '$18.99', image: 'shrimp-devilled', tags: [] },
      { id: 'beef-devilled', name: 'Beef Devilled', price: '$20.99', image: 'beef-devilled', tags: [] },
    ],
  },
  {
    id: 'rice-noodles-kottu',
    name: 'Rice, Noodles & Kottu',
    image: 'category-rice-noodles-kottu',
    items: [
      {
        id: 'ceylontro-kottu-special',
        name: 'Ceylontro Kottu Special',
        description:
          'Sri Lankan style. Carrot, leeks, onion, chilli, tomato, Sri Lankan herbs & shredded cabbage, mixed with Sri Lankan gravy.',
        price: '$13.99',
        image: 'ceylontro-kottu-special',
        extras: [
          {
            label: 'Add fried',
            values: [
              { name: 'Chicken', price: '$2' },
              { name: 'Beef', price: '$3' },
              { name: 'Mutton', price: '$3' },
              { name: 'Seafood', price: '$5' },
              { name: 'Mix', price: '$5' },
            ],
          },
        ],
        tags: [],
        featured: true,
      },
      {
        id: 'fried-rice',
        name: 'Fried Rice',
        description: 'Basmati rice, eggs, diced carrot, green onion & leeks.',
        price: '$15.99',
        image: 'fried-rice',
        extras: [ADD_RICE_NOODLES],
        tags: [],
      },
      {
        id: 'special-nasi-goreng',
        name: 'Special Nasi Goreng with Fried Egg',
        description:
          'Basmati rice, eggs, diced carrot, green onion & Thai chilli, tossed in a flavourful sauce and chilli sauce. Comes with chicken or vegetable satay.',
        price: '$18.99',
        image: 'special-nasi-goreng',
        options: [{ label: 'Choice', values: ['Chicken & shrimp', 'Vegetable'] }],
        tags: [],
        confirm: [
          'The description says "comes with chicken or vegetable satay" but the choice reads "chicken & shrimp · vegetable": which is right?',
        ],
      },
      {
        id: 'chop-suey-rice',
        name: 'Chop Suey Rice',
        description: 'Basmati garlic rice, eggs, green onion, carrot, beans, cabbage & broccoli.',
        price: '$16.99',
        image: 'chop-suey-rice',
        extras: [
          {
            label: 'Add',
            values: [
              { name: 'Chicken', price: '$2' },
              { name: 'Beef', price: '$3' },
              { name: 'Seafood', price: '$4' },
            ],
          },
        ],
        tags: [],
        confirm: ['Seafood add-on is $4 here but $5 on the other rice and noodle dishes: correct?'],
      },
      {
        id: 'stir-fried-noodles',
        name: 'Stir-Fried Noodles',
        description: 'Eggs, julienne carrot, green onion & shredded cabbage.',
        price: '$14.99',
        image: 'stir-fried-noodles',
        extras: [ADD_RICE_NOODLES],
        tags: [],
      },
      {
        id: 'pilawoos-cheese-kottu',
        name: 'Pilawoos Cheese Kottu',
        description:
          'Ceylontro style. Carrot, leeks, onion, chilli, tomato, Sri Lankan herbs & shredded cabbage in Alfredo sauce with cheese.',
        price: '$15.99',
        image: 'pilawoos-cheese-kottu',
        extras: [
          {
            label: 'Add fried',
            values: [
              { name: 'Chicken', price: '$2' },
              { name: 'Beef', price: '$3' },
              { name: 'Seafood', price: '$5' },
              { name: 'Mix', price: '$5' },
            ],
          },
        ],
        tags: [],
      },
    ],
  },
  {
    id: 'chefs-signatures',
    name: 'Chef’s Signatures',
    image: 'category-chefs-signatures',
    items: [
      {
        id: 'chilli-chicken',
        name: 'Chilli Chicken',
        description: 'Tossed in our special sauce with dry chilli & green onion.',
        price: '$17.99',
        image: 'chilli-chicken',
        tags: [],
        featured: true,
      },
      {
        id: 'hot-butter-cuttlefish',
        name: 'Hot Butter Cuttlefish',
        description: 'Dry chilli & green onion.',
        price: '$18.99',
        image: 'hot-butter-cuttlefish',
        tags: [],
      },
      {
        id: 'stir-fried-cuttlefish',
        name: 'Stir-Fried Cuttlefish',
        description: 'Ginger & garlic tossed in oil with dry chilli & green onion.',
        price: '$18.99',
        image: 'stir-fried-cuttlefish',
        tags: [],
      },
    ],
  },
  {
    id: 'set-menus',
    name: 'Set Menus',
    intro: 'Served with our famous rice or noodles, chilli chicken & stir-fried vegetable chop suey.',
    image: 'category-set-menus',
    items: [
      {
        id: 'fried-rice-set-menu',
        name: 'Fried Rice Set Menu',
        price: '$19.99',
        image: 'fried-rice-set-menu',
        tags: [],
        featured: true,
      },
      {
        id: 'stir-fried-noodle-set-menu',
        name: 'Stir-Fried Noodle Set Menu',
        price: '$18.99',
        image: 'stir-fried-noodle-set-menu',
        tags: [],
      },
    ],
  },
  {
    id: 'best-wings',
    name: 'Best Wings',
    intro: 'Served with garden crunch sticks.',
    image: 'category-best-wings',
    sharedOptions: [WING_FLAVOUR],
    items: [
      {
        id: 'wings',
        name: 'Wings (1 lb)',
        price: '$16.99',
        image: 'wings',
        tags: [],
      },
      {
        id: 'chefs-chilli-chicken-wings',
        name: 'Chef’s Chilli Chicken Wings',
        description: 'Battered fried wings tossed in ginger, garlic, dry chilli & chilli sauce with spring onion.',
        price: '$17.99',
        image: 'chefs-chilli-chicken-wings',
        tags: [],
      },
      {
        id: 'wings-and-fries-combo',
        name: 'Wings & Fries Combo (1 lb)',
        price: '$19.99',
        image: 'wings-and-fries-combo',
        tags: [],
        combo: true,
      },
    ],
  },
  {
    id: 'handhelds',
    name: 'Handhelds',
    intro: 'Island special burgers with your choice of fresh-cut fries or salad.',
    image: 'category-handhelds',
    sharedOptions: [{ label: 'Side', values: ['Fresh-cut fries', 'Salad'] }],
    sharedExtras: [{ label: 'Upgrade', values: [{ name: 'Poutine', price: '+$2' }] }],
    items: [
      {
        id: 'ceylontro-classic-beef-burger',
        name: 'Ceylontro Classic Beef Burger',
        description: 'Brioche bun, beef patty, lettuce, tomato, onion & 66 sauce.',
        price: '$15.99',
        image: 'ceylontro-classic-beef-burger',
        extras: [{ label: 'Add', values: [{ name: 'Cheese slice', price: '$1' }] }],
        tags: [],
        featured: true,
        confirm: ['"66 sauce": is that the house sauce\'s name, written exactly like that?'],
      },
      {
        id: 'nashville-hot-chicken-burger',
        name: 'Nashville Hot Chicken Burger',
        description:
          'Crispy marinated chicken breast tossed in our Nashville hot sauce, with pickles & creamy coleslaw on a brioche bun.',
        price: '$14.99',
        image: 'nashville-hot-chicken-burger',
        tags: [],
      },
      {
        id: 'quesadillas',
        name: 'Quesadillas',
        description: 'Corn, black beans, veggies & cheese, with house-made salsa & sour cream.',
        price: '$12.99',
        image: 'quesadillas',
        extras: [ADD_CHICKEN_SEAFOOD],
        tags: [],
        confirm: ['Quesadillas sit under Handhelds: do they also come with the fries-or-salad side?'],
      },
    ],
  },
  {
    id: 'pasta',
    name: 'Pasta',
    image: 'category-pasta',
    items: [
      {
        id: 'penne-or-italian-fettuccine',
        name: 'Penne or Italian Fettuccine',
        description: 'Sautéed onions & garlic, served with garlic cheese fingers.',
        price: '$14.99',
        image: 'penne-or-italian-fettuccine',
        options: [{ label: 'Sauce', values: ['Creamy Alfredo', 'Marinara', 'Rosé'] }],
        extras: [ADD_CHICKEN_SEAFOOD],
        tags: [],
        featured: true,
      },
    ],
  },
  {
    id: 'desserts',
    name: 'Desserts',
    image: 'category-desserts',
    items: [
      { id: 'mango-mousse', name: 'Mango Mousse', price: '$7.99', image: 'mango-mousse', tags: [] },
      {
        id: 'watalappan-cheesecake',
        name: 'Watalappan Cheesecake',
        price: '$8.99',
        image: 'watalappan-cheesecake',
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

/**
 * Home page "House favourites": one tab per category, up to four dishes each, in order.
 * This selection is a design pick until the owner confirms it (listed by the missing-facts report).
 */
export const homeFavourites: readonly { category: string; items: readonly string[] }[] = [
  {
    category: 'rice-noodles-kottu',
    items: ['ceylontro-kottu-special', 'pilawoos-cheese-kottu', 'special-nasi-goreng', 'fried-rice'],
  },
  {
    category: 'chefs-signatures',
    items: ['chilli-chicken', 'hot-butter-cuttlefish', 'stir-fried-cuttlefish'],
  },
  {
    category: 'best-wings',
    items: ['chefs-chilli-chicken-wings', 'wings', 'wings-and-fries-combo'],
  },
  {
    category: 'handhelds',
    items: ['ceylontro-classic-beef-burger', 'nashville-hot-chicken-burger', 'quesadillas'],
  },
];
export const homeFavouritesConfirmed = false;

/** Featured dish on the Home page. */
export const homeFeaturedItem = 'ceylontro-kottu-special';

export function findMenuItem(id: string): MenuItemWithCategory | undefined {
  return allMenuItems().find((item) => item.id === id);
}

export function findCategory(id: string): MenuCategory | undefined {
  return menu.find((category) => category.id === id);
}

/** An item's own choices, or the ones its category shares. */
export function optionsFor(item: MenuItemWithCategory): readonly MenuOptionGroup[] {
  return item.options ?? findCategory(item.category)?.sharedOptions ?? [];
}

/** An item's own paid extras, followed by the ones its category shares. */
export function extrasFor(item: MenuItemWithCategory): readonly MenuExtraGroup[] {
  return [...(item.extras ?? []), ...(findCategory(item.category)?.sharedExtras ?? [])];
}
