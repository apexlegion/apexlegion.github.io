import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LEVELS, LEVEL_IDS, getLevel, isLevelId } from '@/lib/utils/levels';
import { LevelContent } from '@/components/levels/LevelContent';
import type { LevelsBlock } from '@/lib/schemas/entity';

describe('levels metadata', () => {
  it('exposes six canonical levels', () => {
    expect(LEVELS).toHaveLength(6);
    expect(LEVEL_IDS).toEqual([
      'twelve',
      'beginner',
      'student',
      'developer',
      'researcher',
      'business',
    ]);
  });

  it('isLevelId narrows strings correctly', () => {
    expect(isLevelId('beginner')).toBe(true);
    expect(isLevelId('expert')).toBe(false);
    expect(isLevelId(null)).toBe(false);
  });

  it('getLevel returns metadata for known ids', () => {
    const level = getLevel('developer');
    expect(level.label).toBe('Developer');
    expect(level.description.length).toBeGreaterThan(0);
  });

  it('getLevel throws for unknown ids', () => {
    expect(() => getLevel('nope' as never)).toThrow();
  });
});

describe('LevelContent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const levels: LevelsBlock = {
    twelve: {
      summary: 'Kid summary',
      content: 'A twelve-year-old explanation.',
    },
    beginner: {
      summary: 'Beginner summary',
      content: 'A beginner-friendly explanation.',
    },
    student: {
      summary: 'Student summary',
      content: 'A more technical student-level explanation.',
    },
  };

  it('renders content for the default level on first render', () => {
    render(<LevelContent levels={levels} defaultLevel="beginner" />);
    expect(screen.getByText('Beginner summary')).toBeInTheDocument();
    expect(screen.getByText('A beginner-friendly explanation.')).toBeInTheDocument();
  });

  it('switches content when a different level is selected', async () => {
    const user = userEvent.setup();
    render(<LevelContent levels={levels} defaultLevel="twelve" />);
    expect(screen.getByText('Kid summary')).toBeInTheDocument();

    const studentTab = screen.getByRole('tab', { name: /student/i });
    await user.click(studentTab);

    expect(screen.getByText('Student summary')).toBeInTheDocument();
    expect(screen.queryByText('Kid summary')).not.toBeInTheDocument();
  });

  it('renders a placeholder when no level-specific content is provided', () => {
    render(<LevelContent levels={{}} defaultLevel="developer" />);
    expect(screen.getByText(/no level-specific content is available/i)).toBeInTheDocument();
  });
});
