/**
 * Papers With Code connector.
 *
 * Fetches the public Papers With Code listing endpoint and normalizes each
 * paper into a `PaperEntity` matching `src/lib/schemas/entity.ts`.
 *
 * - Source list is hardcoded for Phase 2 (no discovery yet).
 * - Responses are cached on disk under `.cache/paperswithcode/`.
 * - Honours no authentication — uses only the public listing endpoint.
 */

import { resolve } from 'node:path';
import { ApiClient } from '../lib/api.js';
import { FileCache } from '../lib/cache.js';
import { buildSlugFromSource, buildTypedId } from '../lib/id.js';
import { createLogger } from '../lib/logger.js';
import type { PaperEntity, RawRecord } from '../lib/types.js';

const log = createLogger('paperswithcode-connector');

const PWC_API = 'https://paperswithcode.com/api/v1/papers/';
const CACHE_DIR = resolve(process.cwd(), '.cache', 'paperswithcode');
const USER_AGENT = 'ai-atlas-pipeline (+https://github.com/)';

interface PapersWithCodeResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: Array<{
    id: string;
    title?: string;
    abstract?: string;
    authors?: string[];
    published_at?: string | null;
    url_abs?: string;
    url_pdf?: string;
    conference?: string | null;
    [key: string]: unknown;
  }>;
}

export class PapersWithCodeConnector {
  readonly name = 'paperswithcode';
  readonly sources: readonly string[];
  private readonly client: ApiClient;
  private readonly pageSize: number;

  constructor(pageSize: number = 20) {
    this.sources = ['latest'];
    this.pageSize = pageSize;

    const cache = new FileCache(CACHE_DIR);
    this.client = new ApiClient({
      userAgent: USER_AGENT,
      minIntervalMs: 500,
      cache,
      cacheTtlMs: 6 * 60 * 60 * 1000,
    });
  }

  private listUrl(): string {
    const params = new URLSearchParams({ page_size: String(this.pageSize) });
    return `${PWC_API}?${params.toString()}`;
  }

  async fetch(): Promise<RawRecord[]> {
    const url = this.listUrl();
    log.info(`fetching ${url}`);
    try {
      const data = await this.client.getJson<PapersWithCodeResponse>(url);
      if (data === null) {
        log.warn('paperswithcode returned 404');
        return [];
      }
      const results = Array.isArray(data.results) ? data.results : [];
      return results.map((entry) => ({
        source: this.name,
        sourceId: entry.id,
        fetchedAt: new Date().toISOString(),
        data: entry as unknown as Record<string, unknown>,
      }));
    } catch (err) {
      log.error(`failed to fetch paperswithcode: ${(err as Error).message}`);
      return [];
    }
  }

  async normalize(raw: RawRecord[]): Promise<PaperEntity[]> {
    const out: PaperEntity[] = [];
    for (const record of raw) {
      const entry = record.data as unknown as NonNullable<
        PapersWithCodeResponse['results']
      >[number];
      const id = entry.id ?? record.sourceId;
      const slug = buildSlugFromSource('paper', id);
      const title = (entry.title ?? '').trim() || id;
      const abstract = (entry.abstract ?? '').replace(/\s+/g, ' ').trim();
      const description =
        abstract.length > 0 ? abstract : `${title} — paper listed on Papers With Code (${id}).`;
      const summary =
        description.length > 200 ? `${description.slice(0, 197).trimEnd()}...` : description;
      const publishedAt =
        (entry.published_at ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10);
      const links: { label: string; href: string }[] = [];
      if (entry.url_abs) links.push({ label: 'Papers With Code', href: entry.url_abs });
      if (entry.url_pdf) links.push({ label: 'PDF', href: entry.url_pdf });
      if (links.length === 0)
        links.push({ label: 'Papers With Code', href: `https://paperswithcode.com/paper/${id}` });
      const authors = Array.isArray(entry.authors) ? entry.authors.filter(Boolean) : [];
      const tags = ['paperswithcode'];
      if (entry.conference) tags.push(String(entry.conference).toLowerCase());
      const entity: PaperEntity = {
        type: 'paper',
        slug,
        name: title,
        summary,
        description,
        tags,
        externalLinks: links,
        timeline: [
          {
            date: publishedAt,
            type: 'paper',
            title: 'Listed on Papers With Code',
            description: entry.conference ? `Conference: ${entry.conference}.` : 'Public listing.',
            ...(entry.url_abs ? { href: entry.url_abs } : {}),
          },
        ],
        authors,
        paperId: id,
        publishedAt,
        ...(abstract ? { abstract } : {}),
      };
      out.push(entity);
      log.debug(`normalized ${id} -> ${buildTypedId('paper', slug)}`);
    }
    return out;
  }
}

const isDirectInvocation = ((): boolean => {
  if (typeof process === 'undefined') return false;
  const argv1 = process.argv[1];
  if (!argv1) return false;
  try {
    return import.meta.url === new URL(`file://${argv1}`).href;
  } catch {
    return false;
  }
})();

async function main(): Promise<void> {
  const connector = new PapersWithCodeConnector();
  const raw = await connector.fetch();
  const entities = await connector.normalize(raw);
  for (const entity of entities) {
    log.info(`paper ${buildTypedId('paper', entity.slug)}: ${entity.name}`);
  }
  log.info(`done: ${entities.length} papers normalized`);
}

if (isDirectInvocation) {
  main().catch((err: unknown) => {
    log.error((err as Error).message);
    process.exitCode = 1;
  });
}
