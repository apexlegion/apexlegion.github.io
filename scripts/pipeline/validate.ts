/**
 * Validation stage of the data pipeline.
 *
 * Validates normalized entities and relations against the runtime Zod schemas
 * in `src/lib/schemas/entity.ts`. Writes a JSON report to
 * `data/reports/validation.json` summarizing pass/fail counts and listing any
 * invalid records with their issues.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  ContentEntitySchema,
  EntitySchema,
  RelationSchema,
  type Relation,
} from '../../src/lib/schemas/entity.js';
import { createLogger } from '../lib/logger.js';
import type { Entity } from '../lib/types.js';

const log = createLogger('pipeline:validate');

export interface ValidationIssue {
  readonly index: number;
  readonly id?: string;
  readonly issues: string[];
}

export interface ValidationReport {
  readonly generatedAt: string;
  readonly entityCounts: Record<string, number>;
  readonly relationCount: number;
  readonly entitiesInvalid: ValidationIssue[];
  readonly relationsInvalid: ValidationIssue[];
  readonly passed: boolean;
}

export interface ValidateResult {
  readonly report: ValidationReport;
  readonly entities: Entity[];
  readonly relations: Relation[];
}

const DEFAULT_REPORT_PATH = resolve(process.cwd(), 'data', 'reports', 'validation.json');

function summarizeIssues(error: unknown): string[] {
  const err = error as { issues?: Array<{ path?: Array<string | number>; message: string }> };
  if (!Array.isArray(err?.issues)) return [(error as Error).message ?? String(error)];
  return err.issues.map((i) => {
    const p = Array.isArray(i.path) && i.path.length > 0 ? i.path.join('.') : '(root)';
    return `${p}: ${i.message}`;
  });
}

function typedId(entity: Entity): string {
  return `${entity.type}/${entity.slug}`;
}

/**
 * Validate an entity against either the Phase 1 `EntitySchema` (project,
 * model, concept, tutorial) or the Phase 2 `ContentEntitySchema` (paper,
 * news, dataset, benchmark). Returns success/failure plus the matching
 * schema name for logging.
 */
function parseEntity(entity: Entity): { ok: true } | { ok: false; error: unknown } {
  const primary = EntitySchema.safeParse(entity);
  if (primary.success) return { ok: true };
  const secondary = ContentEntitySchema.safeParse(entity);
  if (secondary.success) return { ok: true };
  return { ok: false, error: secondary.error };
}

export async function validateEntitiesAndRelations(
  entities: readonly Entity[],
  relations: readonly Relation[],
): Promise<ValidationReport> {
  const entityCounts: Record<string, number> = {};
  const entitiesInvalid: ValidationIssue[] = [];
  entities.forEach((entity, idx) => {
    entityCounts[entity.type] = (entityCounts[entity.type] ?? 0) + 1;
    const result = parseEntity(entity);
    if (!result.ok) {
      entitiesInvalid.push({
        index: idx,
        id: typedId(entity),
        issues: summarizeIssues(result.error),
      });
    }
  });

  const relationsInvalid: ValidationIssue[] = [];
  relations.forEach((relation, idx) => {
    const result = RelationSchema.safeParse(relation);
    if (!result.success) {
      relationsInvalid.push({
        index: idx,
        id: `${relation.source}->${relation.target}`,
        issues: summarizeIssues(result.error),
      });
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    entityCounts,
    relationCount: relations.length,
    entitiesInvalid,
    relationsInvalid,
    passed: entitiesInvalid.length === 0 && relationsInvalid.length === 0,
  };
}

export function writeReport(report: ValidationReport, path: string = DEFAULT_REPORT_PATH): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2), 'utf8');
  log.info(`validation report written to ${path}`);
}

async function main(): Promise<void> {
  // The validate script can be invoked standalone to re-check files that
  // already live on disk. It scans the normalized directory tree and reports
  // any issues without touching the pipeline's in-memory state.
  const normalizedRoot = resolve(process.cwd(), 'data', 'normalized');

  const entities: Entity[] = [];
  for (const file of listNormalizedEntities(normalizedRoot)) {
    try {
      const text = readFileSync(file, 'utf8');
      entities.push(JSON.parse(text) as Entity);
    } catch (err) {
      log.warn(`failed to parse ${file}: ${(err as Error).message}`);
    }
  }

  const relations: Relation[] = [];
  const relationsDir = join(normalizedRoot, 'relations');
  if (existsSync(relationsDir)) {
    for (const file of readdirSync(relationsDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const data = JSON.parse(readFileSync(join(relationsDir, file), 'utf8')) as unknown;
        if (Array.isArray(data)) relations.push(...(data as Relation[]));
      } catch (err) {
        log.warn(`failed to parse relations/${file}: ${(err as Error).message}`);
      }
    }
  }

  const report = await validateEntitiesAndRelations(entities, relations);
  writeReport(report);
  const totalEntities = Object.values(report.entityCounts).reduce((a, b) => a + b, 0);
  const typeSummary = Object.entries(report.entityCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, n]) => `${t}=${n}`)
    .join(', ');
  if (!report.passed) {
    log.error(
      `validation failed: ${report.entitiesInvalid.length} entities, ${report.relationsInvalid.length} relations invalid (counts: ${typeSummary || 'none'})`,
    );
    process.exitCode = 1;
  } else {
    log.info(
      `validation passed: ${totalEntities} entities (${typeSummary}), ${report.relationCount} relations`,
    );
  }
}

function listNormalizedEntities(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
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
        if (name === 'relations' || name === 'indexes') continue;
        stack.push(p);
      } else if (name.endsWith('.json')) {
        out.push(p);
      }
    }
  }
  return out;
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
