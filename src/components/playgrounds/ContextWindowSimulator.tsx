import { useMemo, useState, type ReactNode } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface ContextWindowSimulatorProps {
  initialMaxTokens?: number;
  initialText?: string;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

/**
 * Approximate token count: ~4 characters per token, matching the
 * rule-of-thumb used for English text by many BPE tokenizers.
 *
 * Exported so it can be unit-tested.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

const TOKEN_PRESETS: { label: string; value: number }[] = [
  { label: '1K', value: 1024 },
  { label: '4K', value: 4096 },
  { label: '8K', value: 8192 },
  { label: '16K', value: 16384 },
  { label: '32K', value: 32768 },
  { label: '64K', value: 65536 },
  { label: '128K', value: 131072 },
];

const DEFAULT_TEXT =
  'Hi there! Here is a long-ish prompt so we can watch the context window fill up. ' +
  'Models can only attend to so many tokens at once, so messages get truncated once the budget ' +
  'is exceeded. Adjust the slider to see the boundary.';

export function ContextWindowSimulator({
  initialMaxTokens = 8192,
  initialText = DEFAULT_TEXT,
  title = 'Context Window Simulator',
  description = 'Pick a context budget and watch how much room your prompt leaves for the response.',
  difficulty = 'student',
  estimatedMinutes = 4,
  relatedConcepts = ['context-window', 'tokens'],
}: ContextWindowSimulatorProps): ReactNode {
  const [maxTokens, setMaxTokens] = useState(initialMaxTokens);
  const [text, setText] = useState(initialText);

  const used = useMemo(() => estimateTokens(text), [text]);
  const remaining = Math.max(0, maxTokens - used);
  const percent = Math.min(100, Math.round((used / maxTokens) * 100));
  const overBudget = used > maxTokens;

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
            label="Input text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={8}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="context-max" className="text-small text-text font-medium">
              Max context:{' '}
              <span className="text-text-muted">{maxTokens.toLocaleString()} tokens</span>
            </label>
            <input
              id="context-max"
              type="range"
              min={1024}
              max={131072}
              step={1024}
              value={maxTokens}
              onChange={(event) => setMaxTokens(Number(event.target.value))}
              aria-valuemin={1024}
              aria-valuemax={131072}
              aria-valuenow={maxTokens}
              className="accent-primary-orange h-2 w-full"
            />
            <div className="flex flex-wrap gap-1.5">
              {TOKEN_PRESETS.map((preset) => {
                const active = preset.value === maxTokens;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setMaxTokens(preset.value)}
                    className={
                      'border-border text-tiny rounded-md border px-2 py-1 font-medium transition-colors ' +
                      (active
                        ? 'bg-primary-orange text-text-inverse border-primary-orange'
                        : 'bg-surface-elevated text-text-muted hover:text-text')
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant={overBudget ? 'danger' : 'info'}>
              {used.toLocaleString()} tokens used
            </Badge>
            <Badge variant={remaining > 0 ? 'success' : 'danger'}>
              {remaining.toLocaleString()} remaining
            </Badge>
          </div>
          <div
            className="bg-surface-elevated border-border h-4 w-full overflow-hidden rounded-full border"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Context window usage"
          >
            <div
              className={
                'duration-fast h-full transition-[width] ' +
                (overBudget ? 'bg-danger' : 'bg-primary-orange')
              }
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-small text-text-muted max-w-prose">
            {overBudget
              ? 'Your prompt would be truncated before reaching the model.'
              : 'You have headroom for the model to respond.'}
          </p>
        </div>
      }
    />
  );
}
