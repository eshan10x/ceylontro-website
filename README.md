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
| `npm run build` | Type-checks, then builds to `dist/` |
| `npm run preview` | Serves the production build locally |

## Structure

```
src/
  assets/brand/        Supplied logo (swap in the flat/transparent master when available)
  components/
    layout/            Section (brand surfaces), Container (widths and gutters)
    ui/                Button, OrderButton, TextLink, Pill, DietaryMarker, Eyebrow,
                       SectionHeading, Ornament, Photo, Logo, MissingData
  config/site.ts       Site name, navigation, ordering link
  layouts/BaseLayout   <head> metadata, font preloads, skip link
  pages/               index (temporary until B4), styleguide (internal, noindex)
  styles/global.css    Design tokens (@theme) and base styles
```

## Design system

- All colours, type sizes, radii, shadows and easing are defined as tokens in `src/styles/global.css`. They follow the "D4 design spec" tab of the project plan.
- Tailwind's default colour palette is switched off, so only brand colours can be used.
- Visit `/styleguide` to see the tokens and every primitive. The page is not linked from the navigation and is not indexed.

## Content rules

- Business facts that the owner has not supplied yet are `null`. They are never shown on the live site and never guessed.
- `MissingData` badges appear only in development and on the style guide. In production they render nothing.
- `Photo` renders a sand-coloured placeholder at the final shape and aspect ratio until real photography is added, so adding photos causes no layout shift. Never use stock or AI images as the restaurant's own food.
- Order Online points to the Contact page's ordering section until `ordering.url` in `src/config/site.ts` is set.

## Deployment

- Set `SITE_URL` once the domain is decided. Canonical URLs and absolute Open Graph URLs are only generated when it is set.
- The hosting platform is still to be chosen. The output in `dist/` is static and works on Vercel, Netlify or Cloudflare Pages.
