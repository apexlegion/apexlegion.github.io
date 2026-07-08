import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import type { DecisionScoringProfileEntity } from '@/lib/schemas/entity';
import { explainScore, recommend } from '@/lib/decisions/engine';

export type AnswerMap = Record<string, string>;

export interface ScoringDecisionRunnerProps {
  profile: DecisionScoringProfileEntity;
  title: string;
  description: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
}

/**
 * Shared renderer for scoring-based decision profiles. Each option on each
 * question contributes weighted points to every candidate; the candidate
 * with the highest total wins.
 *
 * Mirrors the layout of `DecisionRunner` so the two engines look and feel
 * consistent on the site.
 */
export function ScoringDecisionRunner({
  profile,
  title,
  description,
  difficulty = 'student',
  estimatedMinutes = 2,
}: ScoringDecisionRunnerProps): ReactNode {
  const [answers, setAnswers] = useState<AnswerMap>({});

  const allAnswered = profile.questions.every((q) => Boolean(answers[q.id]));
  const result = useMemo(() => recommend(profile, answers), [profile, answers]);

  const setAnswer = (id: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const top = result.top;
  const explanation = top ? explainScore(answers, profile, top.id) : [];

  return (
    <section
      aria-labelledby="scoring-decision-title"
      className="border-border bg-surface-card flex flex-col gap-6 rounded-2xl border p-6 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="scoring-decision-title" className="text-text text-h2 font-semibold">
            {title}
          </h2>
          <p className="text-body text-text-muted max-w-prose">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{difficulty}</Badge>
          <Badge variant="neutral">{estimatedMinutes} min</Badge>
          <Badge variant="concept">scoring engine</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form className="flex flex-col gap-5" aria-label="Decision questions">
          {profile.questions.map((question) => (
            <fieldset key={question.id} className="border-border flex flex-col gap-2">
              <legend className="text-small text-text font-semibold">{question.prompt}</legend>
              {question.helperText ? (
                <p className="text-tiny text-text-muted">{question.helperText}</p>
              ) : null}
              <div className="flex flex-col gap-2">
                {question.options.map((option) => {
                  const checked = answers[question.id] === option.value;
                  const inputId = `q-${question.id}-${option.value}`;
                  return (
                    <label
                      key={option.value}
                      htmlFor={inputId}
                      className="border-border bg-surface-elevated hover:border-border-strong flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors"
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={checked}
                        onChange={() => setAnswer(question.id, option.value)}
                        className="accent-primary-orange h-4 w-4"
                      />
                      <span className="text-small text-text">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </form>

        <aside aria-live="polite" className="flex flex-col gap-3">
          <h3 className="text-small text-text-muted font-semibold tracking-wide uppercase">
            Recommendation
          </h3>
          {!allAnswered ? (
            <p className="text-small text-text-subtle">
              Answer every question to see a ranked recommendation.
            </p>
          ) : !top ? (
            <p className="text-small text-text-subtle">
              No candidates to score — add at least one candidate to this profile.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <Badge variant="success">Top match</Badge>
              <Card
                key={`${top.type}-${top.id}`}
                variant="interactive"
                href={
                  top.type === 'model'
                    ? `/models/${top.slug ?? top.id}`
                    : `/projects/${top.slug ?? top.id}`
                }
              >
                <CardHeader>
                  <Badge variant={top.type === 'model' ? 'model' : 'project'}>{top.type}</Badge>
                  <h4 className="text-text text-h4 mt-2 font-semibold">
                    {top.name ?? top.slug ?? top.id}
                  </h4>
                </CardHeader>
                <CardBody>
                  <p>{top.reason}</p>
                  <p className="text-tiny text-text-subtle mt-2">Score: {top.score.toFixed(2)}</p>
                </CardBody>
              </Card>
              {explanation.length > 0 ? (
                <div className="border-border bg-surface-elevated rounded-md border p-3">
                  <h4 className="text-small text-text font-semibold">Why this pick?</h4>
                  <ul className="mt-2 flex flex-col gap-1">
                    {explanation.map((line, idx) => (
                      <li key={idx} className="text-tiny text-text-muted">
                        <span className="text-text font-medium">{line.prompt}</span>
                        {`: ${line.answer}`}
                        <span className="text-text-subtle"> (+{line.contribution.toFixed(1)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.ranked.length > 1 ? (
                <details className="border-border bg-surface-elevated rounded-md border p-3">
                  <summary className="text-small text-text cursor-pointer font-semibold">
                    Full ranking ({result.ranked.length} candidates)
                  </summary>
                  <ol className="mt-2 flex flex-col gap-2">
                    {result.ranked.map((row, idx) => (
                      <li
                        key={`rank-${row.id}`}
                        className="border-border flex items-center justify-between gap-3 rounded border px-2 py-1"
                      >
                        <span className="text-tiny text-text-muted">#{idx + 1}</span>
                        <span className="text-small text-text flex-1 truncate font-medium">
                          {row.name ?? row.slug ?? row.id}
                        </span>
                        <span className="text-tiny text-text-subtle font-mono">
                          {row.score.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
