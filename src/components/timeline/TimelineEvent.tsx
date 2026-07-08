import type { ReactNode } from 'react';
import { cn } from '@/lib';

export type TimelineEventType =
  'paper' | 'release' | 'milestone' | 'update' | 'community' | 'breaking';

export interface TimelineEventProps {
  date: string;
  type?: TimelineEventType;
  title: string;
  description?: string;
  entityId?: string;
  href?: string;
  className?: string;
  children?: ReactNode;
}

const typeBadgeClass: Record<TimelineEventType, string> = {
  paper: 'bg-info/15 text-info border-info/30',
  release: 'bg-primary-orange/15 text-primary-orange border-primary-orange/30',
  milestone: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
  update: 'bg-success/15 text-success border-success/30',
  community: 'bg-warning/15 text-warning border-warning/30',
  breaking: 'bg-danger/15 text-danger border-danger/30',
};

export function TimelineEvent({
  date,
  type = 'milestone',
  title,
  description,
  href,
  entityId,
  className,
  children,
}: TimelineEventProps): ReactNode {
  const Wrapper = href ? 'a' : 'article';
  const dateLabel = formatTimelineDate(date);

  return (
    <li className={cn('relative pl-10', className)} data-entity-id={entityId}>
      <span
        aria-hidden="true"
        className="border-primary-black bg-primary-orange shadow-glow absolute top-3 left-3 h-3 w-3 -translate-x-1/2 rounded-full border-2"
      />
      <Wrapper
        href={href}
        className={cn(
          'border-border bg-surface-card block rounded-lg border p-4 shadow-sm',
          'duration-base transition-all ease-out',
          href &&
            'hover:border-border-strong focus-visible:ring-primary-orange focus-visible:ring-offset-surface hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <time
            dateTime={date}
            className="text-tiny text-text-muted font-mono tracking-wide uppercase"
          >
            {dateLabel}
          </time>
          <span
            className={cn(
              'text-tiny inline-flex items-center rounded-full border px-2 py-0.5 font-medium tracking-wide uppercase',
              typeBadgeClass[type],
            )}
          >
            {type}
          </span>
        </div>
        <h3 className="text-h4 text-text mt-2 font-semibold">{title}</h3>
        {description ? <p className="text-small text-text-muted mt-1">{description}</p> : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </Wrapper>
    </li>
  );
}

function formatTimelineDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
