// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.crossmaze.in',
  // Pages build to about.html, branch/crossmaze-neotown.html, …; Firebase Hosting
  // serves them at clean URLs (/about) and redirects trailing slashes away.
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/admin') })],
});
