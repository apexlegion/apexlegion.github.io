import { useMemo, useState, type ReactNode } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

/**
 * Split text into tokens using a basic whitespace-and-punctuation regex.
 *
 * Exported so it can be unit-tested in isolation.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .split(/([\s,.!?;:()[\]{}"'`/\\-]+)/u)
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0);
}

const DEFAULT_TEXT = 'Hello, world! LLMs read tokens, not characters.';

export interface TokenizationPlaygroundProps {
  initialText?: string;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

/**
 * Tokenization Playground — see how a basic whitespace-and-punctuation
 * tokenizer splits text. Counts update live.
 */
export function TokenizationPlayground({
  initialText = DEFAULT_TEXT,
  title = 'Tokenization Playground',
  description = 'Type or paste any text. Tokens are split on whitespace and punctuation using a simple regex.',
  difficulty = 'beginner',
  estimatedMinutes = 3,
  relatedConcepts = ['tokenization', 'context-window'],
}: TokenizationPlaygroundProps): ReactNode {
  const [text, setText] = useState(initialText);

  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <PlaygroundShell
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
      relatedConcepts={relatedConcepts}
      controls={
        <Textarea
          label="Input text"
          helperText="Anything you type or paste will be tokenized live."
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
        />
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="info">{tokens.length} tokens</Badge>
            <span className="text-tiny text-text-subtle">{text.length} characters</span>
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Token list">
            {tokens.length === 0 ? (
              <span className="text-small text-text-subtle">No tokens yet.</span>
            ) : (
              tokens.map((token, index) => (
                <span
                  key={`${index}-${token}`}
                  className="border-border bg-surface-elevated text-tiny text-text inline-flex items-center rounded-md border px-2 py-1 font-mono"
                >
                  {token}
                </span>
              ))
            )}
          </div>
        </div>
      }
    />
  );
}
