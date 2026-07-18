/**
 * Learn Academy progress islands.
 *
 * Progress is a plain array of completed lesson slugs in localStorage under
 * `ai-atlas:lessons-done` — no accounts, no server, survives visits. Three
 * small islands share it:
 *
 * - `LessonDone`     — "mark as done" toggle on a lesson page.
 * - `TrackProgress`  — "n/total" bar for a track on the academy landing.
 * - `CopyPrompt`     — copy-to-clipboard button for prompt blocks.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ai-atlas:lessons-done';

function readDone(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function writeDone(slugs: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    /* storage unavailable (private mode) — progress just won't persist */
  }
}

export function LessonDone({ slug }: { slug: string }) {
  // Render unchecked on the server and hydrate from storage on mount so the
  // static HTML never mismatches.
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(readDone().includes(slug));
  }, [slug]);

  const toggle = () => {
    const current = readDone();
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
    writeDone(next);
    setDone(next.includes(slug));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={done}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${
        done
          ? 'border-primary-orange bg-primary-orange/15 text-primary-orange'
          : 'border-border bg-surface-card text-text-muted hover:border-primary-orange hover:text-text'
      }`}
    >
      <span aria-hidden="true">{done ? '✓' : '○'}</span>
      {done ? 'Done — nice work' : 'Mark lesson done'}
    </button>
  );
}

export function TrackProgress({ slugs }: { slugs: string[] }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const done = readDone();
    setCount(slugs.filter((s) => done.includes(s)).length);
  }, [slugs]);

  const total = slugs.length;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5" aria-label={`${count} of ${total} lessons complete`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-text-muted text-xs font-medium tracking-wide uppercase">
          Progress
        </span>
        <span className="text-text text-xs font-semibold tabular-nums">
          {count}/{total}
        </span>
      </div>
      <div className="bg-border/60 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary-orange h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — user can still select the text manually */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="border-border bg-surface-card text-text-muted hover:border-primary-orange hover:text-text inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {copied ? '✓ Copied!' : 'Copy prompt'}
    </button>
  );
}
