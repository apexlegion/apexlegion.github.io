import { describe, expect, it } from 'vitest';
import {
  EntitySchema,
  RelationSchema,
  JobSchema,
  EventSchema,
  NewsSchema,
} from '@/lib/schemas/entity';
import projects from '@/data/seed/projects.json';
import models from '@/data/seed/models.json';
import concepts from '@/data/seed/concepts.json';
import tutorials from '@/data/seed/tutorials.json';
import relations from '@/data/seed/relations.json';
import jobs from '@/data/seed/jobs.json';
import events from '@/data/seed/events.json';
import news from '@/data/seed/news.json';

describe('seed entity schemas', () => {
  it('validates every project against ProjectSchema', () => {
    for (const p of projects) {
      expect(() => EntitySchema.parse(p)).not.toThrow();
    }
  });

  it('validates every model against ModelSchema', () => {
    for (const m of models) {
      expect(() => EntitySchema.parse(m)).not.toThrow();
    }
  });

  it('validates every concept against ConceptSchema', () => {
    for (const c of concepts) {
      expect(() => EntitySchema.parse(c)).not.toThrow();
    }
  });

  it('validates every tutorial against TutorialSchema', () => {
    for (const t of tutorials) {
      expect(() => EntitySchema.parse(t)).not.toThrow();
    }
  });

  it('rejects an entity missing required fields', () => {
    expect(() => EntitySchema.parse({ type: 'project', slug: 'x' })).toThrow();
  });

  it('rejects a project with an invalid slug', () => {
    expect(() =>
      EntitySchema.parse({
        type: 'project',
        slug: 'Bad Slug!',
        name: 'X',
        summary: 's',
        description: 'd',
        category: 'c',
      }),
    ).toThrow();
  });
});

describe('relation schema', () => {
  it('validates every relation against RelationSchema', () => {
    for (const r of relations) {
      expect(() => RelationSchema.parse(r)).not.toThrow();
    }
  });

  it('rejects a relation with an out-of-range weight', () => {
    expect(() =>
      RelationSchema.parse({
        source: 'project/x',
        target: 'project/y',
        type: 'dependsOn',
        weight: 1.5,
      }),
    ).toThrow();
  });

  it('rejects a relation whose source is not a typed slug', () => {
    expect(() =>
      RelationSchema.parse({ source: 'not-typed', target: 'project/y', type: 'dependsOn' }),
    ).toThrow();
  });
});

describe('phase 2 content schemas (jobs, events, news)', () => {
  it('validates every job against JobSchema', () => {
    for (const j of jobs) {
      expect(() => JobSchema.parse(j)).not.toThrow();
    }
  });

  it('validates every event against EventSchema', () => {
    for (const e of events) {
      expect(() => EventSchema.parse(e)).not.toThrow();
    }
  });

  it('validates every news item against NewsSchema', () => {
    for (const n of news) {
      expect(() => NewsSchema.parse(n)).not.toThrow();
    }
  });

  it('rejects a job with an invalid jobType', () => {
    expect(() =>
      JobSchema.parse({
        type: 'job',
        slug: 'test-job',
        name: 'Test Job',
        company: 'Acme',
        location: 'Remote',
        jobType: 'freelance',
        summary: 's',
        description: 'd',
        postedAt: '2026-01-01',
        expiryAt: '2026-12-31',
      }),
    ).toThrow();
  });

  it('rejects an event with an invalid format', () => {
    expect(() =>
      EventSchema.parse({
        type: 'event',
        slug: 'test-event',
        name: 'Test Event',
        location: 'Online',
        format: 'webinar',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        summary: 's',
        description: 'd',
      }),
    ).toThrow();
  });
});
