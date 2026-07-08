/**
 * Pipeline orchestrator.
 *
 * Sequences the full data pipeline:
 *
 *   fetch (per connector) -> normalize -> validate -> enrich -> write -> index
 *
 * CLI flags:
 *   --source=github,huggingface,arxiv,paperswithcode,rss,all   (default: all)
 *   --skip-scrape                                               (use raw data already on disk)
 *   --skip-write                                                (validate/enrich only, don't write)
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { getConnector } from './normalize.js';
import { enrich } from './enrich.js';
import { validateEntitiesAndRelations, writeReport } from './validate.js';
import { writeNormalizedEntities, writeRaw, writeRelations } from './write.js';
import { generateAllIndexes } from './generateIndexes.js';
import { filterExpired } from './expiry.js';
import { createLogger } from '../lib/logger.js';
import type { Entity, NewsEntity, RawRecord, Relation } from '../lib/types.js';

const log = createLogger('pipeline:run');

const VALID_SOURCES = ['github', 'huggingface', 'arxiv', 'paperswithcode', 'rss'] as const;
type _SourceToken = (typeof VALID_SOURCES)[number] | 'all';

interface CliOptions {
  source: string;
  skipScrape: boolean;
  skipWrite: boolean;
}

function parseArgs(argv: readonly string[]): CliOptions {
  let source = 'all';
  let skipScrape = false;
  let skipWrite = false;
  for (const arg of argv) {
    if (arg.startsWith('--source=')) {
      source = arg.slice('--source='.length);
    } else if (arg === '--skip-scrape') {
      skipScrape = true;
    } else if (arg === '--skip-write') {
      skipWrite = true;
    }
  }
  return { source, skipScrape, skipWrite };
}

function connectorsFor(sourceArg: string): string[] {
  const tokens = sourceArg
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (tokens.length === 0 || tokens.includes('all')) {
    return [...VALID_SOURCES];
  }
  const valid: string[] = [];
  for (const t of tokens) {
    if ((VALID_SOURCES as readonly string[]).includes(t)) {
      valid.push(t);
    } else {
      log.warn(`ignoring unknown --source token: ${t}`);
    }
  }
  if (valid.length === 0) {
    log.warn('no valid --source tokens; defaulting to all');
    return [...VALID_SOURCES];
  }
  return valid;
}

async function scrape(name: string): Promise<RawRecord[]> {
  const connector = getConnector(name);
  log.info(`fetching raw data via ${name} connector`);
  return await connector.fetch();
}

function loadRawFromDisk(name: string): RawRecord[] {
  const dir = resolve(process.cwd(), 'data', 'raw', name);
  if (!existsSync(dir)) return [];
  const out: RawRecord[] = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const text = readFileSync(join(dir, file), 'utf8');
    try {
      out.push(JSON.parse(text) as RawRecord);
    } catch (err) {
      log.warn(`failed to parse raw ${name}/${file}: ${(err as Error).message}`);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const sources = connectorsFor(opts.source);
  log.info(`pipeline starting for sources: ${sources.join(', ')}`);

  // 1. Scrape + normalize
  const rawBySource: Record<string, RawRecord[]> = {};
  const allEntities: Entity[] = [];
  for (const name of sources) {
    const raw = opts.skipScrape ? loadRawFromDisk(name) : await scrape(name);
    rawBySource[name] = raw;
    const connector = getConnector(name);
    const entities = await connector.normalize(raw);
    allEntities.push(...entities);
  }
  // 1a. Drop news items whose `expiryAt` is in the past so the runtime
  // never sees stale headlines.
  const newsEntities = allEntities.filter((e): e is NewsEntity => e.type === 'news');
  const liveNews = filterExpired(newsEntities);
  if (liveNews.length !== newsEntities.length) {
    log.info(`filtered ${newsEntities.length - liveNews.length} expired news item(s)`);
    const liveSlugs = new Set(liveNews.map((n) => n.slug));
    const kept = allEntities.filter((e) => e.type !== 'news' || liveSlugs.has(e.slug));
    allEntities.length = 0;
    allEntities.push(...kept);
  }
  log.info(`normalized ${allEntities.length} entities across ${sources.length} source(s)`);

  // 2. Validate
  const explicitRelations: Relation[] = []; // Phase 1: no curated relations from connectors yet
  const report = await validateEntitiesAndRelations(allEntities, explicitRelations);
  writeReport(report);
  if (!report.passed) {
    log.error(
      `validation failed: ${report.entitiesInvalid.length} entities invalid — aborting before write`,
    );
    process.exitCode = 1;
    return;
  }

  // 3. Enrich
  const { entities: enriched, relations: inferredRelations } = enrich(allEntities);
  const allRelations: Relation[] = [...explicitRelations, ...inferredRelations];

  // 4. Write
  if (!opts.skipWrite) {
    writeRaw(rawBySource);
    writeNormalizedEntities(enriched);
    writeRelations(allRelations);
    log.info('wrote raw, normalized, and relation data');
  }

  // 5. Index
  generateAllIndexes();
  log.info('indexes generated');

  log.info('pipeline complete');
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
