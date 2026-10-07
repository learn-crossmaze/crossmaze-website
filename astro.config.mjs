// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.crossmaze.in',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
