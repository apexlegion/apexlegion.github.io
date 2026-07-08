/**
 * File-based cache for raw API responses.
 *
 * Stores values as JSON in `.cache/api/{key}.json`. Each entry includes an
 * `expiresAt` timestamp; readers can request a max-age in milliseconds.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export class FileCache {
  private readonly root: string;

  constructor(root: string) {
    this.root = root;
    mkdirSync(root, { recursive: true });
  }

  private pathFor(key: string): string {
    return join(this.root, `${key}.json`);
  }

  write<T>(key: string, value: T, ttlMs: number = 24 * 60 * 60 * 1000): void {
    const entry: CacheEntry<T> = { expiresAt: Date.now() + ttlMs, value };
    const p = this.pathFor(key);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify(entry), 'utf8');
  }

  /**
   * Returns the cached value when present and fresh enough, otherwise
   * `undefined`. Callers should treat `undefined` as a cache miss.
   */
  read<T>(key: string, maxAgeMs: number = Infinity): T | undefined {
    const p = this.pathFor(key);
    if (!existsSync(p)) return undefined;
    try {
      const raw = readFileSync(p, 'utf8');
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (typeof entry?.expiresAt !== 'number') return undefined;
      if (entry.expiresAt < Date.now()) return undefined;
      if (Date.now() - (entry.expiresAt - 24 * 60 * 60 * 1000) > maxAgeMs) return undefined;
      return entry.value;
    } catch {
      return undefined;
    }
  }

  clear(): void {
    mkdirSync(this.root, { recursive: true });
  }
}
