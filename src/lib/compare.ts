/**
 * Comparison helpers — pure functions for the side-by-side comparison
 * engine used by `src/components/compare/*` and `src/pages/compare/*`.
 *
 * Everything in this module is deterministic and side-effect free so it
 * can be reused by both the React islands and the Astro pages.
 */

import type {
  ConceptEntity,
  Entity,
  ModelEntity,
  ProjectEntity,
  TimelineEvent,
  TutorialEntity,
} from '@/lib/schemas/entity';

export type Winner = 'a' | 'b' | 'tie';

/** Permissiveness rank — higher is more permissive. Tied values fall through to "tie". */
const LICENSE_PERMISSIVENESS: Record<string, number> = {
  MIT: 100,
  'Apache-2.0': 95,
  'BSD-3-Clause': 90,
  'BSD-2-Clause': 88,
  PostgreSQL: 85,
  'CreativeML Open RAIL-M': 70,
  'Llama 3 Community License': 50,
  'CPML (Coqui Public Model License)': 45,
  GPL: 20,
  'GPL-3.0': 15,
  'AGPL-3.0': 5,
};

export interface ComparisonAttribute {
  /** Stable id used as React key. */
  id: string;
  /** Column header for the attribute row. */
  label: string;
  /** Display values for each entity (raw strings, may be empty). */
  valueA: string;
  valueB: string;
  /** Which entity "wins" this row, or 'tie' / undefined when not applicable. */
  winner?: Winner;
}

export interface ComparisonResult {
  /** Attributes shown in `ComparisonTable`. */
  attributes: ComparisonAttribute[];
  /** Tags present in both entities, highlighted in the table. */
  sharedTags: string[];
  /** Tags unique to each entity. */
  onlyA: string[];
  onlyB: string[];
  /** Numeric metrics shown in `BenchmarkChart`. */
  metrics: { id: string; label: string; valueA: number; valueB: number; winner: Winner }[];
  /** Total number of relations each entity has in the seed data. */
  relationsA: number;
  relationsB: number;
}

const emptyValue = '—';

function licenseRank(license: string | undefined): number {
  if (!license) return -1;
  return LICENSE_PERMISSIVENESS[license] ?? 50;
}

/**
 * Parse the leading number from a parameter string like "8B / 70B" or
 * "7.24B". Returns NaN if no number is present.
 */
function parseParameterCount(parameters: string | undefined): number {
  if (!parameters) return NaN;
  // Use the first number we find; the spec only needs a single comparable
  // value to determine a winner.
  const match = parameters.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  if (!match) return NaN;
  return Number(match[1]);
}

function timelineCount(entity: Entity): number {
  return entity.timeline.length;
}

function tagsCount(entity: Entity): number {
  return entity.tags.length;
}

function externalLinksCount(entity: Entity): number {
  return entity.externalLinks.length;
}

function joinTags(tags: string[]): string {
  return tags.length === 0 ? emptyValue : tags.join(', ');
}

function pickHigher(
  rawA: number,
  rawB: number,
): { valueA: string; valueB: string; winner: Winner } {
  if (!Number.isFinite(rawA) && !Number.isFinite(rawB)) {
    return { valueA: emptyValue, valueB: emptyValue, winner: 'tie' };
  }
  if (!Number.isFinite(rawA)) return { valueA: emptyValue, valueB: String(rawB), winner: 'b' };
  if (!Number.isFinite(rawB)) return { valueA: String(rawA), valueB: emptyValue, winner: 'a' };
  if (rawA === rawB) {
    return { valueA: String(rawA), valueB: String(rawB), winner: 'tie' };
  }
  return rawA > rawB
    ? { valueA: String(rawA), valueB: String(rawB), winner: 'a' }
    : { valueA: String(rawA), valueB: String(rawB), winner: 'b' };
}

function pickLicenseWinner(
  a: string | undefined,
  b: string | undefined,
): { valueA: string; valueB: string; winner: Winner } {
  const rankA = licenseRank(a);
  const rankB = licenseRank(b);
  const winner: Winner = rankA > rankB ? 'a' : rankB > rankA ? 'b' : 'tie';
  return {
    valueA: a ?? emptyValue,
    valueB: b ?? emptyValue,
    winner,
  };
}

function buildProjectAttributes(a: ProjectEntity, b: ProjectEntity): ComparisonAttribute[] {
  const license = pickLicenseWinner(a.license, b.license);
  return [
    {
      id: 'category',
      label: 'Category',
      valueA: a.category,
      valueB: b.category,
    },
    {
      id: 'license',
      label: 'License',
      valueA: license.valueA,
      valueB: license.valueB,
      winner: license.winner,
    },
    {
      id: 'repository',
      label: 'Repository',
      valueA: a.repository ?? emptyValue,
      valueB: b.repository ?? emptyValue,
    },
    {
      id: 'tags',
      label: 'Tags',
      valueA: joinTags(a.tags),
      valueB: joinTags(b.tags),
      winner: a.tags.length > b.tags.length ? 'a' : a.tags.length < b.tags.length ? 'b' : 'tie',
    },
    {
      id: 'external-links',
      label: 'External links',
      valueA: String(a.externalLinks.length),
      valueB: String(b.externalLinks.length),
      winner:
        a.externalLinks.length > b.externalLinks.length
          ? 'a'
          : a.externalLinks.length < b.externalLinks.length
            ? 'b'
            : 'tie',
    },
    {
      id: 'timeline',
      label: 'Timeline events',
      valueA: String(a.timeline.length),
      valueB: String(b.timeline.length),
      winner:
        a.timeline.length > b.timeline.length
          ? 'a'
          : a.timeline.length < b.timeline.length
            ? 'b'
            : 'tie',
    },
  ];
}

function buildModelAttributes(a: ModelEntity, b: ModelEntity): ComparisonAttribute[] {
  const license = pickLicenseWinner(a.license, b.license);
  const params = pickHigher(parseParameterCount(a.parameters), parseParameterCount(b.parameters));
  return [
    {
      id: 'modality',
      label: 'Modality',
      valueA: a.modality,
      valueB: b.modality,
    },
    {
      id: 'parameters',
      label: 'Parameters',
      valueA: params.valueA,
      valueB: params.valueB,
      winner: params.winner,
    },
    {
      id: 'publisher',
      label: 'Publisher',
      valueA: a.publishedBy ?? emptyValue,
      valueB: b.publishedBy ?? emptyValue,
    },
    {
      id: 'license',
      label: 'License',
      valueA: license.valueA,
      valueB: license.valueB,
      winner: license.winner,
    },
    {
      id: 'tags',
      label: 'Tags',
      valueA: joinTags(a.tags),
      valueB: joinTags(b.tags),
      winner: a.tags.length > b.tags.length ? 'a' : a.tags.length < b.tags.length ? 'b' : 'tie',
    },
    {
      id: 'external-links',
      label: 'External links',
      valueA: String(a.externalLinks.length),
      valueB: String(b.externalLinks.length),
      winner:
        a.externalLinks.length > b.externalLinks.length
          ? 'a'
          : a.externalLinks.length < b.externalLinks.length
            ? 'b'
            : 'tie',
    },
    {
      id: 'timeline',
      label: 'Timeline events',
      valueA: String(a.timeline.length),
      valueB: String(b.timeline.length),
      winner:
        a.timeline.length > b.timeline.length
          ? 'a'
          : a.timeline.length < b.timeline.length
            ? 'b'
            : 'tie',
    },
  ];
}

function buildConceptAttributes(a: ConceptEntity, b: ConceptEntity): ComparisonAttribute[] {
  return [
    {
      id: 'level',
      label: 'Audience level',
      valueA: a.level,
      valueB: b.level,
    },
    {
      id: 'tags',
      label: 'Tags',
      valueA: joinTags(a.tags),
      valueB: joinTags(b.tags),
      winner: a.tags.length > b.tags.length ? 'a' : a.tags.length < b.tags.length ? 'b' : 'tie',
    },
    {
      id: 'timeline',
      label: 'Timeline events',
      valueA: String(a.timeline.length),
      valueB: String(b.timeline.length),
      winner:
        a.timeline.length > b.timeline.length
          ? 'a'
          : a.timeline.length < b.timeline.length
            ? 'b'
            : 'tie',
    },
  ];
}

function buildTutorialAttributes(a: TutorialEntity, b: TutorialEntity): ComparisonAttribute[] {
  return [
    {
      id: 'level',
      label: 'Audience level',
      valueA: a.level,
      valueB: b.level,
    },
    {
      id: 'format',
      label: 'Format',
      valueA: a.format,
      valueB: b.format,
    },
    {
      id: 'duration',
      label: 'Duration (min)',
      valueA: String(a.durationMinutes),
      valueB: String(b.durationMinutes),
      winner:
        a.durationMinutes < b.durationMinutes
          ? 'a'
          : a.durationMinutes > b.durationMinutes
            ? 'b'
            : 'tie',
    },
    {
      id: 'tags',
      label: 'Tags',
      valueA: joinTags(a.tags),
      valueB: joinTags(b.tags),
      winner: a.tags.length > b.tags.length ? 'a' : a.tags.length < b.tags.length ? 'b' : 'tie',
    },
  ];
}

export function buildAttributes(a: Entity, b: Entity): ComparisonAttribute[] {
  if (a.type === b.type) {
    if (a.type === 'project') {
      return buildProjectAttributes(a as ProjectEntity, b as ProjectEntity);
    }
    if (a.type === 'model') {
      return buildModelAttributes(a as ModelEntity, b as ModelEntity);
    }
    if (a.type === 'concept') {
      return buildConceptAttributes(a as ConceptEntity, b as ConceptEntity);
    }
    return buildTutorialAttributes(a as TutorialEntity, b as TutorialEntity);
  }
  // Mixed-type fallback — only show attributes that exist on both shapes.
  const attrs: ComparisonAttribute[] = [
    {
      id: 'type',
      label: 'Type',
      valueA: a.type,
      valueB: b.type,
    },
    {
      id: 'tags',
      label: 'Tags',
      valueA: joinTags(a.tags),
      valueB: joinTags(b.tags),
      winner: a.tags.length > b.tags.length ? 'a' : a.tags.length < b.tags.length ? 'b' : 'tie',
    },
    {
      id: 'timeline',
      label: 'Timeline events',
      valueA: String(a.timeline.length),
      valueB: String(b.timeline.length),
      winner:
        a.timeline.length > b.timeline.length
          ? 'a'
          : a.timeline.length < b.timeline.length
            ? 'b'
            : 'tie',
    },
  ];
  return attrs;
}

export function buildMetrics(a: Entity, b: Entity, relationsA: number, relationsB: number) {
  return [
    {
      id: 'tags',
      label: 'Tags',
      valueA: tagsCount(a),
      valueB: tagsCount(b),
      winner:
        tagsCount(a) > tagsCount(b)
          ? ('a' as const)
          : tagsCount(a) < tagsCount(b)
            ? ('b' as const)
            : ('tie' as const),
    },
    {
      id: 'timeline',
      label: 'Timeline events',
      valueA: timelineCount(a),
      valueB: timelineCount(b),
      winner:
        timelineCount(a) > timelineCount(b)
          ? ('a' as const)
          : timelineCount(a) < timelineCount(b)
            ? ('b' as const)
            : ('tie' as const),
    },
    {
      id: 'external-links',
      label: 'External links',
      valueA: externalLinksCount(a),
      valueB: externalLinksCount(b),
      winner:
        externalLinksCount(a) > externalLinksCount(b)
          ? ('a' as const)
          : externalLinksCount(a) < externalLinksCount(b)
            ? ('b' as const)
            : ('tie' as const),
    },
    {
      id: 'relations',
      label: 'Knowledge graph links',
      valueA: relationsA,
      valueB: relationsB,
      winner:
        relationsA > relationsB
          ? ('a' as const)
          : relationsA < relationsB
            ? ('b' as const)
            : ('tie' as const),
    },
  ];
}

export function partitionTags(
  a: Entity,
  b: Entity,
): {
  sharedTags: string[];
  onlyA: string[];
  onlyB: string[];
} {
  const setA = new Set(a.tags);
  const setB = new Set(b.tags);
  const shared: string[] = [];
  const onlyA: string[] = [];
  const onlyB: string[] = [];
  for (const tag of a.tags) {
    if (setB.has(tag)) shared.push(tag);
    else onlyA.push(tag);
  }
  for (const tag of b.tags) {
    if (!setA.has(tag)) onlyB.push(tag);
  }
  return { sharedTags: shared.sort(), onlyA: onlyA.sort(), onlyB: onlyB.sort() };
}

export interface MergedTimelineEvent extends TimelineEvent {
  /** Which entity this event belongs to. */
  source: 'a' | 'b';
  sourceName: string;
}

export function mergeTimeline(a: Entity, b: Entity): MergedTimelineEvent[] {
  const merged: MergedTimelineEvent[] = [
    ...a.timeline.map((event) => ({ ...event, source: 'a' as const, sourceName: a.name })),
    ...b.timeline.map((event) => ({ ...event, source: 'b' as const, sourceName: b.name })),
  ];
  return merged.sort((x, y) => x.date.localeCompare(y.date));
}

export function compareEntities(
  a: Entity,
  b: Entity,
  relationsA = 0,
  relationsB = 0,
): ComparisonResult {
  const tags = partitionTags(a, b);
  return {
    attributes: buildAttributes(a, b),
    sharedTags: tags.sharedTags,
    onlyA: tags.onlyA,
    onlyB: tags.onlyB,
    metrics: buildMetrics(a, b, relationsA, relationsB),
    relationsA,
    relationsB,
  };
}

/**
 * Build the canonical URL slug for a comparison pair. The slug is always
 * alphabetical so `llama-cpp-vs-ollama` and `ollama-vs-llama-cpp` map to
 * the same page.
 */
export function buildComparisonSlug(slugA: string, slugB: string): string {
  return [slugA, slugB].sort().join('-vs-');
}

/** Curated list of comparison pairs (used by `getStaticPaths`). */
export const FEATURED_COMPARISONS: { a: string; b: string; reason: string }[] = [
  { a: 'llama-cpp', b: 'ollama', reason: 'Two flagship local LLM runners side-by-side.' },
  { a: 'llama-3', b: 'mistral-7b', reason: 'Open weights flagship vs. compact open model.' },
  {
    a: 'stable-diffusion-webui',
    b: 'comfyui',
    reason: 'Two battle-tested Stable Diffusion UIs.',
  },
  { a: 'milvus', b: 'qdrant', reason: 'Distributed vs. embedded vector search engines.' },
  {
    a: 'vllm',
    b: 'text-generation-inference',
    reason: 'PagedAttention vs. HF production serving.',
  },
  {
    a: 'whisper-cpp',
    b: 'faster-whisper',
    reason: 'C++ ASR port vs. CTranslate2 Whisper.',
  },
  {
    a: 'axolotl',
    b: 'unsloth',
    reason: 'Config-driven fine-tuning vs. kernel-accelerated fine-tuning.',
  },
  {
    a: 'langchain',
    b: 'llama-index',
    reason: 'Two popular RAG / agent frameworks.',
  },
  {
    a: 'mlx',
    b: 'llama-cpp',
    reason: 'Apple Silicon native vs. portable CPU/CPU+GPU inference.',
  },
  {
    a: 'transformer',
    b: 'retrieval-augmented-generation',
    reason: 'Core architecture concept vs. retrieval-grounding pattern.',
  },
];
