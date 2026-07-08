import type { ReactNode } from 'react';
import { cn } from '@/lib';
import type { GraphNode } from '@/lib/graph/types';

const typeAccent: Record<GraphNode['type'], string> = {
  project: 'border-primary-orange/40 hover:border-primary-orange',
  model: 'border-info/40 hover:border-info',
  concept: 'border-accent-orange/40 hover:border-accent-orange',
  tutorial: 'border-success/40 hover:border-success',
  paper: 'border-warning/40 hover:border-warning',
  benchmark: 'border-danger/40 hover:border-danger',
  hardware: 'border-border-strong',
  company: 'border-border-strong',
  license: 'border-border-strong',
  framework: 'border-border-strong',
  dataset: 'border-border-strong',
};

export interface GraphNodeCardProps {
  node: GraphNode;
  href?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Small card used in graph visualizations.
 *
 * When `href` is provided the card renders as a link; otherwise it is a
 * non-interactive box. The accent border colour is driven by the node
 * type so the graph reads correctly at a glance.
 */
export function GraphNodeCard({
  node,
  href,
  size = 'md',
  className,
}: GraphNodeCardProps): ReactNode {
  const padding = size === 'sm' ? 'p-2' : 'p-3';
  const titleSize = size === 'sm' ? 'text-tiny' : 'text-small';

  const inner = (
    <>
      <span className="text-tiny text-text-muted font-mono uppercase">{node.type}</span>
      <span className={cn('text-text mt-1 font-semibold', titleSize)}>{node.name}</span>
      {node.summary && size === 'md' ? (
        <span className="text-text-muted text-tiny mt-1 line-clamp-2">{node.summary}</span>
      ) : null}
    </>
  );

  const baseClass = cn(
    'bg-surface-card text-text flex w-44 flex-col rounded-lg border-2 p-3 shadow-sm transition-colors',
    padding,
    typeAccent[node.type],
    href &&
      'hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    className,
  );

  if (href) {
    return (
      <a href={href} className={cn(baseClass, 'no-underline')}>
        {inner}
      </a>
    );
  }
  return <div className={baseClass}>{inner}</div>;
}

export default GraphNodeCard;
