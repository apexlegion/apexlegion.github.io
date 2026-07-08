import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BookmarkButton } from '@/components/collections/BookmarkButton';
import { clearSavedItems, getSavedItems, isSaved, saveItem } from '@/lib/collections/store';

const baseEntity = {
  id: 'project/langchain',
  type: 'project',
  slug: 'langchain',
  title: 'LangChain',
  url: '/projects/langchain',
};

describe('BookmarkButton + dashboard wiring', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it('renders an accessible Save button before hydration', () => {
    render(<BookmarkButton entity={baseEntity} />);

    const button = screen.getByTestId('bookmark-button');
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('data-saved')).toBe('false');
    expect(button.getAttribute('aria-label')).toContain('Save LangChain to your dashboard');
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('toggles the saved state and persists to localStorage', () => {
    render(<BookmarkButton entity={baseEntity} />);

    const button = screen.getByTestId('bookmark-button');

    // Initial unsaved
    expect(isSaved(baseEntity.id)).toBe(false);

    // Click to save
    fireEvent.click(button);
    expect(isSaved(baseEntity.id)).toBe(true);
    const stored = getSavedItems();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: baseEntity.id,
      type: baseEntity.type,
      slug: baseEntity.slug,
      title: baseEntity.title,
      url: baseEntity.url,
    });

    // Click again to unsave
    fireEvent.click(button);
    expect(isSaved(baseEntity.id)).toBe(false);
    expect(getSavedItems()).toEqual([]);
  });

  it('reflects the pre-existing saved state after hydration', () => {
    saveItem({
      ...baseEntity,
      savedAt: '2026-01-01T00:00:00.000Z',
    });

    render(<BookmarkButton entity={baseEntity} />);

    const button = screen.getByTestId('bookmark-button');
    expect(button.getAttribute('data-saved')).toBe('true');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toContain('Remove');
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('clears the dashboard via the collections store', () => {
    saveItem({ ...baseEntity, savedAt: '2026-01-01T00:00:00.000Z' });
    expect(getSavedItems()).toHaveLength(1);

    clearSavedItems();
    expect(getSavedItems()).toEqual([]);
    expect(isSaved(baseEntity.id)).toBe(false);
  });

  it('accepts custom labels', () => {
    render(
      <BookmarkButton entity={baseEntity} labels={{ save: 'Bookmark', saved: 'Bookmarked' }} />,
    );
    expect(screen.getByText('Bookmark')).toBeInTheDocument();
  });
});
