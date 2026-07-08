import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface AgentWorkflowSimulatorProps {
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

export type AgentStepId = 'plan' | 'search' | 'reason' | 'act' | 'answer';
export type StepStatus = 'idle' | 'running' | 'done' | 'failed';

export interface AgentStepDef {
  id: AgentStepId;
  label: string;
  description: string;
  durationMs: number;
}

export const AGENT_STEPS: AgentStepDef[] = [
  { id: 'plan', label: 'Plan', description: 'Decompose the goal into sub-tasks.', durationMs: 600 },
  {
    id: 'search',
    label: 'Search',
    description: 'Look up relevant context from a knowledge base.',
    durationMs: 900,
  },
  {
    id: 'reason',
    label: 'Reason',
    description: 'Weigh the evidence and decide next move.',
    durationMs: 700,
  },
  {
    id: 'act',
    label: 'Act',
    description: 'Invoke a tool or write to a scratchpad.',
    durationMs: 500,
  },
  {
    id: 'answer',
    label: 'Answer',
    description: 'Compose a final response for the user.',
    durationMs: 400,
  },
];

const STEP_LABELS: Record<AgentStepId, string> = {
  plan: 'Plan',
  search: 'Search',
  reason: 'Reason',
  act: 'Act',
  answer: 'Answer',
};

const STATUS_LABEL: Record<StepStatus, string> = {
  idle: 'idle',
  running: 'running',
  done: 'done',
  failed: 'failed',
};

export function AgentWorkflowSimulator({
  title = 'Agent Workflow Simulator',
  description = 'Toggle and reorder agent steps, then run a mock execution to see each step complete.',
  difficulty = 'developer',
  estimatedMinutes = 6,
  relatedConcepts = ['agents', 'tool-use', 'reasoning'],
}: AgentWorkflowSimulatorProps): ReactNode {
  const [enabled, setEnabled] = useState<Record<AgentStepId, boolean>>({
    plan: true,
    search: true,
    reason: true,
    act: false,
    answer: true,
  });
  const [order, setOrder] = useState<AgentStepId[]>(['plan', 'search', 'reason', 'act', 'answer']);
  const [statuses, setStatuses] = useState<Record<AgentStepId, StepStatus>>({
    plan: 'idle',
    search: 'idle',
    reason: 'idle',
    act: 'idle',
    answer: 'idle',
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const activeOrder = useMemo(() => order.filter((id) => enabled[id]), [order, enabled]);

  const toggleStep = (id: AgentStepId): void => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const moveStep = (id: AgentStepId, direction: -1 | 1): void => {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(idx, 1);
      if (item) next.splice(target, 0, item);
      return next;
    });
  };

  const runWorkflow = (): void => {
    if (activeOrder.length === 0 || running) return;
    setRunning(true);
    setLogs([]);
    setStatuses({ plan: 'idle', search: 'idle', reason: 'idle', act: 'idle', answer: 'idle' });

    const queue = activeOrder.slice();
    let cumulative = 0;

    const runNext = (): void => {
      const nextId = queue.shift();
      if (!nextId) {
        setRunning(false);
        return;
      }
      const step = AGENT_STEPS.find((s) => s.id === nextId);
      if (!step) return;
      setStatuses((prev) => ({ ...prev, [nextId]: 'running' }));
      cumulative += step.durationMs;
      setLogs((prev) => [
        ...prev,
        `[+${cumulative}ms] ${STEP_LABELS[nextId]}: ${step.description}`,
      ]);
      setTimeout(
        () => {
          setStatuses((prev) => ({ ...prev, [nextId]: 'done' }));
          runNext();
        },
        Math.min(step.durationMs, 1200),
      );
    };

    runNext();
  };

  return (
    <PlaygroundShell
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
      relatedConcepts={relatedConcepts}
      controls={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-tiny text-text-muted font-semibold tracking-wide uppercase">
              Steps
            </span>
            {AGENT_STEPS.map((step) => (
              <label key={step.id} className="text-small text-text flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled[step.id]}
                  onChange={() => toggleStep(step.id)}
                  className="accent-primary-orange h-4 w-4"
                />
                {step.label}
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-tiny text-text-muted font-semibold tracking-wide uppercase">
              Order
            </span>
            <ol className="flex flex-col gap-1.5" aria-label="Step order">
              {order.map((id, index) => (
                <li
                  key={id}
                  className="border-border bg-surface-elevated text-small flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
                >
                  <span className="text-text">
                    {index + 1}. {STEP_LABELS[id]}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveStep(id, -1)}
                      disabled={index === 0}
                      className="border-border bg-surface text-tiny text-text-muted rounded border px-2 py-0.5 disabled:opacity-30"
                      aria-label={`Move ${STEP_LABELS[id]} up`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(id, 1)}
                      disabled={index === order.length - 1}
                      className="border-border bg-surface text-tiny text-text-muted rounded border px-2 py-0.5 disabled:opacity-30"
                      aria-label={`Move ${STEP_LABELS[id]} down`}
                    >
                      ↓
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={runWorkflow}
            disabled={running || activeOrder.length === 0}
          >
            {running ? 'Running…' : 'Run workflow'}
          </Button>
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="info">{activeOrder.length} active steps</Badge>
            <span className="text-tiny text-text-subtle">Click run to simulate</span>
          </div>
          <ol className="flex flex-col gap-2" aria-label="Step status">
            {order.map((id) => {
              const status = statuses[id];
              const active = enabled[id];
              const variant =
                status === 'done'
                  ? 'success'
                  : status === 'running'
                    ? 'info'
                    : status === 'failed'
                      ? 'danger'
                      : 'neutral';
              return (
                <li
                  key={id}
                  className={
                    'border-border bg-surface-elevated flex items-center justify-between gap-3 rounded-md border p-3 ' +
                    (!active ? 'opacity-50' : '')
                  }
                >
                  <span className="text-small text-text font-medium">{STEP_LABELS[id]}</span>
                  <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>
                </li>
              );
            })}
          </ol>
        </div>
      }
      output={
        logs.length === 0
          ? 'No execution yet.'
          : logs.map((line, index) => (
              <div key={index} className="text-tiny">
                {line}
              </div>
            ))
      }
    />
  );
}
