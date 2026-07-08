import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import type { DecisionProfileEntity, DecisionRule } from '@/lib/schemas/entity';

export type AnswerMap = Record<string, string>;

export interface DecisionMatch {
  rule: DecisionRule;
  answeredAll: boolean;
}

export function matchesRule(rule: DecisionRule, answers: AnswerMap): boolean {
  const when = rule.when ?? {};
  const collected: string[] = Object.values(answers);
  const all = when.all ?? [];
  const any = when.any ?? [];
  const none = when.none ?? [];
  if (all.length > 0 && !all.every((value) => collected.includes(value))) return false;
  if (any.length > 0 && !any.some((value) => collected.includes(value))) return false;
  if (none.length > 0 && none.some((value) => collected.includes(value))) return false;
  return true;
}

/**
 * Find the first matching rule. Prefers rules whose `when.all` length is
 * greater-than-or-equal to the number of answered questions so we lean
 * toward specific matches when present.
 */
export function findRecommendations(
  rules: DecisionRule[],
  answers: AnswerMap,
): DecisionMatch | null {
  let firstMatch: DecisionMatch | null = null;
  for (const rule of rules) {
    if (!matchesRule(rule, answers)) continue;
    const when = rule.when ?? {};
    const required = when.all?.length ?? 0;
    const answeredAll = required >= Object.keys(answers).length && required > 0;
    if (!firstMatch) firstMatch = { rule, answeredAll };
    if (answeredAll) return { rule, answeredAll };
  }
  return firstMatch;
}

export interface DecisionRunnerProps {
  profile: DecisionProfileEntity;
  title: string;
  description: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
}

/**
 * Shared renderer for decision profiles. Renders each question as a
 * single-select radio group and shows the first matching rule's
 * recommendations.
 */
export function DecisionRunner({
  profile,
  title,
  description,
  difficulty = 'student',
  estimatedMinutes = 2,
}: DecisionRunnerProps): ReactNode {
  const [answers, setAnswers] = useState<AnswerMap>({});

  const allAnswered = profile.questions.every((q) => Boolean(answers[q.id]));
  const result = useMemo(
    () => (allAnswered ? findRecommendations(profile.rules, answers) : null),
    [allAnswered, profile.rules, answers],
  );

  const setAnswer = (id: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <section
      aria-labelledby="decision-title"
      className="border-border bg-surface-card flex flex-col gap-6 rounded-2xl border p-6 shadow-sm"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="decision-title" className="text-text text-h2 font-semibold">
            {title}
          </h2>
          <p className="text-body text-text-muted max-w-prose">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{difficulty}</Badge>
          <Badge variant="neutral">{estimatedMinutes} min</Badge>
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
              Answer every question to see a recommendation.
            </p>
          ) : !result ? (
            <p className="text-small text-text-subtle">
              No rule matches these answers yet. Try different combinations.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {!result.answeredAll ? (
                <Badge variant="warning">Partial match</Badge>
              ) : (
                <Badge variant="success">Strong match</Badge>
              )}
              {result.rule.recommendations.map((rec) => {
                const href = rec.type === 'model' ? `/models/${rec.slug}` : `/projects/${rec.slug}`;
                return (
                  <Card key={`${rec.type}-${rec.slug}`} variant="interactive" href={href}>
                    <CardHeader>
                      <Badge variant={rec.type === 'model' ? 'model' : 'project'}>{rec.type}</Badge>
                      <h4 className="text-text text-h4 mt-2 font-semibold">{rec.slug}</h4>
                    </CardHeader>
                    <CardBody>{rec.reason}</CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
