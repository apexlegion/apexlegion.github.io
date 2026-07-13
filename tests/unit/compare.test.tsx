import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import {
  buildAttributes,
  buildComparisonSlug,
  buildMetrics,
  compareEntities,
  mergeTimeline,
  partitionTags,
} from '@/lib/compare';
import { BenchmarkChart, ComparisonTable, TimelineCompare } from '@/components/compare';
import type { Entity, ModelEntity, ProjectEntity, TimelineEvent } from '@/lib/schemas/entity';

/* ------------------------------------------------------------------------- */
/* Fixtures                                                                  */
/* ------------------------------------------------------------------------- */

const baseTimeline = (overrides: Partial<TimelineEvent> = {}): TimelineEvent => ({
  date: '2024-01-01',
  type: 'release',
  title: 'Initial release',
  description: 'First release.',
  ...overrides,
});

const projectA: ProjectEntity = {
  type: 'project',
  slug: 'alpha',
  name: 'Alpha',
  summary: 'Alpha summary',
  description: 'Alpha description',
  tags: ['rag', 'python', 'framework'],
  externalLinks: [
    { label: 'Repo', href: 'https://example.com/alpha' },
    { label: 'Docs', href: 'https://docs.example.com/alpha' },
  ],
  timeline: [
    baseTimeline({ date: '2023-01-01', title: 'Alpha v1' }),
    baseTimeline({ date: '2024-06-12', type: 'milestone', title: 'Alpha milestone' }),
  ],
  category: 'Inference',
  license: 'MIT',
  repository: 'https://github.com/example/alpha',
};

const projectB: ProjectEntity = {
  type: 'project',
  slug: 'beta',
  name: 'Beta',
  summary: 'Beta summary',
  description: 'Beta description',
  tags: ['rag', 'agents', 'framework'],
  externalLinks: [{ label: 'Repo', href: 'https://example.com/beta' }],
  timeline: [baseTimeline({ date: '2024-02-01', title: 'Beta v1' })],
  category: 'Agents',
  license: 'GPL-3.0',
  repository: 'https://github.com/example/beta',
};

const modelA: ModelEntity = {
  type: 'model',
  slug: 'llama-3',
  name: 'Llama 3',
  summary: 'Llama 3',
  description: 'Llama 3 description',
  tags: ['llm', 'open-weights'],
  externalLinks: [],
  timeline: [],
  modality: 'Text',
  parameters: '70B',
  publishedBy: 'Meta',
  license: 'Llama 3 Community License',
};

const modelB: ModelEntity = {
  type: 'model',
  slug: 'mistral-7b',
  name: 'Mistral 7B',
  summary: 'Mistral 7B',
  description: 'Mistral 7B description',
  tags: ['llm', 'mistral'],
  externalLinks: [],
  timeline: [],
  modality: 'Text',
  parameters: '7B',
  publishedBy: 'Mistral AI',
  license: 'Apache-2.0',
};

/* ------------------------------------------------------------------------- */
/* Winner logic                                                              */
/* ------------------------------------------------------------------------- */

describe('compareEntities — winner logic', () => {
  it('marks the more permissive license as the winner', () => {
    const result = compareEntities(projectA, projectB);
    const licenseRow = result.attributes.find((row) => row.id === 'license');
    expect(licenseRow).toBeDefined();
    expect(licenseRow?.valueA).toBe('MIT');
    expect(licenseRow?.valueB).toBe('GPL-3.0');
    expect(licenseRow?.winner).toBe('a');
  });

  it('marks the entity with more tags as the winner', () => {
    const richerA: ProjectEntity = {
      ...projectA,
      tags: ['rag', 'python', 'framework', 'inference'],
    };
    const result = compareEntities(richerA, projectB);
    const tagsRow = result.attributes.find((row) => row.id === 'tags');
    expect(tagsRow?.winner).toBe('a');
  });

  it('marks the entity with more timeline events as the winner', () => {
    const result = compareEntities(projectA, projectB);
    const timelineRow = result.attributes.find((row) => row.id === 'timeline');
    expect(timelineRow?.winner).toBe('a');
  });

  it('marks the entity with more external links as the winner', () => {
    const result = compareEntities(projectA, projectB);
    const linksRow = result.attributes.find((row) => row.id === 'external-links');
    expect(linksRow?.winner).toBe('a');
  });

  it('returns tie when both entities have the same metric', () => {
    const result = compareEntities(projectA, projectA);
    for (const row of result.attributes) {
      if (row.winner !== undefined) expect(row.winner).toBe('tie');
    }
  });

  it('handles model parameters — higher value wins', () => {
    const result = compareEntities(modelA, modelB);
    const paramsRow = result.attributes.find((row) => row.id === 'parameters');
    expect(paramsRow?.valueA).toBe('70');
    expect(paramsRow?.valueB).toBe('7');
    expect(paramsRow?.winner).toBe('a');
  });

  it('handles models with identical license rank as tie', () => {
    const customA: ModelEntity = { ...modelA, license: 'MIT' };
    const customB: ModelEntity = { ...modelB, license: 'MIT' };
    const result = compareEntities(customA, customB);
    const licenseRow = result.attributes.find((row) => row.id === 'license');
    expect(licenseRow?.winner).toBe('tie');
  });

  it('handles missing parameter values', () => {
    const noParamsA: ModelEntity = { ...modelA, parameters: undefined };
    const result = compareEntities(noParamsA, modelB);
    const paramsRow = result.attributes.find((row) => row.id === 'parameters');
    expect(paramsRow?.valueA).toBe('—');
    expect(paramsRow?.winner).toBe('b');
  });

  it('builds a stable set of attributes for projects', () => {
    const attrs = buildAttributes(projectA, projectB);
    const ids = attrs.map((a) => a.id);
    expect(ids).toEqual([
      'category',
      'license',
      'repository',
      'tags',
      'external-links',
      'timeline',
    ]);
  });

  it('builds a stable set of attributes for models', () => {
    const attrs = buildAttributes(modelA, modelB);
    const ids = attrs.map((a) => a.id);
    expect(ids).toContain('modality');
    expect(ids).toContain('parameters');
    expect(ids).toContain('publisher');
    expect(ids).toContain('license');
    expect(ids).toContain('tags');
  });
});

describe('compareEntities — tag partitioning', () => {
  it('returns shared tags and per-side-only tags', () => {
    const result = compareEntities(projectA, projectB);
    expect(result.sharedTags).toEqual(expect.arrayContaining(['rag', 'framework']));
    expect(result.sharedTags).not.toContain('python');
    expect(result.sharedTags).not.toContain('agents');
    expect(result.onlyA).toEqual(['python']);
    expect(result.onlyB).toEqual(['agents']);
  });

  it('partitionTags returns sorted outputs', () => {
    const result = partitionTags(projectA, projectB);
    expect(result.sharedTags).toEqual([...result.sharedTags].sort());
    expect(result.onlyA).toEqual([...result.onlyA].sort());
    expect(result.onlyB).toEqual([...result.onlyB].sort());
  });
});

describe('compareEntities — metrics', () => {
  it('produces comparable numeric metrics for BenchmarkChart', () => {
    const metrics = buildMetrics(projectA, projectB, 3, 1);
    expect(metrics.length).toBeGreaterThan(0);
    for (const m of metrics) {
      expect(typeof m.valueA).toBe('number');
      expect(typeof m.valueB).toBe('number');
      expect(['a', 'b', 'tie']).toContain(m.winner);
    }
    const tagsMetric = metrics.find((m) => m.id === 'tags');
    expect(tagsMetric?.valueA).toBe(3);
    expect(tagsMetric?.valueB).toBe(3);
    expect(tagsMetric?.winner).toBe('tie');
    const timelineMetric = metrics.find((m) => m.id === 'timeline');
    expect(timelineMetric?.valueA).toBe(2);
    expect(timelineMetric?.valueB).toBe(1);
    expect(timelineMetric?.winner).toBe('a');
  });
});

describe('buildComparisonSlug', () => {
  it('sorts slug order so canonical URLs are stable', () => {
    expect(buildComparisonSlug('ollama', 'llama-cpp')).toBe('llama-cpp-vs-ollama');
    expect(buildComparisonSlug('llama-cpp', 'ollama')).toBe('llama-cpp-vs-ollama');
  });
});

/* ------------------------------------------------------------------------- */
/* Component rendering                                                       */
/* ------------------------------------------------------------------------- */

describe('ComparisonTable', () => {
  it('renders both entity names and all attribute rows', () => {
    render(<ComparisonTable entityA={projectA} entityB={projectB} />);
    // Both names appear as column headers
    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBe(3);
    expect(within(headers[1] as HTMLElement).getByText('Alpha')).toBeInTheDocument();
    expect(within(headers[2] as HTMLElement).getByText('Beta')).toBeInTheDocument();

    // Attribute labels appear
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('highlights shared tags with active state', () => {
    const { container } = render(<ComparisonTable entityA={projectA} entityB={projectB} />);
    // Shared tags ("rag", "framework") render as active Tag spans, marked with
    // data-active="true". (Tags are non-interactive labels, not buttons.)
    const activeTags = container.querySelectorAll('[data-active="true"]');
    expect(activeTags.length).toBeGreaterThan(0);
    const activeText = Array.from(activeTags)
      .map((el) => el.textContent ?? '')
      .join(' ');
    expect(activeText).toMatch(/rag|framework/i);
  });

  it('renders a Winner badge for the winning attribute', () => {
    render(<ComparisonTable entityA={projectA} entityB={projectB} />);
    // Project A has the more permissive license → there should be a "Winner" badge.
    expect(screen.getAllByText(/winner/i).length).toBeGreaterThan(0);
  });
});

describe('BenchmarkChart', () => {
  it('renders an SVG with bar rects for each metric', () => {
    const { container } = render(
      <BenchmarkChart entityA={projectA} entityB={projectB} relationsA={2} relationsB={1} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    const rects = container.querySelectorAll('svg rect');
    // 4 metrics × (2 bars + 1 track) = 12 rects, plus 2 legend swatches = 14.
    expect(rects.length).toBeGreaterThanOrEqual(12);
    expect(screen.getByRole('img', { name: /bar chart/i })).toBeInTheDocument();
  });

  it('renders a figure caption with the comparison title', () => {
    render(<BenchmarkChart entityA={projectA} entityB={projectB} />);
    const figcaption = document.querySelector('figcaption');
    expect(figcaption).not.toBeNull();
    expect(figcaption?.textContent ?? '').toMatch(/metric comparison/i);
  });
});

describe('TimelineCompare', () => {
  it('merges events from both entities and tags the source', () => {
    const merged = mergeTimeline(projectA, projectB);
    // 2 + 1 = 3 events, sorted ascending by date.
    expect(merged.length).toBe(3);
    expect(merged[0]?.date).toBe('2023-01-01');
    expect(merged[2]?.date).toBe('2024-06-12');

    render(<TimelineCompare entityA={projectA} entityB={projectB} />);
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(3);
    expect(items[0]?.getAttribute('data-source')).toBe('a');
    expect(items[2]?.getAttribute('data-source')).toBe('a');

    // Each row surfaces the source entity name
    const sourceLabels = screen.getAllByText('Alpha');
    expect(sourceLabels.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Beta').length).toBeGreaterThan(0);
  });

  it('shows an empty state when neither entity has timeline events', () => {
    const emptyA: Entity = {
      ...projectA,
      timeline: [],
    };
    const emptyB: Entity = {
      ...projectB,
      timeline: [],
    };
    render(<TimelineCompare entityA={emptyA} entityB={emptyB} />);
    expect(
      screen.getByText(/neither alpha nor beta has any recorded timeline events/i),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------------- */
/* Imports sanity check                                                      */
/* ------------------------------------------------------------------------- */

describe('compare module exports', () => {
  it('keeps helper exports stable', () => {
    // Ensures the named exports stay available for downstream consumers.
    expect(typeof buildAttributes).toBe('function');
    expect(typeof buildMetrics).toBe('function');
    expect(typeof compareEntities).toBe('function');
    expect(typeof mergeTimeline).toBe('function');
    expect(typeof partitionTags).toBe('function');
    expect(typeof buildComparisonSlug).toBe('function');
  });
});
