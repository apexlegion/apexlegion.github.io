import type { ReactNode } from 'react';
import type { DecisionProfileEntity } from '@/lib/schemas/entity';
import { DecisionRunner } from './DecisionRunner';

export interface ImageGenerationDecisionProps {
  profile: DecisionProfileEntity;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
}

/**
 * Decision guide for image generation models. Thin wrapper around
 * `DecisionRunner`.
 */
export function ImageGenerationDecision({
  profile,
  title = 'Choose an Image Generation Model',
  description = 'Pick an open image generation model that fits your hardware and license needs.',
  difficulty = 'student',
  estimatedMinutes = 2,
}: ImageGenerationDecisionProps): ReactNode {
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
