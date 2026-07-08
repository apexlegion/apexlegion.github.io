/**
 * Zod schemas for Phase 1 seed entities (projects, models, concepts,
 * tutorials, playgrounds, and decision profiles).
 *
 * These schemas are intentionally minimal — they cover only the fields
 * currently rendered by the entity detail pages and the listing pages.
 */

import { z } from 'zod';

export const EntityTypeSchema = z.enum([
  'project',
  'model',
  'concept',
  'tutorial',
  'paper',
  'news',
  'dataset',
  'benchmark',
  'job',
  'event',
]);

export const PlaygroundCategorySchema = z.enum([
  'fundamentals',
  'models',
  'optimization',
  'applications',
  'agents',
  'hardware',
]);

export const PlaygroundTypeSchema = z.enum([
  'tokenization',
  'embedding',
  'prompt-engineering',
  'context-window',
  'quantization',
  'rag-simulator',
  'vector-search',
  'agent-workflow',
  'model-comparison',
  'inference-visualizer',
  'fine-tuning-simulator',
  'diffusion-playground',
  'whisper-transcription',
]);

export const DecisionQuestionTypeSchema = z.enum(['single', 'multi']);

export const TimelineEventSchema = z.object({
  date: z.string().min(4),
  type: z.enum(['paper', 'release', 'milestone', 'update', 'community', 'breaking']),
  title: z.string().min(1),
  description: z.string().optional(),
  href: z.string().optional(),
});

export const ExternalLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const BaseFields = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  externalLinks: z.array(ExternalLinkSchema).default([]),
  timeline: z.array(TimelineEventSchema).default([]),
});

export const ProjectSchema = BaseFields.extend({
  type: z.literal('project'),
  category: z.string().min(1),
  repository: z.string().optional(),
  license: z.string().optional(),
});

export const ModelSchema = BaseFields.extend({
  type: z.literal('model'),
  modality: z.string().min(1),
  parameters: z.string().optional(),
  publishedBy: z.string().optional(),
  license: z.string().optional(),
});

/** Per-level content block. Allows the same entity to ship explanations
 *  tuned for each Explain Like I'm... level. */
export const LevelContentSchema = z.object({
  summary: z.string().optional(),
  content: z.string().optional(),
});

export const LevelsSchema = z
  .object({
    twelve: LevelContentSchema.optional(),
    beginner: LevelContentSchema.optional(),
    student: LevelContentSchema.optional(),
    developer: LevelContentSchema.optional(),
    researcher: LevelContentSchema.optional(),
    business: LevelContentSchema.optional(),
  })
  .partial();

export const ConceptSchema = BaseFields.extend({
  type: z.literal('concept'),
  level: z.enum(['twelve', 'beginner', 'student', 'developer', 'researcher', 'business']),
  levels: LevelsSchema.optional(),
});

export const TutorialSchema = BaseFields.extend({
  type: z.literal('tutorial'),
  level: z.enum(['twelve', 'beginner', 'student', 'developer', 'researcher', 'business']),
  durationMinutes: z.number().int().positive(),
  format: z.enum(['article', 'video', 'interactive', 'notebook']),
  levels: LevelsSchema.optional(),
});

export const EntitySchema = z.discriminatedUnion('type', [
  ProjectSchema,
  ModelSchema,
  ConceptSchema,
  TutorialSchema,
]);

/* -------------------------------------------------------------------------
 * Phase 2 content entities (papers, news, datasets, benchmarks).
 *
 * These schemas are intentionally separate from `EntitySchema` above —
 * `EntitySchema` is the runtime contract for the entity detail pages, while
 * `ContentEntitySchema` is the contract for ingested content surfaced via
 * the data pipeline (arXiv, Papers With Code, RSS, etc.). Keeping them apart
 * avoids breaking the Phase 1 seed and runtime.
 * ----------------------------------------------------------------------- */

export const PaperSchema = BaseFields.extend({
  type: z.literal('paper'),
  authors: z.array(z.string().min(1)).default([]),
  /** arXiv id, Papers With Code id, DOI, etc. */
  paperId: z.string().min(1),
  /** Categories / primary subject (e.g. "cs.AI", "cs.CL"). */
  category: z.string().optional(),
  /** ISO-8601 publication date (yyyy-mm-dd). */
  publishedAt: z.string().min(4),
  /** Optional abstract — kept short to avoid bloating the JSON payloads. */
  abstract: z.string().optional(),
});

export const NewsSchema = BaseFields.extend({
  type: z.literal('news'),
  /** Source feed identifier (RSS feed URL, blog name, etc.). */
  source: z.string().min(1),
  /** ISO-8601 publication timestamp. */
  publishedAt: z.string().min(4),
  /** ISO-8601 timestamp after which the entry is considered stale. */
  expiryAt: z.string().min(4),
  /** Optional author / byline. */
  author: z.string().optional(),
});

export const DatasetSchema = BaseFields.extend({
  type: z.literal('dataset'),
  modality: z.string().min(1),
  size: z.string().optional(),
  license: z.string().optional(),
  /** Host platform (e.g. "huggingface", "kaggle", "paperswithcode"). */
  host: z.string().optional(),
});

export const BenchmarkSchema = BaseFields.extend({
  type: z.literal('benchmark'),
  task: z.string().min(1),
  metric: z.string().optional(),
  /** Optional host / leaderboard URL. */
  host: z.string().optional(),
});

/* -------------------------------------------------------------------------
 * Phase 2 / Chunk 6 content entities (jobs, events).
 *
 * These mirror the same shape conventions as the other content entities
 * (BaseFields + a couple of type-specific properties). Kept inside the
 * Phase 2 content block so the Phase 1 runtime contract stays untouched.
 * ----------------------------------------------------------------------- */

/** Employment classification — drives filtering on the jobs listing page. */
export const JobTypeSchema = z.enum(['full-time', 'part-time', 'contract', 'internship']);

/** Event delivery format — drives filtering on the events listing page. */
export const EventFormatSchema = z.enum(['in-person', 'virtual', 'hybrid']);

export const JobSchema = BaseFields.extend({
  type: z.literal('job'),
  /** Hiring organisation. */
  company: z.string().min(1),
  /** Free-text location (e.g. "Remote", "Berlin, Germany"). */
  location: z.string().min(1),
  /** Employment classification (full-time, part-time, ...). */
  jobType: JobTypeSchema,
  /** ISO-8601 publication date (yyyy-mm-dd). */
  postedAt: z.string().min(4),
  /** ISO-8601 timestamp after which the listing is considered expired. */
  expiryAt: z.string().min(4),
});

export const EventSchema = BaseFields.extend({
  type: z.literal('event'),
  /** ISO-8601 start date / time. */
  startDate: z.string().min(4),
  /** ISO-8601 end date / time. */
  endDate: z.string().min(4),
  /** Free-text location (e.g. "San Francisco, CA" or "Online"). */
  location: z.string().min(1),
  /** Delivery format. */
  format: EventFormatSchema,
});

export const ContentEntitySchema = z.discriminatedUnion('type', [
  PaperSchema,
  NewsSchema,
  DatasetSchema,
  BenchmarkSchema,
  JobSchema,
  EventSchema,
]);

export const RelationSchema = z.object({
  source: z.string().regex(/^[a-z]+\/[a-z0-9-]+$/),
  target: z.string().regex(/^[a-z]+\/[a-z0-9-]+$/),
  type: z.string().min(1),
  weight: z.number().min(0).max(1).optional(),
});

export const PlaygroundQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  helperText: z.string().optional(),
  type: DecisionQuestionTypeSchema.default('single'),
  options: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .min(2),
});

export const PlaygroundSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  type: PlaygroundTypeSchema,
  category: PlaygroundCategorySchema.default('fundamentals'),
  difficulty: z.enum(['beginner', 'student', 'developer', 'researcher']).default('beginner'),
  estimatedMinutes: z.number().int().positive().default(5),
  relatedConcepts: z.array(z.string()).default([]),
  externalLinks: z.array(ExternalLinkSchema).default([]),
  tags: z.array(z.string().min(1)).default([]),
});

export const DecisionQuestionSchema = PlaygroundQuestionSchema;

export const DecisionRuleSchema = z.object({
  /** Optional predicate descriptor; matched against answers by id. */
  when: z
    .object({
      all: z.array(z.string()).optional(),
      any: z.array(z.string()).optional(),
      none: z.array(z.string()).optional(),
    })
    .partial()
    .optional(),
  recommendations: z.array(
    z.object({
      slug: z.string().min(1),
      type: z.enum(['project', 'model']),
      reason: z.string().min(1),
    }),
  ),
});

export const DecisionProfileSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  questions: z.array(DecisionQuestionSchema).min(1),
  rules: z.array(DecisionRuleSchema).min(1),
  tags: z.array(z.string().min(1)).default([]),
  externalLinks: z.array(ExternalLinkSchema).default([]),
});

export type ProjectEntity = z.infer<typeof ProjectSchema>;
export type ModelEntity = z.infer<typeof ModelSchema>;
export type ConceptEntity = z.infer<typeof ConceptSchema>;
export type TutorialEntity = z.infer<typeof TutorialSchema>;
export type Entity = z.infer<typeof EntitySchema>;
export type PaperEntity = z.infer<typeof PaperSchema>;
export type NewsEntity = z.infer<typeof NewsSchema>;
export type DatasetEntity = z.infer<typeof DatasetSchema>;
export type BenchmarkEntity = z.infer<typeof BenchmarkSchema>;
export type JobEntity = z.infer<typeof JobSchema>;
export type EventEntity = z.infer<typeof EventSchema>;
export type ContentEntity = z.infer<typeof ContentEntitySchema>;
export type JobTypeValue = z.infer<typeof JobTypeSchema>;
export type EventFormatValue = z.infer<typeof EventFormatSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type ExternalLink = z.infer<typeof ExternalLinkSchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type PlaygroundEntity = z.infer<typeof PlaygroundSchema>;
/** Scoring engine — alternative to rule-based decisions. A profile that
 *  uses the scoring engine declares `engine: "scoring"`, replaces `rules`
 *  with `candidates`, and attaches per-option `scores` maps. */
export const DecisionOptionScoreSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  scores: z.record(z.string(), z.number()).optional(),
});

export const DecisionScoringQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  helperText: z.string().optional(),
  type: DecisionQuestionTypeSchema.default('single'),
  weight: z.number().positive().optional(),
  options: z.array(DecisionOptionScoreSchema).min(2),
});

export const DecisionCandidateSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(['project', 'model']),
  reason: z.string().min(1),
  healthScore: z.number().min(0).max(1).optional(),
});

export const DecisionScoringProfileSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  engine: z.literal('scoring'),
  questions: z.array(DecisionScoringQuestionSchema).min(1),
  candidates: z.array(DecisionCandidateSchema).min(1),
  healthWeight: z.number().min(0).max(1).optional(),
  tags: z.array(z.string().min(1)).default([]),
  externalLinks: z.array(ExternalLinkSchema).default([]),
});

export type DecisionProfileEntity = z.infer<typeof DecisionProfileSchema>;
export type DecisionScoringProfileEntity = z.infer<typeof DecisionScoringProfileSchema>;
export type DecisionCandidate = z.infer<typeof DecisionCandidateSchema>;
export type LevelContent = z.infer<typeof LevelContentSchema>;
export type LevelsBlock = z.infer<typeof LevelsSchema>;
export type PlaygroundQuestion = z.infer<typeof PlaygroundQuestionSchema>;
export type DecisionRule = z.infer<typeof DecisionRuleSchema>;
