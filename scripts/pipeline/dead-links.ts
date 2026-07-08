/**
 * Dead-link checker.
 *
 * Walks every JSON file under `data/normalized` (recursively), collects
 * every `externalLinks[].href`, and issues HEAD requests to flag
 * non-2xx/3xx responses. Warnings only: always exits 0 so it can run as a
 * scheduled health check.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createLogger } from '../lib/logger.js';

const log = createLogger('pipeline:dead-links');

const DEFAULT_ROOT = resolve(process.cwd(), 'data', 'normalized');
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_USER_AGENT = 'ai-atlas-dead-link-checker (+https://github.com/)';

export interface ExternalLink {
  label: string;
  href: string;
}

export interface DeadLinkOptions {
  readonly timeoutMs?: number;
  readonly userAgent?: string;
  readonly root?: string;
}

export interface DeadLinkReport {
  readonly checked: number;
  readonly ok: string[];
  readonly dead: ReadonlyArray<{ url: string; status: number | string }>;
}

function extractLinks(data: unknown): ExternalLink[] {
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  const raw = obj.externalLinks;
  if (!Array.isArray(raw)) return [];

  const out: ExternalLink[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;
    const href = rec.href;
    if (typeof href !== 'string' || href.length === 0) continue;
    const label = typeof rec.label === 'string' ? rec.label : '';
    out.push({ label, href });
  }
  return out;
}

export function collectExternalLinks(root: string = DEFAULT_ROOT): ExternalLink[] {
  if (!existsSync(root)) return [];
  const out: ExternalLink[] = [];
  const seen = new Set<string>();
  const stack: string[] = [root];

  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push(p);
      } else if (name.endsWith('.json')) {
        let data: unknown;
        try {
          data = JSON.parse(readFileSync(p, 'utf8')) as unknown;
        } catch {
          continue;
        }
        for (const link of extractLinks(data)) {
          if (seen.has(link.href)) continue;
          seen.add(link.href);
          out.push(link);
        }
      }
    }
  }
  return out;
}

async function headStatus(
  url: string,
  timeoutMs: number,
  userAgent: string,
): Promise<number | string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await globalThis.fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': userAgent },
      signal: controller.signal,
    });
    return res.status;
  } catch (err) {
    return (err as Error).message || 'error';
  } finally {
    clearTimeout(timer);
  }
}

export async function findDeadLinks(options: DeadLinkOptions = {}): Promise<DeadLinkReport> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const root = options.root ?? DEFAULT_ROOT;
  const links = collectExternalLinks(root);
  const ok: string[] = [];
  const dead: Array<{ url: string; status: number | string }> = [];

  for (const link of links) {
    const status = await headStatus(link.href, timeoutMs, userAgent);
    if (typeof status === 'number' && status >= 200 && status < 400) {
      ok.push(link.href);
    } else {
      dead.push({ url: link.href, status });
    }
  }
  return { checked: links.length, ok, dead };
}

async function main(): Promise<void> {
  const report = await findDeadLinks();
  log.info(`checked ${report.checked} link(s)`);
  for (const entry of report.dead) {
    log.warn(`dead link: ${entry.url} (status: ${entry.status})`);
  }
  if (report.dead.length === 0) {
    log.info('all links are healthy');
  } else {
    log.warn(`${report.dead.length} dead link(s) found (warnings only)`);
  }
}

if (typeof process !== 'undefined' && process.argv[1]) {
  const argv1 = process.argv[1];
  try {
    const isDirectInvocation = import.meta.url === new URL(`file://${argv1}`).href;
    if (isDirectInvocation) {
      main().catch((err: unknown) => {
        log.error((err as Error).message);
        process.exitCode = 1;
      });
    }
  } catch {
    // ignore
  }
}
