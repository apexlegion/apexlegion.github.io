# Learn Academy — design spec (2026-07-17)

## Goal

AI Atlas must serve people who don't know AI at all — not just define terms.
Rebuild `/learn` as a 3-track, task-first academy where visitors pick their
level and _do_ things with free AI tools, learning terminology in context.

## Tracks

- **Beginner — "I've never used AI"**: a first-5-minutes lesson + 15 everyday
  task recipes (write an email/CV, summarize a PDF, explain a contract,
  translate, make an image, plan a trip, study for an exam, …). Each recipe:
  exact free tool → copy-paste prompt → what you'll get → how to tweak →
  "words you just learned" linking to concepts/glossary.
- **Intermediate — "I use AI sometimes"**: 10 lessons on getting better
  results (context + examples, roles, formats, iterating, working with files,
  fact-checking, custom instructions, right tool per job, voice).
- **Advanced — "Make me a power user"**: 8 lessons bridging into existing
  site content (run models locally, Open WebUI, local images, RAG, agents,
  choosing a stack, staying current) — wraps tutorials/tools/playgrounds/
  decisions.

## Tool policy

Free-to-use first, open-source flagged: every lesson names one primary free
tool and one open-source alternative with an "Open source" badge.

## Architecture

- `src/data/lessons.ts` — standalone typed content module (NOT part of the
  zod entity/seed system; keeps graph, validation, scrape pipeline untouched).
- `src/pages/learn/index.astro` — academy landing (3 track cards + per-track
  progress + lesson lists). Replaces `src/pages/learn.astro`.
- `src/pages/learn/[slug].astro` — one page per lesson, fixed section order:
  Goal → Tool (+OSS badge) → Steps → Prompt(s) with copy button → What you'll
  get → Make it yours → Words you just learned → Go deeper → Next lesson.
- `src/components/learn/LessonProgress.tsx` — React islands: `LessonDone`
  (mark-done toggle) + `TrackProgress` (n/total bar), localStorage key
  `ai-atlas:lessons-done` (JSON array of slugs). No accounts.
  `CopyPrompt` — copy-to-clipboard button for prompt blocks.
- Homepage "Never touched AI before?" strip repoints to `/learn` beginner
  track.
- All internal links go through `withBase()` (site serves under `/aiatlas/`).

## Out of scope

New entity types, graph nodes, i18n of lessons, accounts/server-side progress.
