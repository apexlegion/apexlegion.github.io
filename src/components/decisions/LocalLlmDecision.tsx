import type { ReactNode } from 'react';
import type { DecisionProfileEntity } from '@/lib/schemas/entity';
import { DecisionRunner } from './DecisionRunner';

export interface LocalLlmDecisionProps {
  profile: DecisionProfileEntity;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
}

/**
 * Decision guide that helps the user pick a local-LLM project.
 * Thin wrapper around `DecisionRunner` — all logic lives there.
 */
export function LocalLlmDecision({
  profile,
  title = 'Choose a Local LLM Tool',
  description = 'Answer a few questions and we will recommend an open-source project from the Atlas.',
  difficulty = 'beginner',
  estimatedMinutes = 2,
}: LocalLlmDecisionProps): ReactNode {
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
