# Photos

Put the owner's real photographs here: large JPG or PNG files, at least 2000 px on the long side. Then set the matching `file` in `src/data/photos.ts`. Astro creates the AVIF/WebP sizes automatically.

Crop guidance for each slot is in the `ratio` field of `src/data/photos.ts`.

Every slot records where its file came from (`source` in `photos.ts`): the owner's own photos, licensed stock, or images generated with Higgsfield. On 2026-10-28 the owner approved generated images for the 13 priority dishes as stand-ins; replace each with the restaurant's own photo when it exists (same file name, then change `source` to `owner`). The restaurant itself, its kitchen and its people are never generated.

| File | Source | Used for |
| --- | --- | --- |
| `stir-fried-noodles.jpg` | Owner | Home hero arch, Stir-Fried Noodles |
| `fried-rice.jpg` | Owner | Home hero round dish, mobile menu, Fried Rice |
| `stir-fried-vegetables.jpg` | Owner | Set Menus category (cropped to the plate) |
| `devilled.jpg` | Owner (file named Prawns_devilled) | Shrimp Devilled, Devilled category |
| `wings.jpg` | Licensed stock (owner holds the licence) | Wings (1 lb) |
| `kottu-overhead.jpg`, `kottu-detail.jpg`, `ceylontro-kottu-special.jpg` | Generated (Higgsfield), owner approved | Home featured dish, Kottu Special |
| `pilawoos-cheese-kottu.jpg`, `special-nasi-goreng.jpg`, `chilli-chicken.jpg`, `hot-butter-cuttlefish.jpg`, `stir-fried-cuttlefish.jpg`, `chefs-chilli-chicken-wings.jpg`, `wings-and-fries-combo.jpg`, `ceylontro-classic-beef-burger.jpg`, `nashville-hot-chicken-burger.jpg`, `quesadillas.jpg` | Generated (Higgsfield), owner approved | Those dishes |
| `cutout-kottu-special.png`, `cutout-nasi-goreng.png` | Cut out of the generated Kottu Special and Nasi Goreng images (transparent PNG; the Kottu plate fades out on the left, where its photo cut it off) | Menu intro plates |
| `contact-mural.jpg` | Generated (Higgsfield), recreated at 3840 px from the owner's menu V1.2 mural | Contact intro, edges faded into the page |
| `story-mural.jpg` | Generated (Higgsfield, 4K): Sri Lanka to Canada in five arched panels | Our Story intro, edges faded into the page |

The owner's photos were cropped to remove the logo text baked into the social posts. The generated images have a light film grain added so they sit with the photographs.
