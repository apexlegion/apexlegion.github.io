/**
 * Graph build utilities.
 *
 * Phase 1 Milestone 3 works from hardcoded seed data. The helpers in this
 * module turn a flat list of nodes and edges into adjacency structures that
 * the rest of the site (MiniGraph, related-entity widgets, future graph
 * explorer) can query in O(1).
 *
 * The helpers are pure functions with no I/O so they can be exercised
 * directly from unit tests.
 */

import type { AdjacencyEntry, AdjacencyList, GraphEdge, GraphNode } from './types';

export function buildNodeIndex(nodes: readonly GraphNode[]): Map<string, GraphNode> {
  const index = new Map<string, GraphNode>();
  for (const node of nodes) {
    if (index.has(node.id)) {
      // Last write wins, but we log a warning so seed data issues are
      // surfaced during development.
      console.warn(`[graph] duplicate node id: ${node.id}`);
    }
    index.set(node.id, node);
  }
  return index;
}

export function buildAdjacencyList(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): AdjacencyList {
  const lookup = buildNodeIndex(nodes);
  const adj: AdjacencyList = new Map();

  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    const target = lookup.get(edge.target);
    if (!target) {
      console.warn(`[graph] edge target not found: ${edge.source} -> ${edge.target}`);
      continue;
    }
    const list = adj.get(edge.source);
    if (!list) {
      console.warn(`[graph] edge source not found: ${edge.source} -> ${edge.target}`);
      continue;
    }
    const entry: AdjacencyEntry = { edge, node: target };
    list.push(entry);
  }

  return adj;
}

export function buildReverseAdjacencyList(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): AdjacencyList {
  const lookup = buildNodeIndex(nodes);
  const reverse: AdjacencyList = new Map();

  for (const node of nodes) {
    reverse.set(node.id, []);
  }

  for (const edge of edges) {
    const source = lookup.get(edge.source);
    if (!source) continue;
    const list = reverse.get(edge.target);
    if (!list) continue;
    list.push({ edge, node: source });
  }

  return reverse;
}

export function getNeighbors(list: AdjacencyList, nodeId: string): AdjacencyEntry[] {
  return list.get(nodeId) ?? [];
}

export function getRelatedNodes(list: AdjacencyList, nodeId: string): GraphNode[] {
  return getNeighbors(list, nodeId).map((entry) => entry.node);
}

export function mergeAdjacency(a: AdjacencyList, b: AdjacencyList): AdjacencyList {
  const merged: AdjacencyList = new Map();
  const ids = new Set<string>([...a.keys(), ...b.keys()]);
  for (const id of ids) {
    merged.set(id, [...(a.get(id) ?? []), ...(b.get(id) ?? [])]);
  }
  return merged;
}
