#!/usr/bin/env node
/**
 * Generate the static Fuse.js search index used by CommandPalette.
 *
 * Reads all seed data through the data-layer helpers and writes
 * public/search-index.json so the fallback search matches the current
 * entity set (projects, models, concepts, tutorials, jobs, events, news).
 */
import { writeFileSync } from 'node:fs';
import { getSearchIndexItems } from '../src/lib/data/entities';

const items = getSearchIndexItems();
writeFileSync('public/search-index.json', JSON.stringify(items, null, 2) + '\n', 'utf-8');
// eslint-disable-next-line no-console
console.log(`Wrote public/search-index.json with ${items.length} items`);
