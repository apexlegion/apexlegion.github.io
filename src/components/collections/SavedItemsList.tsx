import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSavedItems, removeItem, type SavedItem } from '@/lib/collections/store';
import { withBase } from '@/lib/utils/url';

/**
 * SavedItemsList — React island that renders every entry from
 * `localStorage` and lets the user remove items inline.
 *
 * Renders nothing on the server (the storage is empty there anyway).
 * After mount we surface a friendly empty state if there are no items
 * and a card grid otherwise.
 */
export function SavedItemsList() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getSavedItems());
    setHydrated(true);
  }, []);

  const handleRemove = useCallback((id: string) => {
    removeItem(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const sortedItems = useMemo(
    () => items.slice().sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [items],
  );

  if (!hydrated) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="text-text-muted text-small"
        data-testid="saved-items-loading"
      >
        Loading your dashboard…
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div
        data-testid="saved-items-empty"
        className="border-border bg-surface-elevated flex flex-col items-start gap-4 rounded-lg border p-6"
      >
        <h2 className="text-text text-h3 font-semibold">No saved items yet</h2>
        <p className="text-text-muted text-body max-w-prose">
          Tap the bookmark icon on any project, model, or tutorial to keep it handy here. Your
          bookmarks live in this browser only — there is no account, no sync, and nothing is sent to
          a server.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={withBase('/projects')}
            className="bg-primary-orange text-surface hover:bg-primary-orange-hover focus-visible:ring-primary-orange focus-visible:ring-offset-surface inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Browse projects
          </a>
          <a
            href={withBase('/models')}
            className="border-border text-text hover:border-primary-orange hover:text-primary-orange inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold"
          >
            Browse models
          </a>
          <a
            href={withBase('/tutorials')}
            className="border-border text-text hover:border-primary-orange hover:text-primary-orange inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold"
          >
            Browse tutorials
          </a>
        </div>
      </div>
    );
  }

  return (
    <ul
      data-testid="saved-items-list"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      aria-label="Saved bookmarks"
    >
      {sortedItems.map((item) => (
        <li
          key={item.id}
          data-testid="saved-item"
          data-entity-id={item.id}
          className="border-border bg-surface-elevated flex h-full flex-col gap-3 rounded-lg border p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-text-subtle font-mono text-xs tracking-wide uppercase">
                {item.type}
              </span>
              <a
                href={item.url}
                className="text-text hover:text-primary-orange text-h4 font-semibold"
              >
                {item.title}
              </a>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              aria-label={`Remove ${item.title} from your dashboard`}
              data-testid="saved-item-remove"
              className="border-border text-text-muted hover:text-text hover:bg-surface focus-visible:ring-primary-orange focus-visible:ring-offset-surface inline-flex h-9 w-9 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <a href={item.url} className="text-primary-orange text-small font-medium hover:underline">
            Open →
          </a>
          <span className="text-text-subtle text-small">
            Saved {new Date(item.savedAt).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default SavedItemsList;
