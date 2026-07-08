import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdjacencyList, EntityType, GraphEdge, GraphNode } from '@/lib/graph/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib';
import { TYPE_FILL, TYPE_LABEL, expandNode, type GraphData } from '@/lib/graph/explorer';
import { GraphNodeDetail } from './GraphNodeDetail';
import { useGraphLayout } from './useGraphLayout';

export interface GraphExplorerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  adjacency: AdjacencyList;
  reverseAdjacency?: AdjacencyList;
  width?: number;
  height?: number;
  /** Optional list of entity types to surface in the filter chips. */
  availableTypes?: readonly EntityType[];
  /** Initial types to enable. Empty means "show all". */
  initialTypes?: readonly EntityType[];
  /** Initial node id to focus on mount. */
  initialSelectedId?: string;
  className?: string;
}

const DEFAULT_TYPES: EntityType[] = [
  'project',
  'model',
  'concept',
  'tutorial',
  'paper',
  'benchmark',
];

/**
 * Full-page interactive knowledge graph explorer. Renders every entity
 * in the seed graph, supports type filtering, search-to-focus, click-to-
 * select, and expand/collapse neighbours. View state is mirrored to the
 * URL via query params so a focused view can be shared.
 */
export function GraphExplorer({
  nodes,
  edges,
  adjacency,
  reverseAdjacency,
  width = 820,
  height = 600,
  availableTypes = DEFAULT_TYPES,
  initialTypes = [],
  initialSelectedId,
  className,
}: GraphExplorerProps): ReactNode {
  const {
    graph,
    activeTypes,
    setActiveTypes,
    searchTerm,
    setSearchTerm,
    selectedId,
    selectNode,
    expanded,
    toggleExpand,
    expandAll,
    collapseAll,
  } = useGraphLayout({
    nodes,
    edges,
    adjacency,
    width,
    height,
    initialTypes,
    initialSelectedId,
  });

  const [shareCopied, setShareCopied] = useState(false);

  // Mirror the focused selection into the URL so a user can share the
  // view. We update via `history.replaceState` to avoid spamming the
  // back stack as the user clicks around.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (selectedId) {
      url.searchParams.set('selected', selectedId);
    } else {
      url.searchParams.delete('selected');
    }
    if (activeTypes.length > 0) {
      url.searchParams.set('type', activeTypes.join(','));
    } else {
      url.searchParams.delete('type');
    }
    window.history.replaceState(null, '', url.toString());
  }, [selectedId, activeTypes]);

  const toggleType = (type: EntityType) => {
    if (activeTypes.includes(type)) {
      setActiveTypes(activeTypes.filter((t) => t !== type));
    } else {
      setActiveTypes([...activeTypes, type]);
    }
  };

  const onShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
    }
  };

  const selectedNode = selectedId ? graph.byId.get(selectedId) : undefined;
  const expandedNeighbors = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const { ids } = expandNode(adjacency, selectedId);
    return new Set(ids);
  }, [adjacency, selectedId]);

  const visibleNodeIds = useMemo(() => new Set(graph.nodes.map((n) => n.id)), [graph]);

  return (
    <section
      aria-label="Knowledge graph explorer"
      className={cn(
        'border-border bg-surface-card flex flex-col gap-4 rounded-xl border p-4',
        className,
      )}
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-text text-h3 font-semibold">Knowledge graph</h2>
            <p className="text-text-muted text-small">
              {graph.nodes.length} nodes · {graph.links.length} edges · click a node to inspect
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="muted" size="sm" onClick={expandAll}>
              Expand all
            </Button>
            <Button type="button" variant="muted" size="sm" onClick={collapseAll}>
              Collapse
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onShare}
              aria-live="polite"
            >
              {shareCopied ? 'Link copied!' : 'Share view'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Input
            type="search"
            placeholder="Search by name, slug, or type…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            label="Search"
            hideLabel
            className="md:max-w-sm"
          />
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter by type"
          >
            {availableTypes.map((type) => {
              const enabled = activeTypes.length === 0 || activeTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={enabled ? 'true' : 'false'}
                  onClick={() => toggleType(type)}
                  className={cn(
                    'text-tiny inline-flex h-9 items-center rounded-full border px-3 font-medium tracking-wide uppercase transition-colors',
                    'focus-visible:ring-primary-orange focus-visible:ring-offset-surface focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    enabled
                      ? 'border-primary-orange bg-primary-orange/15 text-primary-orange'
                      : 'border-border bg-surface-elevated text-text-muted hover:text-text',
                  )}
                >
                  {TYPE_LABEL[type] ?? type}
                </button>
              );
            })}
            {activeTypes.length > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTypes([])}
                className="text-text-muted hover:text-text text-tiny inline-flex h-9 items-center rounded-full px-3 font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <GraphCanvas
          graph={graph}
          selectedId={selectedId}
          expandedNeighbors={expandedNeighbors}
          expanded={expanded}
          visibleNodeIds={visibleNodeIds}
          onSelect={selectNode}
          onToggleExpand={toggleExpand}
        />
        <GraphNodeDetail
          node={selectedNode}
          adjacency={adjacency}
          reverseAdjacency={reverseAdjacency}
          onClose={() => selectNode(undefined)}
          onSelectNeighbor={(id) => selectNode(id)}
          onToggleExpand={toggleExpand}
          expanded={selectedId ? expanded.has(selectedId) : false}
        />
      </div>
    </section>
  );
}

interface GraphCanvasProps {
  graph: GraphData;
  selectedId: string | undefined;
  expandedNeighbors: Set<string>;
  expanded: Set<string>;
  visibleNodeIds: Set<string>;
  onSelect: (id: string | undefined) => void;
  onToggleExpand: (id: string) => void;
}

function GraphCanvas({
  graph,
  selectedId,
  expandedNeighbors,
  expanded,
  visibleNodeIds,
  onSelect,
  onToggleExpand,
}: GraphCanvasProps): ReactNode {
  const { bounds, nodes, links } = graph;
  const padX = 40;
  const padY = 40;
  const vbX = bounds.minX - padX;
  const vbY = bounds.minY - padY;
  const vbW = Math.max(120, bounds.maxX - bounds.minX + padX * 2);
  const vbH = Math.max(120, bounds.maxY - bounds.minY + padY * 2);

  return (
    <div className="border-border bg-surface-elevated relative overflow-hidden rounded-lg border">
      <svg
        role="img"
        aria-label="Interactive knowledge graph"
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-[420px] w-full md:h-[560px]"
      >
        <title>Knowledge graph</title>
        <desc>
          {nodes.length} nodes and {links.length} edges. Click a node to inspect its relations.
        </desc>

        <g aria-hidden="true">
          {links.map((link, idx) => {
            const isHot = selectedId && (link.source === selectedId || link.target === selectedId);
            return (
              <line
                key={`${link.source}-${link.target}-${idx}`}
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke={
                  isHot
                    ? 'var(--color-primary-orange, #FF6A00)'
                    : 'var(--color-border-strong, #444)'
                }
                strokeOpacity={isHot ? 0.95 : 0.4}
                strokeWidth={isHot ? 1.5 : 0.75}
              />
            );
          })}
        </g>

        <g>
          {nodes.map((node) => {
            const isSelected = node.id === selectedId;
            const isNeighbor = expandedNeighbors.has(node.id);
            const isExpanded = expanded.has(node.id);
            const dimmed = !visibleNodeIds.has(node.id);
            const fillClass = TYPE_FILL[node.type] ?? 'fill-surface-elevated stroke-border-strong';
            const radius = isSelected ? 14 : isNeighbor ? 11 : 8;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                opacity={dimmed ? 0.35 : 1}
                className="cursor-pointer focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`${node.name} (${node.type})`}
                aria-pressed={isSelected ? 'true' : 'false'}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(node.id);
                  onToggleExpand(node.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(node.id);
                    onToggleExpand(node.id);
                  }
                }}
              >
                <circle r={radius + 6} className="fill-transparent" aria-hidden="true" />
                <circle
                  r={radius}
                  className={cn(fillClass, isSelected && 'stroke-text')}
                  strokeWidth={isSelected ? 3 : isNeighbor ? 2 : 1.25}
                />
                <text
                  y={radius + 12}
                  textAnchor="middle"
                  className="fill-text-muted"
                  style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase' }}
                >
                  {node.type}
                </text>
                <text
                  y={radius + 24}
                  textAnchor="middle"
                  className="fill-text"
                  style={{ fontSize: 11, fontWeight: isSelected ? 600 : 500 }}
                >
                  {truncate(node.name, 18)}
                </text>
                {isExpanded ? (
                  <circle
                    r={3}
                    cx={radius}
                    cy={-radius}
                    className="fill-primary-orange"
                    aria-hidden="true"
                  />
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      <button
        type="button"
        aria-label="Clear selection"
        onClick={() => onSelect(undefined)}
        className="border-border bg-surface-card text-text-muted hover:text-text text-tiny absolute top-2 right-2 inline-flex h-9 items-center rounded-md border px-3 font-medium backdrop-blur"
      >
        Clear focus
      </button>

      <div className="border-border text-text-subtle text-tiny flex flex-wrap items-center gap-3 border-t px-3 py-2">
        <span className="font-mono tracking-wide uppercase">Legend</span>
        {Array.from(new Set(nodes.map((n) => n.type))).map((type) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn('inline-block h-3 w-3 rounded-full border', TYPE_FILL[type])}
            />
            <span className="font-mono uppercase">{type}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default GraphExplorer;

// Re-export so callers can use the type without diving into the helpers.
export type { GraphNode, GraphEdge };
