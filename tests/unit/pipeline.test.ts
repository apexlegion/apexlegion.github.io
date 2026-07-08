import { describe, expect, it } from 'vitest';
import {
  buildRelationIndex,
  buildSlugIndex,
  buildTypeIndex,
} from '@/../scripts/pipeline/generateIndexes';
import { computeProjectHealth, enrich, inferModelSimilarities } from '@/../scripts/pipeline/enrich';
import { filterExpired } from '@/../scripts/pipeline/expiry';
import { validateEntitiesAndRelations } from '@/../scripts/pipeline/validate';
import type { Entity, ModelEntity, ProjectEntity, Relation } from '@/../scripts/lib/types';

const baseProject: ProjectEntity = {
  type: 'project',
  slug: 'example-project',
  name: 'Example Project',
  summary: 'A short summary.',
  description: 'A longer description that explains what Example Project does.',
  tags: ['demo'],
  externalLinks: [{ label: 'GitHub repository', href: 'https://github.com/x/y' }],
  timeline: [
    {
      date: '2024-01-01',
      type: 'release',
      title: 'Initial release',
      description: 'First public version.',
    },
  ],
  category: 'Frameworks',
  repository: 'https://github.com/x/y',
  license: 'MIT',
};

const baseModel: ModelEntity = {
  type: 'model',
  slug: 'example-7b',
  name: 'Example 7B',
  summary: 'A 7B example model.',
  description: 'A 7B example model used in pipeline tests.',
  tags: ['llm'],
  externalLinks: [{ label: 'Model card', href: 'https://huggingface.co/x/example-7b' }],
  timeline: [
    {
      date: '2024-01-01',
      type: 'release',
      title: 'Initial release',
      description: 'First public version.',
    },
  ],
  modality: 'Text',
  parameters: '7B',
  publishedBy: 'Example',
};

describe('validateEntitiesAndRelations', () => {
  it('passes for valid entities and relations', async () => {
    const report = await validateEntitiesAndRelations(
      [baseProject, baseModel],
      [{ source: 'project/example-project', target: 'model/example-7b', type: 'usesFramework' }],
    );
    expect(report.passed).toBe(true);
    expect(report.entitiesInvalid).toEqual([]);
    expect(report.relationsInvalid).toEqual([]);
    expect(report.entityCounts.project).toBe(1);
    expect(report.entityCounts.model).toBe(1);
    expect(report.relationCount).toBe(1);
  });

  it('flags an entity with an invalid slug', async () => {
    const bad = { ...baseProject, slug: 'Bad-Slug' };
    const report = await validateEntitiesAndRelations([bad as Entity], []);
    expect(report.passed).toBe(false);
    expect(report.entitiesInvalid).toHaveLength(1);
    expect(report.entitiesInvalid[0]?.id).toBe('project/Bad-Slug');
  });

  it('flags a relation whose weight is out of range', async () => {
    const report = await validateEntitiesAndRelations(
      [],
      [{ source: 'project/x', target: 'model/y', type: 'usesFramework', weight: 2.5 }],
    );
    expect(report.passed).toBe(false);
    expect(report.relationsInvalid).toHaveLength(1);
  });
});

describe('enrich', () => {
  it('attaches a health score to projects and infers similarities across model families', () => {
    const llamaSmall: ModelEntity = { ...baseModel, slug: 'llama-3-8b', name: 'Llama 3 8B' };
    const llamaLarge: ModelEntity = { ...baseModel, slug: 'llama-3-70b', name: 'Llama 3 70B' };
    const result = enrich([baseProject, llamaSmall, llamaLarge]);
    expect(result.entities).toHaveLength(3);
    const enrichedProject = result.entities.find((e) => e.type === 'project');
    expect(enrichedProject).toBeDefined();
    expect(
      (enrichedProject as ProjectEntity & { health?: { total: number } }).health?.total,
    ).toBeGreaterThanOrEqual(0);
    // llama-3-8b and llama-3-70b share the family "llama-3"
    expect(result.relations).toHaveLength(1);
    const relation = result.relations[0];
    expect(relation?.type).toBe('similarTo');
    expect(relation?.source).toBe('model/llama-3-8b');
    expect(relation?.target).toBe('model/llama-3-70b');
  });

  it('does not infer similarities for models in different families', () => {
    const llama: ModelEntity = { ...baseModel, slug: 'llama-3-8b', name: 'Llama 3 8B' };
    const mistral: ModelEntity = { ...baseModel, slug: 'mistral-7b', name: 'Mistral 7B' };
    const result = enrich([llama, mistral]);
    expect(result.relations).toEqual([]);
  });

  it('computeProjectHealth returns a breakdown bounded between 0 and 1', () => {
    const recent = computeProjectHealth({
      ...baseProject,
      // The cast simulates raw GitHub data carried through `extra`.
      ...({
        extra: {
          stargazers_count: 100000,
          forks_count: 20000,
          pushed_at: new Date().toISOString(),
        },
      } as Record<string, unknown>),
    });
    expect(recent.total).toBeGreaterThan(0);
    expect(recent.total).toBeLessThanOrEqual(1);
    expect(recent.popularity).toBeGreaterThan(0);
    expect(recent.recentCommit).toBe(1);
    expect(recent.license).toBe(1);
  });

  it('inferModelSimilarities returns empty for a single model', () => {
    const llama: ModelEntity = { ...baseModel, slug: 'llama-3-8b' };
    expect(inferModelSimilarities([llama])).toEqual([]);
  });
});

describe('filterExpired', () => {
  it('keeps items with no expiry and drops items whose expiryAt is in the past', () => {
    const items = [
      { slug: 'fresh', expiryAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
      { slug: 'stale', expiryAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { slug: 'forever' },
    ];
    const kept = filterExpired(items);
    expect(kept.map((i) => i.slug).sort()).toEqual(['forever', 'fresh']);
  });
});

describe('index generation', () => {
  it('buildSlugIndex indexes every entity by slug with typed id', () => {
    const index = buildSlugIndex([baseProject, baseModel]);
    expect(Object.keys(index.entries)).toEqual(['example-project', 'example-7b']);
    expect(index.entries['example-project']?.typedId).toBe('project/example-project');
    expect(index.entries['example-project']?.type).toBe('project');
    expect(index.entries['example-7b']?.type).toBe('model');
  });

  it('buildTypeIndex groups entities by type and sorts items', () => {
    const project2: ProjectEntity = { ...baseProject, slug: 'another', name: 'Another' };
    const index = buildTypeIndex([baseProject, project2, baseModel]);
    expect(index.counts.project).toBe(2);
    expect(index.counts.model).toBe(1);
    expect(index.items.project).toEqual(['project/another', 'project/example-project']);
    expect(index.items.model).toEqual(['model/example-7b']);
  });

  it('buildRelationIndex coalesces duplicate (source, type) targets', () => {
    const relations: Relation[] = [
      { source: 'project/a', target: 'model/b', type: 'usesFramework' },
      { source: 'project/a', target: 'model/c', type: 'usesFramework' },
      { source: 'project/a', target: 'model/d', type: 'dependsOn' },
      { source: 'project/x', target: 'project/a', type: 'usesFramework' },
    ];
    const index = buildRelationIndex(relations);
    const outgoing = index.outgoing['project/a'];
    expect(outgoing).toBeDefined();
    const uses = outgoing?.find((e) => e.type === 'usesFramework');
    expect(uses?.targets).toEqual(['model/b', 'model/c']);
    const incoming = index.incoming['project/a'];
    expect(incoming?.[0]?.targets).toContain('project/x');
  });

  it('buildRelationIndex handles an empty relation set', () => {
    const index = buildRelationIndex([]);
    expect(index.outgoing).toEqual({});
    expect(index.incoming).toEqual({});
  });
});
