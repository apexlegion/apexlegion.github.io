import { useCallback, useEffect, useState } from 'react';
import { isSaved, removeItem, saveItem, type SavedItem } from '@/lib/collections/store';

/**
 * Props describe the minimum surface needed to bookmark any entity.
 * `type` and `slug` are stored so the dashboard can group saved items by
 * kind; `url` is captured so renames never break an existing bookmark.
 */
export interface BookmarkButtonEntity {
  id: string;
  type: string;
  slug: string;
  title: string;
  url: string;
}

export interface BookmarkButtonProps {
  entity: BookmarkButtonEntity;
  /** Optional className for layout integration. */
  className?: string;
  /** Override the visible label for the saved / unsaved states. */
  labels?: {
    save?: string;
    saved?: string;
  };
}

const DEFAULT_LABELS = {
  save: 'Save',
  saved: 'Saved',
};

/** BookmarkButton — React island. Hydration-safe: renders a stable
 *  "Save" button on the server and upgrades to the persisted state on
 *  the client. Avoids a hydration mismatch warning because the SSR and
 *  the pre-effect first paint agree. */
export function BookmarkButton({ entity, className, labels }: BookmarkButtonProps) {
  const mergedLabels = {
    save: labels?.save ?? DEFAULT_LABELS.save,
    saved: labels?.saved ?? DEFAULT_LABELS.saved,
  };

  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSaved(isSaved(entity.id));
    setHydrated(true);
  }, [entity.id]);

  const handleToggle = useCallback(() => {
    if (saved) {
      removeItem(entity.id);
      setSaved(false);
      return;
    }
    const payload: SavedItem = {
      id: entity.id,
      type: entity.type,
      slug: entity.slug,
      title: entity.title,
      url: entity.url,
      savedAt: new Date().toISOString(),
    };
    saveItem(payload);
    setSaved(true);
  }, [entity.id, entity.slug, entity.title, entity.type, entity.url, saved]);

  // Pre-hydration we render the neutral save state. After hydration we
  // switch the icon + label and announce state via aria-pressed.
  const isSavedState = hydrated && saved;
  const ariaLabel = isSavedState
    ? `Remove ${entity.title} from your dashboard`
    : `Save ${entity.title} to your dashboard`;
  const visibleLabel = isSavedState ? mergedLabels.saved : mergedLabels.save;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={isSavedState}
      aria-label={ariaLabel}
      data-saved={isSavedState ? 'true' : 'false'}
      data-entity-id={entity.id}
      data-testid="bookmark-button"
      className={
        'border-border bg-surface-elevated text-text hover:border-primary-orange hover:text-primary-orange focus-visible:ring-primary-orange focus-visible:ring-offset-surface inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none' +
        (isSavedState ? ' border-primary-orange text-primary-orange' : '') +
        (className ? ` ${className}` : '')
      }
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill={isSavedState ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3h12v18l-6-4-6 4V3z" />
      </svg>
      <span>{visibleLabel}</span>
    </button>
  );
}

export default BookmarkButton;
