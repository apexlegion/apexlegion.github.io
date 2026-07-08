/**
 * News expiry filter.
 *
 * Removes news entries whose `expiryAt` is in the past. The exported
 * `filterExpired` helper is a pure function so it can be reused by the
 * orchestrator and unit tests; the CLI mode walks
 * `data/normalized/news/` and removes the stale files on disk.
 */

import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createLogger } from '../lib/logger.js';

const log = createLogger('pipeline:expiry');

const DEFAULT_NEWS_ROOT = resolve(process.cwd(), 'data', 'normalized', 'news');

export interface WithExpiry {
  expiryAt?: string;
}

/**
 * Keep items whose `expiryAt` is either undefined or still in the future
 * (relative to `now`, defaults to the current wall-clock time).
 */
export function filterExpired<T extends WithExpiry>(items: T[], now: Date = new Date()): T[] {
  const cutoff = now.toISOString();
  return items.filter((item) => {
    if (!item.expiryAt) return true;
    return item.expiryAt >= cutoff;
  });
}

/**
 * Walk a directory recursively, collecting every `.json` file path.
 */
export function listJsonFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (existsSync(p)) {
        const stat = statSync(p);
        if (stat.isDirectory()) {
          stack.push(p);
        } else if (name.endsWith('.json')) {
          out.push(p);
        }
      }
    }
  }
  return out;
}

export interface ExpireRunResult {
  readonly scanned: number;
  readonly kept: number;
  readonly removed: number;
}

/**
 * Walk the news directory, removing any JSON file whose `expiryAt` is
 * strictly before `now`. Returns counts for logging.
 */
export function expireOnDisk(
  root: string = DEFAULT_NEWS_ROOT,
  now: Date = new Date(),
): ExpireRunResult {
  const cutoff = now.toISOString();
  const files = listJsonFiles(root);
  let kept = 0;
  let removed = 0;
  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown;
    } catch (err) {
      log.warn(`failed to parse ${file}: ${(err as Error).message}`);
      continue;
    }
    if (!parsed || typeof parsed !== 'object') continue;
    const expiryAt = (parsed as WithExpiry).expiryAt;
    if (typeof expiryAt === 'string' && expiryAt < cutoff) {
      rmSync(file, { force: true });
      removed++;
      log.info(`expired: removed ${file} (expiryAt=${expiryAt})`);
    } else {
      kept++;
    }
  }
  return { scanned: files.length, kept, removed };
}

async function main(): Promise<void> {
  if (!existsSync(DEFAULT_NEWS_ROOT)) {
    log.info(`no news directory at ${DEFAULT_NEWS_ROOT}; nothing to do`);
    return;
  }
  const result = expireOnDisk();
  log.info(
    `expiry complete: scanned=${result.scanned} kept=${result.kept} removed=${result.removed}`,
  );
}

const isDirectInvocation = ((): boolean => {
  if (typeof process === 'undefined') return false;
  const argv1 = process.argv[1];
  if (!argv1) return false;
  try {
    return import.meta.url === new URL(`file://${argv1}`).href;
  } catch {
    return false;
  }
})();

if (isDirectInvocation) {
  main().catch((err: unknown) => {
    log.error((err as Error).message);
    process.exitCode = 1;
  });
}
