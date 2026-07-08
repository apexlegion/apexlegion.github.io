import type { ReactNode } from 'react';
import { cn } from '@/lib';

export type PlaygroundDifficulty = 'beginner' | 'student' | 'developer' | 'researcher';

export interface PlaygroundShellProps {
  title: string;
  description?: string;
  difficulty?: PlaygroundDifficulty;
  estimatedMinutes?: number;
  relatedConcepts?: string[];
  controls?: ReactNode;
  visualization?: ReactNode;
  output?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const difficultyBadge: Record<PlaygroundDifficulty, string> = {
  beginner: 'bg-success/15 text-success border-success/30',
  student: 'bg-info/15 text-info border-info/30',
  developer: 'bg-primary-orange/15 text-primary-orange border-primary-orange/30',
  researcher: 'bg-warning/15 text-warning border-warning/30',
};

/**
 * PlaygroundShell — three-region shell used by every AI playground.
 *
 * Layout (desktop): controls on the left, visualization in the center,
 * explanation on the right. On mobile, regions stack vertically.
 *
 * The actual playground implementation (e.g. TokenizationPlayground) is
 * passed via `children` and rendered in the visualization region.
 */
export function PlaygroundShell({
  title,
  description,
  difficulty = 'beginner',
  estimatedMinutes,
  relatedConcepts = [],
  controls,
  visualization,
  output,
  children,
  className,
}: PlaygroundShellProps): ReactNode {
  return (
    <section
      aria-labelledby="playground-title"
      className={cn(
        'border-border bg-surface-card flex flex-col gap-6 rounded-2xl border p-6 shadow-sm',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="playground-title" className="text-h2 text-text font-semibold">
            {title}
          </h2>
          {description ? (
            <p className="text-body text-text-muted max-w-prose">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-tiny inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium tracking-wide uppercase',
              difficultyBadge[difficulty],
            )}
          >
            {difficulty}
          </span>
          {typeof estimatedMinutes === 'number' ? (
            <span className="border-border bg-surface-elevated text-tiny text-text-muted inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium tracking-wide uppercase">
              {estimatedMinutes} min
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        <aside aria-label="Playground controls" className="flex flex-col gap-4">
          {controls}
        </aside>
        <div aria-label="Visualization" className="flex flex-col gap-4">
          <div className="border-border-strong bg-surface min-h-[280px] rounded-xl border border-dashed p-6">
            {visualization ?? children}
          </div>
          {output ? (
            <div
              aria-label="Playground output"
              aria-live="polite"
              className="border-border bg-surface-elevated text-small text-text rounded-xl border p-4 font-mono"
            >
              {output}
            </div>
          ) : null}
        </div>
        <aside aria-label="Related concepts" className="flex flex-col gap-3">
          <h3 className="text-small text-text-muted font-semibold tracking-wide uppercase">
            Related concepts
          </h3>
          {relatedConcepts.length === 0 ? (
            <p className="text-small text-text-subtle">No related concepts yet.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {relatedConcepts.map((concept) => (
                <li key={concept}>
                  <a
                    href={`/concepts/${concept}`}
                    className="text-small text-text duration-fast hover:bg-surface-elevated hover:text-primary-orange block rounded-md px-3 py-2 transition-colors ease-out"
                  >
                    {concept}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
