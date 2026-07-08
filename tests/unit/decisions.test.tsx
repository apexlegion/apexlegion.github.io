import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalLlmDecision } from '@/components/decisions/LocalLlmDecision';
import { ScoringDecisionRunner } from '@/components/decisions/ScoringDecisionRunner';
import {
  explainScore,
  recommend,
  scoreProfiles,
  type ScoringProfile,
} from '@/lib/decisions/engine';
import { getDecisionProfileBySlug, getScoringProfileBySlug } from '@/lib/data/entities';
import type { DecisionScoringProfileEntity } from '@/lib/schemas/entity';

describe('LocalLlmDecision', () => {
  const profile = getDecisionProfileBySlug('local-llm');
  if (!profile) throw new Error('Missing decision profile: local-llm');

  it('renders the title and prompts for every question', () => {
    render(<LocalLlmDecision profile={profile} />);
    expect(screen.getByRole('heading', { name: /choose a local llm tool/i })).toBeInTheDocument();
    for (const q of profile.questions) {
      expect(screen.getByText(q.prompt)).toBeInTheDocument();
    }
  });

  it('shows a recommendation after every question is answered', async () => {
    const user = userEvent.setup();
    render(<LocalLlmDecision profile={profile} />);

    for (const q of profile.questions) {
      const firstOption = q.options[0];
      if (!firstOption) throw new Error('Missing option');
      const radio = screen.getByRole('radio', { name: firstOption.label });
      await user.click(radio);
    }

    // Once all questions are answered, the recommendation panel populates
    expect(await screen.findByText(/recommendation/i, { selector: 'h3' })).toBeInTheDocument();
    // Either a strong or partial match badge should appear
    const matches = await screen.findAllByText(/strong match|partial match/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('scoring engine', () => {
  const profile: ScoringProfile = {
    slug: 'test',
    name: 'Test',
    summary: '',
    description: '',
    questions: [
      {
        id: 'size',
        prompt: 'size',
        options: [
          { value: 'small', label: 'small', scores: { a: 1, b: 3 } },
          { value: 'large', label: 'large', scores: { a: 3, b: 1 } },
        ],
      },
      {
        id: 'priority',
        prompt: 'priority',
        weight: 2,
        options: [
          { value: 'speed', label: 'speed', scores: { a: 2, b: 1 } },
          { value: 'quality', label: 'quality', scores: { a: 1, b: 3 } },
        ],
      },
    ],
    candidates: [
      { id: 'a', type: 'project', reason: 'a' },
      { id: 'b', type: 'project', reason: 'b', healthScore: 0.9 },
    ],
  };

  it('scoreProfiles sums per-option weights across all answered questions', () => {
    const result = scoreProfiles({ size: 'small', priority: 'speed' }, profile);
    // a: 1*1 + 2*2 = 5; b: 1*3 + 2*1 = 5 (tie, healthScore breaks it -> b)
    expect(result.ranked.find((r) => r.id === 'a')?.score).toBe(5);
    expect(result.ranked.find((r) => r.id === 'b')?.score).toBe(5);
    expect(result.top?.id).toBe('b');
    expect(result.complete).toBe(true);
    expect(result.answeredWeight).toBe(3);
  });

  it('scoreProfiles respects question weights', () => {
    const result = scoreProfiles({ size: 'large', priority: 'quality' }, profile);
    // size (weight 1): a=3, b=1; priority (weight 2): a=2, b=6
    // totals: a=5, b=7
    expect(result.top?.id).toBe('b');
    expect(result.ranked[0]?.score).toBe(7);
  });

  it('scoreProfiles reports incomplete when some questions are unanswered', () => {
    const result = scoreProfiles({ size: 'small' }, profile);
    expect(result.complete).toBe(false);
    expect(result.top).not.toBeNull();
    expect(result.answeredWeight).toBe(1);
  });

  it('explainScore returns only the lines that contributed positively', () => {
    const lines = explainScore({ size: 'small', priority: 'quality' }, profile, 'a');
    expect(lines.length).toBe(2);
    expect(lines[0]?.prompt).toBe('size');
    expect(lines[0]?.contribution).toBe(1);
    expect(lines[1]?.prompt).toBe('priority');
    expect(lines[1]?.contribution).toBe(2);
  });

  it('recommend is a convenience wrapper around scoreProfiles', () => {
    const a = recommend(profile, { size: 'large' });
    const b = scoreProfiles({ size: 'large' }, profile);
    expect(a.top?.id).toBe(b.top?.id);
    expect(a.ranked.map((r) => r.id)).toEqual(b.ranked.map((r) => r.id));
  });
});

describe('ScoringDecisionRunner', () => {
  const profile = getScoringProfileBySlug('choose-hardware');
  if (!profile) throw new Error('Missing scoring decision profile: choose-hardware');

  it('renders the profile title and every question prompt', () => {
    render(
      <ScoringDecisionRunner
        profile={profile}
        title={profile.name}
        description={profile.description}
      />,
    );
    expect(screen.getByRole('heading', { name: profile.name })).toBeInTheDocument();
    for (const q of profile.questions) {
      expect(screen.getByText(q.prompt)).toBeInTheDocument();
    }
  });

  it('shows a top match after every question is answered', async () => {
    const user = userEvent.setup();
    render(
      <ScoringDecisionRunner
        profile={profile}
        title={profile.name}
        description={profile.description}
      />,
    );

    for (const q of profile.questions) {
      const firstOption = q.options[0];
      if (!firstOption) throw new Error('Missing option');
      const radio = screen.getByRole('radio', { name: firstOption.label });
      await user.click(radio);
    }

    expect(await screen.findByText(/top match/i)).toBeInTheDocument();
  });

  it('uses seed scoring profile entities that conform to the schema', () => {
    const profile: DecisionScoringProfileEntity | undefined =
      getScoringProfileBySlug('choose-vector-database');
    expect(profile).toBeDefined();
    expect(profile?.engine).toBe('scoring');
    expect(profile?.candidates.length).toBeGreaterThan(0);
    for (const q of profile?.questions ?? []) {
      for (const opt of q.options) {
        expect(opt.scores).toBeDefined();
        expect(Object.keys(opt.scores ?? {}).length).toBeGreaterThan(0);
      }
    }
  });
});
