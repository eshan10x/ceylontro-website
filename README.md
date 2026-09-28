# Ceylontro Kitchen — website

*Flavours Beyond Borders.* This is the website for Ceylontro Kitchen, a Canadian restaurant with Sri Lankan, Asian and Western influences.

The site is static, built with **Astro 7**, **TypeScript** (strictest settings) and **Tailwind CSS 4**. Client-side JavaScript is limited to the site shell, scroll reveals, the Home favourites tabs, the Menu scroll-spy and the Contact map loader (about 1 KB gzipped per page).

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
    layout/            Section (brand surfaces), Container (widths and gutters), PageIntro (Menu, Contact)
    shell/             SiteHeader, MobileNav (drawer), MenuToggle, HoursToday, SiteFooter
    home/              HomeHero, HouseFavourites, FeaturedDish, StoryTeaser, OrderBand, VisitTeaser
    story/             StoryHero, StoryChapter, StoryCta
    contact/           ContactOrder (#order), ContactDetails, OpeningHours, ContactMap
    menu/              DishArchCard (Home), and the Menu page: MenuIntro, MenuCategoryBar (mobile),
                       MenuSideNav (desktop), MenuCategory, MenuFeaturedCard, MenuRow,
                       MenuComboCard, MenuItemOptions, MenuPrice, MobileOrderBar
    ui/                Button, OrderButton, TextLink, Pill, DietaryMarker, Eyebrow,
                       SectionHeading, Ornament, Photo, Logo, LogoArch, MissingData
  assets/photos/       The owner's photographs (empty until supplied)
  config/site.ts       Navigation, metadata and the Order Online destination
  lib/seo.ts           Launch gate, which pages are indexable, social image, clean URLs
  lib/structured-data.ts  Restaurant and Menu JSON-LD from verified data
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
  pages/               index (Home), menu, our-story, contact, 404, styleguide (internal, noindex),
                       sitemap.xml.ts, robots.txt.ts
  scripts/
    shell.ts           Header scroll state, drawer fallback, today's hours
    favourites-tabs.ts Home "House favourites" category tabs
    menu-nav.ts        Menu scroll-spy: marks the category in view in both category navigations
    contact-map.ts     Contact: loads the Google map only when the visitor asks
    reveal.ts          Scroll reveals for [data-reveal] elements
  styles/global.css    Design tokens (@theme) and base styles
scripts/
  missing-facts.ts     Runs the report (used by `npm run build`)
public/
  og/                  Social sharing image (1200 × 630)
  _headers             Security and cache headers (Cloudflare Pages, Netlify)
vercel.json            The same headers and clean URLs for Vercel
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

## Our Story and Contact

- **Our Story:** the introduction and each chapter appear only once the owner's text is in `story.ts`. Chapter 02 shows the logo plaque in an espresso arch; the others use a 3:2 photo slot.
- **Contact:** address (with Get directions), phone (with Call now on phones), email, opening hours (today highlighted) and social links each appear once supplied. The map appears once the address exists, and nothing is loaded from Google until the visitor presses Load map.
- **Ordering card (`/contact#order`):** every Order Online button lands here until `ordering.url` is set. Without a URL the card offers View Menu, so it never links back to itself; with one it shows Order Online, the platform name and any delivery partners.
- Both pages are kept out of search results (`noindex`) while they have none of the owner's content, and become indexable automatically once it is added.

## Content rules

- Business facts that the owner has not supplied yet are `null`. They are never shown on the live site and never guessed.
- `MissingData` badges appear only in development and on the style guide. In production they render nothing.
- `Photo` renders a sand-coloured placeholder at the final shape and aspect ratio until real photography is added, so adding photos causes no layout shift. Never use stock or AI images as the restaurant's own food.
- Order Online points to the Contact page's ordering section until `ordering.url` in `src/data/restaurant.ts` is set.

## Search and sharing

- **Launch gate.** Until `domain` is set in `src/data/restaurant.ts`, every page is `noindex`, `robots.txt` disallows everything and the sitemap is empty, so test and preview deployments never reach Google. Setting the domain (e.g. `'https://www.example.ca'`, no trailing slash) turns on canonical URLs, absolute Open Graph URLs, the sitemap and indexing in one step.
- Our Story and Contact stay `noindex` (and out of the sitemap) until they hold some of the owner's content. `src/lib/seo.ts` decides this for the pages, the sitemap and robots.txt together.
- Every page has a title, description, Open Graph and Twitter tags. The sharing image is `public/og/ceylontro-kitchen.jpg`: the supplied logo, unaltered, on linen with the name and tagline. Replace it with a food photograph after the shoot.
- **Structured data:** Home (and Contact, once it has facts) carries a `Restaurant` node; Menu carries a `Menu` with every section and dish. Each property appears only when its data exists — address, phone, hours, prices (`CAD`), vegetarian markers, ordering link, social profiles. Check with Google's Rich Results Test after launch.

## Motion

- First-screen entrances are CSS only (`.enter`, `.enter-arch` in `global.css`): headline words rise, the hero arch opens from the bottom.
- Further down, anything with `data-reveal` fades up as it scrolls into view, and photos open from the bottom while the image settles. `<Photo>` does this by default (not for priority photos); `<SectionHeading>` and `<Container reveal>` opt blocks in. Stagger with `revealIndex` / `--reveal-i`.
- Nothing is hidden without JavaScript or before the script runs, content already on screen is never hidden, and `prefers-reduced-motion` turns all of it off. Only opacity, transform and clip-path animate, so there is no layout shift.

## Deployment

The build output in `dist/` is static. Recommended host: **Cloudflare Pages** (free, fast in Canada, reads `public/_headers`). Netlify works the same way; Vercel uses `vercel.json`.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 22 (from `.nvmrc`) |

- `_headers` / `vercel.json` set a Content-Security-Policy (same-origin scripts and fonts; Google Maps is the only allowed frame), HSTS, `nosniff`, a strict referrer policy and a one-year immutable cache for `/_astro/`. Keep the two files in step.
- URLs have no `.html` and no trailing slash (`/menu`); all three hosts serve them that way (Vercel through `cleanUrls`).
- `404.html` is served automatically for unknown paths.

## Launch checklist

1. `npm run report` shows no business facts left that the owner wants on the site: address, phone, email, hours, ordering URL, social links, story.
2. Draft copy approved by the owner (listed in the report), and the house-favourite picks confirmed.
3. Real photography added (at least the hero, the featured dish and the house favourites).
4. The flat/transparent logo swapped in, if the owner's designer supplies it.
5. `domain` set in `restaurant.ts`, then deploy.
6. After launch: submit `/sitemap.xml` in Google Search Console, run the Rich Results Test on `/` and `/menu`, and claim the Google Business Profile with the same name, address and phone.
