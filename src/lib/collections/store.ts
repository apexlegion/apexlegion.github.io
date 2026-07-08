/**
 * Saved collections — localStorage-backed personal bookmarks.
 *
 * The dashboard is intentionally zero-backend: there is no auth, no
 * sync, and no analytics. Users save entities from detail/listing pages
 * and view them later on `/dashboard`.
 *
 * All helpers are SSR-safe: when `window` is undefined they return the
 * empty result / become no-ops. Callers therefore never need to gate
 * execution with a `typeof window` check of their own.
 */

export const SAVED_STORAGE_KEY = 'ai-atlas:saved';

/** Shape stored for each bookmark. The `id` is namespaced by the data
 *  layer (`<type>/<slug>`) so collisions across entity kinds cannot
 *  happen. `url` is captured at save time so future slug renames do not
 *  silently break an existing bookmark. */
export interface SavedItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  url: string;
  savedAt: string;
}

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeParse(raw: string | null): SavedItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SavedItem => {
      return (
        item !== null &&
        typeof item === 'object' &&
        typeof (item as SavedItem).id === 'string' &&
        typeof (item as SavedItem).type === 'string' &&
        typeof (item as SavedItem).slug === 'string' &&
        typeof (item as SavedItem).title === 'string' &&
        typeof (item as SavedItem).url === 'string' &&
        typeof (item as SavedItem).savedAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

export function getSavedItems(): SavedItem[] {
  if (!hasStorage()) return [];
  try {
    return safeParse(window.localStorage.getItem(SAVED_STORAGE_KEY));
  } catch {
    return [];
  }
}

/** Append an item if it is not already saved. Existing entries are left
 *  alone so re-saving an item does not bump its `savedAt` and shuffle
 *  ordering. */
export function saveItem(item: SavedItem): void {
  if (!hasStorage()) return;
  if (!item.id) return;
  const existing = getSavedItems();
  if (existing.some((e) => e.id === item.id)) return;
  try {
    const next = [...existing, item];
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or storage disabled — fail quietly.
  }
}

export function removeItem(id: string): void {
  if (!hasStorage()) return;
  const existing = getSavedItems();
  const next = existing.filter((e) => e.id !== id);
  if (next.length === existing.length) return;
  try {
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be disabled — fail quietly.
  }
}

export function isSaved(id: string): boolean {
  return getSavedItems().some((e) => e.id === id);
}

/** Wipe every saved bookmark. Exposed for testing and future "clear
 *  dashboard" affordances; not currently rendered in the UI. */
export function clearSavedItems(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(SAVED_STORAGE_KEY);
  } catch {
    // Storage may be disabled — fail quietly.
  }
}
