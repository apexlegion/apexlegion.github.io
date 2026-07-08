import { useMemo, useState, type ReactNode } from 'react';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';
import type { ModelEntity } from '@/lib/schemas/entity';

export interface ModelComparisonPlaygroundProps {
  models?: ModelEntity[];
  initialLeftSlug?: string;
  initialRightSlug?: string;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

interface DiffRow {
  label: string;
  left: string | undefined;
  right: string | undefined;
  match: boolean;
}

function buildRows(left: ModelEntity, right: ModelEntity): DiffRow[] {
  const pairs: { label: string; left: string | undefined; right: string | undefined }[] = [
    { label: 'Parameters', left: left.parameters, right: right.parameters },
    { label: 'Modality', left: left.modality, right: right.modality },
    { label: 'License', left: left.license, right: right.license },
    { label: 'Published by', left: left.publishedBy, right: right.publishedBy },
    { label: 'Tags', left: left.tags.join(', '), right: right.tags.join(', ') },
  ];
  return pairs.map((p) => ({
    label: p.label,
    left: p.left,
    right: p.right,
    match: p.left === p.right,
  }));
}

export function ModelComparisonPlayground({
  models = [],
  initialLeftSlug,
  initialRightSlug,
  title = 'Model Comparison Playground',
  description = 'Pick any two models from the atlas to compare parameters, modality, and license side by side.',
  difficulty = 'beginner',
  estimatedMinutes = 3,
  relatedConcepts = ['models', 'licensing'],
}: ModelComparisonPlaygroundProps): ReactNode {
  const first = models[0]?.slug ?? '';
  const second = models[1]?.slug ?? first;
  const [leftSlug, setLeftSlug] = useState(initialLeftSlug ?? first);
  const [rightSlug, setRightSlug] = useState(initialRightSlug ?? second);

  const options = useMemo(
    () =>
      models.map((model) => ({
        value: model.slug,
        label: model.name,
      })),
    [models],
  );

  const left = useMemo(() => models.find((m) => m.slug === leftSlug), [models, leftSlug]);
  const right = useMemo(() => models.find((m) => m.slug === rightSlug), [models, rightSlug]);

  const rows = useMemo(() => {
    if (!left || !right) return [];
    return buildRows(left, right);
  }, [left, right]);

  return (
    <PlaygroundShell
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
      relatedConcepts={relatedConcepts}
      controls={
        <div className="flex flex-col gap-4">
          <Select
            label="Left model"
            options={options}
            value={leftSlug}
            onChange={(event) => setLeftSlug(event.target.value)}
            placeholder="Select a model"
          />
          <Select
            label="Right model"
            options={options}
            value={rightSlug}
            onChange={(event) => setRightSlug(event.target.value)}
            placeholder="Select a model"
          />
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          {models.length === 0 ? (
            <p className="text-small text-text-subtle">No model data available.</p>
          ) : !left || !right ? (
            <p className="text-small text-text-subtle">Select two models to compare.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-border bg-surface-elevated rounded-md border p-3">
                  <h3 className="text-small text-text font-semibold">{left.name}</h3>
                  <p className="text-tiny text-text-subtle">{left.slug}</p>
                </div>
                <div className="border-border bg-surface-elevated rounded-md border p-3">
                  <h3 className="text-small text-text font-semibold">{right.name}</h3>
                  <p className="text-tiny text-text-subtle">{right.slug}</p>
                </div>
              </div>
              <table className="text-small w-full border-collapse">
                <thead>
                  <tr className="text-tiny text-text-muted">
                    <th className="text-left font-medium tracking-wide uppercase">Attribute</th>
                    <th className="text-left font-medium tracking-wide uppercase">Left</th>
                    <th className="text-left font-medium tracking-wide uppercase">Right</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-border border-t">
                      <td className="text-text-muted py-1.5 pr-2 align-top font-medium">
                        {row.label}
                      </td>
                      <td className="text-text py-1.5 pr-2 align-top">
                        {row.left ?? '—'}
                        {row.match ? null : (
                          <Badge variant="info" className="ml-2">
                            diff
                          </Badge>
                        )}
                      </td>
                      <td className="text-text py-1.5 align-top">{row.right ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      }
    />
  );
}
