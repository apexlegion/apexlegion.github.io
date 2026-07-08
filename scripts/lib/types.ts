/**
 * Shared types for the AI Atlas data pipeline.
 *
 * The pipeline lives outside the runtime src/ tree but writes data files that
 * the runtime consumes. These types mirror the runtime Zod schemas enough to
 * keep the boundary safe; runtime validation still happens through Zod at the
 * end of the pipeline.
 */

import type {
  BenchmarkEntity,
  ConceptEntity,
  ContentEntity,
  DatasetEntity,
  ExternalLink,
  ModelEntity,
  NewsEntity,
  PaperEntity,
  ProjectEntity,
  Relation,
  TimelineEvent,
  TutorialEntity,
} from '../../src/lib/schemas/entity.js';

export type EntityType =
  'project' | 'model' | 'concept' | 'tutorial' | 'paper' | 'news' | 'dataset' | 'benchmark';

/**
 * Every entity a connector can produce. Covers the Phase 1 runtime
 * `EntitySchema` (project/model/concept/tutorial) plus the Phase 2
 * `ContentEntitySchema` (paper/news/dataset/benchmark).
 */
export type Entity =
  | ProjectEntity
  | ModelEntity
  | ConceptEntity
  | TutorialEntity
  | PaperEntity
  | NewsEntity
  | DatasetEntity
  | BenchmarkEntity;

export type {
  ProjectEntity,
  ModelEntity,
  ConceptEntity,
  TutorialEntity,
  PaperEntity,
  NewsEntity,
  DatasetEntity,
  BenchmarkEntity,
  ContentEntity,
  Relation,
  TimelineEvent,
  ExternalLink,
};

/**
 * Raw, source-native record produced by a connector's `fetch()`.
 * Connectors are free to attach any extra fields under `extra`.
 */
export interface RawRecord {
  source: string;
  sourceId: string;
  fetchedAt: string;
  data: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export type RawRecordMap = Record<string, unknown>;

/**
 * Health score breakdown produced during enrichment.
 */
export interface HealthBreakdown {
  recentCommit: number;
  releaseFrequency: number;
  popularity: number;
  documentation: number;
  license: number;
  total: number;
}
