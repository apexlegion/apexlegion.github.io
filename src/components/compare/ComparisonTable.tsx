import type { ReactNode } from 'react';
import type { Entity } from '@/lib/schemas/entity';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { compareEntities, type ComparisonAttribute, type Winner } from '@/lib/compare';
import { withBase } from '@/lib/utils/url';

export interface ComparisonTableProps {
  entityA: Entity;
  entityB: Entity;
  /** Number of relations each entity has in the knowledge graph. */
  relationsA?: number;
  relationsB?: number;
}

function WinnerBadge({ winner, side }: { winner: Winner | undefined; side: 'a' | 'b' }) {
  if (!winner || winner === 'tie') return null;
  if (winner !== side) return null;
  return (
    <Badge variant="success" className="ml-2">
      Winner
    </Badge>
  );
}

function ValueCell({
  attribute,
  side,
  highlightTags,
}: {
  attribute: ComparisonAttribute;
  side: 'a' | 'b';
  highlightTags: Set<string>;
}) {
  const value = side === 'a' ? attribute.valueA : attribute.valueB;
  const isTags = attribute.id === 'tags';

  if (!isTags) {
    return (
      <div className="flex items-start gap-2">
        <span className="text-body text-text break-words">{value || '—'}</span>
        <WinnerBadge winner={attribute.winner} side={side} />
      </div>
    );
  }

  const tags = value
    .split(', ')
    .map((t) => t.trim())
    .filter(Boolean);

  if (tags.length === 0) {
    return <span className="text-text-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => {
        const isShared = highlightTags.has(tag);
        return (
          <Tag key={`${side}-${tag}`} active={isShared} disabled>
            {tag}
          </Tag>
        );
      })}
      <WinnerBadge winner={attribute.winner} side={side} />
    </div>
  );
}

function TitleCell({ label }: { label: string }): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <span className="text-tiny text-primary-orange font-mono tracking-wide uppercase">
        Attribute
      </span>
      <span className="text-small text-text font-medium">{label}</span>
    </div>
  );
}

/**
 * ComparisonTable — side-by-side attribute comparison for any two entities
 * (project, model, concept, or tutorial). Highlights matching tags and
 * surfaces a subtle "Winner" badge per attribute.
 */
export function ComparisonTable({
  entityA,
  entityB,
  relationsA = 0,
  relationsB = 0,
}: ComparisonTableProps) {
  const result = compareEntities(entityA, entityB, relationsA, relationsB);
  const sharedTags = new Set(result.sharedTags);

  return (
    <div className="border-border bg-surface-card overflow-hidden rounded-lg border">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Side-by-side comparison of {entityA.name} and {entityB.name}
        </caption>
        <thead>
          <tr className="border-border bg-surface-elevated border-b">
            <th
              scope="col"
              className="text-text-muted w-1/4 px-4 py-3 text-left align-bottom text-sm font-medium"
            >
              Attribute
            </th>
            <th
              scope="col"
              className="text-text w-3/8 px-4 py-3 text-left align-bottom text-sm font-semibold"
            >
              <div className="flex flex-col gap-1">
                <Badge variant={entityA.type}>{entityA.type}</Badge>
                <a
                  href={entityHref(entityA)}
                  className="hover:text-primary-orange text-text text-body font-semibold transition-colors"
                >
                  {entityA.name}
                </a>
              </div>
            </th>
            <th
              scope="col"
              className="text-text w-3/8 px-4 py-3 text-left align-bottom text-sm font-semibold"
            >
              <div className="flex flex-col gap-1">
                <Badge variant={entityB.type}>{entityB.type}</Badge>
                <a
                  href={entityHref(entityB)}
                  className="hover:text-primary-orange text-text text-body font-semibold transition-colors"
                >
                  {entityB.name}
                </a>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {result.attributes.map((attr, index) => (
            <tr
              key={attr.id}
              className={index % 2 === 0 ? 'bg-surface-card' : 'bg-surface-elevated/40'}
            >
              <th
                scope="row"
                className="text-text-muted border-border border-t px-4 py-3 text-left align-top text-sm font-normal"
              >
                <TitleCell label={attr.label} />
              </th>
              <td className="border-border text-text border-t px-4 py-3 align-top text-sm">
                <ValueCell attribute={attr} side="a" highlightTags={sharedTags} />
              </td>
              <td className="border-border text-text border-t px-4 py-3 align-top text-sm">
                <ValueCell attribute={attr} side="b" highlightTags={sharedTags} />
              </td>
            </tr>
          ))}
          {result.sharedTags.length > 0 ? (
            <tr className="bg-surface-elevated/40">
              <th
                scope="row"
                className="text-text-muted border-border border-t px-4 py-3 text-left align-top text-sm font-normal"
              >
                <TitleCell label="Shared tags" />
              </th>
              <td
                colSpan={2}
                className="border-border text-text border-t px-4 py-3 align-top text-sm"
              >
                <div className="flex flex-wrap gap-1.5" role="list">
                  {result.sharedTags.map((tag) => (
                    <Tag key={`shared-${tag}`} active disabled>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function entityHref(entity: Entity): string {
  const base = entity.type === 'tutorial' ? 'tutorials' : `${entity.type}s`;
  return withBase(`/${base}/${entity.slug}`);
}

export default ComparisonTable;
