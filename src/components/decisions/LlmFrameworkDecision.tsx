import type { ReactNode } from 'react';
import type { DecisionProfileEntity } from '@/lib/schemas/entity';
import { DecisionRunner } from './DecisionRunner';

export interface LlmFrameworkDecisionProps {
  profile: DecisionProfileEntity;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
}

/**
 * Decision guide for choosing an LLM framework. Thin wrapper around
 * `DecisionRunner`.
 */
export function LlmFrameworkDecision({
  profile,
  title = 'Choose an LLM Framework',
  description = 'Tell us how you want to integrate LLMs and we will recommend an open framework.',
  difficulty = 'student',
  estimatedMinutes = 2,
}: LlmFrameworkDecisionProps): ReactNode {
  return (
    <DecisionRunner
      profile={profile}
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
    />
  );
}
