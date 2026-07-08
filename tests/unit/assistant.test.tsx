import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { matchRule, rules } from '@/lib/assistant/rules';

describe('assistant rule engine', () => {
  it('matches the greeting rule for hi/hello/hey', () => {
    for (const keyword of ['hi', 'Hello there', 'hey!']) {
      const rule = matchRule(keyword);
      expect(rule.keywords).toContain('hi');
    }
  });

  it('matches the compare rule for compare / vs / difference queries', () => {
    const rule = matchRule('How do Llama and Mistral compare?');
    expect(rule.keywords).toEqual(expect.arrayContaining(['compare']));
    expect(rule.suggestions).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: '/compare' })]),
    );
  });

  it('matches the playground rule for demo / playground / try', () => {
    const rule = matchRule('Can I try a playground demo?');
    expect(rule.keywords).toEqual(expect.arrayContaining(['playground']));
  });

  it('matches the decision rule for recommend / which / choose', () => {
    const rule = matchRule('Which model should I choose for coding?');
    expect(rule.keywords).toEqual(expect.arrayContaining(['which', 'choose']));
  });

  it('matches the graph rule for graph / explore / connections', () => {
    const rule = matchRule('Show me connections between models');
    expect(rule.keywords).toEqual(expect.arrayContaining(['graph', 'connections']));
  });

  it('matches the jobs rule for job / career / hire', () => {
    const rule = matchRule('Are there any AI career openings?');
    expect(rule.keywords).toEqual(expect.arrayContaining(['job', 'career']));
  });

  it('matches the news rule for news / latest / updates', () => {
    const rule = matchRule('What are the latest news updates?');
    expect(rule.keywords).toEqual(expect.arrayContaining(['news', 'latest']));
  });

  it('falls back to the catch-all rule for unmatched queries', () => {
    const rule = matchRule('zxqyfoobar nothing matches this string');
    expect(rule).toBe(rules[rules.length - 1]);
    expect(rule.keywords).toHaveLength(0);
  });

  it('falls back for empty input without throwing', () => {
    const rule = matchRule('');
    expect(rule).toBe(rules[rules.length - 1]);
  });
});

describe('AIAssistant component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders a floating toggle button with an accessible label', () => {
    render(<AIAssistant />);
    const toggle = screen.getByTestId('ai-assistant-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-label', 'Open AI Atlas Assistant');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the panel on click and shows a greeting message', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByTestId('ai-assistant-toggle'));

    const panel = screen.getByTestId('ai-assistant-panel');
    expect(panel).toBeInTheDocument();

    const log = screen.getByTestId('ai-assistant-log');
    expect(within(log).getByText(/AI Atlas assistant/i)).toBeInTheDocument();
    expect(screen.getByTestId('ai-assistant-input')).toBeInTheDocument();
  });

  it('responds to user input by running the rule engine', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByTestId('ai-assistant-toggle'));

    const input = screen.getByTestId('ai-assistant-input');
    await user.type(input, 'How do Llama and Mistral compare?');
    await user.click(screen.getByTestId('ai-assistant-send'));

    const log = screen.getByTestId('ai-assistant-log');
    expect(within(log).getByText('How do Llama and Mistral compare?')).toBeInTheDocument();
    expect(within(log).getByText(/Compare page/i)).toBeInTheDocument();
    // Suggestion link from the compare rule.
    expect(within(log).getByRole('link', { name: /open compare/i })).toHaveAttribute(
      'href',
      '/compare',
    );
  });

  it('falls back to the catch-all response for nonsense queries', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByTestId('ai-assistant-toggle'));

    await user.type(screen.getByTestId('ai-assistant-input'), 'zxqyfoobar');
    await user.click(screen.getByTestId('ai-assistant-send'));

    expect(
      within(screen.getByTestId('ai-assistant-log')).getByText(/not sure i understood/i),
    ).toBeInTheDocument();
  });

  it('clears the conversation when Clear is pressed', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByTestId('ai-assistant-toggle'));

    await user.type(screen.getByTestId('ai-assistant-input'), 'hi');
    await user.click(screen.getByTestId('ai-assistant-send'));

    const log = screen.getByTestId('ai-assistant-log');
    expect(within(log).getAllByText(/AI Atlas assistant/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /clear conversation/i }));

    // Only the welcome message should remain.
    const greetings = within(log).getAllByText(/AI Atlas assistant/i);
    expect(greetings).toHaveLength(1);
  });

  it('persists messages to localStorage', async () => {
    const user = userEvent.setup();
    render(<AIAssistant />);
    await user.click(screen.getByTestId('ai-assistant-toggle'));

    await user.type(screen.getByTestId('ai-assistant-input'), 'playground demo');
    await user.click(screen.getByTestId('ai-assistant-send'));

    const stored = localStorage.getItem('ai-atlas:assistant:messages:v1');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.some((m: { text: string }) => m.text === 'playground demo')).toBe(true);
  });
});
