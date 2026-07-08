import type { ReactNode } from 'react';
import { TimelineEvent, type TimelineEventProps } from './TimelineEvent';
import { cn } from '@/lib';

export interface TimelineProps {
  events: TimelineEventProps[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  ariaLabel?: string;
}

/**
 * Timeline — renders a chronologically ordered list of `TimelineEvent` items.
 *
 * Vertical orientation is the default and is what entity detail pages use.
 * Horizontal orientation is reserved for the graph-explorer milestone view
 * (Phase 2); events render in a horizontally scrolling row.
 */
export function Timeline({
  events,
  orientation = 'vertical',
  className,
  ariaLabel = 'Timeline',
}: TimelineProps): ReactNode {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  if (orientation === 'horizontal') {
    return (
      <div role="region" aria-label={ariaLabel} className={cn('overflow-x-auto pb-2', className)}>
        <ol className="flex min-w-max items-stretch gap-4 px-2 py-4">
          {sorted.map((event, index) => (
            <div
              key={`${event.date}-${index}`}
              className="border-border bg-surface-card flex w-64 shrink-0 flex-col gap-2 rounded-lg border p-3"
            >
              <TimelineEvent {...event} className="pl-0" />
            </div>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <ol
      aria-label={ariaLabel}
      className={cn(
        'border-border-strong relative ml-3 border-l pl-2',
        'flex flex-col gap-4',
        className,
      )}
    >
      {sorted.map((event, index) => (
        <TimelineEvent key={`${event.date}-${index}`} {...event} />
      ))}
    </ol>
  );
}
