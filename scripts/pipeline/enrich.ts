/**
 * Enrichment stage of the data pipeline.
 *
 * Adds metadata derived from already-normalized entities:
 * - Health scores for projects (stars, forks, recency, documentation, license).
 * - Lightweight similarity links between models in the same family.
 *
 * Inferred relations are emitted as `Relation[]` so they can be merged with
 * explicitly-curated relations downstream.
 */

import { buildTypedId, parseTypedId } from '../lib/id.js';
import { createLogger } from '../lib/logger.js';
import type {
  Entity,
  HealthBreakdown,
  ModelEntity,
  ProjectEntity,
  Relation,
} from '../lib/types.js';

const log = createLogger('pipeline:enrich');

export interface EnrichedEntity {
  readonly entity: Entity;
  readonly health?: HealthBreakdown;
}

export interface EnrichResult {
  readonly entities: Entity[];
  readonly relations: Relation[];
}

/**
 * Compute a health score breakdown for a single project entity.
 * Uses fields carried over from the GitHub connector's raw data when present.
 */
export function computeProjectHealth(project: ProjectEntity): HealthBreakdown {
  const extra = (project as ProjectEntity & { extra?: Record<string, unknown> }).extra ?? {};
  const stars = typeof extra.stargazers_count === 'number' ? extra.stargazers_count : 0;
  const forks = typeof extra.forks_count === 'number' ? extra.forks_count : 0;
  const pushedAt = typeof extra.pushed_at === 'string' ? extra.pushed_at : '';
  const hasDocs = project.externalLinks.some(
    (l) => /docs?/i.test(l.label) || /docs?/i.test(l.href),
  );
  const hasLicense = typeof project.license === 'string' && project.license.length > 0;

  const recentCommit = scoreRecency(pushedAt);
  const popularity = scorePopularity(stars, forks);
  const documentation = hasDocs ? 1 : 0;
  const licenseScore = hasLicense ? 1 : 0;
  // Phase 1: release frequency is not derivable from a single API call.
  const releaseFrequency = 0.5;
  const total =
    recentCommit * 0.35 +
    releaseFrequency * 0.15 +
    popularity * 0.3 +
    documentation * 0.1 +
    licenseScore * 0.1;
  return {
    recentCommit,
    releaseFrequency,
    popularity,
    documentation,
    license: licenseScore,
    total: clamp01(total),
  };
}

function scoreRecency(pushedAt: string): number {
  if (!pushedAt) return 0;
  const t = Date.parse(pushedAt);
  if (Number.isNaN(t)) return 0;
  const days = Math.max(0, (Date.now() - t) / (24 * 60 * 60 * 1000));
  if (days < 30) return 1;
  if (days < 180) return 0.8;
  if (days < 365) return 0.6;
  if (days < 730) return 0.3;
  return 0.1;
}

function scorePopularity(stars: number, forks: number): number {
  // Simple log-scaled scoring so very popular repos don't dominate.
  const score = Math.log10(1 + stars) + 0.5 * Math.log10(1 + forks);
  return clamp01(score / 6);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Attach a `health` breakdown to every project entity.
 */
export function enrichProjects(entities: readonly Entity[]): Entity[] {
  return entities.map((e) => {
    if (e.type !== 'project') return e;
    const health = computeProjectHealth(e);
    log.debug(`health ${buildTypedId('project', e.slug)} = ${health.total.toFixed(2)}`);
    return { ...e, health } as Entity;
  });
}

/**
 * Infer `similarTo` relations between models that share the same family.
 * Family is defined by the slug prefix before the first size/tier token
 * (e.g. `llama-3-8b` and `llama-3-70b` both map to family `llama-3`).
 */
export function inferModelSimilarities(models: readonly ModelEntity[]): Relation[] {
  const families = new Map<string, string[]>();
  for (const m of models) {
    const family = modelFamily(m.slug);
    if (!family) continue;
    const list = families.get(family) ?? [];
    list.push(m.slug);
    families.set(family, list);
  }
  const out: Relation[] = [];
  for (const [family, slugs] of families) {
    if (slugs.length < 2) continue;
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        const a = slugs[i];
        const b = slugs[j];
        if (!a || !b) continue;
        out.push({
          source: buildTypedId('model', a),
          target: buildTypedId('model', b),
          type: 'similarTo',
          weight: 0.7,
        });
      }
    }
    log.debug(`family ${family}: linked ${slugs.length} models`);
  }
  return out;
}

function modelFamily(slug: string): string | null {
  const tokens = slug.split('-');
  if (tokens.length < 2) return null;
  // Drop trailing size/variant tokens like "7b", "8b", "xl", "base".
  const dropSuffix = (t: string): boolean =>
    /^\d+(\.\d+)?[bmk]?$/.test(t) || /^(xl|base|large|small|mini|medium)$/i.test(t);
  while (tokens.length > 1 && dropSuffix(tokens[tokens.length - 1] ?? '')) {
    tokens.pop();
  }
  return tokens.join('-');
}

/**
 * Run the full enrichment step over the supplied entities.
 */
export function enrich(entities: readonly Entity[]): EnrichResult {
  const enriched = enrichProjects(entities);
  const models = enriched.filter((e): e is ModelEntity => e.type === 'model');
  const inferredRelations = inferModelSimilarities(models);
  log.info(
    `enriched ${enriched.length} entities (${models.length} models) and inferred ${inferredRelations.length} relations`,
  );
  return { entities: enriched, relations: inferredRelations };
}

// Re-export parseTypedId so downstream scripts can resolve IDs.
export { parseTypedId };
