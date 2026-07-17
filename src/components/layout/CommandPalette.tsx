import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { withBase } from '../../lib/utils/url';

export interface SearchIndexItem {
  id: string;
  type: 'project' | 'model' | 'concept' | 'tutorial' | 'page';
  title: string;
  description: string;
  url: string;
  tags?: string[];
}

export interface CommandPaletteProps {
  /** Path to the JSON search index relative to the site root. */
  indexUrl?: string;
  /** Whether the palette is open (controlled). */
  open: boolean;
  /** Called when the palette requests close. */
  onClose: () => void;
}

export function CommandPalette({
  indexUrl = '/search-index.json',
  open,
  onClose,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(withBase(indexUrl))
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SearchIndexItem[]) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, indexUrl]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const fuse = useMemo(
    () => new Fuse(items, { keys: ['title', 'description', 'tags'], threshold: 0.4 }),
    [items],
  );

  const results = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8);
    return fuse
      .search(query)
      .map((r) => r.item)
      .slice(0, 10);
  }, [query, items, fuse]);

  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [results, active]);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[active];
      if (target) {
        window.location.href = withBase(target.url);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24"
    >
      <button
        type="button"
        aria-label="Close command palette"
        onClick={onClose}
        className="bg-overlay absolute inset-0 backdrop-blur-sm"
      />
      <div className="bg-surface-card border-border relative w-full max-w-xl overflow-hidden rounded-xl border shadow-xl">
        <div className="border-border border-b px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search projects, models, concepts..."
            aria-label="Search"
            className="text-text text-body placeholder:text-text-subtle w-full bg-transparent outline-none"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
          {results.length === 0 ? (
            <li className="text-text-muted text-small px-4 py-6 text-center">No results found.</li>
          ) : (
            results.map((item, idx) => (
              <li key={item.id} role="option" aria-selected={idx === active}>
                <a
                  href={withBase(item.url)}
                  onMouseEnter={() => setActive(idx)}
                  className={`flex flex-col gap-1 px-4 py-2 ${
                    idx === active ? 'bg-surface-elevated' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-tiny text-primary-orange font-mono uppercase">
                      {item.type}
                    </span>
                    <span className="text-text text-small font-medium">{item.title}</span>
                  </span>
                  <span className="text-text-subtle text-tiny">{item.description}</span>
                </a>
              </li>
            ))
          )}
        </ul>
        <div className="text-text-subtle border-border text-tiny flex items-center justify-between border-t px-4 py-2">
          <span>
            <kbd className="bg-surface-elevated rounded px-1.5 py-0.5">↑↓</kbd> navigate ·{' '}
            <kbd className="bg-surface-elevated rounded px-1.5 py-0.5">↵</kbd> select
          </span>
          <span>
            <kbd className="bg-surface-elevated rounded px-1.5 py-0.5">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
