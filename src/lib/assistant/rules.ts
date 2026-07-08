/**
 * Rule engine for the AI Assistant widget.
 *
 * The assistant is fully client-side and rule-based: incoming user messages
 * are matched (case-insensitive whole-word match) against the keyword sets
 * of each rule. The first rule whose keywords overlap the query wins. The
 * `fallback` rule always matches unmatched queries.
 */

export interface AssistantSuggestion {
  /** Display text for the link. */
  label: string;
  /** Target href (internal app path). */
  href: string;
}

export interface AssistantRule {
  /** Lowercased keywords that trigger this rule. */
  keywords: string[];
  /** Response text shown in the chat panel. */
  response: string;
  /** Optional suggested navigation links appended to the response. */
  suggestions?: AssistantSuggestion[];
}

export const rules: AssistantRule[] = [
  {
    keywords: ['hi', 'hello', 'hey', 'greetings'],
    response:
      "Hi! I'm the AI Atlas assistant. I can help you compare models, explore the graph, find a playground, or point you to jobs and the latest news. What would you like to do?",
    suggestions: [
      { label: 'Compare models', href: '/compare' },
      { label: 'Browse the graph', href: '/graph' },
    ],
  },
  {
    keywords: ['compare', 'vs', 'versus', 'difference', 'differences'],
    response:
      'Use the Compare page to put two (or more) models, projects, or concepts side by side and see how they differ on licenses, scores, and use cases.',
    suggestions: [{ label: 'Open Compare', href: '/compare' }],
  },
  {
    keywords: ['playground', 'demo', 'try', 'sandbox'],
    response:
      'Playgrounds let you try a model or project without installing anything. Browse the list and pick one to launch.',
    suggestions: [{ label: 'Browse playgrounds', href: '/playgrounds' }],
  },
  {
    keywords: ['which', 'recommend', 'recommendation', 'choose', 'should i', 'best'],
    response:
      'For personal recommendations, head to the Decisions page. Pick a goal (chat, code, image, etc.) and we will narrow the field for you.',
    suggestions: [{ label: 'Get a recommendation', href: '/decide' }],
  },
  {
    keywords: ['graph', 'explore', 'connections', 'relationship', 'related'],
    response:
      'The Knowledge Graph shows how models, projects, concepts, and tutorials connect. Start from any node and follow the edges.',
    suggestions: [{ label: 'Open the graph', href: '/graph' }],
  },
  {
    keywords: ['job', 'jobs', 'career', 'careers', 'hire', 'hiring', 'work'],
    response:
      'Looking for open roles in the AI ecosystem? The Jobs page aggregates openings from across tracked organisations.',
    suggestions: [{ label: 'See open jobs', href: '/jobs' }],
  },
  {
    keywords: ['news', 'latest', 'updates', 'release', 'releases', 'changelog'],
    response:
      'Stay current with the latest releases, model updates, and ecosystem news collected by the AI Atlas pipeline.',
    suggestions: [{ label: 'Read latest news', href: '/news' }],
  },
  {
    keywords: ['tutorial', 'tutorials', 'learn', 'course', 'guide'],
    response:
      'Tutorials and guides live under each topic. Filter by difficulty and format to find one that matches your level.',
    suggestions: [{ label: 'Browse tutorials', href: '/tutorials' }],
  },
  {
    keywords: ['help', 'support', 'how', 'where'],
    response:
      'I can point you to the right section: Compare, Playgrounds, Decisions, Graph, Jobs, or News. Try asking about any of those.',
  },
  {
    keywords: ['thanks', 'thank you', 'thx'],
    response: "You're welcome! Let me know if there is anything else I can help you find.",
  },
  {
    // Sentinel — must remain last. Always matches.
    keywords: [],
    response:
      "I am not sure I understood that. Try asking about compare, playgrounds, recommendations, the graph, jobs, or news — I'll point you to the right page.",
    suggestions: [
      { label: 'Home', href: '/' },
      { label: 'Compare', href: '/compare' },
      { label: 'Decide', href: '/decide' },
    ],
  },
];

/**
 * Escape a string so it can be safely embedded in a `RegExp`.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns the first rule whose keywords appear as whole words in the query.
 * Falls back to the trailing catch-all rule (which has empty keywords).
 */
export function matchRule(input: string): AssistantRule {
  const normalised = input.trim().toLowerCase();
  if (normalised.length > 0) {
    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (keyword.length === 0) continue;
        const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
        if (pattern.test(normalised)) {
          return rule;
        }
      }
    }
  }
  // Fallback is the last rule (empty keywords, always matches).
  return rules.at(-1)!;
}
