// @ts-check
/* global process, URL */
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// AI Atlas is deployed to GitHub Pages. When a custom domain is not configured,
// the site is served from https://<owner>.github.io/<repo>. The `site` option
// below drives canonical URLs, sitemap.xml, and structured metadata.
// Override via env vars when deploying elsewhere.
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://ai-atlas.dev';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  // i18n: English (default) lives at "/" with no prefix; Spanish ("es") lives
  // under "/es". New locales can be added to `locales` and a matching set of
  // pages under `src/pages/<locale>/` without touching this config.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    format: 'directory',
  },
  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
  vite: {
    // @ts-expect-error Vite version mismatch between Astro 5 (vite 6) and @tailwindcss/vite (vite 7); runtime works.
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
