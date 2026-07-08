/**
 * Hugging Face connector.
 *
 * Fetches public model metadata via the Hugging Face Hub API and normalizes
 * each model into a `ModelEntity` matching `src/lib/schemas/entity.ts`.
 *
 * - Source list is hardcoded for Milestone 4 (no discovery yet).
 * - Responses are cached on disk under `.cache/huggingface/`.
 * - Honours `HF_TOKEN` if present for gated / private model endpoints.
 */

import { resolve } from 'node:path';
import { ApiClient } from '../lib/api.js';
import { FileCache } from '../lib/cache.js';
import { buildSlugFromSource, buildTypedId } from '../lib/id.js';
import { createLogger } from '../lib/logger.js';
import type { ModelEntity, RawRecord } from '../lib/types.js';

const log = createLogger('huggingface-connector');

const DEFAULT_MODELS: readonly string[] = [
  'meta-llama/Meta-Llama-3-8B',
  'mistralai/Mistral-7B-v0.1',
  'stabilityai/stable-diffusion-xl-base-1.0',
  'openai/whisper-large-v3',
  'sentence-transformers/all-MiniLM-L6-v2',
];

const CACHE_DIR = resolve(process.cwd(), '.cache', 'huggingface');
const USER_AGENT = 'ai-atlas-pipeline (+https://github.com/)';

interface HuggingFaceSafetensors {
  total?: number;
  parameters?: Record<string, number>;
}

interface HuggingFaceSibling {
  rfilename: string;
}

interface HuggingFaceCardData {
  license?: string;
  description?: string;
  [key: string]: unknown;
}

interface HuggingFaceModelResponse {
  id: string;
  modelId?: string;
  author?: string;
  sha?: string;
  pipeline_tag?: string | null;
  library_name?: string | null;
  tags?: string[];
  license?: string | null;
  cardData?: HuggingFaceCardData;
  siblings?: HuggingFaceSibling[];
  safetensors?: HuggingFaceSafetensors;
  downloads?: number;
  likes?: number;
  private?: boolean;
  gated?: boolean | string;
  lastModified?: string;
  createdAt?: string;
}

function modelApiUrl(id: string): string {
  return `https://huggingface.co/api/models/${id}`;
}

function modalityFor(pipelineTag: string | null | undefined): string {
  if (!pipelineTag) return 'Other';
  const tag = pipelineTag.toLowerCase();
  if (
    tag.includes('text-generation') ||
    tag.includes('text2text') ||
    tag.includes('summarization')
  ) {
    return 'Text';
  }
  if (
    tag.includes('text-to-image') ||
    tag.includes('image-to-image') ||
    tag.includes('image-generation')
  ) {
    return 'Image';
  }
  if (
    tag.includes('automatic-speech-recognition') ||
    tag.includes('text-to-speech') ||
    tag.includes('audio')
  ) {
    return 'Audio';
  }
  if (
    tag.includes('sentence-similarity') ||
    tag.includes('feature-extraction') ||
    tag.includes('embedding')
  ) {
    return 'Text';
  }
  if (tag.includes('fill-mask')) return 'Text';
  if (tag.includes('video')) return 'Video';
  if (tag.includes('multimodal')) return 'Multimodal';
  return 'Other';
}

function parametersFor(total: number | undefined): string | undefined {
  if (typeof total !== 'number' || !Number.isFinite(total) || total <= 0) return undefined;
  if (total >= 1e9) return `${(total / 1e9).toFixed(total % 1e9 === 0 ? 0 : 1)}B`;
  if (total >= 1e6) return `${(total / 1e6).toFixed(total % 1e6 === 0 ? 0 : 1)}M`;
  if (total >= 1e3) return `${(total / 1e3).toFixed(total % 1e3 === 0 ? 0 : 1)}K`;
  return String(total);
}

function licenseFromTags(tags: readonly string[]): string | undefined {
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    if (tag.toLowerCase().startsWith('license:')) {
      return tag.slice('license:'.length).trim() || undefined;
    }
  }
  return undefined;
}

function cleanTags(input: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const t = raw.trim().toLowerCase();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function ensureNonEmpty(value: string | null | undefined, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function displayName(id: string): string {
  const tail = id.split('/').pop() ?? id;
  return tail.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function publisherName(id: string): string {
  const head = id.split('/')[0] ?? id;
  if (!head) return 'Unknown';
  const cleaned = head.replace(/[-_]+/g, ' ').trim();
  if (!cleaned) return 'Unknown';
  return cleaned
    .split(' ')
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export class HuggingFaceConnector {
  readonly name = 'huggingface';
  readonly sources: readonly string[];
  private readonly client: ApiClient;

  constructor(models: readonly string[] = DEFAULT_MODELS) {
    this.sources = models;

    const cache = new FileCache(CACHE_DIR);
    const token = process.env.HF_TOKEN ?? '';
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    if (token) {
      log.info('using authenticated Hugging Face requests');
    } else {
      log.info('HF_TOKEN not set; using public unauthenticated requests');
    }

    const fetchImpl: typeof fetch = (input, init) => {
      // eslint-disable-next-line no-undef
      const reqInit: RequestInit = { ...(init ?? {}) };
      const incoming = (init?.headers ?? {}) as Record<string, string>;
      reqInit.headers = { ...incoming, ...authHeaders };
      return globalThis.fetch(input, reqInit);
    };

    this.client = new ApiClient({
      userAgent: USER_AGENT,
      minIntervalMs: 250,
      cache,
      cacheTtlMs: 6 * 60 * 60 * 1000,
      fetchImpl,
    });
  }

  async fetch(): Promise<RawRecord[]> {
    const records: RawRecord[] = [];
    for (const id of this.sources) {
      const url = modelApiUrl(id);
      log.info(`fetching ${url}`);
      try {
        const data = await this.client.getJson<HuggingFaceModelResponse>(url);
        if (data === null) {
          log.warn(`404 for ${id}; skipping`);
          continue;
        }
        records.push({
          source: this.name,
          sourceId: id,
          fetchedAt: new Date().toISOString(),
          data: data as unknown as Record<string, unknown>,
        });
      } catch (err) {
        log.error(`failed to fetch ${id}: ${(err as Error).message}`);
      }
    }
    return records;
  }

  async normalize(raw: RawRecord[]): Promise<ModelEntity[]> {
    const out: ModelEntity[] = [];
    for (const record of raw) {
      const m = record.data as unknown as HuggingFaceModelResponse;
      const id = ensureNonEmpty(m.id, record.sourceId);
      const slug = buildSlugFromSource('model', id);
      const tags = Array.isArray(m.tags) ? m.tags : [];
      const modality = modalityFor(m.pipeline_tag ?? null);
      const parameters = parametersFor(m.safetensors?.total);
      const license =
        (typeof m.license === 'string' && m.license.length > 0 ? m.license : undefined) ??
        (typeof m.cardData?.license === 'string' && m.cardData.license.length > 0
          ? m.cardData.license
          : undefined) ??
        licenseFromTags(tags);
      const publisher = publisherName(ensureNonEmpty(m.author ?? undefined, id));
      const name = displayName(id);
      const description =
        ensureNonEmpty(m.cardData?.description, '') ||
        `${name} is a ${modality.toLowerCase()} model on the Hugging Face Hub (${id}).`;
      const summary =
        description.length > 200 ? `${description.slice(0, 197).trimEnd()}...` : description;
      const hubUrl = `https://huggingface.co/${id}`;
      const links: { label: string; href: string }[] = [
        { label: 'Hugging Face model card', href: hubUrl },
      ];
      const createdAt = ensureNonEmpty(m.createdAt, new Date().toISOString());
      const lastModified = ensureNonEmpty(m.lastModified, createdAt);
      const entity: ModelEntity = {
        type: 'model',
        slug,
        name,
        summary,
        description,
        tags: cleanTags(tags),
        externalLinks: links,
        timeline: [
          {
            date: createdAt.slice(0, 10),
            type: 'release',
            title: 'Model uploaded',
            description: `First published on the Hugging Face Hub as ${id}.`,
          },
          {
            date: lastModified.slice(0, 10),
            type: 'update',
            title: 'Latest revision',
            description: `Most recent change recorded by the Hub API.`,
          },
        ],
        modality,
        ...(parameters ? { parameters } : {}),
        publishedBy: publisher,
        ...(license ? { license } : {}),
      };
      out.push(entity);
      log.debug(`normalized ${id} -> ${buildTypedId('model', slug)}`);
    }
    return out;
  }
}

// CLI entry: `pnpm run scrape:huggingface` invokes this file directly.
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
  const connector = new HuggingFaceConnector();
  const raw = await connector.fetch();
  const entities = await connector.normalize(raw);
  for (const entity of entities) {
    log.info(`model ${buildTypedId('model', entity.slug)}: ${entity.name}`);
  }
  log.info(`done: ${entities.length}/${connector.sources.length} models normalized`);
}

if (isDirectInvocation) {
  main().catch((err: unknown) => {
    log.error((err as Error).message);
    process.exitCode = 1;
  });
}
