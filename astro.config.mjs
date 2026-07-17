// @ts-check
/* global process, URL */
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// AI Atlas is deployed to GitHub Pages as a project page (not a
// <owner>.github.io root repo), so it's served from
// https://<owner>.github.io/<repo>/ — the `base` option below must match the
// repo name so internal links resolve under that subpath instead of the
// domain root. `deploy.yml` derives both PUBLIC_SITE_URL and
// PUBLIC_BASE_PATH from `actions/configure-pages` at build time so this
// stays correct even if the repo is renamed again.
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://apexlegion.github.io';
const BASE_PATH = process.env.PUBLIC_BASE_PATH ?? '/aiatlas';

export default defineConfig({
  site: SITE,
  base: BASE_PATH,
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
      // Force a single copy of React across all islands. Without this, Vite's
      // dep optimizer can prebundle React twice (two different `?v=` hashes),
      // which throws "Invalid hook call / more than one copy of React" and
      // silently kills every interactive island in dev.
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
    },
  },
});
