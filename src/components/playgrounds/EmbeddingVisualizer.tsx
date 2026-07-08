import { useMemo, useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

/**
 * Deterministic 32-bit string hash (FNV-1a variant).
 *
 * Used to build a stable per-token signal so the cosine similarity
 * computation stays repeatable for the same inputs.
 */
export function hashToken(token: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}

/**
 * Convert a string into a fixed-length unit vector.
 *
 * Each unique token contributes a non-zero value at one dimension (its hash
 * modulo `dimensions`); the vector is then L2-normalised so cosine similarity
 * is well-behaved.
 */
export function embed(text: string, dimensions = 32): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();
  if (!normalized) return vector;
  const tokens = normalized.split(/\s+/u).filter(Boolean);
  if (tokens.length === 0) return vector;
  for (const token of tokens) {
    const idx = hashToken(token) % dimensions;
    vector[idx] = (vector[idx] ?? 0) + 1;
  }
  // L2 normalise.
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm);
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}

/**
 * Cosine similarity between two equal-length vectors, in `[-1, 1]`.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

export interface EmbeddingVisualizerProps {
  initialLeft?: string;
  initialRight?: string;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

const DEFAULT_LEFT = 'The cat sat on the mat.';
const DEFAULT_RIGHT = 'A kitten is sitting on the rug.';

export function EmbeddingVisualizer({
  initialLeft = DEFAULT_LEFT,
  initialRight = DEFAULT_RIGHT,
  title = 'Embedding Visualizer',
  description = 'Compare two pieces of text with a deterministic mock cosine similarity score.',
  difficulty = 'student',
  estimatedMinutes = 5,
  relatedConcepts = ['embeddings', 'cosine-similarity'],
}: EmbeddingVisualizerProps): ReactNode {
  const [left, setLeft] = useState(initialLeft);
  const [right, setRight] = useState(initialRight);

  const similarity = useMemo(() => {
    const vecA = embed(left);
    const vecB = embed(right);
    const raw = cosineSimilarity(vecA, vecB);
    return Math.max(0, Math.min(1, raw));
  }, [left, right]);

  const percentage = (similarity * 100).toFixed(1);

  return (
    <PlaygroundShell
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
      relatedConcepts={relatedConcepts}
      controls={
        <div className="flex flex-col gap-4">
          <Input
            label="Text A"
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            placeholder="Paste a sentence…"
          />
          <Input
            label="Text B"
            value={right}
            onChange={(event) => setRight(event.target.value)}
            placeholder="Paste another sentence…"
          />
        </div>
      }
      visualization={
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <Badge variant="info">{percentage}% similarity</Badge>
          <div
            className="bg-surface-elevated border-border h-3 w-full max-w-md overflow-hidden rounded-full border"
            role="progressbar"
            aria-valuenow={Number(percentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Cosine similarity"
          >
            <div className="bg-primary-orange h-full" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-small text-text-muted max-w-prose text-center">
            Mock embeddings are derived from a deterministic hash of each token, so identical inputs
            always produce the same score.
          </p>
        </div>
      }
    />
  );
}
