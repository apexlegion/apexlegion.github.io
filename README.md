# AI Atlas

> Learn. Compare. Build. Everything Open Source AI, in One Place.

AI Atlas is the definitive knowledge platform for Open Source AI —
visual-first, accessibility-led, curated by humans and automated by
robots. See [`.kimchi/docs/PROJECT_MANIFEST.md`](.kimchi/docs/PROJECT_MANIFEST.md)
for the frozen Phase 1 spec.

## Stack

- **Astro 5** static site generator with React 19 islands.
- **TypeScript** strict mode, ESLint + Prettier.
- **Tailwind CSS v4** via `@tailwindcss/vite`.
- **Pagefind** full-text search (post-build index).
- **D3 / Framer Motion** for graphs and motion (Phase 2).
- **Vitest** unit tests, **Playwright** E2E tests.

## Commands

```bash
pnpm install            # install dependencies
pnpm run dev            # start dev server (http://localhost:4321)
pnpm run build          # astro build + pagefind index
pnpm run preview        # serve the production build
pnpm run lint           # eslint + prettier --check
pnpm run typecheck      # tsc --noEmit
pnpm test               # vitest run (unit tests)
pnpm run test:e2e       # playwright (requires Chromium; see tests/e2e/README.md)
pnpm run scrape:all     # run the GitHub + Hugging Face data pipeline
```

## Project structure

```
.kimchi/docs/     Authoritative design + spec docs (manifest, a11y, perf).
data/             Scraped + normalized entity data.
public/           Static assets served as-is.
scripts/          Connectors, pipelines, audits.
src/components/   UI, layout, entity, search, graph components.
src/content/      MDX content.
src/data/         Seed JSON + helpers.
src/layouts/      BaseLayout + SiteShell.
src/lib/          Utilities, schemas, graph helpers.
src/pages/        Astro routes (static).
tests/            Vitest (unit) + Playwright (e2e).
```

## Accessibility & performance

- WCAG 2.2 AA target. See [`.kimchi/docs/ACCESSIBILITY.md`](.kimchi/docs/ACCESSIBILITY.md).
- Lighthouse ≥ 95 in all categories. See [`.kimchi/docs/PERFORMANCE_GUIDE.md`](.kimchi/docs/PERFORMANCE_GUIDE.md).
- Audit scripts: `scripts/a11y-audit.ts`, `scripts/lighthouse-audit.ts`.

## License

Content in this repository is for the AI Atlas project. Open Source
project data is curated from public sources and respects each project's
license; see individual entity pages for attribution.
