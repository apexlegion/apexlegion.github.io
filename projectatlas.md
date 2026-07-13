# AI Atlas — Complete Project Record (`projectatlas.md`)

**Product:** AI Atlas — _Learn. Compare. Build. Everything Open Source AI, in one place._
**Parent brand:** Affiliate Forge
**Owner:** Kunal Singh — GitHub `apexlegion`
**Live site:** https://apexlegion.github.io
**Repository:** https://github.com/apexlegion/apexlegion.github.io
**Local path:** `~/AI-Atlas` in WSL (`\\wsl.localhost\Ubuntu\home\kunal\AI-Atlas`)
**Cost:** $0 / month — public GitHub repo (free Actions + free Pages)

This is the single, complete record of what AI Atlas is, everything that was
built and fixed, how it deploys, and how it keeps updating itself. Nothing left
out.

---

## 1. What it is

A visual-first, beginner-friendly encyclopedia of **open-source AI**. Anyone —
from someone who has never written code to a senior engineer — can learn AI,
compare tools and models, explore a knowledge graph, try in-browser
playgrounds, and discover the famous free tools people use worldwide. Built only
with open technology, hosted free, and it refreshes itself daily.

---

## 2. Tech stack

| Layer               | Choice                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| Framework           | Astro 5 (static site generation)                                       |
| Interactive islands | React 19 (`client:load` / `client:visible`)                            |
| Styling             | Tailwind CSS v4 (theme tokens via `@theme` in `src/styles/global.css`) |
| Search              | Pagefind (static index built from `dist/`)                             |
| Data                | JSON seed files in `src/data/seed/` + a scrape pipeline in `scripts/`  |
| Tests               | Vitest (194 unit tests) + Playwright (e2e config)                      |
| CI/CD               | GitHub Actions → GitHub Pages                                          |
| Package manager     | pnpm 10.34.4                                                           |

---

## 3. What's on the site

- **Home** — bold hero (gradient headline, ambient glow, live stat row), a
  "start here for beginners" strip, category explorer, featured projects and
  models, and a knowledge-graph call-to-action. Every card and button links.
- **Learn** — a guided **"Start here — no experience needed"** 10-step path,
  plus tutorials and concepts.
- **Tools (the Open-Source Toolbox)** — leads with **8 famous free tools
  explained in plain language** (Ollama, GPT4All, Jan, Open WebUI, ComfyUI,
  Stable Diffusion WebUI, whisper.cpp, LangChain) — each with _what it does /
  how to start / best for_, a green **"No coding"** badge where true, and a
  GitHub link — followed by the full ~49-repo filterable directory.
- **Projects** — ~49 globally famous open-source AI repos.
- **Models** — 10 famous open models (Llama 3, Mistral 7B, Qwen2.5, Gemma 2,
  DeepSeek-R1, Mixtral 8x7B, Whisper, FLUX.1, Phi-3, SDXL).
- **Glossary** — 31 AI terms A–Z, plain language.
- **Concepts** — deep-dive pages with an **"Explain like I'm 12 / Beginner /
  Student / Developer / Researcher / Business"** switcher.
- **Playgrounds** — in-browser demos (tokenization, embeddings, RAG, and more).
- **Decisions** — answer questions, get a recommended tool.
- **Compare**, **Graph**, **Jobs**, **Events**, **News**, **Dashboard**.
- **Knowledge Graph** — interactive explorer of how everything connects.
- **PWA** — installable, offline-capable. **i18n** — English + a Spanish pilot.

---

## 4. Everything fixed and built (nothing skipped)

### A. Build / correctness (the site wouldn't ship cleanly)

1. **`scripts/pipeline/dead-links.ts` broke the TypeScript parser** — a `**/`
   inside a block comment closed it early. It had been _excluded from linting_
   as a hack. Fixed the comment, removed the exclusion.
2. **Duplicate routes** — `/decisions` and `/playgrounds` each had two files
   resolving to the same URL (Astro collisions). Removed the older duplicates.
3. **Dead React islands in `SiteShell`** — `MobileMenu`/`CommandPalette` were
   mounted twice, one inert copy throwing a hydration error. Removed the copies.
4. **Service worker precached a non-existent file** (`/styles/global.css`, which
   is content-hashed at build). Removed it so install stops failing.
5. **Graph hydration mismatch** — node coordinates differed by 1 ULP between
   server and browser. Rounded to 2 decimals.

### B. "It looks dead / not appealing" (the real problems)

6. **Invisible graph text** — Tailwind v4 only emits SVG `fill-*` utilities for
   colors registered in `@theme`; the text colors were missing, so labels
   rendered **black on black**. Added the semantic aliases — labels now white /
   muted / orange.
7. **The beginner-education feature was being thrown away** — `EntityDetail`
   never rendered `<slot name="header" />`, so the "Explain like I'm 12…" level
   switcher was silently dropped on every concept/tutorial page. Added the slot.
8. **Dead buttons / menus — the root causes:**
   - The **`Button` component could only be a `<button>`**, but was used as a
     link (`Button as="a" href`) everywhere → it produced `<button href>` that
     went nowhere. Made it render a real `<a>` when given a link.
   - **`Tag` labels were `<button>`s nested inside linked cards** — invalid HTML
     that _swallowed the click_ so cards never navigated. Converted to `<span>`.
   - **The whole homepage's cards/CTAs had no links** — the `href` data was
     never used. Wired every one.
   - **13 more ghost card buttons** on list pages had the same nesting problem —
     replaced with plain labels.
   - **Dev server loaded React twice** (Vite dep optimizer), killing every
     island with "Invalid hook call." Added `resolve.dedupe` + `optimizeDeps`.

### C. Visual redesign (premium, on-brand: orange on black)

9. New utility language: **gradient brand text, ambient radial glow, glass,
   grid backdrop, hover-lift, staggered rise-in**.
10. Rebuilt the **hero** (72px headline, gradient accent, live stat row),
    a **beginner strip**, and a **knowledge-graph CTA**; equal-height,
    hover-reactive cards throughout.
11. **Dark-only, deliberately.** Light mode had a pre-existing Tailwind v4
    `@theme` token-cycle bug (the toggle flipped but the page stayed dark).
    Since the brand is dark-first, shipped the polished dark design and removed
    the broken toggle rather than expose a half-working control.
    _(Future: fixable by renaming tokens so `@theme` names don't self-reference.)_

### D. Content (the site was nearly empty, not broken)

12. **Glossary: 4 → 31 terms** A–Z; foundational ones have 12-year-old +
    beginner explanations.
13. **Beginner path** added to `/learn` (10 ordered steps).
14. **Models: 3 → 10** famous open models.
15. **Tools page** rebuilt with the plain-language "popular tools" section
    (see §3).

### E. Automation & deployment

16. **Added the GitHub Pages deploy workflow** (`deploy.yml`) — the site
    previously never published anywhere.
17. **Fixed the self-update trigger gap** — a `GITHUB_TOKEN` commit (the nightly
    scrape) can't trigger another workflow, so gave `deploy.yml` its own daily
    schedule.
18. **Fixed CI/deploy "Setup pnpm" failure** — workflows pinned `version: 10`
    while `package.json` already sets `packageManager: pnpm@10.34.4`, causing a
    "multiple versions" error. Removed the pin from all five workflows.
19. **Pushed to `apexlegion.github.io`** (non-destructively — merged the empty
    placeholder repo's history, touched no other repo) and enabled Pages with
    the "GitHub Actions" source.

**Quality gates:** lint clean · typecheck clean · **194/194 unit tests pass** ·
**169 pages** build · no console errors · nav, cards, tools filter, level
switcher, and playgrounds all verified interactive in a production build.

---

## 5. How it updates itself — free, automatic, every 24h

All times UTC (IST = UTC + 5:30). Every workflow also has a manual "Run
workflow" button in the Actions tab.

| Time (UTC)  | IST      | Workflow                 | What it does                                             |
| ----------- | -------- | ------------------------ | ------------------------------------------------------- |
| 02:00 daily | 07:30    | `daily-data-update.yml`  | Scrape GitHub / HF / arXiv / Papers With Code / RSS → commit new data |
| 04:00 daily | 09:30    | `daily-news-expiry.yml`  | Remove news older than 30 days → commit                 |
| 05:00 daily | 10:30    | `deploy.yml`             | Rebuild the site with the latest data → publish to Pages |
| Mon 03:00   | Mon 08:30| `weekly-health-check.yml`| Re-validate data + dead-link scan (report only)         |
| on push     | —        | `deploy.yml` + `on-push.yml` | Redeploy + CI whenever a human pushes               |

So the **live site refreshes every 24 hours** with zero effort. Because the
daily scrape commits keep the repo active, GitHub never auto-pauses the
schedules. Full detail in [`AUTOMATION.md`](AUTOMATION.md).

**Cost:** public repos get unlimited free Actions minutes and free Pages
hosting. No backend, no domain, no API keys required (GitHub's token is free and
automatic; an optional free Hugging Face token just raises scrape limits).
**$0/month.**

---

## 6. Running it locally

Node 20 + pnpm, in `~/AI-Atlas`:

```bash
pnpm install
pnpm dev          # dev server with hot reload
pnpm build        # production build → dist/ (+ Pagefind index)
pnpm preview      # serve the production build
pnpm test         # 194 unit tests
pnpm lint         # eslint + prettier
pnpm typecheck    # tsc --noEmit
```

Data pipeline:

```bash
pnpm run scrape:all                 # scrape all sources
pnpm run scrape:all --skip-scrape   # re-process cached data offline
pnpm run data:validate              # validate normalized data
pnpm run data:index                 # regenerate indexes
```

---

## 7. Deployment status

- **Repo:** `apexlegion/apexlegion.github.io` (public).
- **Pages source:** GitHub Actions (enabled).
- **Live URL:** https://apexlegion.github.io
- **Auth:** pushes use the Windows Git Credential Manager (`apexlegion`).
- **Nothing else on the account was modified** — only this one repo.

To deploy an update by hand: push to `main`, or click **Run workflow** on
**Deploy to GitHub Pages** in the Actions tab.

---

## 8. Known limitations (inherited / deferred)

- **Light mode** is disabled (dark-first brand + a pre-existing Tailwind v4
  token-cycle bug). The dark design is the intended experience.
- E2E (Playwright) and Lighthouse can't run in this environment (missing system
  libraries); documented in `tests/e2e/README.md`.
- The Spanish (`/es`) locale is a homepage pilot, not a full translation.
- The browser extension uses placeholder icons.

---

## 9. Suggested next steps

- Keep growing the glossary, models, and tutorials (projects/news grow
  automatically via the nightly scraper).
- Add a free `HF_TOKEN` repo secret to pull more data each night.
- Revisit light mode by renaming design tokens so `@theme` entries no longer
  self-reference.
- Expand the Spanish translation and the playgrounds.
