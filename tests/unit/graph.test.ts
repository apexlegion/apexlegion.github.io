import { describe, expect, it } from 'vitest';
import {
  buildAdjacencyList,
  buildReverseAdjacencyList,
  getNeighbors,
  mergeAdjacency,
} from '@/lib/graph/build';
import type { GraphEdge, GraphNode } from '@/lib/graph/types';

const nodes: GraphNode[] = [
  { id: 'project/llama-cpp', type: 'project', name: 'llama.cpp', slug: 'llama-cpp' },
  { id: 'project/ollama', type: 'project', name: 'Ollama', slug: 'ollama' },
  { id: 'model/llama-3', type: 'model', name: 'Llama 3', slug: 'llama-3' },
];

const edges: GraphEdge[] = [
  { source: 'project/ollama', target: 'project/llama-cpp', type: 'dependsOn', weight: 0.9 },
  { source: 'project/llama-cpp', target: 'model/llama-3', type: 'implements' },
];

describe('buildAdjacencyList', () => {
  it('indexes outgoing edges by source id', () => {
    const adj = buildAdjacencyList(nodes, edges);
    expect(adj.size).toBe(nodes.length);
    const ollama = getNeighbors(adj, 'project/ollama');
    expect(ollama).toHaveLength(1);
    expect(ollama[0]?.node.id).toBe('project/llama-cpp');
    expect(ollama[0]?.edge.type).toBe('dependsOn');
  });

  it('returns an empty list for nodes with no outgoing edges', () => {
    const adj = buildAdjacencyList(nodes, edges);
    expect(getNeighbors(adj, 'model/llama-3')).toEqual([]);
  });

  it('skips edges whose target is missing and warns', () => {
    const adj = buildAdjacencyList(nodes, [
      { source: 'project/llama-cpp', target: 'model/does-not-exist', type: 'implements' },
    ]);
    expect(getNeighbors(adj, 'project/llama-cpp')).toEqual([]);
  });

  it('buildReverseAdjacencyList mirrors the graph', () => {
    const fwd = buildAdjacencyList(nodes, edges);
    const rev = buildReverseAdjacencyList(nodes, edges);
    const incoming = getNeighbors(rev, 'project/llama-cpp');
    expect(incoming.map((e) => e.node.id)).toEqual(['project/ollama']);
    expect(getNeighbors(fwd, 'project/ollama').map((e) => e.node.id)).toEqual([
      'project/llama-cpp',
    ]);
  });

  it('mergeAdjacency concatenates outgoing edges', () => {
    const a = buildAdjacencyList(nodes, [edges[0]!]);
    const b = buildAdjacencyList(nodes, [edges[1]!]);
    const merged = mergeAdjacency(a, b);
    expect(getNeighbors(merged, 'project/ollama')).toHaveLength(1);
    expect(getNeighbors(merged, 'project/llama-cpp')).toHaveLength(1);
  });
});
