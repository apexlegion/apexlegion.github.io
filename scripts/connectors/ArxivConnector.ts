/**
 * arXiv connector.
 *
 * Fetches AI-related papers from the public arXiv API
 * (http://export.arxiv.org/api/query) and normalizes each entry into a
 * `PaperEntity` matching `src/lib/schemas/entity.ts`.
 *
 * - The default category is `cs.AI` (Artificial Intelligence) and the default
 *   page size is 20 results, matching the public-facing page.
 * - Responses are cached on disk under `.cache/arxiv/` so repeat runs are
 *   cheap and offline-tolerant.
 * - Uses `ApiClient.getText` (arXiv returns Atom XML, not JSON) and stores
 *   the raw payload under `RawRecord.data` as a string.
 */

import { resolve } from 'node:path';
import { ApiClient } from '../lib/api.js';
import { FileCache } from '../lib/cache.js';
import { buildSlugFromSource, buildTypedId } from '../lib/id.js';
import { createLogger } from '../lib/logger.js';
import type { PaperEntity, RawRecord } from '../lib/types.js';

const log = createLogger('arxiv-connector');

const ARXIV_API = 'http://export.arxiv.org/api/query';
const DEFAULT_CATEGORY = 'cs.AI';
const DEFAULT_MAX_RESULTS = 20;
const CACHE_DIR = resolve(process.cwd(), '.cache', 'arxiv');
const USER_AGENT = 'ai-atlas-pipeline (+https://github.com/)';

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  publishedAt: string;
  category: string;
  link: string;
}

function arxivQueryUrl(category: string, maxResults: number): string {
  const params = new URLSearchParams({
    search_query: `cat:${category}`,
    max_results: String(maxResults),
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  });
  return `${ARXIV_API}?${params.toString()}`;
}

/**
 * Minimal Atom parser — extracts `<entry>` blocks and their child fields
 * using regex-based tag extraction. The arXiv Atom feed is small and
 * well-formed, so a full DOM parser is overkill here. If an entry is
 * malformed it is silently dropped.
 */
export function parseArxivAtom(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  const tagRe = (tag: string): RegExp => new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const altLinkRe = /<link[^>]*rel="alternate"[^>]*href="([^"]+)"[^>]*\/?>(?!\s*<\/link>)/i;
  const firstLinkRe = /<link[^>]*href="([^"]+)"[^>]*\/?>(?!\s*<\/link>)/i;
  const idTextRe = /<id>([\s\S]*?)<\/id>/i;

  let match = entryRe.exec(xml);
  while (match !== null) {
    const block = match[1] ?? '';
    const idMatch = idTextRe.exec(block);
    const titleMatch = tagRe('title').exec(block);
    const summaryMatch = tagRe('summary').exec(block);
    const publishedMatch = tagRe('published').exec(block);
    const altLinkMatch = altLinkRe.exec(block);
    const firstLinkMatch = firstLinkRe.exec(block);

    if (!idMatch || !titleMatch || !publishedMatch) {
      match = entryRe.exec(xml);
      continue;
    }

    const idRaw = (idMatch[1] ?? '').trim();
    const titleRaw = (titleMatch[1] ?? '').replace(/\s+/g, ' ').trim();
    const summaryRaw = (summaryMatch?.[1] ?? '').replace(/\s+/g, ' ').trim();
    const publishedAt = (publishedMatch[1] ?? '').trim().slice(0, 10);

    // arXiv ids appear at the end of the <id> URL, e.g. http://arxiv.org/abs/2501.12345v1
    const idParts = idRaw.split('/');
    const arxivId = (idParts[idParts.length - 1] ?? idRaw).replace(/v\d+$/, '');

    const authors: string[] = [];
    const authorRe = /<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g;
    let a = authorRe.exec(block);
    while (a !== null) {
      const name = (a[1] ?? '').replace(/\s+/g, ' ').trim();
      if (name) authors.push(name);
      a = authorRe.exec(block);
    }

    const categoryRe = /<category[^>]*term="([^"]+)"/i;
    const categoryMatch = categoryRe.exec(block);
    const category = categoryMatch?.[1] ?? DEFAULT_CATEGORY;

    const link = (altLinkMatch?.[1] ?? firstLinkMatch?.[1] ?? `https://arxiv.org/abs/${arxivId}`)
      .replace(/\s+/g, '')
      .trim();

    if (!arxivId || !titleRaw || !publishedAt) {
      match = entryRe.exec(xml);
      continue;
    }

    entries.push({
      id: arxivId,
      title: titleRaw,
      summary: summaryRaw,
      authors,
      publishedAt,
      category,
      link,
    });
    match = entryRe.exec(xml);
  }
  return entries;
}

function ensureNonEmpty(value: string | null | undefined, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function trimAbstract(text: string, max = 600): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 3).trimEnd()}...`;
}

export class ArxivConnector {
  readonly name = 'arxiv';
  readonly sources: readonly string[];
  private readonly client: ApiClient;
  private readonly maxResults: number;
  private readonly queryUrl: string;

  constructor(category: string = DEFAULT_CATEGORY, maxResults: number = DEFAULT_MAX_RESULTS) {
    this.sources = [category];
    this.maxResults = maxResults;
    this.queryUrl = arxivQueryUrl(category, maxResults);

    const cache = new FileCache(CACHE_DIR);
    this.client = new ApiClient({
      userAgent: USER_AGENT,
      minIntervalMs: 3000, // arXiv asks for >= 3s between requests.
      cache,
      cacheTtlMs: 6 * 60 * 60 * 1000,
    });
  }

  async fetch(): Promise<RawRecord[]> {
    log.info(`fetching ${this.queryUrl}`);
    try {
      const xml = await this.client.getText(this.queryUrl);
      if (xml === null) {
        log.warn('arxiv returned 404');
        return [];
      }
      const entries = parseArxivAtom(xml);
      return entries.map((entry) => ({
        source: this.name,
        sourceId: entry.id,
        fetchedAt: new Date().toISOString(),
        data: {
          ...entry,
          raw: xml,
        },
      }));
    } catch (err) {
      log.error(`failed to fetch arxiv: ${(err as Error).message}`);
      return [];
    }
  }

  async normalize(raw: RawRecord[]): Promise<PaperEntity[]> {
    const out: PaperEntity[] = [];
    for (const record of raw) {
      const entry = record.data as unknown as ArxivEntry;
      const id = ensureNonEmpty(entry.id, record.sourceId);
      const slug = buildSlugFromSource('paper', id);
      const title = ensureNonEmpty(entry.title, id);
      const abstract = trimAbstract(entry.summary ?? '');
      const description =
        abstract.length > 0 ? abstract : `${title} — paper retrieved from arXiv (${id}).`;
      const summary =
        description.length > 200 ? `${description.slice(0, 197).trimEnd()}...` : description;
      const links = [
        { label: 'arXiv abstract', href: entry.link ?? `https://arxiv.org/abs/${id}` },
      ];
      const entity: PaperEntity = {
        type: 'paper',
        slug,
        name: title,
        summary,
        description,
        tags: ['arxiv', entry.category].filter(Boolean),
        externalLinks: links,
        timeline: [
          {
            date: entry.publishedAt,
            type: 'paper',
            title: 'Published on arXiv',
            description: `Listed in category ${entry.category}.`,
            ...(entry.link ? { href: entry.link } : {}),
          },
        ],
        authors: Array.isArray(entry.authors) ? entry.authors : [],
        paperId: id,
        ...(entry.category ? { category: entry.category } : {}),
        publishedAt: entry.publishedAt,
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
  const connector = new ArxivConnector();
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
