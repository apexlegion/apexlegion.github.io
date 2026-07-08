/**
 * RSS connector.
 *
 * Fetches AI news from a small set of curated RSS feeds and normalizes each
 * item into a `NewsEntity` matching `src/lib/schemas/entity.ts`.
 *
 * - The feed list is hardcoded for Phase 2 (no discovery yet).
 * - Each entry's `expiryAt` is set to `publishedAt + 30 days`.
 * - Responses are cached on disk under `.cache/rss/` so repeat runs are
 *   cheap and offline-tolerant.
 */

import { resolve } from 'node:path';
import { ApiClient } from '../lib/api.js';
import { FileCache } from '../lib/cache.js';
import { buildSlugFromSource, buildTypedId } from '../lib/id.js';
import { createLogger } from '../lib/logger.js';
import type { NewsEntity, RawRecord } from '../lib/types.js';

const log = createLogger('rss-connector');

const CACHE_DIR = resolve(process.cwd(), '.cache', 'rss');
const USER_AGENT = 'ai-atlas-pipeline (+https://github.com/)';
const DEFAULT_EXPIRY_DAYS = 30;

interface RssFeed {
  readonly id: string;
  readonly url: string;
  readonly source: string;
}

const DEFAULT_FEEDS: readonly RssFeed[] = [
  {
    id: 'mit-news-ai',
    url: 'https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml',
    source: 'MIT News',
  },
  {
    id: 'google-ai-blog',
    url: 'https://blog.google/technology/ai/rss/',
    source: 'Google AI Blog',
  },
  {
    id: 'openai-blog',
    url: 'https://openai.com/blog/rss.xml',
    source: 'OpenAI Blog',
  },
  {
    id: 'huggingface-blog',
    url: 'https://huggingface.co/blog/feed.xml',
    source: 'Hugging Face Blog',
  },
  {
    id: 'arxiv-cs-ai',
    url: 'https://export.arxiv.org/rss/cs.AI',
    source: 'arXiv cs.AI',
  },
];

export interface RssItem {
  guid: string;
  title: string;
  link: string;
  description: string;
  publishedAt: string;
  author?: string;
  feedId: string;
  source: string;
}

function stripCdata(text: string): string {
  return text.replace(/^<!\[CDATA\[(.*?)\]\]>$/s, '$1');
}

function extractTag(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(block);
  if (!m) return undefined;
  return stripCdata((m[1] ?? '').replace(/<!\[CDATA\[|\]\]>/g, ''));
}

/**
 * Minimal RSS/Atom parser — extracts `<item>` blocks (RSS) or `<entry>`
 * blocks (Atom) and returns them as `RssItem` records. Falls back to the
 * feed's top-level `<link>` if an item-level link is missing.
 */
export function parseRss(xml: string, feed: RssFeed): RssItem[] {
  const items: RssItem[] = [];

  // RSS <channel><link> fallback.
  const channelLinkMatch = /<channel>[\s\S]*?<link>([\s\S]*?)<\/link>/i.exec(xml);
  const channelLink = channelLinkMatch
    ? stripCdata((channelLinkMatch[1] ?? '').replace(/<!\[CDATA\[|\]\]>/g, '')).trim()
    : '';

  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  const blocks: RegExpExecArray[] = [];
  let m = itemRe.exec(xml);
  while (m !== null) {
    blocks.push(m);
    m = itemRe.exec(xml);
  }
  if (blocks.length === 0) {
    m = entryRe.exec(xml);
    while (m !== null) {
      blocks.push(m);
      m = entryRe.exec(xml);
    }
  }

  for (const block of blocks) {
    const body = block[1] ?? '';
    const title = (extractTag(body, 'title') ?? '').trim();
    const description = (extractTag(body, 'description') ?? extractTag(body, 'summary') ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const link = (extractTag(body, 'link') ?? channelLink ?? '').trim();
    const guid = (extractTag(body, 'guid') ?? link ?? title).trim();
    const pubRaw = extractTag(body, 'pubDate') ?? extractTag(body, 'published') ?? '';
    const publishedAt = parseRssDate(pubRaw);
    const author =
      extractTag(body, 'author') ??
      extractTag(body, 'dc:creator') ??
      extractTag(body, 'dc\\:creator');

    if (!title || !link || !publishedAt) continue;

    items.push({
      guid: `${feed.id}:${guid}`,
      title,
      link,
      description,
      publishedAt,
      ...(author ? { author: author.trim() } : {}),
      feedId: feed.id,
      source: feed.source,
    });
  }
  return items;
}

function parseRssDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // RFC822 / RFC3339 — fall back to Date.parse which handles both.
  const t = Date.parse(trimmed);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const base = isoDate.length === 10 ? `${isoDate}T00:00:00.000Z` : isoDate;
  const t = Date.parse(base);
  if (Number.isNaN(t)) return new Date().toISOString();
  return new Date(t + days * 24 * 60 * 60 * 1000).toISOString();
}

function trimDescription(text: string, max = 400): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 3).trimEnd()}...`;
}

export class RssConnector {
  readonly name = 'rss';
  readonly sources: readonly string[];
  private readonly client: ApiClient;
  private readonly feeds: readonly RssFeed[];
  private readonly expiryDays: number;

  constructor(feeds: readonly RssFeed[] = DEFAULT_FEEDS, expiryDays: number = DEFAULT_EXPIRY_DAYS) {
    this.feeds = feeds;
    this.sources = feeds.map((f) => f.id);
    this.expiryDays = expiryDays;

    const cache = new FileCache(CACHE_DIR);
    this.client = new ApiClient({
      userAgent: USER_AGENT,
      minIntervalMs: 1000,
      cache,
      cacheTtlMs: 60 * 60 * 1000,
    });
  }

  async fetch(): Promise<RawRecord[]> {
    const records: RawRecord[] = [];
    for (const feed of this.feeds) {
      log.info(`fetching feed ${feed.id}: ${feed.url}`);
      try {
        const xml = await this.client.getText(feed.url);
        if (xml === null) {
          log.warn(`404 for feed ${feed.id}; skipping`);
          continue;
        }
        const items = parseRss(xml, feed);
        for (const item of items) {
          records.push({
            source: this.name,
            sourceId: item.guid,
            fetchedAt: new Date().toISOString(),
            data: item as unknown as Record<string, unknown>,
            extra: { feedId: feed.id, source: feed.source },
          });
        }
      } catch (err) {
        log.error(`failed to fetch feed ${feed.id}: ${(err as Error).message}`);
      }
    }
    return records;
  }

  async normalize(raw: RawRecord[]): Promise<NewsEntity[]> {
    const out: NewsEntity[] = [];
    for (const record of raw) {
      const item = record.data as unknown as RssItem;
      const id = item.guid || record.sourceId;
      const slug = buildSlugFromSource('news', id);
      const title = (item.title ?? '').trim() || id;
      const description = trimDescription(item.description ?? '');
      const summary =
        description.length > 200
          ? `${description.slice(0, 197).trimEnd()}...`
          : description || title;
      const fullDescription = description.length > 0 ? description : title;
      const publishedAt = item.publishedAt;
      const expiryAt = addDays(publishedAt, this.expiryDays);
      const links = [{ label: item.source ?? 'Source', href: item.link }];
      const entity: NewsEntity = {
        type: 'news',
        slug,
        name: title,
        summary,
        description: fullDescription,
        tags: ['news', (item.feedId ?? 'rss').toString()],
        externalLinks: links,
        timeline: [
          {
            date: publishedAt,
            type: 'milestone',
            title: 'Published',
            description: `Posted by ${item.source}.`,
            href: item.link,
          },
        ],
        source: item.source ?? 'RSS',
        publishedAt,
        expiryAt,
        ...(item.author ? { author: item.author } : {}),
      };
      out.push(entity);
      log.debug(`normalized ${id} -> ${buildTypedId('news', slug)}`);
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
  const connector = new RssConnector();
  const raw = await connector.fetch();
  const entities = await connector.normalize(raw);
  for (const entity of entities) {
    log.info(`news ${buildTypedId('news', entity.slug)}: ${entity.name}`);
  }
  log.info(`done: ${entities.length} news items normalized`);
}

if (isDirectInvocation) {
  main().catch((err: unknown) => {
    log.error((err as Error).message);
    process.exitCode = 1;
  });
}
