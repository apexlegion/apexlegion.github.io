/**
 * Write stage of the data pipeline.
 *
 * Persists pipeline output to disk in the layout the runtime expects:
 *
 *   data/raw/{source}/{sourceId}.json
 *   data/normalized/projects/{slug}.json
 *   data/normalized/models/{slug}.json
 *   data/normalized/relations/all.json
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Entity, NewsEntity, PaperEntity, RawRecord, Relation } from '../lib/types.js';

const DATA_ROOT = resolve(process.cwd(), 'data');

export interface WriteOptions {
  /** Wipe the destination directories before writing. Defaults to true. */
  clean?: boolean;
}

export interface WriteResult {
  readonly rawFiles: number;
  readonly entityFiles: number;
  readonly relationFile?: string;
}

export function writeRaw(
  rawBySource: Readonly<Record<string, readonly RawRecord[]>>,
  options: WriteOptions = {},
): number {
  const clean = options.clean ?? true;
  let count = 0;
  for (const [source, records] of Object.entries(rawBySource)) {
    const dir = join(DATA_ROOT, 'raw', source);
    if (clean) {
      rmSync(dir, { recursive: true, force: true });
    }
    mkdirSync(dir, { recursive: true });
    for (const record of records) {
      const slug = rawSlug(record.sourceId);
      const path = join(dir, `${slug}.json`);
      writeFileSync(path, JSON.stringify(record, null, 2), 'utf8');
      count++;
    }
  }
  return count;
}

export function writeNormalizedEntities(
  entities: readonly Entity[],
  options: WriteOptions = {},
): number {
  const clean = options.clean ?? true;
  const roots = ['projects', 'models', 'concepts', 'tutorials', 'papers', 'news'];
  if (clean) {
    for (const r of roots) {
      rmSync(join(DATA_ROOT, 'normalized', r), { recursive: true, force: true });
    }
  }
  let count = 0;
  for (const entity of entities) {
    const dir = outputDirFor(entity);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `${entity.slug}.json`);
    writeFileSync(path, JSON.stringify(entity, null, 2), 'utf8');
    count++;
  }
  return count;
}

/**
 * Resolve the on-disk directory for an entity. Phase 1 types use a flat
 * `{type}s/` layout. Phase 2 content types are partitioned by first-letter
 * (papers) or publication-date (news) to keep directory listings small.
 */
export function outputDirFor(entity: Entity): string {
  if (entity.type === 'paper') {
    const letter = bucketFor(entity);
    return join(DATA_ROOT, 'normalized', 'papers', letter);
  }
  if (entity.type === 'news') {
    const date = dateBucketFor(entity);
    return join(DATA_ROOT, 'normalized', 'news', date);
  }
  return join(DATA_ROOT, 'normalized', `${entity.type}s`);
}

function bucketFor(paper: PaperEntity): string {
  const first = paper.slug.charAt(0).toLowerCase();
  if (first >= 'a' && first <= 'z') return first;
  if (first >= '0' && first <= '9') return first;
  return 'misc';
}

function dateBucketFor(news: NewsEntity): string {
  const iso = (news.publishedAt ?? '').slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return 'undated';
}

export function writeRelations(
  relations: readonly Relation[],
  options: WriteOptions = {},
): string | undefined {
  if (relations.length === 0) return undefined;
  const clean = options.clean ?? true;
  const dir = join(DATA_ROOT, 'normalized', 'relations');
  if (clean) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'all.json');
  writeFileSync(path, JSON.stringify(relations, null, 2), 'utf8');
  return path;
}

function rawSlug(sourceId: string): string {
  return sourceId
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
