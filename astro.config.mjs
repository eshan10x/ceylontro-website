// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { restaurant } from './src/data/restaurant.ts';

// The production domain is an owner fact (src/data/restaurant.ts). Until it is set, canonical
// URLs are not emitted and every page asks search engines not to index it (see src/lib/seo.ts).
const site = restaurant.domain ?? undefined;

export default defineConfig({
  ...(site ? { site } : {}),
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
