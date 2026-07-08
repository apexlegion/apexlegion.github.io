/**
 * Knowledge graph type definitions.
 *
 * The graph is intentionally simple for Phase 1 Milestone 3: nodes are
 * identified by `{type}/{slug}` and edges connect two nodes with a typed
 * relationship and an optional weight. Richer properties (confidence,
 * source, since, notes) can be added later without breaking existing
 * consumers.
 */

export type EntityType =
  | 'project'
  | 'model'
  | 'concept'
  | 'tutorial'
  | 'paper'
  | 'benchmark'
  | 'hardware'
  | 'company'
  | 'license'
  | 'framework'
  | 'dataset';

export interface GraphNode {
  /** Globally unique node id in the form `{type}/{slug}`. */
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  /** Optional URL for the entity detail page, if it exists in the site. */
  href?: string;
  /** Optional short description used for tooltips and cards. */
  summary?: string;
}

export type EdgeType =
  | 'implements'
  | 'introduced'
  | 'dependsOn'
  | 'usesFramework'
  | 'trainsOn'
  | 'evaluatesOn'
  | 'supersedes'
  | 'similarTo'
  | 'requiresHardware'
  | 'licensedUnder'
  | 'teaches'
  | 'prerequisiteOf'
  | 'leadsTo'
  | 'partOf'
  | 'authoredBy'
  | 'publishedBy'
  | 'mentions'
  | 'compatibleWith';

export interface GraphEdge {
  /** Source node id (`{type}/{slug}`). */
  source: string;
  /** Target node id (`{type}/{slug}`). */
  target: string;
  type: EdgeType;
  /** Relationship strength from 0.0 to 1.0. Optional. */
  weight?: number;
}

export interface AdjacencyEntry {
  edge: GraphEdge;
  node: GraphNode;
}

/** Map from node id to outgoing edges (and the node on the other end). */
export type AdjacencyList = Map<string, AdjacencyEntry[]>;
