import { useMemo, type ReactNode } from 'react';
import type { AdjacencyList, GraphNode } from '@/lib/graph/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib';

export interface GraphNodeDetailProps {
  /** The node currently selected. */
  node: GraphNode | undefined;
  /** Forward adjacency list — used to list direct relations. */
  adjacency: AdjacencyList;
  /** Reverse adjacency lookup, used to show incoming edges. */
  reverseAdjacency?: AdjacencyList;
  /** Called when the user clicks the close button. */
  onClose?: () => void;
  /** Called when the user clicks an outgoing neighbour chip. */
  onSelectNeighbor?: (id: string) => void;
  /** Called when the user toggles expand/collapse on the node. */
  onToggleExpand?: (id: string) => void;
  /** Whether the node is currently expanded. */
  expanded?: boolean;
  className?: string;
}

const variantByType: Record<GraphNode['type'], 'project' | 'model' | 'concept' | 'tutorial'> = {
  project: 'project',
  model: 'model',
  concept: 'concept',
  tutorial: 'tutorial',
  paper: 'project',
  benchmark: 'project',
  hardware: 'project',
  company: 'project',
  license: 'project',
  framework: 'project',
  dataset: 'project',
};

/**
 * Sidebar panel showing details for the currently selected node: its
 * type/name/summary, outgoing relations, incoming relations, and quick
 * actions (open detail page, expand/collapse neighbours, close panel).
 */
export function GraphNodeDetail({
  node,
  adjacency,
  reverseAdjacency,
  onClose,
  onSelectNeighbor,
  onToggleExpand,
  expanded,
  className,
}: GraphNodeDetailProps): ReactNode {
  const outgoing = useMemo(() => {
    if (!node) return [];
    return adjacency.get(node.id) ?? [];
  }, [adjacency, node]);

  const incoming = useMemo(() => {
    if (!node || !reverseAdjacency) return [];
    return reverseAdjacency.get(node.id) ?? [];
  }, [reverseAdjacency, node]);

  if (!node) {
    return (
      <aside
        className={cn(
          'border-border bg-surface-card flex h-full flex-col gap-3 rounded-xl border p-4',
          className,
        )}
        aria-label="Node details"
      >
        <h2 className="text-text text-h3 font-semibold">Node details</h2>
        <p className="text-text-muted text-small">
          Click a node in the graph to inspect its connections, or use the search box to focus one.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'border-border bg-surface-card flex h-full flex-col gap-4 overflow-y-auto rounded-xl border p-4',
        className,
      )}
      aria-label={`Details for ${node.name}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Badge variant={variantByType[node.type]}>{node.type}</Badge>
          <h2 className="text-text text-h3 leading-tight font-semibold">{node.name}</h2>
          <span className="text-text-subtle text-tiny font-mono">{node.id}</span>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Close details"
            onClick={onClose}
            className="text-text-muted hover:text-text hover:bg-surface-elevated focus-visible:ring-primary-orange focus-visible:ring-offset-surface inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span aria-hidden="true">✕</span>
          </button>
        ) : null}
      </header>

      {node.summary ? (
        <p className="text-text-muted text-small">{node.summary}</p>
      ) : (
        <p className="text-text-subtle text-small italic">No summary available.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {node.href ? (
          <a
            href={node.href}
            className="bg-primary-orange text-text-inverse hover:bg-primary-hover focus-visible:ring-primary-orange focus-visible:ring-offset-surface text-small inline-flex h-9 items-center rounded-md px-3 font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Open page →
          </a>
        ) : null}
        {onToggleExpand ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onToggleExpand(node.id)}
            aria-pressed={expanded ? 'true' : 'false'}
          >
            {expanded ? 'Collapse neighbours' : 'Expand neighbours'}
          </Button>
        ) : null}
      </div>

      <section aria-labelledby="outgoing-heading" className="flex flex-col gap-2">
        <h3
          id="outgoing-heading"
          className="text-text text-small font-semibold tracking-wide uppercase"
        >
          Outgoing relations ({outgoing.length})
        </h3>
        {outgoing.length === 0 ? (
          <p className="text-text-subtle text-tiny italic">No outgoing relations.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {outgoing.map((entry, idx) => (
              <li key={`${entry.node.id}-${idx}`}>
                <button
                  type="button"
                  onClick={() => onSelectNeighbor?.(entry.node.id)}
                  className="border-border bg-surface-elevated hover:border-primary-orange focus-visible:ring-primary-orange focus-visible:ring-offset-surface flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="flex flex-col">
                    <span className="text-text text-small font-medium">{entry.node.name}</span>
                    <span className="text-text-subtle text-tiny font-mono">{entry.edge.type}</span>
                  </span>
                  <Badge variant={variantByType[entry.node.type]}>{entry.node.type}</Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reverseAdjacency ? (
        <section aria-labelledby="incoming-heading" className="flex flex-col gap-2">
          <h3
            id="incoming-heading"
            className="text-text text-small font-semibold tracking-wide uppercase"
          >
            Incoming relations ({incoming.length})
          </h3>
          {incoming.length === 0 ? (
            <p className="text-text-subtle text-tiny italic">No incoming relations.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {incoming.map((entry, idx) => (
                <li key={`${entry.node.id}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onSelectNeighbor?.(entry.node.id)}
                    className="border-border bg-surface-elevated hover:border-primary-orange focus-visible:ring-primary-orange focus-visible:ring-offset-surface flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <span className="flex flex-col">
                      <span className="text-text text-small font-medium">{entry.node.name}</span>
                      <span className="text-text-subtle text-tiny font-mono">
                        {entry.edge.type}
                      </span>
                    </span>
                    <Badge variant={variantByType[entry.node.type]}>{entry.node.type}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <Tag className="self-start">id: {node.id}</Tag>
    </aside>
  );
}

export default GraphNodeDetail;
