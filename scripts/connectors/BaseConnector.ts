/**
 * Base connector interface for AI Atlas data sources.
 *
 * Every external source must implement this contract. The pipeline runner
 * treats connectors as plugins: it discovers them, calls `fetch()` to gather
 * raw data, then `normalize()` to produce entity records that satisfy the
 * runtime Zod schemas in `src/lib/schemas/entity.ts`.
 *
 * Concrete connectors should expose a small static `sources()` list of
 * source-specific identifiers (e.g. repo names, model IDs).
 */

import type { Entity, RawRecord } from '../lib/types.js';

export interface BaseConnector {
  readonly name: string;
  /** Source identifiers this connector knows about. */
  readonly sources: readonly string[];
  /** Fetch raw data for every source. Implementations should be idempotent. */
  fetch(): Promise<RawRecord[]>;
  /** Transform raw records into runtime-compatible entity records. */
  normalize(raw: RawRecord[]): Promise<Entity[]>;
}

/**
 * Convenience base class. Concrete connectors extend this and override the
 * abstract methods. They may also override `prefetch` to seed the raw cache
 * without making network calls (useful for offline runs).
 */
export abstract class Connector implements BaseConnector {
  abstract readonly name: string;
  abstract readonly sources: readonly string[];

  abstract fetch(): Promise<RawRecord[]>;
  abstract normalize(raw: RawRecord[]): Promise<Entity[]>;
}
