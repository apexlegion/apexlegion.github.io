import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdjacencyList, EntityType, GraphEdge, GraphNode } from '@/lib/graph/types';
import {
  buildGraphData,
  filterByType,
  getNeighbors,
  parseNodeId,
  type GraphData,
  type PositionedNode,
} from '@/lib/graph/explorer';

export interface UseGraphLayoutOptions {
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  adjacency: AdjacencyList;
  width?: number;
  height?: number;
  /** Initial types to show. Empty array means "all". */
  initialTypes?: readonly EntityType[];
  /** Initial node id to focus. */
  initialSelectedId?: string;
}

export interface UseGraphLayoutResult {
  /** Fully-laid-out graph data for rendering. */
  graph: GraphData;
  /** Currently active type filter. */
  activeTypes: EntityType[];
  /** Set the active type filter. */
  setActiveTypes: (types: EntityType[]) => void;
  /** Search term used to highlight/focus a node. */
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  /** Currently selected node id. */
  selectedId: string | undefined;
  selectNode: (id: string | undefined) => void;
  /** Set of node ids the user has chosen to expand. */
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  /** Adjacent ids to the currently-selected node, in display order. */
  selectedNeighbors: string[];
}

/**
 * Drives the interactive state of the graph explorer: type filter,
 * search, selected node, and expanded set. The hook owns the layout so
 * the SVG component can stay presentational.
 */
export function useGraphLayout(options: UseGraphLayoutOptions): UseGraphLayoutResult {
  const {
    nodes,
    edges,
    adjacency,
    width = 800,
    height = 600,
    initialTypes = [],
    initialSelectedId,
  } = options;

  const [activeTypes, setActiveTypes] = useState<EntityType[]>(() => [...initialTypes]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Keep filter in sync with URL query params (selected, type).
  // The page passes `initialSelectedId` / `initialTypes` only on mount,
  // so this effect never overwrites user actions during a session.
  const initialApplied = useRef(false);
  useEffect(() => {
    if (initialApplied.current) return;
    initialApplied.current = true;
    if (initialSelectedId) setSelectedId(initialSelectedId);
    if (initialTypes.length > 0) setActiveTypes([...initialTypes]);
  }, [initialSelectedId, initialTypes]);

  const graph = useMemo<GraphData>(() => {
    return buildGraphData(nodes, edges, {
      width,
      height,
      includeTypes: activeTypes.length === 0 ? undefined : activeTypes,
    });
  }, [nodes, edges, width, height, activeTypes]);

  const selectNode = useCallback((id: string | undefined) => {
    setSelectedId(id);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(nodes.map((n) => n.id)));
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  // Compute visible neighbours for the selected node (used by the sidebar
  // + the expand-on-click interaction).
  const selectedNeighbors = useMemo<string[]>(() => {
    if (!selectedId) return [];
    const fromAdj = getNeighbors(adjacency, selectedId).map((e) => e.node.id);
    const fromGraph = graph.byId.get(selectedId);
    const visibleIds = new Set<string>([...graph.nodes.map((n: PositionedNode) => n.id)]);
    return fromAdj.filter((id) => visibleIds.has(id) || fromGraph !== undefined);
  }, [adjacency, selectedId, graph]);

  // Best-effort match for search — first node whose name starts with the
  // term, or whose type/slug contains it. Used to focus/select a node.
  const searchMatch = useMemo<string | undefined>(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return undefined;
    const visible = new Set(graph.nodes.map((n) => n.id));
    for (const node of nodes) {
      if (!visible.has(node.id)) continue;
      if (node.name.toLowerCase().startsWith(term)) return node.id;
    }
    for (const node of nodes) {
      if (!visible.has(node.id)) continue;
      if (node.name.toLowerCase().includes(term)) return node.id;
    }
    for (const node of nodes) {
      if (!visible.has(node.id)) continue;
      const parsed = parseNodeId(node.id);
      if (!parsed) continue;
      if (parsed.slug.includes(term) || parsed.type.includes(term)) return node.id;
    }
    return undefined;
  }, [searchTerm, nodes, graph]);

  // When search matches, auto-select the node so the sidebar reflects it.
  useEffect(() => {
    if (searchMatch) setSelectedId(searchMatch);
  }, [searchMatch]);

  return {
    graph,
    activeTypes,
    setActiveTypes,
    searchTerm,
    setSearchTerm,
    selectedId: selectedId ?? searchMatch,
    selectNode,
    expanded,
    toggleExpand,
    expandAll,
    collapseAll,
    selectedNeighbors,
  };
}

export default useGraphLayout;

// Re-export so callers don't need a second import when filtering in the
// UI without going through `buildGraphData`.
export { filterByType };
