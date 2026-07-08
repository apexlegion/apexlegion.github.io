/**
 * Canonical ID generation for AI Atlas entities.
 *
 * IDs are deterministic, lowercase, kebab-case, and stable across pipeline runs.
 * A canonical slug is the public identifier used in URLs and relation references.
 * A typed ID combines an entity type with a slug (e.g. "project/llama-cpp").
 */

import type { EntityType } from './types.js';

/**
 * Convert a free-form string into a canonical slug.
 *
 * - Lowercases
 * - Replaces any non-alphanumeric character with `-`
 * - Collapses and trims repeated dashes
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a canonical slug from source-specific identifiers.
 *
 * GitHub: `owner/repo` → `owner-repo`.
 * Hugging Face: `org/name` → `org-name`.
 */
export function buildSlugFromSource(type: EntityType, sourceId: string): string {
  const normalized = sourceId.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
  return toSlug(normalized);
}

/**
 * Build a typed ID such as `project/llama-cpp` or `model/llama-3`.
 */
export function buildTypedId(type: EntityType, slug: string): string {
  return `${type}/${slug}`;
}

/**
 * Parse a typed ID back into its components.
 */
export function parseTypedId(typedId: string): { type: EntityType; slug: string } | null {
  const idx = typedId.indexOf('/');
  if (idx <= 0 || idx >= typedId.length - 1) return null;
  const type = typedId.slice(0, idx);
  const slug = typedId.slice(idx + 1);
  if (!isEntityType(type)) return null;
  return { type, slug };
}

const ENTITY_TYPES: readonly EntityType[] = ['project', 'model', 'concept', 'tutorial'];

export function isEntityType(value: string): value is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(value);
}

export const ENTITY_TYPES_LIST = ENTITY_TYPES;
