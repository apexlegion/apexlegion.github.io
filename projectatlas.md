# AI Atlas — Complete Project Record (`projectatlas.md`)

> **Read me first.** This file is the single, self-contained record of what AI
> Atlas is, everything built and fixed, how it deploys, and — importantly — the
> **rename / base-path migration** done on 2026-07-14. If you are a new session
> picking this up cold, you should not need any other explanation. Nothing left
> out.

**Product:** AI Atlas — _Learn. Compare. Build. Everything Open Source AI, in one place._
**Parent brand:** Affiliate Forge
**Owner:** Kunal Singh — GitHub `apexlegion` (account email goodvibesbykunal@gmail.com)
**Cost:** $0 / month — public GitHub repo (free Actions + free Pages)

---

## 0. CURRENT STATE / WHERE THINGS STAND (read this section first)

- **Local working copy (authoritative):** `C:\Users\Kunal\claudecode\aiatlas`
  (Windows-native, sits alongside the other projects like `affiliateforge`,
  `space-site`, etc.). This **replaces** the old WSL copy at
  `\\wsl.localhost\Ubuntu\home\kunal\AI-Atlas`, which is now stale — do not use it.
- **LIVE.** Repo renamed `apexlegion/aiatlas`, migration + Learn Academy
  pushed and deployed. Site is up at **https://apexlegion.github.io/aiatlas/**
  — verified in a live browser check (no console errors, all 3 Academy
  tracks render).
- **Git remote:** `origin` → `https://github.com/apexlegion/aiatlas.git` on
  branch `main`.
- Before pushing, local `main` was fast-forwarded onto `origin/main` to pick
  up 4 daily-scrape bot commits made on the old repo name before the rename,
  then rebuilt/retypechecked clean against that merged data before pushing —
  so no scraped data was lost or overwritten by the migration.
- **2026-07-17: the Learn Academy shipped and is live.** `/learn` is now a
  3-track, hands-on curriculum (34 lessons); see §3.5. Production build emits
  **203 pages**, verified both in a local served build and on the live site.

**Why the rename is needed at all:** the current repo is named
`apexlegion.github.io`, which GitHub treats as the account's *root* user page
(served at the bare domain). Renaming it to `aiatlas` makes GitHub serve it as a
*project page* at `apexlegion.github.io/aiatlas/`. "aiatlas" as a standalone
username/org (`aiatlas.github.io`) was **not available** — both `github.com/aiatlas`
and `github.com/ai-atlas` are already taken by unrelated accounts — so the
project-page subpath is the free way to get "aiatlas" into the URL.

---

## 1. What it is

A visual-first, beginner-friendly encyclopedia of **open-source AI**. Anyone —
from someone who has never written code to a senior engineer — can learn AI,
compare tools and models, explore a knowledge graph, try in-browser
playgrounds, and discover the famous free tools people use worldwide. Built only
with open technology, hosted free, and it refreshes itself daily.

---

## 2. HOW TO FINISH THE RENAME (step-by-step)

### Step A — Kunal renames the repo (human-only; Claude cannot do this)

Renaming a repo requires being logged into GitHub as the owner. In the repo
(`https://github.com/apexlegion/apexlegion.github.io`):

1. **Settings** (top nav) → **General** (default page).
2. First field is **Repository name** — it says `apexlegion.github.io`.
3. Change it to exactly **`aiatlas`** → click **Rename**.

That's it. GitHub keeps all history, commits, stars, and Actions. It also
auto-redirects the old repo URL to the new one, so the local git `origin` keeps
working even before it's updated.

### Step B — Confirm Pages is still on "GitHub Actions"

Settings → **Pages** → **Build and deployment** → **Source** should still say
**GitHub Actions**. (Renaming doesn't change it, but verify.)

### Step C — Claude pushes the migration commits (do this after Step A)

From `C:\Users\Kunal\claudecode\aiatlas`:

```bash
git remote set-url origin https://github.com/apexlegion/aiatlas.git
git add -A
git commit -m "Serve as a GitHub Pages project page under /aiatlas base path"
git push origin main
```

The push triggers `deploy.yml`, which builds with the correct base path
(derived automatically — see §6) and publishes to
**`https://apexlegion.github.io/aiatlas/`**. Give GitHub's CDN a few minutes.

### What happens to the old root URL

After the rename there is no longer a repo named `apexlegion.github.io`, so the
bare `https://apexlegion.github.io` will 404. That's expected. If Kunal ever
wants the bare domain to redirect to `/aiatlas`, create a new (separate)
`apexlegion.github.io` repo later with a one-line redirect — not needed now.

---

## 3. The base-path migration — what was changed and WHY (2026-07-14)

Moving from a root site (`/`) to a project subpath (`/aiatlas/`) is **not** just
a settings flip. Astro's `base` config only rewrites the routes and assets Astro
generates itself; it does **not** rewrite root-absolute string literals in
templates, JSON data, service workers, or inline scripts. Every such literal had
to be routed through a helper. Summary of the work:

### A. Config

- **`astro.config.mjs`** — added `base: BASE_PATH` where
  `BASE_PATH = process.env.PUBLIC_BASE_PATH ?? '/aiatlas'`, and set the local
  default `site` to `https://apexlegion.github.io`.
- **`.github/workflows/deploy.yml`** — the Build step now also exports
  `PUBLIC_BASE_PATH: ${{ steps.pages.outputs.base_path }}` alongside the existing
  `PUBLIC_SITE_URL: ${{ steps.pages.outputs.origin }}`. `actions/configure-pages`
  resolves `base_path` to `/aiatlas` for a project repo (and to `""` for a root
  repo), so **CI stays correct even if the repo is renamed again** — no hardcoding.

### B. The helper — `src/lib/utils/url.ts` (new file, exported from `@/lib`)

- **`withBase(path)`** — prefixes an internal path with `import.meta.env.BASE_URL`
  (leaves absolute `http(s)://` URLs untouched). Use this for **every** internal
  link/asset written as a literal string.
- **`stripBase(path)`** — inverse; removes the deploy subpath so locale/route
  logic that assumes root-relative paths keeps working.

### C. New file: `src/env.d.ts`

Added `/// <reference types="astro/client" />`. This was **missing entirely**
from the project (a pre-existing gap) and is what provides the `import.meta.env`
typings — without it, typecheck failed the moment any code touched
`import.meta.env`.

### D. Site-wide components fixed to call `withBase`

- `src/layouts/SiteShell.astro` — desktop nav links (EN + ES) **and** the inline
  client-side mobile-menu links array.
- `src/layouts/BaseLayout.astro` — `favicon.svg`, `manifest.json`, `og:image`,
  and the hreflang tags (now computed from `stripBase(Astro.url.pathname)`).
- `src/components/layout/GlobalNav.astro`, `Header.astro`, `Footer.astro` —
  logo/home hrefs and link arrays.
- `src/components/layout/Breadcrumbs.astro` — one fix here covers **43 pages**
  that render breadcrumbs.
- `src/components/layout/CommandPalette.tsx` — search index fetch + result links.
- `src/components/search/PagefindUI.astro` — pagefind bundle probe/load,
  search-index fetch, noscript link, and result item URLs.
- `src/components/pwa/RegisterSW.tsx` — SW `scriptUrl` **and** `scope` (the scope
  must match the subpath or the browser rejects registration).
- `src/components/collections/SavedItemsList.tsx`, `assistant/AIAssistant.tsx`,
  `compare/TimelineCompare.tsx`, `compare/ComparisonTable.tsx`,
  `entity/EntityDetail.astro`, `playground/PlaygroundShell.tsx`.

### E. Data + i18n layers (fix at the source, not every call site)

- `src/lib/data/entities.ts` — `entityToNode()` builds graph-node hrefs; now
  wrapped in `withBase`, so every graph/mini-graph/related-entity link is correct.
- `src/i18n/utils.ts` — `buildHreflangs` now re-applies `withBase` after
  computing locale-neutral paths, and `LanguageSwitcher.tsx` strips the base
  before locale math then re-adds it. (Without this, `/aiatlas/es/graph` would
  misparse `aiatlas` as the locale segment and break the language switcher +
  hreflangs.)

### F. Per-page literal links

Fixed hardcoded hrefs in: `index.astro`, `learn.astro`, `404.astro`,
`offline.astro`, `concepts/index`, `decisions`, `events` + `events/[slug]`,
`glossary`, `jobs` + `jobs/[slug]`, `models/index`, `news` + `news/[slug]`,
`playgrounds/index`, `projects/index`, `tools`, `tutorials/index`,
`compare` + `compare/[a]-vs-[b]`. Also the four `Astro.redirect('/404')` calls
(now `withBase('/404')`) and the `compare.astro` form `action` + its `is:inline`
submit script (base passed via `define:vars` since inline scripts can't read
`import.meta.env`).

### G. Static `public/` files (copied as-is, can't be templated)

- **`public/manifest.json`** — `start_url`, `scope`, and both icon `src` values
  hardcoded to the `/aiatlas/` prefix.
- **`public/sw.js`** — derives `BASE` **at runtime** from
  `self.registration.scope` (which carries the subpath), then prefixes the
  precache list and the offline-fallback links. Runtime-derived so it survives a
  future rename without edits.

### External links are intentionally left alone

`externalLinks[].href` in seed data and timeline events are real off-site URLs;
`withBase` no-ops on `http(s)://` anyway, but they were audited and confirmed
external.

---

## 3.5. The Learn Academy (2026-07-17)

**Why:** the site taught *about* AI (concepts/glossary) but a total beginner
could read for an hour and never actually *use* an AI. Product decision
(Kunal): the site must take someone who knows nothing and get them doing real
work with AI, at whatever level they're at.

**What `/learn` is now:** a 3-track, task-first academy — pick your level:

- **🌱 Beginner ("I've never used AI") — 16 lessons.** "Your first 5 minutes"
  plus everyday task recipes: write any email · summarize anything · decode a
  confusing document · translate · make your first image · plan a trip · AI as
  tutor · polish your writing · cook with what you have · interview practice ·
  CV writing · social posts · bills & budgets · compare before buying ·
  effective complaints. Each: exact free tool → copy-paste prompt (brackets to
  fill) → what you'll get → tweaks → "words you just learned".
- **⚡ Intermediate ("I use AI sometimes") — 10 lessons.** Prompt anatomy
  (role+context+task+format), examples/few-shot, the draft→critique→rewrite
  loop, personas + the "don't flatter me" clause, output formats, files/photos/
  screenshots, catching hallucinations, custom instructions, right-tool-per-
  job, voice mode.
- **🚀 Advanced ("Make me a power user") — 8 lessons.** Bridges into existing
  site content: Ollama/GPT4All locally, Open WebUI private ChatGPT, local
  image gen, RAG/chat-with-documents, Whisper transcription, agents (manual
  agent-loop exercise), choosing a stack (quantization/GGUF/hardware), staying
  current via the site's own auto-updating dashboard/news.

**Tool policy (decided):** free-to-use first, open-source always shown and
badged ("★ Open source") — every lesson has both a primary tool card and an
OSS alternative card.

**Terminology strategy:** vocab is taught inside lessons; each lesson's
"Words you just learned" box links to `/concepts/<slug>` pages (which have the
5-level explanation switcher).

**Implementation:**

- `src/data/lessons.ts` — all lesson content as a standalone typed TS module.
  Deliberately NOT part of the zod seed/entity system (no graph/validation/
  scraper impact). Helpers: `getLessonsByTrack`, `getLesson`, `getNextLesson`,
  `getTrack`, `TRACKS`, `LESSONS`.
- `src/pages/learn/index.astro` — academy landing (replaces the deleted
  `src/pages/learn.astro`): 3 track cards + per-track lesson lists + the old
  tutorials/concepts sections kept at the bottom.
- `src/pages/learn/[slug].astro` — lesson page, fixed section order: goal →
  tools (free + OSS) → steps → prompts (copyable) → result → tweaks → vocab →
  go deeper → mark-done/next.
- `src/components/learn/LessonProgress.tsx` — three React islands:
  `LessonDone` (toggle), `TrackProgress` (n/total bar), `CopyPrompt`
  (clipboard). Progress = array of slugs in localStorage key
  `ai-atlas:lessons-done`. No accounts, no server.
- Homepage "Never touched AI before?" strip now points at the first 4
  beginner lessons instead of concept pages.
- **Bonus fix:** `BaseLayout.astro` doubled the site name in `<title>`
  ("Learn — AI Atlas — AI Atlas") site-wide; now appends only when missing.
- Spec: `docs/superpowers/specs/2026-07-17-learn-academy-design.md`.

**Verified (2026-07-17):** typecheck clean · 203 pages · served the production
build and confirmed: islands hydrate, mark-done persists and shows on the
landing progress bars, copy button present, all `/learn` hrefs base-prefixed,
no console errors.

---

## 4. Tech stack

| Layer               | Choice                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| Framework           | Astro 5 (static site generation), `base: '/aiatlas'`                    |
| Interactive islands | React 19 (`client:load` / `client:visible`)                            |
| Styling             | Tailwind CSS v4 (theme tokens via `@theme` in `src/styles/global.css`) |
| Search              | Pagefind (static index built from `dist/`) + Fuse.js dev fallback      |
| Data                | JSON seed files in `src/data/seed/` + a scrape pipeline in `scripts/`  |
| Tests               | Vitest (unit) + Playwright (e2e config)                                |
| CI/CD               | GitHub Actions → GitHub Pages                                          |
| Package manager     | pnpm 10.34.4 (run via `corepack pnpm` on Kunal's Windows box)          |

---

## 5. Building & verifying locally (Windows)

pnpm isn't on PATH directly; use **`corepack pnpm`** (corepack ships with Node).

```powershell
cd C:\Users\Kunal\claudecode\aiatlas
corepack pnpm install
corepack pnpm run typecheck   # tsc --noEmit — must be clean
corepack pnpm run build       # astro build + pagefind -> dist/
```

To reproduce the exact CI/production build (project-page subpath), set the env
vars first:

```powershell
$env:PUBLIC_SITE_URL="https://apexlegion.github.io/aiatlas"
$env:PUBLIC_BASE_PATH="/aiatlas"
corepack pnpm run build
```

**Verification done on 2026-07-14 (rename) and 2026-07-17 (Academy):** typecheck clean · 203 pages built ·
Pagefind indexed 2 languages / 2780 words · a grep of `dist/**/*.html` for
root-absolute internal hrefs found **only two stray links**, both
**pre-existing content dead-links** in the news seed data (not migration bugs):

- `/blog/ai-atlas-phase-2` — points to a `/blog/...` page that doesn't exist.
- `/learn/rag-evaluation` — points to a `/learn/...` sub-page that doesn't exist.

Both live in `src/data/seed/news.json` as `externalLinks` that are actually
internal, mislabeled. **Left as-is** (content bug, out of scope for the rename).
Fixing them = correct the two URLs in that seed file, or drop the links.

Data pipeline commands (unchanged): `corepack pnpm run scrape:all`,
`... --skip-scrape`, `data:validate`, `data:index`.

---

## 6. How it updates itself — free, automatic, every 24h

All times UTC (IST = UTC + 5:30). Every workflow also has a manual "Run
workflow" button in the Actions tab.

| Time (UTC)  | IST      | Workflow                 | What it does                                             |
| ----------- | -------- | ------------------------ | ------------------------------------------------------- |
| 02:00 daily | 07:30    | `daily-data-update.yml`  | Scrape GitHub / HF / arXiv / Papers With Code / RSS -> commit new data |
| 04:00 daily | 09:30    | `daily-news-expiry.yml`  | Remove news older than 30 days -> commit                |
| 05:00 daily | 10:30    | `deploy.yml`             | Rebuild with latest data -> publish to Pages (subpath-aware) |
| Mon 03:00   | Mon 08:30| `weekly-health-check.yml`| Re-validate data + dead-link scan (report only)         |
| on push     | —        | `deploy.yml` + `on-push.yml` | Redeploy + CI whenever a human pushes               |

`deploy.yml` reads the live origin **and base path** from
`actions/configure-pages` at build time, so canonical URLs, sitemap.xml,
internal links, and structured data all resolve under `/aiatlas/` automatically.
Public repos get unlimited free Actions minutes + free Pages. **$0/month.**

---

## 7. Everything fixed & built earlier (pre-migration history, still true)

### A. Build / correctness

1. `scripts/pipeline/dead-links.ts` broke the TS parser (a `**/` closed a block
   comment early); it had been excluded from linting as a hack. Fixed + re-included.
2. Duplicate routes (`/decisions`, `/playgrounds`) removed.
3. Dead React islands in `SiteShell` (`MobileMenu`/`CommandPalette` mounted
   twice, one throwing a hydration error) removed.
4. Service worker precached a non-existent hashed `/styles/global.css` — removed.
5. Graph hydration mismatch (node coords differed 1 ULP server vs browser) —
   rounded to 2 decimals.

### B. "Looks dead / not appealing"

6. Invisible graph text — Tailwind v4 only emits SVG `fill-*` for colors in
   `@theme`; added the semantic aliases so labels render white/muted/orange.
7. Beginner-education level switcher was silently dropped — `EntityDetail` never
   rendered `<slot name="header" />`; added it.
8. Dead buttons/menus, root causes fixed: `Button` could only be `<button>` (now
   renders a real `<a>` for links); `Tag` labels were `<button>`s nested in
   linked cards (invalid HTML swallowing clicks -> `<span>`); homepage cards/CTAs
   had no links (wired); 13 more ghost card buttons fixed; dev React double-load
   fixed via `resolve.dedupe` + `optimizeDeps`.

### C. Visual redesign (premium, orange-on-black)

9–11. New utility language (gradient brand text, ambient glow, glass, grid
backdrop, hover-lift, staggered rise-in); rebuilt hero (72px headline, live stat
row), beginner strip, knowledge-graph CTA. **Dark-only, deliberately** — light
mode had a pre-existing Tailwind v4 `@theme` token-cycle bug (toggle flipped but
page stayed dark), so the broken toggle was removed rather than shipped
half-working. _(Future fix: rename tokens so `@theme` names don't self-reference.)_

### D. Content

12–15. Glossary 4 -> 31 terms A–Z; 10-step beginner path on `/learn`; models
3 -> 10; Tools page rebuilt with the plain-language "popular tools" section
(Ollama, GPT4All, Jan, Open WebUI, ComfyUI, Stable Diffusion WebUI,
whisper.cpp, LangChain) + the ~49-repo filterable directory.

### E. Automation & deployment (original)

16–19. Added the Pages deploy workflow; fixed the self-update trigger gap (a
`GITHUB_TOKEN` commit can't trigger another workflow, so `deploy.yml` got its own
daily schedule); fixed "Setup pnpm" failure (workflows pinned `version: 10` while
`package.json` sets `packageManager: pnpm@10.34.4` -> removed the pin from all
five workflows); originally pushed to `apexlegion.github.io` and enabled Pages.

---

## 8. What's on the site

- **Home**, **Learn** (10-step beginner path + tutorials + concepts),
  **Tools**, **Projects** (~49 repos), **Models** (10 open models),
  **Glossary** (31 terms), **Concepts** (with an "Explain like I'm 12 …"
  level switcher), **Playgrounds**, **Decisions**, **Compare**, **Graph**,
  **Jobs**, **Events**, **News**, **Dashboard**.
- **Knowledge Graph** — interactive explorer. **PWA** — installable,
  offline-capable. **i18n** — English + a Spanish (`/es`) homepage pilot.

---

## 9. Known limitations (inherited / deferred)

- **Light mode** disabled (dark-first brand + pre-existing Tailwind v4
  token-cycle bug). Dark is the intended experience.
- Two pre-existing content dead-links in `news.json` (see §5).
- E2E (Playwright) + Lighthouse can't run in this environment (missing system
  libs); documented in `tests/e2e/README.md`.
- Spanish (`/es`) is a homepage pilot, not a full translation.
- Browser extension uses placeholder icons.

---

## 10. Suggested next steps

- After the rename lands, click through the live `/aiatlas/` site and confirm
  nav, cards, tools filter, the concept level switcher, search, and the graph.
- Fix the two `news.json` content dead-links (or remove them).
- Keep growing glossary/models/tutorials (projects/news grow via the nightly
  scraper). Add a free `HF_TOKEN` repo secret to raise scrape limits.
- Revisit light mode by renaming design tokens so `@theme` entries don't
  self-reference.
- Later, if wanted: make the source repo private while keeping the site public —
  on GitHub's free tier that needs either GitHub Pro (~$4/mo) or a split setup
  (private source repo + a separate public deploy-only repo receiving just the
  built `dist/`). Not set up yet.
