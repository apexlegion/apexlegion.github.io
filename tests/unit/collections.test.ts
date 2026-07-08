import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSavedItems,
  getSavedItems,
  isSaved,
  removeItem,
  saveItem,
  SAVED_STORAGE_KEY,
  type SavedItem,
} from '@/lib/collections/store';

function makeItem(overrides: Partial<SavedItem> = {}): SavedItem {
  return {
    id: 'project/langchain',
    type: 'project',
    slug: 'langchain',
    title: 'LangChain',
    url: '/projects/langchain',
    savedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('collections store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns an empty array when nothing has been saved', () => {
    expect(getSavedItems()).toEqual([]);
    expect(isSaved('project/langchain')).toBe(false);
  });

  it('persists a saved item to localStorage under the documented key', () => {
    const item = makeItem();
    saveItem(item);

    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual([item]);
    expect(getSavedItems()).toEqual([item]);
    expect(isSaved(item.id)).toBe(true);
  });

  it('does not duplicate an item that is already saved', () => {
    const item = makeItem({ savedAt: '2026-01-01T00:00:00.000Z' });
    saveItem(item);
    saveItem({ ...item, savedAt: '2026-02-02T00:00:00.000Z' });

    const all = getSavedItems();
    expect(all).toHaveLength(1);
    // Existing savedAt is preserved so re-saving does not reorder the list.
    expect(all[0]?.savedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('removes a saved item by id', () => {
    const a = makeItem({ id: 'project/a', slug: 'a' });
    const b = makeItem({ id: 'project/b', slug: 'b' });
    saveItem(a);
    saveItem(b);

    removeItem(a.id);

    expect(getSavedItems().map((i) => i.id)).toEqual([b.id]);
    expect(isSaved(a.id)).toBe(false);
    expect(isSaved(b.id)).toBe(true);
  });

  it('is a no-op when removing an unknown id', () => {
    const a = makeItem({ id: 'project/a', slug: 'a' });
    saveItem(a);
    removeItem('project/does-not-exist');
    expect(getSavedItems()).toEqual([a]);
  });

  it('ignores items without an id', () => {
    // @ts-expect-error - intentionally invalid for the test
    saveItem({ type: 'project', slug: 'x', title: 'x', url: '/x', savedAt: '' });
    expect(getSavedItems()).toEqual([]);
  });

  it('recovers from malformed JSON in storage', () => {
    window.localStorage.setItem(SAVED_STORAGE_KEY, '{not valid json');
    expect(getSavedItems()).toEqual([]);
  });

  it('drops entries that do not match the SavedItem shape', () => {
    const valid = makeItem();
    window.localStorage.setItem(
      SAVED_STORAGE_KEY,
      JSON.stringify([
        valid,
        // Missing fields
        { id: 'project/broken' },
        // Wrong types
        { id: 1, type: 'project', slug: 'x', title: 'x', url: '/x', savedAt: '' },
        null,
        'string-not-object',
      ]),
    );

    expect(getSavedItems()).toEqual([valid]);
  });

  it('clearSavedItems empties the storage', () => {
    saveItem(makeItem());
    clearSavedItems();
    expect(getSavedItems()).toEqual([]);
    expect(window.localStorage.getItem(SAVED_STORAGE_KEY)).toBeNull();
  });

  it('returns an empty result when window is undefined (SSR guard)', () => {
    const originalWindow = globalThis.window;
    // Simulate SSR by removing the `window` reference entirely.
    // The cast is necessary because TypeScript would otherwise refuse to
    // assign to a read-only property.
    (globalThis as unknown as { window: unknown }).window = undefined;
    try {
      expect(getSavedItems()).toEqual([]);
      expect(isSaved('project/langchain')).toBe(false);
      // The mutators must not throw either.
      expect(() => saveItem(makeItem())).not.toThrow();
      expect(() => removeItem('project/langchain')).not.toThrow();
      expect(() => clearSavedItems()).not.toThrow();
    } finally {
      (globalThis as unknown as { window: unknown }).window = originalWindow;
    }
  });
});
