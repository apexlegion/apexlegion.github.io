/**
 * a11y-audit.ts — standalone axe-core accessibility audit for built pages.
 *
 * Run AFTER `pnpm run build`:
 *   pnpm tsx scripts/a11y-audit.ts
 *
 * Walks `dist/` for every `index.html` (one level deep) plus known detail
 * pages, fetches each via jsdom + resource loader, and runs axe-core.
 * Critical/serious violations are printed and the script exits non-zero so
 * CI can fail the build.
 *
 * Browser-based a11y audits are preferred but not available in this
 * environment (no Chromium). This static analyzer is the next-best thing
 * and is sufficient for catching obvious regressions (missing alt, missing
 * labels, broken landmarks, etc.).
 */
/* eslint-disable no-console, @typescript-eslint/ban-ts-comment */
// @ts-nocheck — jsdom types and ResourceLoader API drift between releases; this
// is a best-effort CLI tool run via `tsx`, not part of the app bundle.
import { JSDOM, ResourceLoader } from 'jsdom';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  helpUrl: string;
  nodes: { target: unknown[] }[];
}

interface AxeRunResult {
  violations: AxeViolation[];
}

interface AxeStatic {
  run: (doc: Document, options: Record<string, unknown>) => Promise<AxeRunResult>;
  source: unknown;
}

const DIST = 'dist';

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      // Skip pagefind (binary blob, not meaningful for a11y).
      if (e.name === 'pagefind' || e.name === '_astro') continue;
      yield* walk(full);
    } else if (e.name === 'index.html') {
      yield full;
    }
  }
}

async function collectPages(): Promise<string[]> {
  const pages: string[] = [];
  if (!(await pathExists(DIST))) return pages;
  // Top-level listing pages.
  for await (const p of walk(DIST)) {
    pages.push(p);
  }
  // Detail pages — at least one per entity type.
  const detailRoots = ['projects', 'models', 'concepts', 'tutorials'];
  for (const root of detailRoots) {
    const dir = join(DIST, root);
    if (!(await pathExists(dir))) continue;
    const entries = (await readdir(dir)).filter((n) => n.endsWith('.html') && n !== 'index.html');
    if (entries.length > 0) {
      pages.push(join(dir, entries[0] ?? ''));
    }
  }
  return pages;
}

class LocalResourceLoader extends ResourceLoader {
  async fetch(url: string, _options: unknown): Promise<Buffer | null> {
    if (!url.startsWith('file:') && !url.startsWith('http://localhost')) return null;
    try {
      if (url.startsWith('file:')) {
        const path = fileURLToPath(url);
        const buf = await readFile(path);
        return buf;
      }
    } catch {
      return null;
    }
    return null;
  }
}

function fileURLToPath(url: string): string {
  return new URL(url).pathname;
}

async function auditPage(htmlPath: string): Promise<AxeViolation[]> {
  const html = await readFile(htmlPath, 'utf8');
  const baseUrl = pathToFileURL(htmlPath).toString();
  const dom = new JSDOM(html, {
    url: baseUrl,
    runScripts: 'outside-only',
    resources: new LocalResourceLoader(),
  });
  // axe-core is a CommonJS module.
  const axePath = require.resolve('axe-core');
  const axeModule = (await import(pathToFileURL(axePath).href)) as {
    default?: AxeStatic;
    source?: AxeStatic;
  };
  const axe: AxeStatic =
    axeModule.default ?? axeModule.source ?? (axeModule as unknown as AxeStatic);
  // axe-core expects the document/window from jsdom to be installed as globals
  // so it can walk the DOM. We expose them before invoking run().
  const g = globalThis as unknown as Record<string, unknown>;
  const prevWindow = g.window;
  const prevDocument = g.document;
  g.window = dom.window as unknown as typeof globalThis.window;
  g.document = dom.window.document;
  try {
    const result = await axe.run(dom.window.document, {
      resultTypes: ['violations'],
    });
    return result.violations;
  } finally {
    if (prevWindow === undefined) delete g.window;
    else g.window = prevWindow;
    if (prevDocument === undefined) delete g.document;
    else g.document = prevDocument;
    dom.window.close();
  }
}

async function main(): Promise<void> {
  const pages = await collectPages();
  if (pages.length === 0) {
    console.error(`[a11y] No built pages found under "${DIST}/". Run \`pnpm run build\` first.`);
    process.exit(1);
  }

  let critical = 0;
  let serious = 0;
  let moderate = 0;
  let minor = 0;
  const report: { page: string; violations: AxeViolation[] }[] = [];

  for (const p of pages) {
    const violations = await auditPage(p);
    const rel = relative(process.cwd(), p);
    report.push({ page: rel, violations });
    for (const v of violations) {
      const count = v.nodes.length;
      switch (v.impact) {
        case 'critical':
          critical += count;
          break;
        case 'serious':
          serious += count;
          break;
        case 'moderate':
          moderate += count;
          break;
        case 'minor':
          minor += count;
          break;
        default:
          break;
      }
      console.error(`[a11y] ${rel}: ${v.impact ?? 'unknown'} ${v.id} (${count}) — ${v.help}`);
    }
  }

  console.log('\n=== A11y audit summary ===');
  console.log(`Pages audited: ${pages.length}`);
  console.log(`Critical: ${critical}`);
  console.log(`Serious:  ${serious}`);
  console.log(`Moderate: ${moderate}`);
  console.log(`Minor:    ${minor}`);
  console.log('See `.kimchi/docs/A11Y_AUDIT.md` for full findings.');

  if (critical > 0 || serious > 0) {
    console.error('[a11y] Critical or serious violations found. Failing.');
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('[a11y] Audit failed:', err);
  process.exit(1);
});
