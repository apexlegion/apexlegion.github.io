# AI Atlas — Changelog

All notable changes to AI Atlas are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.0] - 2026-07-08

> Phase 3 foundation delivered: i18n, PWA, Public API, AI Assistant, saved collections/dashboard, and browser extension scaffold.

### Phase 3: Living Ecosystem — Foundation

### Added — Internationalization (i18n)

- Added `src/i18n/translations.json` and `src/i18n/utils.ts` for translation lookup, locale normalization, hreflang generation, and fallback to English.
- Added `src/components/i18n/LanguageSwitcher.tsx` with locale-aware path switching.
- Updated `astro.config.mjs` with `i18n` config (`defaultLocale: 'en'`, `locales: ['en', 'es']`, `prefixDefaultLocale: false`).
- Updated `src/layouts/BaseLayout.astro` to render `<html lang="...">` and hreflang alternate links.
- Updated `src/layouts/SiteShell.astro` and `src/components/layout/Header.astro` with Spanish nav links and the language switcher.
- Added `src/pages/es/index.astro` Spanish homepage pilot.
- Added `tests/unit/i18n.test.ts`.

### Added — PWA / Offline Mode

- Added `public/manifest.json` web app manifest.
- Added `public/sw.js` dependency-free service worker with app-shell precaching and offline fallback.
- Added `src/pages/offline.astro` offline fallback page.
- Added `src/components/pwa/RegisterSW.tsx` and `src/components/pwa/InstallPrompt.tsx`.
- Wired PWA components into `src/layouts/BaseLayout.astro` and `src/layouts/SiteShell.astro`.
- Added `tests/unit/pwa.test.ts`.

### Added — Public API

- Added Astro API endpoints under `src/pages/api/`:
  - `projects.json.ts`, `models.json.ts`, `concepts.json.ts`, `tutorials.json.ts`
  - `graph.json.ts`, `search.json.ts`, `index.json.ts`
- Added `tests/unit/api.test.ts`.

### Added — AI Assistant v1

- Added `src/lib/assistant/rules.ts` rule engine for navigation/help queries.
- Added `src/components/assistant/AIAssistant.tsx` floating chat widget with localStorage-backed history.
- Wired assistant into `src/layouts/SiteShell.astro`.
- Added `tests/unit/assistant.test.tsx`.

### Added — Saved Collections / Dashboard

- Added `src/lib/collections/store.ts` localStorage-backed saved-items store.
- Added `src/components/collections/BookmarkButton.tsx` and `src/components/collections/SavedItemsList.tsx`.
- Added `src/pages/dashboard.astro` personal dashboard.
- Wired `BookmarkButton` into `src/components/entity/EntityDetail.astro`.
- Added dashboard links to `src/layouts/SiteShell.astro` and `src/components/layout/Header.astro`.
- Added `tests/unit/collections.test.ts` and `tests/unit/dashboard.test.tsx`.

### Added — Browser Extension Scaffold

- Created `browser-extension/` workspace with `manifest.json`, `content.js`, `popup.html`, `README.md`, and placeholder icons.

### Known Limitations

- Spanish pilot only covers the homepage (`/es/`). Sub-routes under `/es/*` would require duplicating/translating the full page tree and are deferred to ongoing Phase 3 content work.
- Browser extension uses placeholder 1x1 transparent PNG icons.

### Verified

- Phase 3 foundation verified: lint, typecheck, tests (194/194), build (135 pages, 2 languages) passing.
- Startup smoke test confirmed `/`, `/dashboard`, `/offline`, and all `/api/*.json` endpoints return 200.

## [0.2.0] - 2026-07-07

> Phase 2 approved and finalized on 2026-07-07. Phase 3 pending definition.

### Phase 2: Galaxy Expansion

### Added — Chunk 1: Comparison Engine

- Added `src/pages/compare.astro` and `src/pages/compare/[a]-vs-[b].astro` for side-by-side AI model/project comparison.
- Added `src/components/compare/ComparisonTable.tsx`, `BenchmarkChart.tsx`, and `TimelineCompare.tsx`.
- Added tests in `tests/unit/compare.test.tsx`.

### Added — Chunk 2: Knowledge Graph Explorer

- Added `src/pages/graph.astro` interactive graph explorer.
- Added `src/components/graph/GraphExplorer.tsx`, `GraphNodeDetail.tsx`, and `src/lib/graph/explorer.ts`.
- Added `useGraphLayout` hook for SVG force-directed layout.

### Added — Chunk 3: Expanded Playgrounds

- Added 13 total browser-based AI playgrounds across 6 categories.
- Added `src/components/playgrounds` React islands and `src/pages/playgrounds/index.astro` grouped by category.
- Added `tests/unit/playgrounds.test.tsx`.

### Added — Chunk 4: Decision Engine v2 + Explain Levels

- Added `src/lib/decisions/engine.ts` scoring decision engine with weighted scoring profiles.
- Added 6 canonical Explain Like I'm... levels: `twelve`, `beginner`, `student`, `developer`, `researcher`, `business`.
- Added `LevelContent` renderer and level-aware detail pages.
- Added `tests/unit/decisions.test.tsx` and `tests/unit/levels.test.tsx`.

### Added — Chunk 5: Multi-Source Scrapers

- Added `scripts/connectors/ArxivConnector.ts` and `scripts/connectors/PapersWithCodeConnector.ts`.
- Added `scripts/connectors/RssConnector.ts` for RSS/Atom feeds.
- Added pipeline scripts: `expiry.ts`, `dead-links.ts`, `normalize.ts`, `run.ts`, `validate.ts`, `write.ts`, `generateIndexes.ts`.
- Added `.github/workflows/daily-data-update.yml`, `manual-scrape.yml`, and `on-push.yml` validation step.
- Updated schemas in `src/lib/schemas/entity.ts` to support `paper`, `news`, `dataset`, and `benchmark` content entities.

### Added — Chunk 6: Jobs, Events, News

- Added seed data: `src/data/seed/jobs.json`, `src/data/seed/events.json`, `src/data/seed/news.json`.
- Added schemas: `JobSchema`, `EventSchema` to `src/lib/schemas/entity.ts`.
- Added data helpers in `src/lib/data/entities.ts`: `getAllJobs`, `getJobBySlug`, `getAllEvents`, `getEventBySlug`, `getAllNews`, `getNewsBySlug`, with expiry filtering and search-index integration.
- Added pages: `src/pages/jobs.astro`, `src/pages/jobs/[slug].astro`, `src/pages/events.astro`, `src/pages/events/[slug].astro`, `src/pages/news.astro`, `src/pages/news/[slug].astro`.
- Added homepage CTAs and navigation links for `/jobs`, `/events`, `/news`.
- Updated tests in `tests/unit/schemas.test.ts` and `tests/unit/entities.test.ts`.

### Fixed

- Fixed Vite 7/6 type mismatch by pinning `@tailwindcss/vite` to `~4.1.17`.
- Fixed `eslint.config.js` TypeScript union-type issue with `@ts-expect-error`.
- Fixed Pagefind UI build-time resolution via runtime script injection.
- Fixed ArXiv ID normalization to strip trailing version suffixes (`2501.12345v1` → `2501.12345`).
- Fixed pipeline `Entity` type mismatch by importing the broader pipeline `Entity` union in `scripts/pipeline/validate.ts`.
- Fixed `JobSchema`/`EventSchema` temporal dead-zone ordering in `src/lib/schemas/entity.ts`.

### Phase 2 Validation Fixes (2026-07-07)

- Fixed broken `/learn` nav link by creating `src/pages/learn.astro` as a learning hub for tutorials and concepts.
- Added `/graph` link to the global navigation in `src/components/layout/Header.astro` and `src/layouts/SiteShell.astro`.
- Fixed React runtime warning in `src/pages/404.astro` by replacing `<Button onclick="...">` with native `<a>` and `<button>` elements.
- Added `scripts/generate-search-index.ts` and regenerated `public/search-index.json` (82 items) so CommandPalette search includes current entities plus jobs, events, and news.

### Verified

- Phase 2 fully validated: lint (no issues), typecheck (pass), tests (130/130), build (132 pages) passing.
- Startup validation confirmed all Phase 2 routes return 200.
- E2E browser tests cannot run in this environment (missing `libnspr4`, `libnss3`, `libasound`); documented as known limitation.

## [0.1.0] - 2026-07-06

> Phase 1 approved and finalized on 2026-07-06. Phase 2 will be defined after review and testing.

### Added — Milestone 5: Content Generation + AI Glossary + Tool Directory + Model Directory

- Expanded seed data: 50 projects, 20 models, 20 concepts, 20 tutorials, 5 playgrounds, 3 decision profiles (`src/data/seed/*.json`).
- Added `src/pages/glossary.astro` and `src/pages/tools.astro` listing pages.
- Added playground pages under `src/pages/playgrounds/{tokenization,embedding-visualizer,prompt-engineering,context-window,quantization}.astro` with matching React islands under `src/components/playgrounds/`.
- Added decision pages under `src/pages/decisions/{local-llm,llm-framework,image-generation}.astro` with matching React islands under `src/components/decisions/` (shared `DecisionRunner`).
- Added `src/pages/playgrounds/index.astro` and `src/pages/decisions/index.astro` listing pages.
- Enhanced `src/pages/models/index.astro` with modality filter chips (All / Text / Vision / Audio / Multimodal) and a sort dropdown (alphabetical, parameters ascending/descending) powered by `src/components/models/ModelDirectoryFilters.astro`.
- Extended `GlobalNav` (Header.astro default) and the `MobileMenu` link set in `src/layouts/SiteShell.astro` to include `/glossary`, `/tools`, `/playgrounds`, and `/decisions`.
- Expanded `src/pages/index.astro` category grid to eight CTAs (Projects, Models, Tutorials, Playgrounds, Glossary, Tools, Decisions, Concepts).
- Added tests: `tests/unit/playgrounds.test.tsx` (TokenizationPlayground + `tokenize`) and `tests/unit/decisions.test.tsx` (LocalLlmDecision smoke test).
- Fixed two `no-useless-escape` lint errors in `src/components/playgrounds/TokenizationPlayground.tsx` by removing unnecessary escapes inside a character class.

### Fixed

- `src/components/playgrounds/TokenizationPlayground.tsx`: removed useless escapes `\[` and `\-` inside a character class regex.

### Verified

- Milestone 5 verified: lint, typecheck, tests, build passing.

### Added — Milestone 6: Responsive Optimization + Testing + Documentation

- Mobile-first responsive pass on listing, detail, glossary, tools, models, search, and homepage components.
- Added `scripts/a11y-audit.ts` — static axe-core audit over the built `dist/` pages using jsdom.
- Added `scripts/lighthouse-audit.ts` — Lighthouse CI runner for the built static site.
- Added `.kimchi/docs/A11Y_AUDIT.md` and `.kimchi/docs/LIGHTHOUSE_AUDIT.md` documenting audit approach and current results.
- Added `tests/e2e/README.md` explaining Playwright E2E setup and the environment limitation (missing `libnspr4`, `libnss3`, `libasound`).
- Updated `README.md` with project overview and build/test commands.

### Verified

- Milestone 6 verified: lint, typecheck, tests (55/55), build (78 pages) passing.
- E2E browser tests cannot run in this environment; documented as a known limitation.

## [0.1.0] - 2026-07-06

### Added — Milestone 4: Data Pipeline + GitHub Actions

- Added `scripts/pipeline/normalize.ts` — orchestrates per-connector normalization.
- Added `scripts/pipeline/validate.ts` — validates entities and relations against the runtime Zod schemas and writes a JSON report to `data/reports/validation.json`.
- Added `scripts/pipeline/enrich.ts` — computes per-project health scores (recency, popularity, documentation, license) and infers `similarTo` relations between models that share a family slug.
- Added `scripts/pipeline/write.ts` — writes raw records to `data/raw/{source}/`, normalized entities to `data/normalized/{projects,models,concepts,tutorials}/`, and relations to `data/normalized/relations/all.json`.
- Added `scripts/pipeline/generateIndexes.ts` — emits `data/normalized/indexes/{slug-index,type-index,relation-index}.json`.
- Added `scripts/pipeline/run.ts` — orchestrates fetch → normalize → validate → enrich → write → index with `--source=github|huggingface|all`, `--skip-scrape`, `--skip-write` flags.
- Added `.github/workflows/daily-data-update.yml` — cron `0 2 * * *` runs `pnpm run scrape:all`, validates, regenerates indexes, and commits changes if any.
- Added `.github/workflows/manual-scrape.yml` — `workflow_dispatch` with a `source` input (`github`, `huggingface`, `all`) and the same commit-if-changed behavior.
- Updated `.github/workflows/on-push.yml` to run `pnpm run data:validate` when `data/` or `scripts/` change.
- Added `tests/unit/connectors.test.ts` — covers slug/typed-id helpers, GitHub + Hugging Face normalization on sample raw records (no real API calls).
- Added `tests/unit/pipeline.test.ts` — covers validation (valid + invalid entities and relations), enrichment (health scores + model-family similarity inference), and index generation.

## [0.1.0] - 2026-07-06

### Added — Milestone 3: Search + Knowledge Graph Foundation

- Installed `pagefind` and `zod` as dev dependencies.
- `pnpm run build` now runs `astro build && pagefind --site dist --output-subdir pagefind`, so every production build emits a Pagefind search index.
- Added `src/lib/graph/types.ts` (`GraphNode`, `GraphEdge`, `AdjacencyList`) and `src/lib/graph/build.ts` (`buildAdjacencyList`, `buildReverseAdjacencyList`, `getRelatedNodes`, `mergeAdjacency`).
- Added Zod schemas in `src/lib/schemas/entity.ts` for Project, Model, Concept, Tutorial, TimelineEvent, ExternalLink, and Relation.
- Added seed JSON files in `src/data/seed/` (5 projects, 3 models, 4 concepts, 3 tutorials, 27 relations) and the `src/lib/data/entities.ts` helper with `getEntityBySlug`, `getEntitiesByType`, `getRelatedEntities`, and `getSearchIndexItems`.
- Added `src/components/graph/MiniGraph.tsx` (zero-dependency SVG hub-and-spoke view) and `GraphNodeCard.tsx`, with a barrel export.
- Added `src/components/search/PagefindUI.astro` — mounts Pagefind UI in production and falls back to Fuse.js over `/search-index.json` in development.
- Added `src/pages/search.astro` (Pagefind-powered search page).
- Added listing pages `src/pages/{projects,models,concepts,tutorials}/index.astro`.
- Added detail pages `src/pages/{projects,models,concepts,tutorials}/[slug].astro` powered by `getStaticPaths` and a shared `src/components/entity/EntityDetail.astro` shell (breadcrumbs, type badge, tags, external links, optional Timeline, MiniGraph, "What should I learn next?").
- Concept and tutorial detail pages include a `LevelSwitcher` shell.
- `GlobalNav` (and the MobileMenu copy) now link to `/projects`, `/models`, `/concepts`, `/tutorials`, and `/search`.
- Added unit tests: `tests/unit/graph.test.ts` (adjacency list construction, reverse adjacency, missing-target handling, merge) and `tests/unit/schemas.test.ts` (every seed entity validates; bad slugs and out-of-range weights are rejected).
- Updated `public/search-index.json` to include the new entities and to match the CommandPalette index shape.

### Fixed

- Removed redundant `role="list"` on `<ul>` in `MiniGraph.tsx` (jsx-a11y/no-redundant-roles).
- Removed unused `eslint-disable no-console` directives in `src/lib/graph/build.ts`.
- Re-pointed `AdjacencyList` import in `src/lib/data/entities.ts` to `@/lib/graph/types` (where it is exported).

### Verified

- Milestone 3 verified: lint, typecheck, tests (27/27), and build passing. 22 static pages generated; Pagefind indexed 22 pages.

## [Unreleased]

### Added

- Initial project manifest and architecture documentation.
- Frozen architecture with final engineering rules.
- Backlog, TODO, and changelog established.

## [0.2.0] - 2026-07-06

### Milestone 2: Layout + Navigation + Homepage

- Added layout components: `Container`, `Grid`, `Section`, `Header`, `Footer` (`src/components/layout/`).
- Added `GlobalNav` with logo, main links, search trigger, and theme toggle; dispatches a `palette:open` window event.
- Added `SiteShell` layout composing `BaseLayout` with `Header`, `Footer`, `CommandPalette`, and `MobileMenu` islands.
- Added `MobileMenu` React island — full-screen menu triggered by the hamburger button.
- Added `CommandPalette` React island — global `/`-triggered search using Fuse.js over `/search-index.json` (seed projects, models, concepts).
- Added `ThemeToggle` React island — toggles `data-theme` on `<html>` and persists to `localStorage`.
- Added `Breadcrumbs` Astro component with typed `BreadcrumbItem[]` API.
- Hardcoded seed search index in `src/data/search-index.json` and `public/search-index.json` (15 entries across projects, models, concepts).
- Rewrote `src/pages/index.astro` home page: hero with search + CTAs, four category cards, featured projects, featured models, latest news, learning paths, knowledge graph teaser.
- Improved `src/pages/404.astro` styling and wired it to the new shell.
- Added `fuse.js@^7.0.0` dependency.
- Mobile-first, keyboard-accessible, dark-mode default.

## [0.1.0] - 2026-07-06

### Added — Milestone 1: Project Scaffold + Design System + Component Library

- Astro 5 + TypeScript strict project scaffold with pnpm.
- Tailwind CSS v4 wired through `@tailwindcss/vite` with Affiliate Forge
  design tokens (orange on black palette, typography, spacing, radius, shadows).
- CSS custom properties layer (`src/styles/tokens.css`) and global stylesheet
  (`src/styles/global.css`) with skip-link, scrollbar, focus, and
  `prefers-reduced-motion` baselines.
- `BaseLayout.astro` with `<html lang>`, OG/Twitter meta, canonical URL,
  skip-to-content link, and dark-default / light-supported theming.
- Path aliases `@/components`, `@/lib`, `@/data`, `@/styles` configured in
  `tsconfig.json` and Astro Vite resolver.
- Primitive UI components in `src/components/ui/`:
  `Button`, `Card` (+ `CardHeader`/`CardBody`/`CardFooter`),
  `Badge`, `Tag`, `Input` (+ `Textarea`), `Select`, `Tabs`, `Dialog`,
  `Tooltip`, `Skeleton`.
- Architecture-specific components in `src/components/`:
  `LevelSwitcher` (Explain Like I'm... levels), `Timeline` + `TimelineEvent`,
  `PlaygroundShell`.
- Minimal home page (`src/pages/index.astro`) and 404 page demonstrating the
  design system end-to-end.
- ESLint flat config + Prettier with Astro and Tailwind plugins.
- Vitest with jsdom and `@testing-library/react` for component tests.
- Playwright config and a home-page end-to-end test.
- GitHub Actions workflow `.github/workflows/on-push.yml` running lint,
  typecheck, unit tests, and build with pnpm caching.

### Fixed

- `cn` utility now drops `0` along with other falsy values, matching the
  conventional behavior expected by class-name composition utilities.
- Fixed eslint.config.js type error; Milestone 2 verified.

### Verified

- Milestone 1 verified: lint, typecheck, tests, build, and E2E passing.

## [0.0.0] - 2026-07-06

### Added

- Phase 0 planning documents created and approved.
