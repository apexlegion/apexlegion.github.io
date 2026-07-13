# How AI Atlas updates itself

AI Atlas is a **static site that rebuilds and redeploys itself on a schedule**,
with **zero servers and zero monthly cost**. Everything runs on free GitHub
Actions minutes. Once it is pushed to GitHub and Pages is switched on, you never
have to touch it — exactly like the other self-updating projects.

## The daily loop (all times UTC)

```
02:00  ┌─ daily-data-update.yml ──────────────────────────────┐
       │  Scrapes GitHub, Hugging Face, arXiv, Papers With    │
       │  Code, and RSS. Normalises + validates the data,     │
       │  regenerates indexes, and commits any changes to     │
       │  data/ on the main branch.                           │
       └──────────────────────────────────────────────────────┘

04:00  ┌─ daily-news-expiry.yml ───────────────────────────────┐
       │  Removes news items older than 30 days so the News    │
       │  section only ever shows fresh items. Commits the     │
       │  cleanup.                                             │
       └──────────────────────────────────────────────────────┘

05:00  ┌─ deploy.yml ──────────────────────────────────────────┐
       │  Builds the whole static site from the latest data    │
       │  and publishes it to GitHub Pages. This is what makes  │
       │  the newest content go live.                          │
       └──────────────────────────────────────────────────────┘
```

Weekly, on Monday at 03:00, `weekly-health-check.yml` re-validates the data and
scans every external link for dead URLs (report only — it never breaks a build).

## Why the deploy runs on a schedule (important detail)

You might expect the deploy to fire automatically the moment the scrape commits
new data. It does **not**, and that is on purpose:

> GitHub deliberately blocks a commit made by the built-in `GITHUB_TOKEN` from
> triggering another workflow. This prevents infinite loops (a workflow that
> commits, which triggers a workflow, which commits…).

So instead of chaining off the commit, `deploy.yml` runs on its **own daily
schedule at 05:00** — after the scrape (02:00) and the news expiry (04:00) have
finished. That guarantees the live site always reflects the newest data once a
day, with no manual step. It **also** deploys instantly whenever you (a human)
push a code or content change to `main`.

## One-time setup (do this once after pushing to GitHub)

1. Push the repository to GitHub (see the main README / the commands you were
   given).
2. In the repo: **Settings → Pages → Build and deployment → Source →
   "GitHub Actions"**.
3. (Optional) Add repository secrets to raise scraper rate limits and pull more
   data each night:
   - `GITHUB_TOKEN` is provided automatically — nothing to do.
   - `HF_TOKEN` — a free Hugging Face token, if you want higher HF limits.
4. That's it. The site goes live at your Pages URL and refreshes itself every
   day forever.

## Running it by hand (optional)

Every workflow also has a **"Run workflow"** button in the Actions tab
(`workflow_dispatch`), so you can force a data refresh or a redeploy at any time
without waiting for the schedule. `manual-scrape.yml` additionally lets you
choose which single source to scrape.

## Cost

Public repositories get unlimited free GitHub Actions minutes and free GitHub
Pages hosting. The whole system costs **$0/month**.
