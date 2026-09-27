# Ceylontro Kitchen — website

*Flavours Beyond Borders.* This is the website for Ceylontro Kitchen, a Canadian restaurant with Sri Lankan, Asian and Western influences.

The site is static, built with **Astro 7**, **TypeScript** (strictest settings) and **Tailwind CSS 4**. Client-side JavaScript is limited to the site shell, the Home favourites tabs and the Menu scroll-spy (under 1 KB gzipped per page).

## Requirements

- Node 22.12 or newer (see `.nvmrc`)

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts the dev server at http://localhost:4321 |
| `npm run check` | Type-checks `.astro` and `.ts` files |
| `npm run build` | Type-checks, prints the missing-facts report, then builds to `dist/` |
| `npm run report` | Prints the missing-facts report (`-- --write` saves `MISSING-FACTS.md`) |
| `npm run preview` | Serves the production build locally |

## Structure

```
src/
  assets/brand/        Supplied logo (swap in the flat/transparent master when available)
  components/
    layout/            Section (brand surfaces), Container (widths and gutters)
    shell/             SiteHeader, MobileNav (drawer), MenuToggle, HoursToday, SiteFooter
    home/              HomeHero, HouseFavourites, FeaturedDish, StoryTeaser, OrderBand, VisitTeaser
    menu/              DishArchCard (Home), and the Menu page: MenuIntro, MenuCategoryBar (mobile),
                       MenuSideNav (desktop), MenuCategory, MenuFeaturedCard, MenuRow,
                       MenuComboCard, MenuItemOptions, MenuPrice, MobileOrderBar
    ui/                Button, OrderButton, TextLink, Pill, DietaryMarker, Eyebrow,
                       SectionHeading, Ornament, Photo, Logo, MissingData
  assets/photos/       The owner's photographs (empty until supplied)
  config/site.ts       Navigation, metadata and the Order Online destination
  data/                All content, as typed data:
    menu.ts            The full menu, transcribed from the printed menu
    restaurant.ts      Address, phone, email, hours, ordering, social (null until supplied)
    story.ts           Our Story chapters (hidden until the owner writes them)
    copy.ts            Brand lines, marked owner-menu or draft
    photos.ts          Every photo slot with alt text and crop ratio
    images.ts          Resolves photo slots to optimised images
    report.ts          Missing-facts report and data validation
    types.ts           Content types
  layouts/
    BaseLayout         <head> metadata, font preloads, skip link
    PageLayout         BaseLayout + header, drawer, <main>, footer (use this for pages)
  lib/format.ts        Hours, address, phone and current-page helpers
  lib/text.ts          Italic-accent headings, menu description spacing
  pages/               index (Home), menu, 404, styleguide (internal, noindex)
  scripts/
    shell.ts           Header scroll state, drawer fallback, today's hours
    favourites-tabs.ts Home "House favourites" category tabs
    menu-nav.ts        Menu scroll-spy: marks the category in view in both category navigations
  styles/global.css    Design tokens (@theme) and base styles
scripts/
  missing-facts.ts     Runs the report (used by `npm run build`)
```

## Design system

- All colours, type sizes, radii, shadows and easing are defined as tokens in `src/styles/global.css`. They follow the "D4 design spec" tab of the project plan.
- Tailwind's default colour palette is switched off, so only brand colours can be used.
- Visit `/styleguide` to see the tokens and every primitive. The page is not linked from the navigation and is not indexed.

## Updating content

The owner's facts all go in `src/data/`, and none of it requires touching components.

- **Home selections:** `homeFavourites` and `homeFeaturedItem` at the bottom of `menu.ts` choose the dishes on Home. Set `homeFavouritesConfirmed = true` once the owner approves them.
- **Menu:** edit `menu.ts`. Set `price` (e.g. `'$14.99'`) and add `'vegetarian'` to `tags` only when the owner confirms it. Delete a `confirm` note once its question is answered. `featured: true` puts a dish on the category's large card (one per category) and `combo: true` on the espresso combo card. The Menu page updates on its own: category navigation, numbering and the marker key all come from this file.
- **Restaurant facts:** replace a `null` in `restaurant.ts` with the owner's value. Hours are in 24-hour `HH:MM` format, and an empty list means closed that day.
- **Photos:** add the file to `src/assets/photos/` and set `file` in `photos.ts`.
- **Checking progress:** `npm run report` lists what is still missing. The build fails only on broken data, such as a duplicate id, a bad time format or a photo file that doesn't exist.

## Site shell

- Every page uses `PageLayout`. Pass `overlayHeader` when the page opens with a hero, and give that first section the `pt-header` class so its content starts below the header.
- The header is transparent over a hero and turns solid after 40 px of scroll; without JavaScript it stays solid.
- The mobile drawer is a native modal `<dialog>` (focus stays inside, Esc closes it). It opens with the HTML `command` attribute, with a fallback in `shell.ts` for older browsers.
- Footer and drawer blocks for address, hours, phone, email and social links appear on their own once the data exists in `restaurant.ts`.

## Menu page

- Mobile and tablet: a sticky bar of category pills under the header, and Order Online pinned to the bottom of the screen until the end of the menu. Desktop: a sticky category list with Order Online beside the menu.
- Dish rows are text-first. A square thumbnail appears on a row once that dish's real photo is added; featured and combo cards always keep their photo frame.
- A category's rows switch to a compact name-and-price list when none of its dishes has a description, options or photo (for example Wings Special).
- Choices shared by a whole category (for example the Handhelds side) are shown once in the category header.
- Every dish has an anchor (`/menu#honey-garlic-wings`), used by the Home cards; the dish is briefly highlighted on arrival.

## Content rules

- Business facts that the owner has not supplied yet are `null`. They are never shown on the live site and never guessed.
- `MissingData` badges appear only in development and on the style guide. In production they render nothing.
- `Photo` renders a sand-coloured placeholder at the final shape and aspect ratio until real photography is added, so adding photos causes no layout shift. Never use stock or AI images as the restaurant's own food.
- Order Online points to the Contact page's ordering section until `ordering.url` in `src/data/restaurant.ts` is set.

## Deployment

- Set `SITE_URL` once the domain is decided. Canonical URLs and absolute Open Graph URLs are only generated when it is set.
- The hosting platform is still to be chosen. The output in `dist/` is static and works on Vercel, Netlify or Cloudflare Pages.
