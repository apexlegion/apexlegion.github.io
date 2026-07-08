import { useMemo, type ReactNode } from 'react';
import { cn } from '@/lib';
import type { AdjacencyList, GraphNode } from '@/lib/graph/types';
import { GraphNodeCard } from './GraphNodeCard';

export interface MiniGraphProps {
  /** Center node id (e.g. `project/llama-cpp`). */
  entityId: string;
  /** Adjacency list built from the seed graph. */
  adjacency: AdjacencyList;
  /** Center node, used to render the hub card and summary text. */
  center: GraphNode;
  /** Maximum number of neighbor cards to render. */
  maxNeighbors?: number;
  className?: string;
  /** Optional label shown above the visualization. */
  ariaLabel?: string;
}

/**
 * MiniGraph — a small, static, dependency-free SVG visualization that
 * places the center node in the middle and arranges its direct neighbors
 * evenly around it. Lines connect each neighbor to the hub.
 *
 * The component is intentionally lightweight so it ships as part of every
 * entity detail page without adding kilobytes of graph runtime. A full
 * interactive explorer arrives in Phase 2.
 */
export function MiniGraph({
  entityId,
  adjacency,
  center,
  maxNeighbors = 8,
  className,
  ariaLabel = 'Related entities',
}: MiniGraphProps): ReactNode {
  const neighbors = useMemo(() => {
    const list = adjacency.get(entityId) ?? [];
    return list.slice(0, maxNeighbors);
  }, [adjacency, entityId, maxNeighbors]);

  const size = 280;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 60;

  const points = neighbors.map((_, idx) => {
    const angle = (2 * Math.PI * idx) / Math.max(neighbors.length, 1) - Math.PI / 2;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return (
    <figure
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'border-border bg-surface-card flex flex-col gap-4 rounded-xl border p-4',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${center.name} connections`}
        className="w-full"
      >
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX}
          y2={centerY}
          stroke="transparent"
          aria-hidden="true"
        />
        {points.map((pt, idx) => (
          <line
            key={`line-${idx}`}
            x1={centerX}
            y1={centerY}
            x2={pt.x}
            y2={pt.y}
            stroke="currentColor"
            strokeWidth={1}
            className="text-border-strong"
            aria-hidden="true"
          />
        ))}
        <g>
          <rect
            x={centerX - 60}
            y={centerY - 28}
            width={120}
            height={56}
            rx={10}
            className="fill-primary-orange/15 stroke-primary-orange"
            strokeWidth={2}
          />
          <text
            x={centerX}
            y={centerY - 6}
            textAnchor="middle"
            className="fill-primary-orange"
            style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase' }}
          >
            {center.type}
          </text>
          <text
            x={centerX}
            y={centerY + 12}
            textAnchor="middle"
            className="fill-text"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            {truncate(center.name, 16)}
          </text>
        </g>
        {neighbors.map((entry, idx) => {
          const pt = points[idx];
          if (!pt) return null;
          return (
            <g key={`pt-${entry.node.id}`} transform={`translate(${pt.x - 40}, ${pt.y - 20})`}>
              <rect
                width={80}
                height={40}
                rx={8}
                className="fill-surface-elevated stroke-border-strong"
                strokeWidth={1.5}
              />
              <text
                x={40}
                y={16}
                textAnchor="middle"
                className="fill-text-muted"
                style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase' }}
              >
                {entry.node.type}
              </text>
              <text
                x={40}
                y={30}
                textAnchor="middle"
                className="fill-text"
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                {truncate(entry.node.name, 12)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="flex flex-col gap-2">
        <div className="flex flex-col items-center gap-2">
          <GraphNodeCard node={center} size="sm" />
        </div>
        {neighbors.length === 0 ? (
          <p className="text-text-muted text-small text-center">No related entities yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {neighbors.map((entry) => (
              <li key={entry.node.id} className="flex justify-center">
                <GraphNodeCard node={entry.node} size="sm" href={entry.node.href ?? '#'} />
              </li>
            ))}
          </ul>
        )}
      </figcaption>
    </figure>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default MiniGraph;
