import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { matchRule, type AssistantRule, type AssistantSuggestion } from '@/lib/assistant/rules';
import { withBase } from '@/lib/utils/url';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestions?: AssistantSuggestion[];
  ruleKeywords?: string[];
}

const STORAGE_KEY = 'ai-atlas:assistant:messages:v1';
const PANEL_TITLE = 'AI Atlas Assistant';
const WELCOME_MESSAGE: AssistantMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm the AI Atlas assistant. Ask me about compare, playgrounds, recommendations, the graph, jobs, or news.",
  suggestions: [
    { label: 'Compare', href: '/compare' },
    { label: 'Decide', href: '/decide' },
    { label: 'Playgrounds', href: '/playgrounds' },
  ],
  ruleKeywords: ['hi', 'hello'],
};

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadMessages(): AssistantMessage[] {
  if (typeof window === 'undefined') return [WELCOME_MESSAGE];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [WELCOME_MESSAGE];
    const messages: AssistantMessage[] = [];
    for (const entry of parsed) {
      if (
        entry &&
        typeof entry === 'object' &&
        'id' in entry &&
        'role' in entry &&
        'text' in entry &&
        ((entry as { role: unknown }).role === 'user' ||
          (entry as { role: unknown }).role === 'assistant')
      ) {
        const e = entry as Partial<AssistantMessage> & { role: 'user' | 'assistant' };
        messages.push({
          id: typeof e.id === 'string' ? e.id : generateId(),
          role: e.role,
          text: typeof e.text === 'string' ? e.text : '',
          suggestions: Array.isArray(e.suggestions) ? e.suggestions : undefined,
          ruleKeywords: Array.isArray(e.ruleKeywords) ? e.ruleKeywords : undefined,
        });
      }
    }
    return messages.length > 0 ? messages : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function persistMessages(messages: AssistantMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}

function buildAssistantReply(rule: AssistantRule): AssistantMessage {
  return {
    id: generateId(),
    role: 'assistant',
    text: rule.response,
    suggestions: rule.suggestions,
    ruleKeywords: rule.keywords,
  };
}

export interface AIAssistantProps {
  /**
   * Override the floating action button position. Useful for narrow layouts.
   * Defaults to bottom-right.
   */
  position?: 'bottom-right' | 'bottom-left';
}

export function AIAssistant({ position = 'bottom-right' }: AIAssistantProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState('');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  // Hydrate from localStorage after mount to avoid SSR mismatches.
  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  // Persist on every change after the initial render.
  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  // Close on Escape and focus management when the panel opens.
  useEffect(() => {
    if (!open) return;
    const node = inputRef.current;
    if (node) {
      // Focus the input shortly after the panel mounts.
      const t = window.setTimeout(() => node.focus(), 0);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const positionClasses = useMemo(
    () => (position === 'bottom-left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'),
    [position],
  );

  const handleSubmit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const value = draft.trim();
      if (value.length === 0) return;
      const userMessage: AssistantMessage = {
        id: generateId(),
        role: 'user',
        text: value,
      };
      const rule = matchRule(value);
      const assistantMessage = buildAssistantReply(rule);
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setDraft('');
    },
    [draft],
  );

  const handleClear = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setDraft('');
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div
      className={`fixed bottom-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 ${positionClasses}`}
    >
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          data-testid="ai-assistant-panel"
          className="bg-surface-card border-border-strong flex w-[min(360px,calc(100vw-2rem))] flex-col rounded-xl border shadow-xl"
        >
          <header className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Badge variant="info" aria-hidden="true">
                AI
              </Badge>
              <h2 id={titleId} className="text-body text-text font-semibold">
                {PANEL_TITLE}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
                aria-label="Clear conversation"
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                aria-label="Close assistant"
              >
                Close
              </Button>
            </div>
          </header>

          <div
            className="flex max-h-[60vh] min-h-[200px] flex-col gap-3 overflow-y-auto px-4 py-3"
            data-testid="ai-assistant-log"
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>

          <form
            className="border-border flex items-end gap-2 border-t px-4 py-3"
            onSubmit={handleSubmit}
          >
            <label htmlFor={`ai-assistant-input-${titleId}`} className="sr-only">
              Ask the assistant
            </label>
            <Input
              id={`ai-assistant-input-${titleId}`}
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about compare, playgrounds, jobs..."
              aria-label="Ask the assistant"
              data-testid="ai-assistant-input"
              className="flex-1"
            />
            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={draft.trim().length === 0}
              aria-label="Send message"
              data-testid="ai-assistant-send"
            >
              Send
            </Button>
          </form>
        </div>
      ) : null}

      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close AI Atlas Assistant' : 'Open AI Atlas Assistant'}
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        data-testid="ai-assistant-toggle"
        className="bg-primary-orange text-text-inverse hover:bg-primary-hover focus-visible:ring-primary-orange duration-fast focus-visible:ring-offset-surface h-12 w-12 rounded-full shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span aria-hidden="true" className="text-h4 font-bold">
          {open ? '×' : 'AI'}
        </span>
      </button>
    </div>
  );
}

interface MessageBubbleProps {
  message: AssistantMessage;
}

function MessageBubble({ message }: MessageBubbleProps): ReactElement {
  const isUser = message.role === 'user';
  return (
    <div
      className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
      data-role={message.role}
    >
      <div
        className={`text-small max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-primary-orange text-text-inverse'
            : 'bg-surface-elevated text-text border-border border'
        }`}
      >
        {message.text}
      </div>
      {message.suggestions && message.suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {message.suggestions.map((suggestion) => (
            <a
              key={`${message.id}-${suggestion.href}`}
              href={withBase(suggestion.href)}
              className="text-small text-primary-orange hover:text-primary-hover focus-visible:ring-primary-orange focus-visible:ring-offset-surface rounded-md underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {suggestion.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default AIAssistant;
