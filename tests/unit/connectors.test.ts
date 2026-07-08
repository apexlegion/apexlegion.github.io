import { describe, expect, it } from 'vitest';
import { GitHubConnector } from '@/../scripts/connectors/GitHubConnector';
import { HuggingFaceConnector } from '@/../scripts/connectors/HuggingFaceConnector';
import { ArxivConnector, parseArxivAtom } from '@/../scripts/connectors/ArxivConnector';
import { PapersWithCodeConnector } from '@/../scripts/connectors/PapersWithCodeConnector';
import { RssConnector, parseRss } from '@/../scripts/connectors/RssConnector';
import { buildSlugFromSource, buildTypedId, parseTypedId, toSlug } from '@/../scripts/lib/id';

describe('slug and typed-id helpers', () => {
  it('lowercases and dashes non-alphanumeric runs', () => {
    expect(toSlug('Hello World!! Foo-Bar')).toBe('hello-world-foo-bar');
  });

  it('collapses repeated dashes and trims edges', () => {
    expect(toSlug('  --a--b--  ')).toBe('a-b');
  });

  it('builds a canonical slug from a GitHub owner/repo', () => {
    expect(buildSlugFromSource('project', 'ggerganov/llama.cpp')).toBe('ggerganov-llama-cpp');
  });

  it('builds a canonical slug from a Hugging Face id', () => {
    expect(buildSlugFromSource('model', 'meta-llama/Meta-Llama-3-8B')).toBe(
      'meta-llama-meta-llama-3-8b',
    );
  });

  it('strips scheme prefix when building slugs', () => {
    expect(buildSlugFromSource('project', 'https://github.com/foo/bar')).toBe('foo-bar');
  });

  it('builds and parses a typed id', () => {
    const typed = buildTypedId('project', 'llama-cpp');
    expect(typed).toBe('project/llama-cpp');
    expect(parseTypedId(typed)).toEqual({ type: 'project', slug: 'llama-cpp' });
  });

  it('returns null for invalid typed ids', () => {
    expect(parseTypedId('not-typed')).toBeNull();
    expect(parseTypedId('unknown/x')).toBeNull();
  });
});

describe('GitHubConnector.normalize', () => {
  const connector = new GitHubConnector(['ggerganov/llama.cpp']);

  it('produces a valid ProjectEntity from a representative raw record', async () => {
    const raw = [
      {
        source: 'github',
        sourceId: 'ggerganov/llama.cpp',
        fetchedAt: '2026-07-06T00:00:00.000Z',
        data: {
          id: 1,
          name: 'llama.cpp',
          full_name: 'ggerganov/llama.cpp',
          description: 'LLM inference in C/C++',
          html_url: 'https://github.com/ggerganov/llama.cpp',
          homepage: '',
          language: 'C++',
          topics: ['llm', 'inference', 'cpp'],
          stargazers_count: 70000,
          forks_count: 10000,
          open_issues_count: 500,
          license: { spdx_id: 'MIT' },
          created_at: '2023-03-10T00:00:00Z',
          updated_at: '2025-09-18T00:00:00Z',
          pushed_at: '2025-09-18T00:00:00Z',
          archived: false,
          fork: false,
          private: false,
          default_branch: 'master',
        },
      },
    ];

    const entities = await connector.normalize(raw);
    expect(entities).toHaveLength(1);
    const entity = entities[0]!;
    expect(entity.type).toBe('project');
    expect(entity.slug).toBe('ggerganov-llama-cpp');
    expect(entity.name).toBe('llama.cpp');
    expect(entity.category).toMatch(/language models|inference|frameworks/i);
    expect(entity.tags).toEqual(expect.arrayContaining(['llm', 'inference', 'cpp']));
    expect(entity.license).toBe('MIT');
    expect(entity.externalLinks[0]?.href).toBe('https://github.com/ggerganov/llama.cpp');
    expect(entity.timeline.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back gracefully when description is missing', async () => {
    const raw = [
      {
        source: 'github',
        sourceId: 'someone/something',
        fetchedAt: '2026-07-06T00:00:00.000Z',
        data: {
          id: 2,
          name: 'something',
          full_name: 'someone/something',
          description: null,
          html_url: 'https://github.com/someone/something',
          homepage: null,
          language: null,
          topics: [],
          license: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          pushed_at: '2024-01-02T00:00:00Z',
          archived: false,
          fork: false,
          private: false,
          default_branch: 'main',
        },
      },
    ];

    const entities = await connector.normalize(raw);
    expect(entities).toHaveLength(1);
    const entity = entities[0]!;
    expect(entity.summary.length).toBeGreaterThan(0);
    expect(entity.description.length).toBeGreaterThan(0);
    expect(entity.tags).toEqual([]);
  });
});

describe('HuggingFaceConnector.normalize', () => {
  const connector = new HuggingFaceConnector(['meta-llama/Meta-Llama-3-8B']);

  it('produces a valid ModelEntity from a representative raw record', async () => {
    const raw = [
      {
        source: 'huggingface',
        sourceId: 'meta-llama/Meta-Llama-3-8B',
        fetchedAt: '2026-07-06T00:00:00.000Z',
        data: {
          id: 'meta-llama/Meta-Llama-3-8B',
          author: 'meta-llama',
          pipeline_tag: 'text-generation',
          library_name: 'transformers',
          tags: ['llama', 'text-generation', 'license:llama3'],
          license: 'llama3',
          cardData: { description: 'Meta Llama 3 8B base model.' },
          safetensors: { total: 8_030_000_000 },
          downloads: 100000,
          likes: 5000,
          private: false,
          gated: false,
          lastModified: '2025-06-01T00:00:00Z',
          createdAt: '2024-04-18T00:00:00Z',
        },
      },
    ];

    const entities = await connector.normalize(raw);
    expect(entities).toHaveLength(1);
    const entity = entities[0]!;
    expect(entity.type).toBe('model');
    expect(entity.modality).toBe('Text');
    expect(entity.parameters).toBe('8.0B');
    expect(entity.publishedBy).toBe('Meta Llama');
    expect(entity.tags).toContain('text-generation');
  });

  it('handles missing parameters and license gracefully', async () => {
    const raw = [
      {
        source: 'huggingface',
        sourceId: 'someone/model',
        fetchedAt: '2026-07-06T00:00:00.000Z',
        data: {
          id: 'someone/model',
          author: 'someone',
          pipeline_tag: 'feature-extraction',
          tags: ['embedding'],
          cardData: {},
          createdAt: '2024-01-01T00:00:00Z',
          lastModified: '2024-01-02T00:00:00Z',
        },
      },
    ];

    const entities = await connector.normalize(raw);
    expect(entities).toHaveLength(1);
    const entity = entities[0]!;
    expect(entity.parameters).toBeUndefined();
    expect(entity.license).toBeUndefined();
    expect(entity.modality).toBe('Text');
  });
});

describe('ArxivConnector', () => {
  const connector = new ArxivConnector();

  it('parses an Atom XML entry into an ArxivEntry', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2501.12345v1</id>
    <title>Sample Paper: AI Agents in the Wild</title>
    <summary>We study agents in production.</summary>
    <published>2025-01-15T00:00:00Z</published>
    <author><name>Jane Doe</name></author>
    <author><name>John Smith</name></author>
    <category term="cs.AI" />
    <link rel="alternate" href="http://arxiv.org/abs/2501.12345v1" />
  </entry>
</feed>`;
    const entries = parseArxivAtom(xml);
    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.id).toBe('2501.12345');
    expect(entry.title).toContain('Sample Paper');
    expect(entry.authors).toEqual(['Jane Doe', 'John Smith']);
    expect(entry.publishedAt).toBe('2025-01-15');
    expect(entry.category).toBe('cs.AI');
  });

  it('normalizes a raw arxiv entry into a PaperEntity', async () => {
    const raw = [
      {
        source: 'arxiv',
        sourceId: '2501.12345',
        fetchedAt: '2026-07-06T00:00:00.000Z',
        data: {
          id: '2501.12345',
          title: 'Sample Paper',
          summary: 'An abstract describing the work.',
          authors: ['Jane Doe'],
          publishedAt: '2025-01-15',
          category: 'cs.AI',
          link: 'https://arxiv.org/abs/2501.12345',
        },
      },
    ];
    const entities = await connector.normalize(raw);
    expect(entities).toHaveLength(1);
    const entity = entities[0]!;
    expect(entity.type).toBe('paper');
    expect(entity.paperId).toBe('2501.12345');
    expect(entity.publishedAt).toBe('2025-01-15');
    expect(entity.authors).toEqual(['Jane Doe']);
    expect(entity.tags).toEqual(expect.arrayContaining(['arxiv', 'cs.AI']));
    expect(entity.externalLinks[0]?.href).toBe('https://arxiv.org/abs/2501.12345');
  });
});

describe('PapersWithCodeConnector.normalize', () => {
  const connector = new PapersWithCodeConnector();

  it('produces a PaperEntity from a representative raw record', async () => {
    const raw = [
      {
        source: 'paperswithcode',
        sourceId: 'abc123',
        fetchedAt: '2026-07-06T00:00:00.000Z',
        data: {
          id: 'abc123',
          title: 'A Survey of AI Agents',
          abstract: 'A broad look at AI agents.',
          authors: ['Alice', 'Bob'],
          published_at: '2025-03-10',
          url_abs: 'https://paperswithcode.com/paper/a-survey-of-ai-agents',
          url_pdf: 'https://paperswithcode.com/paper/a-survey-of-ai-agents/pdf',
          conference: 'NeurIPS',
        },
      },
    ];
    const entities = await connector.normalize(raw);
    expect(entities).toHaveLength(1);
    const entity = entities[0]!;
    expect(entity.type).toBe('paper');
    expect(entity.paperId).toBe('abc123');
    expect(entity.publishedAt).toBe('2025-03-10');
    expect(entity.authors).toEqual(['Alice', 'Bob']);
    expect(entity.tags).toEqual(expect.arrayContaining(['paperswithcode', 'neurips']));
    expect(entity.externalLinks.map((l) => l.href)).toEqual(
      expect.arrayContaining([
        'https://paperswithcode.com/paper/a-survey-of-ai-agents',
        'https://paperswithcode.com/paper/a-survey-of-ai-agents/pdf',
      ]),
    );
  });

  it('falls back when optional fields are missing', async () => {
    const raw = [
      {
        source: 'paperswithcode',
        sourceId: 'minimal',
        fetchedAt: '2026-07-06T00:00:00.000Z',
        data: { id: 'minimal' },
      },
    ];
    const entities = await connector.normalize(raw);
    expect(entities).toHaveLength(1);
    const entity = entities[0]!;
    expect(entity.paperId).toBe('minimal');
    expect(entity.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entity.externalLinks[0]?.href).toContain('paperswithcode.com/paper/minimal');
  });
});

describe('RssConnector', () => {
  const feed = { id: 'test-feed', url: 'https://example.com/feed.xml', source: 'Test Source' };
  const connector = new RssConnector([feed]);

  it('parses an RSS XML feed into items', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <item>
      <title>First Post</title>
      <link>https://example.com/post-1</link>
      <description>Hello world.</description>
      <pubDate>Mon, 15 Jan 2025 00:00:00 GMT</pubDate>
      <guid>https://example.com/post-1</guid>
    </item>
  </channel>
</rss>`;
    const items = parseRss(xml, feed);
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.title).toBe('First Post');
    expect(item.link).toBe('https://example.com/post-1');
    expect(item.publishedAt).toBe('2025-01-15');
    expect(item.feedId).toBe('test-feed');
  });

  it('normalizes an RSS raw record into a NewsEntity with expiryAt', async () => {
    const raw = [
      {
        source: 'rss',
        sourceId: 'test-feed:https://example.com/post-1',
        fetchedAt: '2026-07-06T00:00:00.000Z',
        data: {
          guid: 'test-feed:https://example.com/post-1',
          title: 'First Post',
          link: 'https://example.com/post-1',
          description: 'A short description of the post.',
          publishedAt: '2025-01-15',
          feedId: 'test-feed',
          source: 'Test Source',
        },
        extra: { feedId: 'test-feed', source: 'Test Source' },
      },
    ];
    const entities = await connector.normalize(raw);
    expect(entities).toHaveLength(1);
    const entity = entities[0]!;
    expect(entity.type).toBe('news');
    expect(entity.source).toBe('Test Source');
    expect(entity.publishedAt).toBe('2025-01-15');
    expect(entity.expiryAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(entity.expiryAt).getTime()).toBeGreaterThan(new Date('2025-01-15').getTime());
  });
});
