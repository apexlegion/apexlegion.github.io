import { useMemo, useState, type ReactNode } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface VectorSearchProps {
  initialDocuments?: string[];
  initialQuery?: string;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

const DEFAULT_DOCUMENTS = [
  'Retrieval-augmented generation (RAG) grounds language models in external documents.',
  'Quantization shrinks a model by storing weights at lower bit precision.',
  'Fine-tuning adapts a pre-trained model to a narrower task or domain.',
  'Embeddings map text into a high-dimensional vector space for similarity search.',
  'Diffusion models generate images by iteratively denoising random noise.',
  'Speculative decoding speeds up generation with a small draft model.',
];

const DEFAULT_QUERY = 'How do embeddings help search?';

function hashToken(token: string, dim: number): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % dim;
}

function tokenizeVs(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((t) => t.length > 1);
}

/**
 * Build a deterministic mock embedding as a sparse bag-of-words hash vector.
 * Exported for unit tests.
 */
export function mockEmbed(text: string, dim = 128): number[] {
  const vec: number[] = [];
  for (let i = 0; i < dim; i++) vec.push(0);
  const tokens = tokenizeVs(text);
  for (const token of tokens) {
    const idx = hashToken(token, dim);
    vec[idx] = (vec[idx] ?? 0) + 1;
  }
  // L2 normalise so cosine similarity is just a dot product
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface RankedDocument {
  text: string;
  score: number;
}

/**
 * Rank documents by mock-embedding similarity to a query.
 */
export function rankDocuments(query: string, documents: string[]): RankedDocument[] {
  if (!query.trim() || documents.length === 0) return [];
  const qVec = mockEmbed(query);
  return documents
    .map((doc) => ({ text: doc, score: cosineSimilarity(qVec, mockEmbed(doc)) }))
    .sort((a, b) => b.score - a.score);
}

export function VectorSearch({
  initialDocuments = DEFAULT_DOCUMENTS,
  initialQuery = DEFAULT_QUERY,
  title = 'Vector Search',
  description = 'Rank a document list against a query using a deterministic mock embedding and cosine similarity.',
  difficulty = 'student',
  estimatedMinutes = 5,
  relatedConcepts = ['embeddings', 'cosine-similarity', 'vector-search'],
}: VectorSearchProps): ReactNode {
  const [documentsText, setDocumentsText] = useState(initialDocuments.join('\n'));
  const [query, setQuery] = useState(initialQuery);

  const documents = useMemo(
    () =>
      documentsText
        .split(/\n+/u)
        .map((d) => d.trim())
        .filter(Boolean),
    [documentsText],
  );

  const ranked = useMemo(() => rankDocuments(query, documents), [query, documents]);

  return (
    <PlaygroundShell
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
      relatedConcepts={relatedConcepts}
      controls={
        <div className="flex flex-col gap-4">
          <Textarea
            label="Documents (one per line)"
            helperText="Each line is treated as a separate document."
            value={documentsText}
            onChange={(event) => setDocumentsText(event.target.value)}
            rows={8}
          />
          <Input
            label="Query"
            helperText="The string you want to find similar documents for."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="info">{ranked.length} ranked</Badge>
            <span className="text-tiny text-text-subtle">Mock embedding · 128 dimensions</span>
          </div>
          {ranked.length === 0 ? (
            <p className="text-small text-text-subtle">Add a query and at least one document.</p>
          ) : (
            <ol className="flex flex-col gap-2" aria-label="Ranked results">
              {ranked.map((doc, index) => (
                <li
                  key={`${index}-${doc.text.slice(0, 24)}`}
                  className="border-border bg-surface-elevated rounded-md border p-3"
                >
                  <div className="text-tiny text-text-muted mb-1 flex items-center justify-between">
                    <span>#{index + 1}</span>
                    <span>cosine {(doc.score * 100).toFixed(1)}%</span>
                  </div>
                  <div
                    className="bg-primary-orange h-1.5 rounded-full"
                    style={{ width: `${Math.max(2, doc.score * 100)}%` }}
                    aria-hidden="true"
                  />
                  <p className="text-small text-text mt-2">{doc.text}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      }
    />
  );
}
