/**
 * Index generation stage of the data pipeline.
 *
 * Reads the normalized entity and relation files written by `write.ts` and
 * emits three lookup indexes used by the runtime:
 *
 *   data/normalized/indexes/slug-index.json
 *   data/normalized/indexes/type-index.json
 *   data/normalized/indexes/relation-index.json
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { buildTypedId } from '../lib/id.js';
import type { Entity, Relation } from '../lib/types.js';

const DATA_ROOT = resolve(process.cwd(), 'data', 'normalized');
const INDEX_DIR = join(DATA_ROOT, 'indexes');

export interface SlugIndexEntry {
  readonly slug: string;
  readonly typedId: string;
  readonly name: string;
  readonly type: Entity['type'];
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface TypeIndex {
  readonly generatedAt: string;
  readonly counts: Record<string, number>;
  readonly items: Record<string, readonly string[]>;
}

export interface SlugIndex {
  readonly generatedAt: string;
  readonly entries: Record<string, SlugIndexEntry>;
}

export interface RelationIndexEntry {
  readonly type: string;
  readonly targets: readonly string[];
}

export interface RelationIndex {
  readonly generatedAt: string;
  readonly outgoing: Record<string, readonly RelationIndexEntry[]>;
  readonly incoming: Record<string, readonly RelationIndexEntry[]>;
}

function loadEntities(): Entity[] {
  const out: Entity[] = [];
  if (!existsSync(DATA_ROOT)) return out;
  const stack: string[] = [DATA_ROOT];
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
        if (name === 'relations' || name === 'indexes') continue;
        stack.push(p);
      } else if (name.endsWith('.json')) {
        try {
          out.push(JSON.parse(readFileSync(p, 'utf8')) as Entity);
        } catch {
          // skip unparseable files; validate stage will surface them
        }
      }
    }
  }
  return out;
}

function loadRelations(): Relation[] {
  const path = join(DATA_ROOT, 'relations', 'all.json');
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as Relation[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function buildSlugIndex(entities: readonly Entity[]): SlugIndex {
  const entries: Record<string, SlugIndexEntry> = {};
  for (const entity of entities) {
    entries[entity.slug] = {
      slug: entity.slug,
      typedId: buildTypedId(entity.type, entity.slug),
      name: entity.name,
      type: entity.type,
      summary: entity.summary,
      tags: entity.tags,
    };
  }
  return { generatedAt: new Date().toISOString(), entries };
}

export function buildTypeIndex(entities: readonly Entity[]): TypeIndex {
  const counts: Record<string, number> = {};
  const items: Record<string, string[]> = {};
  for (const entity of entities) {
    counts[entity.type] = (counts[entity.type] ?? 0) + 1;
    (items[entity.type] ??= []).push(buildTypedId(entity.type, entity.slug));
  }
  for (const list of Object.values(items)) {
    list.sort();
  }
  return { generatedAt: new Date().toISOString(), counts, items };
}

export function buildRelationIndex(relations: readonly Relation[]): RelationIndex {
  const outgoing: Record<string, RelationIndexEntry[]> = {};
  const incoming: Record<string, RelationIndexEntry[]> = {};
  for (const rel of relations) {
    const out = (outgoing[rel.source] ??= []);
    out.push({ type: rel.type, targets: [rel.target] });
    const inc = (incoming[rel.target] ??= []);
    inc.push({ type: rel.type, targets: [rel.source] });
  }
  // Coalesce duplicate (source, type) pairs so consumers don't have to.
  const coalesce = (acc: Record<string, RelationIndexEntry[]>): void => {
    for (const [key, list] of Object.entries(acc)) {
      const byType = new Map<string, Set<string>>();
      for (const entry of list) {
        const set = byType.get(entry.type) ?? new Set<string>();
        for (const t of entry.targets) set.add(t);
        byType.set(entry.type, set);
      }
      acc[key] = [...byType.entries()].map(([type, set]) => ({
        type,
        targets: [...set].sort(),
      }));
    }
  };
  coalesce(outgoing);
  coalesce(incoming);
  return { generatedAt: new Date().toISOString(), outgoing, incoming };
}

export function writeIndex<T>(name: string, payload: T): string {
  mkdirSync(INDEX_DIR, { recursive: true });
  const path = join(INDEX_DIR, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf8');
  return path;
}

export function generateAllIndexes(): {
  slugIndex: SlugIndex;
  typeIndex: TypeIndex;
  relationIndex: RelationIndex;
  paths: { slug: string; type: string; relation: string };
} {
  const entities = loadEntities();
  const relations = loadRelations();
  const slugIndex = buildSlugIndex(entities);
  const typeIndex = buildTypeIndex(entities);
  const relationIndex = buildRelationIndex(relations);
  const paths = {
    slug: writeIndex('slug-index.json', slugIndex),
    type: writeIndex('type-index.json', typeIndex),
    relation: writeIndex('relation-index.json', relationIndex),
  };
  return { slugIndex, typeIndex, relationIndex, paths };
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
  try {
    const result = generateAllIndexes();
    console.warn(
      `[pipeline:generateIndexes] slug-index=${result.paths.slug} type-index=${result.paths.type} relation-index=${result.paths.relation}`,
    );
  } catch (err) {
    console.error(`[pipeline:generateIndexes] failed: ${(err as Error).message}`);
    process.exitCode = 1;
  }
}
