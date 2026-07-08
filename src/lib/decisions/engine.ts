/**
 * Decision Engine v2 — scoring-based recommender.
 *
 * Sits alongside the existing rule-based engine in `DecisionRunner`. The
 * rule engine matches the first rule whose `when` predicate is satisfied;
 * the scoring engine sums per-option weights across all questions and
 * returns the candidate (project/model) with the highest total.
 *
 * Profiles that opt into scoring declare `engine: "scoring"` and replace
 * the `rules` array with a `candidates` list. Each option on each question
 * carries a `scores` map keyed by candidate id.
 */

import type { DecisionProfileEntity, DecisionRule } from '@/lib/schemas/entity';

export type AnswerMap = Record<string, string>;

export interface ScoringCandidate {
  id: string;
  slug?: string;
  name?: string;
  type: 'project' | 'model';
  reason: string;
  healthScore?: number;
}

export interface ScoringQuestion {
  id: string;
  prompt: string;
  helperText?: string;
  type?: 'single' | 'multi';
  weight?: number;
  options: Array<{
    value: string;
    label: string;
    /** Per-candidate weight contribution. Missing candidates default to 0. */
    scores?: Record<string, number>;
  }>;
}

export interface ScoringProfile {
  slug: string;
  name: string;
  summary: string;
  description: string;
  questions: ScoringQuestion[];
  candidates: ScoringCandidate[];
  /** Tie-breaker weight applied to a candidate's `healthScore` (0..1). */
  healthWeight?: number;
}

export interface ScoringResult {
  /** Sorted descending by total score. Includes all candidates, even unscored ones. */
  ranked: Array<ScoringCandidate & { score: number }>;
  /** Highest-scoring candidate (ties broken by healthScore, then order). */
  top: (ScoringCandidate & { score: number }) | null;
  /** Total possible score across all answered questions. */
  maxScore: number;
  /** Sum of weights for questions that were answered. */
  answeredWeight: number;
  /** True when every question has an answer. */
  complete: boolean;
}

function getOptionScore(option: ScoringQuestion['options'][number], candidateId: string): number {
  return option.scores?.[candidateId] ?? 0;
}

/**
 * Sum the weighted contribution of a single option to a single candidate.
 */
function contribution(question: ScoringQuestion, optionValue: string, candidateId: string): number {
  const option = question.options.find((o) => o.value === optionValue);
  if (!option) return 0;
  const weight = question.weight ?? 1;
  return weight * getOptionScore(option, candidateId);
}

/**
 * Score every candidate in a profile against the given answers.
 */
export function scoreProfiles(answers: AnswerMap, profile: ScoringProfile): ScoringResult {
  const totalWeight = profile.questions.reduce((acc, q) => acc + (q.weight ?? 1), 0);
  const answeredWeight = profile.questions.reduce((acc, q) => {
    return acc + (answers[q.id] ? (q.weight ?? 1) : 0);
  }, 0);

  const maxPerCandidate = profile.questions.reduce((acc, q) => {
    const maxOption = q.options.reduce(
      (m, opt) => Math.max(m, Math.max(0, ...Object.values(opt.scores ?? {}))),
      0,
    );
    return acc + (q.weight ?? 1) * maxOption;
  }, 0);

  const ranked = profile.candidates
    .map((candidate) => {
      let score = 0;
      for (const q of profile.questions) {
        const a = answers[q.id];
        if (!a) continue;
        score += contribution(q, a, candidate.id);
      }
      return { ...candidate, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie-break: higher health score wins.
      const ha = a.healthScore ?? 0;
      const hb = b.healthScore ?? 0;
      if (hb !== ha) return hb - ha;
      return 0;
    });

  return {
    ranked,
    top: ranked[0] ?? null,
    maxScore: maxPerCandidate,
    answeredWeight,
    complete: answeredWeight === totalWeight && profile.questions.length > 0,
  };
}

/**
 * Human-readable explanation for why `candidate` won. Lists each question
 * where the chosen option contributed to the score.
 */
export function explainScore(
  answers: AnswerMap,
  profile: ScoringProfile,
  candidateId: string,
): { prompt: string; answer: string; contribution: number }[] {
  const lines: { prompt: string; answer: string; contribution: number }[] = [];
  for (const q of profile.questions) {
    const a = answers[q.id];
    if (!a) continue;
    const option = q.options.find((o) => o.value === a);
    if (!option) continue;
    const c = contribution(q, a, candidateId);
    if (c <= 0) continue;
    lines.push({ prompt: q.prompt, answer: option.label, contribution: c });
  }
  return lines;
}

/**
 * Return the top recommendation with explanation. Convenience wrapper
 * around `scoreProfiles`.
 */
export function recommend(profile: ScoringProfile, answers: AnswerMap): ScoringResult {
  return scoreProfiles(answers, profile);
}

/**
 * Type guard: is this profile scoring-based?
 */
export function isScoringProfile(
  profile: DecisionProfileEntity | ScoringProfile,
): profile is ScoringProfile {
  return (
    'candidates' in profile &&
    Array.isArray((profile as ScoringProfile).candidates) &&
    !('rules' in profile)
  );
}

/**
 * Adapter: convert a v1 rule-based profile into a scoring-friendly shape
 * by treating each recommendation as a candidate. Used for fallback
 * scenarios where a profile only ships rules.
 */
export function rulesToScoring(profile: DecisionProfileEntity): ScoringProfile {
  const candidates = new Map<string, ScoringCandidate>();
  for (const rule of profile.rules as DecisionRule[]) {
    const w = (rule.when?.all?.length ?? 0) + 0.5 * (rule.when?.any?.length ?? 0);
    for (const rec of rule.recommendations) {
      const id = `${rec.type}:${rec.slug}`;
      if (!candidates.has(id)) {
        candidates.set(id, {
          id,
          type: rec.type,
          reason: rec.reason,
          healthScore: w > 0 ? Math.min(1, w / 5) : 0.1,
        });
      }
    }
  }
  return {
    slug: profile.slug,
    name: profile.name,
    summary: profile.summary,
    description: profile.description,
    questions: profile.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      ...(q.helperText ? { helperText: q.helperText } : {}),
      type: q.type ?? 'single',
      options: q.options.map((o) => ({
        value: o.value,
        label: o.label,
        scores: {},
      })),
    })),
    candidates: Array.from(candidates.values()),
    healthWeight: 0.2,
  };
}
