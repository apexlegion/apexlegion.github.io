import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

function readJson(relativePath: string) {
  const text = readFileSync(resolve(repoRoot, relativePath), 'utf8');
  return JSON.parse(text) as Record<string, unknown>;
}

function readText(relativePath: string) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

describe('PWA web app manifest', () => {
  const manifest = readJson('public/manifest.json');

  it('declares the AI Atlas branding', () => {
    expect(manifest.name).toBe('AI Atlas');
    expect(manifest.short_name).toBe('AI Atlas');
    expect(manifest.description).toBe('The definitive Open Source AI knowledge platform.');
    expect(manifest.lang).toBe('en');
  });

  it('configures standalone display and Atlas theme colours', () => {
    // The site deploys as a GitHub Pages project page under /aiatlas/, and
    // manifest.json is a static file, so the subpath is baked in.
    expect(manifest.start_url).toBe('/aiatlas/');
    expect(manifest.scope).toBe('/aiatlas/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#0B0B0B');
    expect(manifest.theme_color).toBe('#FF6A00');
  });

  it('exposes a maskable 192x192 and 512x512 icon pointing at favicon.svg', () => {
    const icons = manifest.icons as Array<{
      src: string;
      sizes: string;
      type: string;
      purpose?: string;
    }>;
    expect(Array.isArray(icons)).toBe(true);
    expect(icons).toHaveLength(2);

    const sizes = icons.map((i) => i.sizes).sort();
    expect(sizes).toEqual(['192x192', '512x512']);

    for (const icon of icons) {
      expect(icon.src).toBe('/aiatlas/favicon.svg');
      expect(icon.type).toBe('image/svg+xml');
      expect(icon.purpose ?? '').toMatch(/maskable/);
    }
  });
});

describe('PWA service worker', () => {
  const sw = readText('public/sw.js');

  it('uses versioned cache names (cache-name-vN format)', () => {
    // Require the literal cache identifiers to follow `name-vN`.
    expect(sw).toMatch(/['"]app-shell-v\d+['"]/);
    expect(sw).toMatch(/['"]runtime-v\d+['"]/);
  });

  it('precaches the app shell on install, relative to the deploy base', () => {
    expect(sw).toMatch(/addEventListener\(\s*['"]install['"]/);
    // The SW derives its base path from its own registration scope at runtime
    // so the precache list survives deploys under any subpath.
    expect(sw).toMatch(/self\.registration\.scope/);
    expect(sw).toMatch(/\$\{BASE\}\/`?/);
    expect(sw).toMatch(/\$\{BASE\}\/offline/);
    expect(sw).toMatch(/\$\{BASE\}\/favicon\.svg/);
  });

  it('handles fetch and activate events', () => {
    expect(sw).toMatch(/addEventListener\(\s*['"]fetch['"]/);
    expect(sw).toMatch(/addEventListener\(\s*['"]activate['"]/);
    expect(sw).toMatch(/caches\.delete\(/);
  });

  it('falls back to the offline page on failed navigation', () => {
    expect(sw).toMatch(/\$\{BASE\}\/offline/);
    expect(sw).toMatch(/offlineFallback/);
  });
});
