# Photos

Put the owner's real photographs here: large JPG or PNG files, at least 2000 px on the long side. Then set the matching `file` in `src/data/photos.ts`. Astro creates the AVIF/WebP sizes automatically.

Crop guidance for each slot is in the `ratio` field of `src/data/photos.ts`.

Dishes and the restaurant itself: the owner's own photographs only. Never add stock or AI-generated images of food or of the venue and present them as Ceylontro's own.

AI-generated images are used only for atmosphere (spices, ingredients, surfaces). Their files start with `mood-` and their slots are marked `source: 'generated'` in `photos.ts`.

| File | Source | Used for |
| --- | --- | --- |
| `stir-fried-noodles.jpg` | Owner | Home hero arch, Stir-Fried Noodles |
| `fried-rice.jpg` | Owner | Home hero round dish, mobile menu, Fried Rice |
| `stir-fried-vegetables.jpg` | Owner | Menu intro round dish, Set Menus category (cropped to the plate) |
| `devilled.jpg` | Owner | Devilled category |
| `mood-spices.jpg` | Generated (Higgsfield) | Menu intro arch |
| `mood-ingredients.jpg` | Generated (Higgsfield) | Our Story hero arch |
| `mood-limes.jpg` | Generated (Higgsfield) | Contact intro arch |

The owner's photos were cropped to remove the logo text baked into the social posts. The generated images have a light film grain added so they sit with the photographs.
