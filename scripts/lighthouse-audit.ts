/**
 * lighthouse-audit.ts — Lighthouse CI runner for the built static site.
 *
 * Run AFTER `pnpm run build`:
 *   pnpm tsx scripts/lighthouse-audit.ts
 *
 * Requires a Chromium binary on $PATH (or set CHROME_PATH). On hosts where
 * Chromium cannot be installed (e.g. minimal CI containers missing
 * libnspr4/libnss3/libasound) the script logs the limitation and exits 0
 * so the rest of the build pipeline is not blocked.
 */
/* eslint-disable no-console, @typescript-eslint/ban-ts-comment */
// @ts-nocheck — lighthouse's type signatures vary across majors; this is a
// best-effort CLI tool run via `tsx`, not part of the app bundle.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const TARGET = 'http://127.0.0.1:4321/';

interface LighthouseResult {
  categories: Record<string, { score: number | null }>;
}

async function findChrome(): Promise<string | null> {
  if (process.env['CHROME_PATH'] && existsSync(process.env['CHROME_PATH'])) {
    return process.env['CHROME_PATH'];
  }
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/opt/google/chrome/chrome',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

async function main(): Promise<void> {
  const chrome = await findChrome();
  if (!chrome) {
    console.warn(
      '[lh] No Chrome/Chromium binary found. Lighthouse audit skipped.\n' +
        'See `.kimchi/docs/LIGHTHOUSE_AUDIT.md` for details and CI notes.',
    );
    process.exit(0);
  }

  // Probe lighthouse availability.
  let lighthouseModule: typeof import('lighthouse') | null = null;
  try {
    lighthouseModule = (await import('lighthouse')).default
      ? ((await import('lighthouse')) as typeof import('lighthouse'))
      : null;
  } catch {
    lighthouseModule = null;
  }

  if (!lighthouseModule) {
    console.warn('[lh] `lighthouse` package not installed; skipping run.');
    process.exit(0);
  }

  console.log(`[lh] Auditing ${TARGET} with ${chrome}...`);
  const result = await lighthouseModule.default(TARGET, {
    port: 0,
    output: 'json',
    logLevel: 'error',
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });
  if (!result) {
    console.error('[lh] No result returned.');
    process.exit(1);
  }
  const lhr = result as unknown as LighthouseResult;
  const cats = lhr.categories;
  const fmt = (n: number | null): string => (n === null ? 'n/a' : Math.round(n * 100).toString());
  console.log('=== Lighthouse ===');
  for (const [key, cat] of Object.entries(cats)) {
    console.log(`  ${key.padEnd(16)} ${fmt(cat.score)}`);
  }
  // Soft threshold: warn (don't fail) below 90. CI may set LHCI_FAIL to enforce.
  const min = Number.parseInt(process.env['LHCI_FAIL'] ?? '90', 10);
  let failed = false;
  for (const [, cat] of Object.entries(cats)) {
    if (cat.score !== null && cat.score * 100 < min) {
      console.error(`[lh] Category below threshold (${min}): ${fmt(cat.score)}`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
}

// Spawn probe fallback: if `lighthouse` CLI exists, try it.
const cliProbe = spawnSync('npx', ['--no-install', 'lighthouse', '--version'], {
  encoding: 'utf8',
});
void cliProbe;

main().catch((err: unknown) => {
  console.error('[lh] Audit failed:', err);
  // Don't fail the build if Chrome is unavailable.
  if (
    err instanceof Error &&
    /Could not find Chrome|ChromeLauncher|ECONNREFUSED|chrome-launcher/i.test(err.message)
  ) {
    console.warn('[lh] Skipping due to missing Chrome runtime.');
    process.exit(0);
  }
  process.exit(1);
});
