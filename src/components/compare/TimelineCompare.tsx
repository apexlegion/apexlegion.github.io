import type { ReactNode } from 'react';
import type { Entity } from '@/lib/schemas/entity';
import { mergeTimeline, type MergedTimelineEvent } from '@/lib/compare';
import { withBase } from '@/lib/utils/url';

export interface TimelineCompareProps {
  entityA: Entity;
  entityB: Entity;
}

const TYPE_LABEL: Record<MergedTimelineEvent['type'], string> = {
  paper: 'Paper',
  release: 'Release',
  milestone: 'Milestone',
  update: 'Update',
  community: 'Community',
  breaking: 'Breaking',
};

function formatDate(date: string): string {
  // Accept both "YYYY-MM-DD" and "YYYY-MM" by padding.
  if (date.length === 7) return date;
  // Keep ISO short-month rendering deterministic in tests.
  return date;
}

/**
 * TimelineCompare — chronologically ordered overlay of both entities'
 * milestone events, with each row tagged with its source entity.
 */
export function TimelineCompare({ entityA, entityB }: TimelineCompareProps): ReactNode {
  const events = mergeTimeline(entityA, entityB);

  if (events.length === 0) {
    return (
      <div className="border-border bg-surface-card text-text-muted rounded-lg border p-6 text-center text-sm">
        Neither {entityA.name} nor {entityB.name} has any recorded timeline events yet.
      </div>
    );
  }

  return (
    <ol
      aria-label={`Merged timeline of ${entityA.name} and ${entityB.name}`}
      className="border-border-strong relative ml-3 flex flex-col gap-4 border-l pl-6"
    >
      {events.map((event, index) => {
        const isA = event.source === 'a';
        return (
          <li
            key={`${event.date}-${index}-${event.title}`}
            className="relative"
            data-source={event.source}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 -left-[34px] inline-flex h-3 w-3 rounded-full border-2 ${
                isA ? 'border-primary-orange bg-primary-orange' : 'border-info bg-info'
              }`}
            />
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-tiny text-primary-orange font-mono tracking-wide uppercase">
                  {formatDate(event.date)}
                </span>
                <span
                  className={`text-tiny font-mono tracking-wide uppercase ${
                    isA ? 'text-primary-orange' : 'text-info'
                  }`}
                >
                  {event.sourceName}
                </span>
                <span className="text-tiny text-text-subtle font-mono tracking-wide uppercase">
                  {TYPE_LABEL[event.type] ?? event.type}
                </span>
              </div>
              <h3 className="text-text text-body font-semibold">{event.title}</h3>
              {event.description ? (
                <p className="text-text-muted text-small max-w-prose">{event.description}</p>
              ) : null}
              {event.href ? (
                <a
                  href={withBase(event.href)}
                  className="text-primary-orange hover:text-primary-hover text-small inline-flex w-fit items-center gap-1 underline-offset-2 hover:underline"
                >
                  Read more ↗
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default TimelineCompare;
