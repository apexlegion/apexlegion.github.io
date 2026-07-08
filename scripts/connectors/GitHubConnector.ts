/**
 * GitHub connector.
 *
 * Fetches public repository metadata via the GitHub REST API and normalizes
 * each repo into a `ProjectEntity` matching `src/lib/schemas/entity.ts`.
 *
 * - Source list is hardcoded for Milestone 4 (no discovery yet).
 * - Responses are cached on disk under `.cache/github/` so repeat runs are
 *   cheap and offline-tolerant.
 * - Honours `GITHUB_TOKEN` if present (raises the per-hour rate limit from
 *   60 to 5000 requests for unauthenticated calls).
 */

import { resolve } from 'node:path';
import { ApiClient } from '../lib/api.js';
import { FileCache } from '../lib/cache.js';
import { buildSlugFromSource, buildTypedId } from '../lib/id.js';
import { createLogger } from '../lib/logger.js';
import type { ProjectEntity, RawRecord } from '../lib/types.js';

const log = createLogger('github-connector');

const DEFAULT_REPOS: readonly string[] = [
  'ggerganov/llama.cpp',
  'ollama/ollama',
  'huggingface/transformers',
  'langchain-ai/langchain',
  'microsoft/DeepSpeed',
  'OpenBMB/MiniCPM',
  'Stability-AI/stablediffusion',
  'AUTOMATIC1111/stable-diffusion-webui',
  'openai/whisper',
  'comfyanonymous/ComfyUI',
];

const CACHE_DIR = resolve(process.cwd(), '.cache', 'github');
const USER_AGENT = 'ai-atlas-pipeline (+https://github.com/)';

interface GitHubLicense {
  key?: string;
  name?: string;
  spdx_id?: string;
}

interface GitHubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  license: GitHubLicense | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
  private: boolean;
  default_branch: string;
}

function repoApiUrl(ownerRepo: string): string {
  return `https://api.github.com/repos/${ownerRepo}`;
}

function pickCategory(topics: readonly string[], language: string | null): string {
  const lower = topics.map((t) => t.toLowerCase());
  const has = (kw: string): boolean => lower.some((t) => t.includes(kw));
  if (has('agent') || has('rag')) return 'Agents';
  if (has('image-generation') || has('stable-diffusion') || has('diffusion'))
    return 'Image Generation';
  if (has('audio') || has('speech') || has('whisper') || has('asr') || has('tts')) return 'Speech';
  if (has('llm') || has('language-model') || has('inference')) return 'Language Models';
  if (has('training') || has('framework') || has('pytorch') || has('transformer'))
    return 'Frameworks';
  if (language) {
    const lang = language.toLowerCase();
    if (lang === 'python' || lang === 'rust' || lang === 'c++' || lang === 'cuda')
      return 'Frameworks';
  }
  return 'Open Source';
}

function cleanTags(input: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
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

export class GitHubConnector {
  readonly name = 'github';
  readonly sources: readonly string[];
  private readonly client: ApiClient;

  constructor(repos: readonly string[] = DEFAULT_REPOS) {
    this.sources = repos;

    const cache = new FileCache(CACHE_DIR);
    const token = process.env.GITHUB_TOKEN ?? '';
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    if (token) {
      log.info('using authenticated GitHub requests');
    } else {
      log.warn('GITHUB_TOKEN not set; using unauthenticated requests (60/hour limit)');
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
      minIntervalMs: token ? 100 : 1500,
      cache,
      cacheTtlMs: 6 * 60 * 60 * 1000,
      fetchImpl,
    });
  }

  async fetch(): Promise<RawRecord[]> {
    const records: RawRecord[] = [];
    for (const repo of this.sources) {
      const url = repoApiUrl(repo);
      log.info(`fetching ${url}`);
      try {
        const data = await this.client.getJson<GitHubRepoResponse>(url);
        if (data === null) {
          log.warn(`404 for ${repo}; skipping`);
          continue;
        }
        records.push({
          source: this.name,
          sourceId: repo,
          fetchedAt: new Date().toISOString(),
          data: data as unknown as Record<string, unknown>,
        });
      } catch (err) {
        log.error(`failed to fetch ${repo}: ${(err as Error).message}`);
      }
    }
    return records;
  }

  async normalize(raw: RawRecord[]): Promise<ProjectEntity[]> {
    const out: ProjectEntity[] = [];
    for (const record of raw) {
      const repo = record.data as unknown as GitHubRepoResponse;
      const fullName = ensureNonEmpty(repo.full_name, record.sourceId);
      const slug = buildSlugFromSource('project', fullName);
      const description = ensureNonEmpty(repo.description, `${repo.name} on GitHub (${fullName}).`);
      const summary =
        description.length > 200 ? `${description.slice(0, 197).trimEnd()}...` : description;
      const topics = Array.isArray(repo.topics) ? repo.topics : [];
      const language = repo.language ?? null;
      const tags = cleanTags([...topics, ...(language ? [language] : [])]);
      const licenseId =
        repo.license?.spdx_id ?? repo.license?.key ?? repo.license?.name ?? undefined;
      const links: { label: string; href: string }[] = [
        { label: 'GitHub repository', href: repo.html_url },
      ];
      if (repo.homepage && repo.homepage.length > 0) {
        links.push({ label: 'Homepage', href: repo.homepage });
      }
      const createdAt = ensureNonEmpty(repo.created_at, new Date().toISOString());
      const pushedAt = ensureNonEmpty(repo.pushed_at, createdAt);
      const entity: ProjectEntity = {
        type: 'project',
        slug,
        name: ensureNonEmpty(repo.name, fullName),
        summary,
        description,
        tags,
        externalLinks: links,
        timeline: [
          {
            date: createdAt.slice(0, 10),
            type: 'release',
            title: 'Repository created',
            description: `Initial public commit on ${fullName}.`,
          },
          {
            date: pushedAt.slice(0, 10),
            type: 'update',
            title: 'Latest activity',
            description: `Most recent push recorded by the GitHub API.`,
          },
        ],
        category: pickCategory(topics, language),
        repository: repo.html_url,
        ...(licenseId ? { license: licenseId } : {}),
      };
      out.push(entity);
      log.debug(`normalized ${fullName} -> ${buildTypedId('project', slug)}`);
    }
    return out;
  }
}

// CLI entry: `pnpm run scrape:github` invokes this file directly.
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
  const connector = new GitHubConnector();
  const raw = await connector.fetch();
  const entities = await connector.normalize(raw);
  for (const entity of entities) {
    log.info(`project ${buildTypedId('project', entity.slug)}: ${entity.name}`);
  }
  log.info(`done: ${entities.length}/${connector.sources.length} projects normalized`);
}

if (isDirectInvocation) {
  main().catch((err: unknown) => {
    log.error((err as Error).message);
    process.exitCode = 1;
  });
}
