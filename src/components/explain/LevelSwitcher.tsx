import { useId, type ReactNode } from 'react';
import { cn, LEVELS, type LevelId } from '@/lib';

export interface LevelSwitcherProps {
  active: LevelId;
  onChange: (id: LevelId) => void;
  levels?: readonly LevelId[];
  className?: string;
  label?: string;
  showDescription?: boolean;
}

/**
 * The "Explain Like I'm..." level switcher.
 *
 * Renders a tab-like segmented control with one button per Explain level.
 * Persisting the active level is the caller's responsibility (typically
 * localStorage on the consumer side).
 */
export function LevelSwitcher({
  active,
  onChange,
  levels,
  className,
  label = 'Reading level',
  showDescription = false,
}: LevelSwitcherProps): ReactNode {
  const reactId = useId();
  const listId = `${reactId}-level-switcher`;
  const visibleLevels = (levels ?? LEVELS.map((l) => l.id)).filter((id) =>
    LEVELS.some((level) => level.id === id),
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span
        id={`${listId}-label`}
        className="text-tiny text-text-muted font-medium tracking-wide uppercase"
      >
        {label}
      </span>
      <div
        role="tablist"
        id={listId}
        aria-labelledby={`${listId}-label`}
        className="border-border bg-surface-elevated inline-flex flex-wrap items-center gap-1 rounded-lg border p-1"
      >
        {visibleLevels.map((id) => {
          const meta = LEVELS.find((level) => level.id === id);
          if (!meta) return null;
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={showDescription ? `${listId}-desc-${id}` : undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(id)}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
                event.preventDefault();
                const idx = visibleLevels.indexOf(id);
                const dir = event.key === 'ArrowRight' ? 1 : -1;
                const nextIdx = (idx + dir + visibleLevels.length) % visibleLevels.length;
                const nextId = visibleLevels[nextIdx];
                if (nextId) {
                  onChange(nextId);
                  document.getElementById(`${listId}-btn-${nextId}`)?.focus();
                }
              }}
              id={`${listId}-btn-${id}`}
              title={meta.description}
              className={cn(
                'text-small duration-fast rounded-md px-3 py-1.5 font-medium transition-colors ease-out',
                'focus-visible:ring-primary-orange focus-visible:ring-offset-surface focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                isActive
                  ? 'bg-primary-orange text-text-inverse shadow-sm'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
      {showDescription
        ? visibleLevels.map((id) => {
            const meta = LEVELS.find((level) => level.id === id);
            if (!meta) return null;
            return (
              <p
                key={id}
                id={`${listId}-desc-${id}`}
                role="tabpanel"
                hidden={id !== active}
                className="text-small text-text-muted"
              >
                {meta.description}
              </p>
            );
          })
        : null}
    </div>
  );
}
