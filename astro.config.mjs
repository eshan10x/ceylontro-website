// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// The production domain is not decided yet. Set SITE_URL (e.g. in the host's
// environment settings) once it is; canonical URLs are only emitted when it exists.
const site = process.env['SITE_URL'];

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
