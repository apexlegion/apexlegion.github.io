/**
 * Entity helpers — load seed data from `src/data/seed/*.json` and expose
 * typed lookups for listing pages, detail pages, and the graph.
 *
 * The seed files live next to the source tree and are read at build time
 * by Astro. Milestone 4 will replace this with the production data
 * pipeline; the API surface here is what the rest of the site consumes.
 */

import projectsJson from '@/data/seed/projects.json';
import modelsJson from '@/data/seed/models.json';
import conceptsJson from '@/data/seed/concepts.json';
import tutorialsJson from '@/data/seed/tutorials.json';
import relationsJson from '@/data/seed/relations.json';
import playgroundsJson from '@/data/seed/playgrounds.json';
import decisionsJson from '@/data/seed/decisions.json';
import jobsJson from '@/data/seed/jobs.json';
import eventsJson from '@/data/seed/events.json';
import newsJson from '@/data/seed/news.json';
import type { Entity, Relation } from '@/lib/schemas/entity';
import {
  EntitySchema,
  PlaygroundSchema,
  DecisionProfileSchema,
  DecisionScoringProfileSchema,
  RelationSchema,
  EventSchema,
  JobSchema,
  NewsSchema,
  type ConceptEntity,
  type ModelEntity,
  type ProjectEntity,
  type TutorialEntity,
  type PlaygroundEntity,
  type DecisionProfileEntity,
  type DecisionScoringProfileEntity,
  type EventEntity,
  type JobEntity,
  type NewsEntity,
} from '@/lib/schemas/entity';
import { buildAdjacencyList, buildReverseAdjacencyList, getRelatedNodes } from '@/lib/graph/build';
import type { AdjacencyList, GraphEdge, GraphNode } from '@/lib/graph/types';

const projectEntities: ProjectEntity[] = (projectsJson as Entity[]).map((e) =>
  EntitySchema.parse(e),
) as ProjectEntity[];
const modelEntities: ModelEntity[] = (modelsJson as Entity[]).map((e) =>
  EntitySchema.parse(e),
) as ModelEntity[];
const conceptEntities: ConceptEntity[] = (conceptsJson as Entity[]).map((e) =>
  EntitySchema.parse(e),
) as ConceptEntity[];
const tutorialEntities: TutorialEntity[] = (tutorialsJson as Entity[]).map((e) =>
  EntitySchema.parse(e),
) as TutorialEntity[];
const relationData: Relation[] = (relationsJson as Relation[]).map((r) => RelationSchema.parse(r));
const playgrounds: PlaygroundEntity[] = (playgroundsJson as PlaygroundEntity[]).map((p) =>
  PlaygroundSchema.parse(p),
);
const decisionData = decisionsJson as Array<DecisionProfileEntity | DecisionScoringProfileEntity>;
const decisionProfiles: DecisionProfileEntity[] = decisionData
  .filter((d) => !('engine' in d && d.engine === 'scoring'))
  .map((d) => DecisionProfileSchema.parse(d));
const scoringProfiles: DecisionScoringProfileEntity[] = decisionData
  .filter((d) => 'engine' in d && d.engine === 'scoring')
  .map((d) => DecisionScoringProfileSchema.parse(d as DecisionScoringProfileEntity));

const jobEntities: JobEntity[] = (jobsJson as JobEntity[]).map((j) => JobSchema.parse(j));
const eventEntities: EventEntity[] = (eventsJson as EventEntity[]).map((e) => EventSchema.parse(e));
const newsEntities: NewsEntity[] = (newsJson as NewsEntity[]).map((n) => NewsSchema.parse(n));

/** Filter helper — returns true if the given ISO-8601 timestamp is in the past
 *  relative to `now`. Used by jobs and news to drop stale listings from the
 *  default listing while preserving them for explicit "include expired" queries. */
function isExpired(timestamp: string, now: Date = new Date()): boolean {
  return new Date(timestamp).getTime() < now.getTime();
}

/** All jobs, sorted newest-first by `postedAt`. Expired jobs (those whose
 *  `expiryAt` is in the past) are filtered out by default. Pass
 *  `{ includeExpired: true }` to retain them. */
export function getAllJobs(options: { includeExpired?: boolean; now?: Date } = {}): JobEntity[] {
  const { includeExpired = false, now = new Date() } = options;
  const filtered = includeExpired
    ? jobEntities
    : jobEntities.filter((j) => !isExpired(j.expiryAt, now));
  return filtered.slice().sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

export function getJobBySlug(slug: string): JobEntity | undefined {
  return jobEntities.find((j) => j.slug === slug);
}

/** All events, sorted soonest-first by `startDate`. */
export function getAllEvents(): EventEntity[] {
  return eventEntities.slice().sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getEventBySlug(slug: string): EventEntity | undefined {
  return eventEntities.find((e) => e.slug === slug);
}

/** All news items, sorted newest-first by `publishedAt`. Expired items
 *  (those whose `expiryAt` is in the past) are filtered out by default.
 *  Pass `{ includeExpired: true }` to retain them. */
export function getAllNews(options: { includeExpired?: boolean; now?: Date } = {}): NewsEntity[] {
  const { includeExpired = false, now = new Date() } = options;
  const filtered = includeExpired
    ? newsEntities
    : newsEntities.filter((n) => !isExpired(n.expiryAt, now));
  return filtered.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getNewsBySlug(slug: string): NewsEntity | undefined {
  return newsEntities.find((n) => n.slug === slug);
}

/** True if the news item has expired (i.e. its `expiryAt` is in the past). */
export function isNewsExpired(news: NewsEntity, now: Date = new Date()): boolean {
  return isExpired(news.expiryAt, now);
}

/** True if the job listing has expired (i.e. its `expiryAt` is in the past). */
export function isJobExpired(job: JobEntity, now: Date = new Date()): boolean {
  return isExpired(job.expiryAt, now);
}

const allEntities: Entity[] = [
  ...projectEntities,
  ...modelEntities,
  ...conceptEntities,
  ...tutorialEntities,
];

function entityToNode(entity: Entity): GraphNode {
  return {
    id: `${entity.type}/${entity.slug}`,
    type: entity.type,
    name: entity.name,
    slug: entity.slug,
    href: `/${entity.type === 'tutorial' ? 'tutorials' : `${entity.type}s`}/${entity.slug}`,
    summary: entity.summary,
  };
}

const nodes: GraphNode[] = allEntities.map(entityToNode);

const edges: GraphEdge[] = relationData.map((r) => ({
  source: r.source,
  target: r.target,
  type: r.type as GraphEdge['type'],
  ...(r.weight !== undefined ? { weight: r.weight } : {}),
}));

const forward: AdjacencyList = buildAdjacencyList(nodes, edges);
const reverse: AdjacencyList = buildReverseAdjacencyList(nodes, edges);

export function getAllEntities(): Entity[] {
  return allEntities;
}

export function getEntitiesByType<K extends Entity['type']>(
  type: K,
): Extract<Entity, { type: K }>[] {
  switch (type) {
    case 'project':
      return projectEntities as Extract<Entity, { type: K }>[];
    case 'model':
      return modelEntities as Extract<Entity, { type: K }>[];
    case 'concept':
      return conceptEntities as Extract<Entity, { type: K }>[];
    case 'tutorial':
      return tutorialEntities as Extract<Entity, { type: K }>[];
  }
}

export function getEntityBySlug(slug: string): Entity | undefined {
  return allEntities.find((e) => e.slug === slug);
}

export function getEntityByTypeAndSlug(type: Entity['type'], slug: string): Entity | undefined {
  return allEntities.find((e) => e.type === type && e.slug === slug);
}

export function getRelatedEntities(entity: Entity): GraphNode[] {
  return getRelatedNodes(forward, `${entity.type}/${entity.slug}`);
}

export function getIncomingRelatedEntities(entity: Entity): GraphNode[] {
  return getRelatedNodes(reverse, `${entity.type}/${entity.slug}`);
}

export function getAdjacencyList(): AdjacencyList {
  return forward;
}

export function getAllNodes(): GraphNode[] {
  return nodes;
}

export function getAllRelations(): Relation[] {
  return relationData;
}

export function getSearchIndexItems(): {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
}[] {
  const baseItems = allEntities.map((e) => ({
    id: `${e.type}/${e.slug}`,
    type: e.type as string,
    title: e.name,
    description: e.summary,
    url: `/${e.type === 'tutorial' ? 'tutorials' : `${e.type}s`}/${e.slug}`,
    tags: e.tags,
  }));
  const jobItems = jobEntities.map((j) => ({
    id: `job/${j.slug}`,
    type: 'job' as const,
    title: j.name,
    description: j.summary,
    url: `/jobs/${j.slug}`,
    tags: j.tags,
  }));
  const eventItems = eventEntities.map((e) => ({
    id: `event/${e.slug}`,
    type: 'event' as const,
    title: e.name,
    description: e.summary,
    url: `/events/${e.slug}`,
    tags: e.tags,
  }));
  const newsItems = newsEntities.map((n) => ({
    id: `news/${n.slug}`,
    type: 'news' as const,
    title: n.name,
    description: n.summary,
    url: `/news/${n.slug}`,
    tags: n.tags,
  }));
  return [...baseItems, ...jobItems, ...eventItems, ...newsItems];
}

export function getAllPlaygrounds(): PlaygroundEntity[] {
  return playgrounds;
}

export function getPlaygroundBySlug(slug: string): PlaygroundEntity | undefined {
  return playgrounds.find((p) => p.slug === slug);
}

export function getAllDecisionProfiles(): DecisionProfileEntity[] {
  return decisionProfiles;
}

export function getDecisionProfileBySlug(slug: string): DecisionProfileEntity | undefined {
  return decisionProfiles.find((d) => d.slug === slug);
}

export function getAllScoringProfiles(): DecisionScoringProfileEntity[] {
  return scoringProfiles;
}

export function getScoringProfileBySlug(slug: string): DecisionScoringProfileEntity | undefined {
  return scoringProfiles.find((d) => d.slug === slug);
}
