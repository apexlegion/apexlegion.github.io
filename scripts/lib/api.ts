/**
 * Rate-limited HTTP client for the data pipeline.
 *
 * - Uses global fetch (Node 20+).
 * - Tracks requests per host and enforces a simple per-host minimum interval.
 * - Supports a cache layer to short-circuit repeat requests.
 */

import { createHash } from 'node:crypto';
import type { FileCache } from './cache.js';

export interface ApiClientOptions {
  userAgent: string;
  minIntervalMs?: number;
  cache?: FileCache;
  cacheTtlMs?: number;
  fetchImpl?: typeof fetch;
}

interface HostState {
  lastRequestAt: number;
}

export class ApiClient {
  private readonly userAgent: string;
  private readonly minIntervalMs: number;
  private readonly cache?: FileCache;
  private readonly cacheTtlMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly hosts = new Map<string, HostState>();

  constructor(opts: ApiClientOptions) {
    this.userAgent = opts.userAgent;
    this.minIntervalMs = opts.minIntervalMs ?? 250;
    this.cache = opts.cache;
    this.cacheTtlMs = opts.cacheTtlMs ?? 24 * 60 * 60 * 1000;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  }

  private cacheKey(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  private async respectRateLimit(host: string): Promise<void> {
    const state = this.hosts.get(host);
    if (!state) return;
    const elapsed = Date.now() - state.lastRequestAt;
    if (elapsed >= this.minIntervalMs) return;
    await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
  }

  private hostOf(url: string): string {
    try {
      return new URL(url).host;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Fetch a URL and parse the response as JSON. Returns `null` on 404.
   */
  async getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
    if (this.cache) {
      const cached = this.cache.read<T>(this.cacheKey(url), this.cacheTtlMs);
      if (cached !== undefined) return cached;
    }

    await this.respectRateLimit(this.hostOf(url));
    this.hosts.set(this.hostOf(url), { lastRequestAt: Date.now() });

    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'application/json',
        ...headers,
      },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    }
    const json = (await res.json()) as T;
    if (this.cache) this.cache.write(this.cacheKey(url), json);
    return json;
  }

  /**
   * Fetch a URL and return the raw text body. Returns `null` on 404.
   * Caches the response body as a JSON string so the existing FileCache
   * (which only stores JSON) can be reused for XML/Atom feeds too.
   */
  async getText(url: string, headers: Record<string, string> = {}): Promise<string | null> {
    if (this.cache) {
      const cached = this.cache.read<string>(this.cacheKey(url), this.cacheTtlMs);
      if (cached !== undefined) return cached;
    }

    await this.respectRateLimit(this.hostOf(url));
    this.hosts.set(this.hostOf(url), { lastRequestAt: Date.now() });

    const res = await this.fetchImpl(url, {
      method: 'GET',
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'application/xml, text/xml, application/atom+xml, */*',
        ...headers,
      },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
    }
    const text = await res.text();
    if (this.cache) this.cache.write(this.cacheKey(url), text);
    return text;
  }
}
