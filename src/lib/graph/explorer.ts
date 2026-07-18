/**
 * Knowledge graph explorer helpers.
 *
 * Phase 2 Chunk 2 builds on top of `@/lib/graph/build` (Phase 1) to add the
 * data shapes the full-page explorer needs:
 *
 *  - {@link GraphData}        — nodes + links with layout coordinates.
 *  - {@link buildGraphData}   — assemble a `GraphData` from raw entities
 *                                and relations and compute a deterministic
 *                                circular layout per type.
 *  - {@link filterByType}     — restrict nodes to a set of entity types.
 *  - {@link getNeighbors}     — outgoing neighbours from an adjacency list.
 *  - {@link getAllNeighbors}  — outgoing + incoming neighbours.
 *  - {@link expandNode}       — return the node ids to reveal when a node
 *                                is expanded.
 *
 * The helpers are pure functions, so they can be exercised directly from
 * Vitest without any DOM or React setup.
 */

import type {
  AdjacencyEntry,
  AdjacencyList,
  EdgeType,
  EntityType,
  GraphEdge,
  GraphNode,
} from './types';

/** Node enriched with 2D layout coordinates for the SVG explorer. */
export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

/** Edge enriched with endpoints that already know their coordinates. */
export interface PositionedLink {
  source: string;
  target: string;
  type: EdgeType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GraphData {
  nodes: PositionedNode[];
  links: PositionedLink[];
  /** Lookup map from node id to its positioned record. */
  byId: Map<string, PositionedNode>;
  /** Bounds helper for viewport calculations (min/max x and y). */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

/** Options accepted by {@link buildGraphData}. */
export interface BuildGraphDataOptions {
  /** Canvas width used for the circular layout. Defaults to 800. */
  width?: number;
  /** Canvas height used for the circular layout. Defaults to 600. */
  height?: number;
  /** Optional set of types to include. Empty/undefined = include all. */
  includeTypes?: readonly EntityType[];
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

/** Default type palette — keeps colour consistent across components. */
export const TYPE_FILL: Record<EntityType, string> = {
  project: 'fill-primary-orange/40 stroke-primary-orange',
  model: 'fill-info/40 stroke-info',
  concept: 'fill-accent-orange/40 stroke-accent-orange',
  tutorial: 'fill-success/40 stroke-success',
  paper: 'fill-warning/40 stroke-warning',
  benchmark: 'fill-danger/40 stroke-danger',
  hardware: 'fill-surface-elevated stroke-border-strong',
  company: 'fill-surface-elevated stroke-border-strong',
  license: 'fill-surface-elevated stroke-border-strong',
  framework: 'fill-surface-elevated stroke-border-strong',
  dataset: 'fill-surface-elevated stroke-border-strong',
};

/** Human-readable labels for type chips in the explorer filter row. */
export const TYPE_LABEL: Record<EntityType, string> = {
  project: 'Projects',
  model: 'Models',
  concept: 'Concepts',
  tutorial: 'Tutorials',
  paper: 'Papers',
  benchmark: 'Benchmarks',
  hardware: 'Hardware',
  company: 'Companies',
  license: 'Licenses',
  framework: 'Frameworks',
  dataset: 'Datasets',
};

/**
 * Return only nodes whose `type` is in `types`. When `types` is undefined
 * or empty the original list is returned unchanged (so callers can pass an
 * empty selection as "show everything").
 */
export function filterByType(
  nodes: readonly GraphNode[],
  types: readonly EntityType[] | undefined,
): GraphNode[] {
  if (!types || types.length === 0) return [...nodes];
  const allowed = new Set<EntityType>(types);
  return nodes.filter((node) => allowed.has(node.type));
}

/**
 * Outgoing neighbours of `nodeId` according to the adjacency list.
 * The list is shallow-copied so callers can safely mutate it.
 */
export function getNeighbors(list: AdjacencyList, nodeId: string): AdjacencyEntry[] {
  const entry = list.get(nodeId);
  if (!entry) return [];
  return [...entry];
}

/**
 * Return all neighbours — outgoing plus incoming — for a node. The
 * incoming list is computed from the forward adjacency by scanning every
 * entry's `node.id`, which is fine for the seed data sizes Phase 2 ships
 * with (a few dozen entities).
 */
export function getAllNeighbors(list: AdjacencyList, nodeId: string): AdjacencyEntry[] {
  const outgoing = getNeighbors(list, nodeId);
  const incoming: AdjacencyEntry[] = [];
  for (const [sourceId, entries] of list.entries()) {
    if (sourceId === nodeId) continue;
    for (const entry of entries) {
      if (entry.node.id === nodeId) {
        // Reconstruct a reversed entry — swap the source label so
        // consumers can tell which direction the edge came from.
        incoming.push({
          edge: { ...entry.edge, source: entry.node.id, target: sourceId },
          node: list.has(sourceId)
            ? ({ id: sourceId, type: 'project', name: sourceId, slug: sourceId } as GraphNode)
            : entry.node,
        });
      }
    }
  }
  return [...outgoing, ...incoming];
}

/**
 * Return the set of node ids that should be revealed when a node is
 * expanded. Expansion includes direct neighbours only — callers can call
 * this repeatedly to walk the graph step by step.
 */
export function expandNode(
  list: AdjacencyList,
  nodeId: string,
): { ids: string[]; entries: AdjacencyEntry[] } {
  const entries = getNeighbors(list, nodeId);
  return {
    entries,
    ids: entries.map((entry) => entry.node.id),
  };
}

/** Minimum arc distance (px) between two adjacent nodes on the same ring. */
const MIN_NODE_ARC = 74;
/** Minimum radial gap (px) between two concentric rings. */
const RING_GAP = 104;
/** Radius (px) of the innermost ring's baseline. */
const INNER_RADIUS = 70;

/**
 * Build a deterministic per-type circular layout. Each entity type gets its
 * own concentric ring, ordered so the least-populated types sit on the inner
 * rings and the most-populated on the outer rings. Crucially, each ring's
 * radius is sized so its nodes keep at least {@link MIN_NODE_ARC} px of arc
 * between them — otherwise a type with many members (e.g. ~49 projects) would
 * pile up on a small ring and overlap into an unreadable clump. The SVG
 * viewBox in the explorer auto-fits the resulting bounds, so larger rings
 * just scale the whole graph to fit rather than overflowing.
 *
 * No physics simulation — a stable analytic layout keeps SSR and client
 * markup byte-identical (see the rounding note below).
 */
function layoutNodes(
  nodes: readonly GraphNode[],
  width: number,
  height: number,
): Map<string, PositionedNode> {
  const cx = width / 2;
  const cy = height / 2;
  const byType = new Map<EntityType, GraphNode[]>();
  for (const node of nodes) {
    const list = byType.get(node.type) ?? [];
    list.push(node);
    byType.set(node.type, list);
  }

  // Deterministic tiebreak order for types with equal node counts, so the
  // layout never depends on Map insertion / sort stability quirks.
  const ringOrder: EntityType[] = [
    'project',
    'model',
    'concept',
    'tutorial',
    'paper',
    'benchmark',
    'hardware',
    'framework',
    'dataset',
    'company',
    'license',
  ];
  const rank = (t: EntityType): number => {
    const i = ringOrder.indexOf(t);
    return i === -1 ? ringOrder.length : i;
  };

  // Fewest-populated ring innermost → most-populated outermost. This gives the
  // crowded rings the largest circumference, which is exactly what they need.
  const orderedTypes = [...byType.keys()].sort((a, b) => {
    const diff = (byType.get(a)?.length ?? 0) - (byType.get(b)?.length ?? 0);
    return diff !== 0 ? diff : rank(a) - rank(b);
  });

  const positioned = new Map<string, PositionedNode>();
  const single =
    orderedTypes.length <= 1 &&
    (byType.get(orderedTypes[0] ?? ('' as EntityType))?.length ?? 0) <= 1;

  let radius = 0;
  orderedTypes.forEach((type, ringIdx) => {
    const list = (byType.get(type) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
    const count = list.length;
    // Radius this ring needs so `count` nodes each get MIN_NODE_ARC of arc.
    const radiusForSpacing = count <= 1 ? 0 : (count * MIN_NODE_ARC) / (2 * Math.PI);
    // Grow monotonically outward and never crowd the previous ring.
    radius = Math.max(radius + RING_GAP, radiusForSpacing, INNER_RADIUS + ringIdx * RING_GAP);

    list.forEach((node, idx) => {
      const angle = count === 0 ? 0 : (2 * Math.PI * idx) / count - Math.PI / 2;
      // Math.cos/Math.sin can differ by a single ULP between Node's V8 (SSR)
      // and the browser's V8 (hydration), which React treats as a hydration
      // mismatch. Rounding to a stable precision keeps the SSR and client
      // markup byte-identical; sub-hundredth-pixel differences are invisible.
      const x = single ? cx : Math.round((cx + radius * Math.cos(angle)) * 100) / 100;
      const y = single ? cy : Math.round((cy + radius * Math.sin(angle)) * 100) / 100;
      positioned.set(node.id, { ...node, x, y });
    });
  });

  return positioned;
}

/**
 * Assemble a `GraphData` record from raw entities + relations. The
 * function applies the type filter (if any), drops relations whose
 * endpoints are no longer in scope, and computes a deterministic layout.
 */
export function buildGraphData(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  options: BuildGraphDataOptions = {},
): GraphData {
  const { width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, includeTypes } = options;
  const filteredNodes = filterByType(nodes, includeTypes);
  const scoped = new Set(filteredNodes.map((n) => n.id));

  const filteredEdges = edges.filter((edge) => scoped.has(edge.source) && scoped.has(edge.target));

  const positioned = layoutNodes(filteredNodes, width, height);

  const links: PositionedLink[] = [];
  for (const edge of filteredEdges) {
    const source = positioned.get(edge.source);
    const target = positioned.get(edge.target);
    if (!source || !target) continue;
    links.push({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y,
    });
  }

  const bounds = filteredNodes.reduce(
    (acc, node) => {
      const pos = positioned.get(node.id);
      if (!pos) return acc;
      return {
        minX: Math.min(acc.minX, pos.x),
        maxX: Math.max(acc.maxX, pos.x),
        minY: Math.min(acc.minY, pos.y),
        maxY: Math.max(acc.maxY, pos.y),
      };
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );

  return {
    nodes: filteredNodes
      .map((n) => positioned.get(n.id))
      .filter((n): n is PositionedNode => n !== undefined),
    links,
    byId: positioned,
    bounds: Number.isFinite(bounds.minX) ? bounds : { minX: 0, maxX: width, minY: 0, maxY: height },
  };
}

/**
 * Convenience helper: parse a node id like `project/llama-cpp` into
 * `{ type, slug }`. Returns `undefined` for malformed ids.
 */
export function parseNodeId(id: string): { type: EntityType; slug: string } | undefined {
  const idx = id.indexOf('/');
  if (idx <= 0 || idx === id.length - 1) return undefined;
  const type = id.slice(0, idx) as EntityType;
  const slug = id.slice(idx + 1);
  if (!slug) return undefined;
  return { type, slug };
}
