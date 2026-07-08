import { describe, expect, it } from 'vitest';
import {
  getAllNodes,
  getAllRelations,
  getEntitiesByType,
  getSearchIndexItems,
} from '@/lib/data/entities';

describe('API endpoint data helpers', () => {
  it('returns an array of project entities', () => {
    const projects = getEntitiesByType('project');
    expect(Array.isArray(projects)).toBe(true);
  });

  it('returns an array of model entities', () => {
    const models = getEntitiesByType('model');
    expect(Array.isArray(models)).toBe(true);
  });

  it('returns an array of concept entities', () => {
    const concepts = getEntitiesByType('concept');
    expect(Array.isArray(concepts)).toBe(true);
  });

  it('returns an array of tutorial entities', () => {
    const tutorials = getEntitiesByType('tutorial');
    expect(Array.isArray(tutorials)).toBe(true);
  });

  it('returns graph nodes as an array', () => {
    expect(Array.isArray(getAllNodes())).toBe(true);
  });

  it('returns graph relations as an array', () => {
    expect(Array.isArray(getAllRelations())).toBe(true);
  });

  it('returns search index items as an array', () => {
    expect(Array.isArray(getSearchIndexItems())).toBe(true);
  });
});
