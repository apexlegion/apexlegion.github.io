/**
 * Normalization stage of the data pipeline.
 *
 * For Phase 1, this is a thin orchestrator: it asks each connector to
 * transform its raw records into runtime-compatible entities. Connectors are
 * responsible for the actual mapping logic; the pipeline just sequences the
 * work and logs progress.
 */

import { GitHubConnector } from '../connectors/GitHubConnector.js';
import { HuggingFaceConnector } from '../connectors/HuggingFaceConnector.js';
import { ArxivConnector } from '../connectors/ArxivConnector.js';
import { PapersWithCodeConnector } from '../connectors/PapersWithCodeConnector.js';
import { RssConnector } from '../connectors/RssConnector.js';
import { createLogger } from '../lib/logger.js';
import type { Entity, RawRecord } from '../lib/types.js';

const log = createLogger('pipeline:normalize');

export interface ConnectorBundle {
  readonly name: string;
  fetch(): Promise<RawRecord[]>;
  normalize(raw: RawRecord[]): Promise<Entity[]>;
}

export interface NormalizeResult {
  readonly source: string;
  readonly rawCount: number;
  readonly entityCount: number;
  readonly entities: Entity[];
}

/**
 * Normalize raw records using the given connector's `normalize` method.
 * Returns the normalized entities along with bookkeeping metadata.
 */
export async function normalizeWithConnector(
  connector: ConnectorBundle,
  raw: RawRecord[],
): Promise<NormalizeResult> {
  const entities = await connector.normalize(raw);
  log.info(
    `${connector.name}: normalized ${entities.length}/${raw.length} raw records into entities`,
  );
  return {
    source: connector.name,
    rawCount: raw.length,
    entityCount: entities.length,
    entities,
  };
}

/**
 * Build a connector bundle for a given source identifier.
 * Accepts the literal names `"github"`, `"huggingface"`, `"arxiv"`,
 * `"paperswithcode"`, and `"rss"`.
 */
export function getConnector(name: string): ConnectorBundle {
  switch (name) {
    case 'github':
      return new GitHubConnector();
    case 'huggingface':
      return new HuggingFaceConnector();
    case 'arxiv':
      return new ArxivConnector();
    case 'paperswithcode':
      return new PapersWithCodeConnector();
    case 'rss':
      return new RssConnector();
    default:
      throw new Error(`unknown connector: ${name}`);
  }
}
