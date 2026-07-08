import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { LevelSwitcher } from '@/components/explain/LevelSwitcher';
import { Badge } from '@/components/ui/Badge';
import { LEVELS, type LevelId, isLevelId } from '@/lib/utils/levels';
import type { LevelsBlock } from '@/lib/schemas/entity';

export interface LevelContentProps {
  levels: LevelsBlock;
  defaultLevel: LevelId;
  /** localStorage key override; defaults to `ai-atlas:level`. */
  storageKey?: string;
  /** Stable identifier used to namespace the persisted choice. */
  entityId?: string;
}

const FALLBACK_STORAGE_KEY = 'ai-atlas:level';

/**
 * Renders a "Explain Like I'm..." experience for an entity. Shows a
 * `LevelSwitcher` and the content for the currently selected level.
 *
 * The chosen level is persisted to localStorage so the user's preference
 * carries across pages. When `entityId` is provided the key is namespaced
 * per-entity so different concepts can remember different defaults.
 */
export function LevelContent({
  levels,
  defaultLevel,
  storageKey,
  entityId,
}: LevelContentProps): ReactNode {
  const fullKey = useMemo(() => {
    const base = storageKey ?? FALLBACK_STORAGE_KEY;
    return entityId ? `${base}:${entityId}` : base;
  }, [storageKey, entityId]);

  const [active, setActive] = useState<LevelId>(defaultLevel);

  // Hydrate the active level from localStorage on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(fullKey);
      if (stored && isLevelId(stored) && levels[stored]) {
        setActive(stored);
      }
    } catch {
      // localStorage can be unavailable (private mode, etc.) — silently ignore.
    }
  }, [fullKey, levels]);

  // Persist whenever the user changes the level.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(fullKey, active);
    } catch {
      // Same caveat as above.
    }
  }, [active, fullKey]);

  const current = levels[active];
  const meta = LEVELS.find((l) => l.id === active);
  const availableLevels = LEVELS.filter((l) => Boolean(levels[l.id])).map((l) => l.id);

  // If no level-specific content was authored, fall back to the default level
  // so the switcher still has something to show.
  const fallbackLevel = availableLevels[0] ?? defaultLevel;
  const display = current ?? levels[fallbackLevel];

  return (
    <section
      aria-labelledby="level-content-title"
      className="border-border bg-surface-card flex flex-col gap-5 rounded-2xl border p-5 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 id="level-content-title" className="text-text text-h3 font-semibold">
            Explain it like I'm...
          </h3>
          {meta ? <p className="text-tiny text-text-muted">{meta.description}</p> : null}
        </div>
        {current ? (
          <Badge variant="concept">{meta?.label ?? active}</Badge>
        ) : (
          <Badge variant="warning">Default level</Badge>
        )}
      </header>

      <LevelSwitcher
        active={active}
        onChange={setActive}
        {...(availableLevels.length > 0 ? { levels: availableLevels } : {})}
      />

      {display ? (
        <div className="flex flex-col gap-3">
          {display.summary ? (
            <p className="text-body text-text font-medium">{display.summary}</p>
          ) : null}
          {display.content ? (
            <p className="text-body text-text-muted max-w-prose whitespace-pre-line">
              {display.content}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-small text-text-subtle">
          No level-specific content is available for this entity yet.
        </p>
      )}
    </section>
  );
}
