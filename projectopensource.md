# AI Atlas — Project Record (`projectopensource.md`)

**Product:** AI Atlas — _Learn. Compare. Build. Everything Open Source AI, in one place._
**Parent brand:** Affiliate Forge
**Owner:** Kunal Singh (GitHub: `apexlegion`)
**Type:** Static, self-updating, zero-cost open-source AI knowledge platform
**Local path:** `\\wsl.localhost\Ubuntu\home\kunal\AI-Atlas` (WSL: `~/AI-Atlas`)

This document is the single record of what AI Atlas is, what was built, what was
broken, what was fixed, and how it keeps running by itself.

---

## 1. What AI Atlas is

A visual-first, beginner-friendly encyclopedia of **open-source AI**. It is not a
blog, a tools directory, or a news site — it is a place where anyone (assuming
zero knowledge) can learn AI, compare models and projects, explore a knowledge
graph, try in-browser playgrounds, and stay updated — using only open-source
technology.

- **Hosting:** GitHub Pages (static). **Cost: $0/month.**
- **Backend:** none. Everything is generated at build time.
- **Updates:** GitHub Actions rebuild + redeploy on a daily schedule.
- **Branding:** Affiliate Forge — orange (`#FF6A00`) on black.

---

## 2. Tech stack

| Layer               | Choice                                                                |
| ------------------- | --------------------------------------------------------------------- |
| Framework           | Astro 5 (static output)                                               |
| Interactive islands | React 19 (`client:load` / `client:visible`)                           |
| Styling             | Tailwind CSS v4 (theme via `@theme` in `src/styles/global.css`)       |
| Search              | Pagefind (static index built from `dist/`)                            |
| Data                | JSON seed files in `src/data/seed/` + a scrape pipeline in `scripts/` |
| Tests               | Vitest (unit) + Playwright (e2e, config only)                         |
| CI/CD               | GitHub Actions → GitHub Pages                                         |
| Package manager     | pnpm                                                                  |

---

## 3. Site map (what's in it)

- **Home** — hero, category explorer, trending projects.
- **Learn** — a guided **"Start here — no experience needed"** beginner path,
  plus tutorials and concepts.
- **Projects** — ~49 globally famous open-source AI repos (llama.cpp, Ollama,
  Transformers, LangChain, vLLM, ComfyUI, Milvus, Qdrant, and more).
- **Models** — 10 famous open models (Llama 3, Mistral 7B, Qwen2.5, Gemma 2,
  DeepSeek-R1, Mixtral 8x7B, Whisper, FLUX.1, Phi-3, SDXL).
- **Glossary** — 31 AI terms A–Z, plain-language, with multi-level explanations.
- **Concepts** — deep-dive concept pages with an **"Explain like I'm 12 /
  Beginner / Student / Developer / Researcher / Business"** switcher.
- **Tools, Playgrounds, Decisions, Compare, Graph, Jobs, Events, News,
  Dashboard** — supporting sections.
- **Knowledge Graph** — interactive explorer of how everything connects.
- **PWA** — installable, offline-capable via a service worker.
- **i18n** — English (root) + a Spanish (`/es`) pilot.

---

## 4. Everything fixed / built in this engagement

### Phase 1 — build/correctness (site would not ship cleanly)

1. **`scripts/pipeline/dead-links.ts` broke the TypeScript parser.** A `**/`
   sequence inside a block comment closed the comment early. It had been
   _excluded from linting_ as a workaround. Fixed the comment and removed the
   exclusion.
2. **Duplicate routes.** `/decisions` and `/playgrounds` each had two files
   resolving to the same URL (Astro route collisions, slated to become hard
   errors). Removed the older duplicate of each.
3. **Dead React islands in `SiteShell`.** `MobileMenu` and `CommandPalette` were
   mounted twice — once as inert `client:load` copies (hardcoded `open={false}`,
   could never open) that threw a hydration preamble error, and once via the
   real event-wired roots. Removed the dead copies.
4. **Service worker precached a non-existent file.** `sw.js` tried to cache
   `/styles/global.css`, but Astro content-hashes CSS filenames, so install
   silently failed. Removed it from the precache list.
5. **Graph hydration mismatch.** Node coordinates from `Math.cos/sin` differed by
   1 ULP between server and browser, triggering a React hydration error on
   `/graph`. Rounded coordinates to 2 decimals.

### Phase 2 — the "it looks dead" report (real, and worse than bugs)

6. **Invisible graph text (Tailwind v4 gap).** Graph node labels rendered pure
   **black on the black canvas** — invisible. Root cause: Tailwind v4 only emits
   SVG `fill-*` / `stroke-*` utilities for colors registered in `@theme`, and the
   text colors (`--color-text`, `--color-text-muted`, `--color-surface-*`) were
   missing. Added the semantic aliases to `@theme`. Labels now render white /
   muted / orange. **Verified:** `fill = rgb(255,255,255)`.
7. **The entire beginner-education feature was being discarded.**
   `EntityDetail.astro` never rendered `<slot name="header" />`, so the
   "Explain like I'm 12 / Beginner / …" level switcher that concept and tutorial
   pages pass was silently dropped on **every** page. This _was_ the "no
   education for non-coding people" complaint — the feature existed but was
   invisible. Added the slot; removed a redundant no-op `LevelSwitcher`.
   **Verified:** clicking "Like I'm 12" now swaps in the child-level text.
8. **"Buttons don't work" was a symptom, not a bug.** In the production build,
   navigation, cards, the level switcher, and the graph all respond correctly.
   The "dead" feeling came from the invisible content above plus dev-server
   hydration noise — not from broken production code. **Verified in a production
   build.**

### Phase 2 — content (the site was nearly empty, not broken)

9. **Glossary: 4 → 31 terms** spanning A–Z (20 letters), each with a plain
   definition; foundational terms ship "explain like I'm 12" + beginner text.
10. **Beginner path added** to `/learn`: a 10-step "Start here — no experience
    needed" sequence from _What is AI?_ to _AI agents_.
11. **Models: 3 → 10** famous open models.
12. **Projects** already contained ~49 famous repos; they simply weren't
    reachable while the site felt dead. The nightly scraper keeps adding
    GitHub-trending repos automatically.

### Phase 2 — automation

13. **Added the missing GitHub Pages deploy workflow** (`deploy.yml`) — the site
    previously never published anywhere.
14. **Fixed the self-update trigger gap.** A commit made by the built-in
    `GITHUB_TOKEN` (the nightly scrape) cannot trigger another workflow (GitHub
    anti-recursion rule), so the deploy would never fire off new data. Gave
    `deploy.yml` its own **daily 05:00 UTC schedule** (after the 02:00 scrape and
    04:00 news-expiry) so the live site refreshes every 24 h with zero touches.
15. **Documented the whole loop** in `AUTOMATION.md`.

**Result:** lint clean, typecheck clean, **194/194 unit tests pass**, **169
pages** build successfully.

---

## 5. How it updates itself (zero-touch, $0/month)

All times UTC. Every workflow also has a manual "Run workflow" button.

```
02:00  daily-data-update.yml   scrape GitHub / HF / arXiv / PwC / RSS → commit data/
04:00  daily-news-expiry.yml   drop news older than 30 days → commit
05:00  deploy.yml              rebuild the static site → publish to GitHub Pages
Mon 03:00  weekly-health-check.yml   re-validate data + dead-link scan (report only)
on push    deploy.yml + on-push.yml  redeploy + CI whenever a human pushes
```

Full detail in [`AUTOMATION.md`](AUTOMATION.md).

---

## 6. Running it locally

Node 20 + pnpm. In `~/AI-Atlas` (WSL):

```bash
pnpm install
pnpm dev          # dev server (hot reload)
pnpm build        # production build → dist/ (+ Pagefind search index)
pnpm preview      # serve the production build
pnpm test         # unit tests
pnpm lint         # eslint + prettier
pnpm typecheck    # tsc --noEmit
```

Data pipeline:

```bash
pnpm run scrape:all                 # scrape all sources
pnpm run scrape:all --skip-scrape   # re-process cached raw data offline
pnpm run data:validate              # validate normalized data
pnpm run data:index                 # regenerate indexes
```

---

## 7. Deployment status & one-time setup

- **Git:** initialized locally; work committed on `main`.
- **GitHub account:** `apexlegion` (Kunal Singh), authenticated via Git
  Credential Manager on Windows.
- **Chosen home:** _(pending confirmation)_ — either `apexlegion.github.io`
  (root URL, all links work) or a new `apexlegion/ai-atlas` project repo
  (serves at `/ai-atlas/`, would need base-path handling).

**One-time setup after the first push:**

1. Repo **Settings → Pages → Build and deployment → Source → "GitHub Actions."**
2. (Optional) add an `HF_TOKEN` secret to raise Hugging Face scrape limits.
3. Done — the site goes live and refreshes itself daily, forever.

---

## 8. Known limitations (inherited, non-blocking)

- E2E (Playwright) and Lighthouse can't run in this environment (missing system
  libs); documented in `tests/e2e/README.md`.
- The Spanish (`/es`) locale is a homepage pilot, not a full translation.
- The browser extension uses placeholder icons.

---

## 9. Next steps

- Confirm the deploy target and push (see §7).
- Keep growing the glossary, models, and tutorials (the scraper handles
  projects/news automatically).
- Full i18n; richer playgrounds; optional community features.
