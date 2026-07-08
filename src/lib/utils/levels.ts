/**
 * Canonical Explain Like I'm... level identifiers and metadata.
 *
 * Used by the LevelSwitcher component, by content frontmatter, and by the
 * indexer to find level-specific content.
 */

export const LEVEL_IDS = [
  'twelve',
  'beginner',
  'student',
  'developer',
  'researcher',
  'business',
] as const;

export type LevelId = (typeof LEVEL_IDS)[number];

export interface LevelMeta {
  id: LevelId;
  label: string;
  description: string;
}

export const LEVELS: readonly LevelMeta[] = [
  {
    id: 'twelve',
    label: "Like I'm 12",
    description: 'Plain language with everyday analogies.',
  },
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Gentle introduction with key terms defined.',
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Structured learning with examples and exercises.',
  },
  {
    id: 'developer',
    label: 'Developer',
    description: 'Technical depth with code and APIs.',
  },
  {
    id: 'researcher',
    label: 'Researcher',
    description: 'Papers, references, and frontier context.',
  },
  {
    id: 'business',
    label: 'Business',
    description: 'Decisions, costs, risks, and outcomes.',
  },
];

export function isLevelId(value: unknown): value is LevelId {
  return typeof value === 'string' && (LEVEL_IDS as readonly string[]).includes(value);
}

export function getLevel(id: LevelId): LevelMeta {
  const meta = LEVELS.find((level) => level.id === id);
  if (!meta) {
    throw new Error(`Unknown level id: ${String(id)}`);
  }
  return meta;
}
