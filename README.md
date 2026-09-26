# Ceylontro Kitchen — website

*Flavours Beyond Borders.* This is the website for Ceylontro Kitchen, a Canadian restaurant with Sri Lankan, Asian and Western influences.

The site is static, built with **Astro 7**, **TypeScript** (strictest settings) and **Tailwind CSS 4**. It ships no client-side JavaScript so far.

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
  layouts/BaseLayout   <head> metadata, font preloads, skip link
  pages/               index (temporary until B4), styleguide (internal, noindex)
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

- **Menu:** edit `menu.ts`. Set `price` (e.g. `'$14.99'`) and add `'vegetarian'` to `tags` only when the owner confirms it. Delete a `confirm` note once its question is answered.
- **Restaurant facts:** replace a `null` in `restaurant.ts` with the owner's value. Hours are in 24-hour `HH:MM` format, and an empty list means closed that day.
- **Photos:** add the file to `src/assets/photos/` and set `file` in `photos.ts`.
- **Checking progress:** `npm run report` lists what is still missing. The build fails only on broken data, such as a duplicate id, a bad time format or a photo file that doesn't exist.

## Content rules

- Business facts that the owner has not supplied yet are `null`. They are never shown on the live site and never guessed.
- `MissingData` badges appear only in development and on the style guide. In production they render nothing.
- `Photo` renders a sand-coloured placeholder at the final shape and aspect ratio until real photography is added, so adding photos causes no layout shift. Never use stock or AI images as the restaurant's own food.
- Order Online points to the Contact page's ordering section until `ordering.url` in `src/data/restaurant.ts` is set.

## Deployment

- Set `SITE_URL` once the domain is decided. Canonical URLs and absolute Open Graph URLs are only generated when it is set.
- The hosting platform is still to be chosen. The output in `dist/` is static and works on Vercel, Netlify or Cloudflare Pages.
