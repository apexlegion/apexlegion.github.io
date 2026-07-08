import { useMemo, useState, type ReactNode } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export type PromptVerdict = 'focused' | 'balanced' | 'creative';

export interface PromptEngineeringPlaygroundProps {
  initialSystem?: string;
  initialUser?: string;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

const DEFAULT_SYSTEM = 'You are a helpful assistant that answers concisely.';
const DEFAULT_USER = 'Explain the difference between a token and a word.';

/**
 * Generate a deterministic mock response.
 *
 * The shape of the response varies with `temperature`:
 *   - low temperature  -> focused, short, template-like
 *   - mid temperature  -> balanced
 *   - high temperature -> creative, longer, with bullet points
 *
 * Exported so it can be unit-tested.
 */
export function generateMockResponse(
  userPrompt: string,
  temperature: number,
  systemPrompt: string,
): { verdict: PromptVerdict; body: string } {
  const trimmed = userPrompt.trim();
  const empty = trimmed.length === 0;
  const topic = empty ? '[no question yet]' : trimmed.slice(0, 80);
  const systemIsRich = systemPrompt.trim().length > 30;

  let verdict: PromptVerdict;
  if (temperature < 0.34) verdict = 'focused';
  else if (temperature < 0.67) verdict = 'balanced';
  else verdict = 'creative';

  let body: string;
  if (verdict === 'focused') {
    body = empty
      ? '(waiting for a prompt — try asking something specific)'
      : `Answer: ${topic}. This is a deterministic, low-temperature mock.`;
  } else if (verdict === 'balanced') {
    body = empty
      ? 'No question yet. Try: "What is a context window?"'
      : `Here's a balanced take on "${topic}".\n\n` +
        'Key points:\n' +
        '  - One grounded sentence answering directly.\n' +
        '  - One follow-up to clarify the ask.\n' +
        `${systemIsRich ? '  - One observation drawn from the system prompt.\n' : ''}`;
  } else {
    body = empty
      ? 'Your prompt is empty — surprise me with anything!'
      : `Creative riff on "${topic}".\n\n` +
        'Imagine three different angles:\n' +
        '  1. A beginner-friendly metaphor.\n' +
        '  2. A practitioner-level gotcha.\n' +
        '  3. A research-flavored aside.\n' +
        'Pick whichever one sparks the next question.';
  }

  return { verdict, body };
}

export function PromptEngineeringPlayground({
  initialSystem = DEFAULT_SYSTEM,
  initialUser = DEFAULT_USER,
  title = 'Prompt Engineering Playground',
  description = 'Compose a system prompt + user prompt and preview a mock response at different temperatures.',
  difficulty = 'student',
  estimatedMinutes = 5,
  relatedConcepts = ['prompt-engineering', 'temperature'],
}: PromptEngineeringPlaygroundProps): ReactNode {
  const [system, setSystem] = useState(initialSystem);
  const [user, setUser] = useState(initialUser);
  const [temperature, setTemperature] = useState(0.4);

  const response = useMemo(
    () => generateMockResponse(user, temperature, system),
    [user, temperature, system],
  );

  const verdictVariant: 'success' | 'info' | 'warning' =
    response.verdict === 'focused'
      ? 'success'
      : response.verdict === 'balanced'
        ? 'info'
        : 'warning';

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
            label="System prompt"
            value={system}
            onChange={(event) => setSystem(event.target.value)}
            rows={4}
          />
          <Textarea
            label="User prompt"
            value={user}
            onChange={(event) => setUser(event.target.value)}
            rows={5}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="temperature-slider" className="text-small text-text font-medium">
              Temperature: <span className="text-text-muted">{temperature.toFixed(2)}</span>
            </label>
            <input
              id="temperature-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={temperature}
              onChange={(event) => setTemperature(Number(event.target.value))}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={temperature}
              className="accent-primary-orange h-2 w-full"
            />
            <div className="text-tiny text-text-subtle flex justify-between">
              <span>0 — focused</span>
              <span>1 — creative</span>
            </div>
          </div>
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          <Badge variant={verdictVariant}>temperature: {response.verdict}</Badge>
          <pre className="text-small text-text font-mono whitespace-pre-wrap">{response.body}</pre>
        </div>
      }
    />
  );
}
