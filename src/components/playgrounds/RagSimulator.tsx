import { useMemo, useState, type ReactNode } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface RagSimulatorProps {
  initialCorpus?: string;
  initialQuery?: string;
  initialChunkSize?: number;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

export interface RagChunk {
  index: number;
  text: string;
  score: number;
  matchedTerms: string[];
}

const DEFAULT_CORPUS =
  'Retrieval-Augmented Generation (RAG) combines a language model with an external knowledge base. ' +
  'The retriever fetches relevant chunks of text and the generator uses them as context for the answer. ' +
  'Vector databases like FAISS, Pinecone, and Weaviate store embeddings for fast similarity lookup. ' +
  'Chunking strategies affect recall: smaller chunks improve precision but may lose surrounding context.';

const DEFAULT_QUERY = 'What is retrieval-augmented generation?';

function tokenizeRag(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((t) => t.length > 1);
}

function chunkText(text: string, chunkSize: number): string[] {
  if (!text.trim()) return [];
  const words = text.split(/\s+/u).filter(Boolean);
  if (chunkSize <= 0) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

function scoreChunk(
  chunkText: string,
  queryTokens: Set<string>,
): { score: number; matched: string[] } {
  const chunkTokens = tokenizeRag(chunkText);
  if (chunkTokens.length === 0) return { score: 0, matched: [] };
  const counts = new Map<string, number>();
  for (const token of chunkTokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  let matches = 0;
  const matched: string[] = [];
  for (const token of queryTokens) {
    const count = counts.get(token) ?? 0;
    if (count > 0) {
      matches += count;
      matched.push(token);
    }
  }
  return { score: matches / chunkTokens.length, matched };
}

/**
 * Pure retrieval function exported for unit tests.
 */
export function retrieveChunks(
  corpus: string,
  query: string,
  chunkSize: number,
  topK = 3,
): RagChunk[] {
  const queryTokens = new Set(tokenizeRag(query));
  const chunks = chunkText(corpus, chunkSize);
  const scored = chunks.map((text, index) => {
    const { score, matched } = scoreChunk(text, queryTokens);
    return { index, text, score, matchedTerms: matched };
  });
  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function RagSimulator({
  initialCorpus = DEFAULT_CORPUS,
  initialQuery = DEFAULT_QUERY,
  initialChunkSize = 30,
  title = 'RAG Simulator',
  description = 'Paste a small corpus and a query to see keyword-based retrieval pick the top chunks.',
  difficulty = 'student',
  estimatedMinutes = 6,
  relatedConcepts = ['retrieval-augmented-generation', 'embeddings', 'vector-search'],
}: RagSimulatorProps): ReactNode {
  const [corpus, setCorpus] = useState(initialCorpus);
  const [query, setQuery] = useState(initialQuery);
  const [chunkSize, setChunkSize] = useState(initialChunkSize);

  const chunks = useMemo(
    () => retrieveChunks(corpus, query, chunkSize),
    [corpus, query, chunkSize],
  );
  const mockAnswer = useMemo(() => {
    const top = chunks[0];
    if (!top) return 'No relevant chunks retrieved. Try a different query.';
    const lead = top.text.split(/[.!?]/u)[0] ?? top.text;
    return `Based on the retrieved context: "${lead}..."`;
  }, [chunks]);

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
            label="Corpus"
            helperText="Paste the text you want the retriever to search over."
            value={corpus}
            onChange={(event) => setCorpus(event.target.value)}
            rows={8}
          />
          <Textarea
            label="Query"
            helperText="What should the system try to find in the corpus?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={3}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rag-chunk-size" className="text-small text-text font-medium">
              Chunk size: <span className="text-text-muted">{chunkSize} words</span>
            </label>
            <input
              id="rag-chunk-size"
              type="range"
              min={5}
              max={80}
              step={1}
              value={chunkSize}
              onChange={(event) => setChunkSize(Number(event.target.value))}
              className="accent-primary-orange h-2 w-full"
            />
          </div>
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="info">{chunks.length} chunks retrieved</Badge>
            <span className="text-tiny text-text-subtle">Top 3 by keyword overlap</span>
          </div>
          <ol className="flex flex-col gap-2" aria-label="Retrieved chunks">
            {chunks.length === 0 ? (
              <li className="text-small text-text-subtle">
                No matches yet. Add a query that overlaps with the corpus.
              </li>
            ) : (
              chunks.map((chunk) => (
                <li
                  key={chunk.index}
                  className="border-border bg-surface-elevated rounded-md border p-3"
                >
                  <div className="text-tiny text-text-muted mb-1 flex items-center justify-between">
                    <span>Chunk #{chunk.index + 1}</span>
                    <span>score {(chunk.score * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-small text-text">{chunk.text}</p>
                  {chunk.matchedTerms.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chunk.matchedTerms.map((term) => (
                        <span
                          key={term}
                          className="border-border bg-surface text-tiny text-text-muted rounded border px-1.5 py-0.5 font-mono"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ol>
        </div>
      }
      output={mockAnswer}
    />
  );
}
