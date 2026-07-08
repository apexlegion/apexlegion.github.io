import type { ReactNode } from 'react';
import type { Entity } from '@/lib/schemas/entity';
import { buildMetrics } from '@/lib/compare';

export interface BenchmarkChartProps {
  entityA: Entity;
  entityB: Entity;
  relationsA?: number;
  relationsB?: number;
  /** Optional chart title (defaults to "Metric comparison"). */
  title?: string;
  /** Optional SVG viewBox width. Defaults to 640. */
  width?: number;
  /** Optional SVG viewBox height. Defaults to 280. */
  height?: number;
}

interface BarRow {
  label: string;
  valueA: number;
  valueB: number;
  winner: 'a' | 'b' | 'tie';
}

const BAR_HEIGHT = 18;
const BAR_GAP = 14;
const LABEL_HEIGHT = 22;
const PADDING_X = 24;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 24;

/**
 * BenchmarkChart — small SVG bar chart comparing the two entities across
 * a fixed set of metrics. No external chart library; designed to be both
 * accessible (title + descriptions) and easy to render server-side.
 */
export function BenchmarkChart({
  entityA,
  entityB,
  relationsA = 0,
  relationsB = 0,
  title = 'Metric comparison',
  width = 640,
  height = 280,
}: BenchmarkChartProps): ReactNode {
  const metrics = buildMetrics(entityA, entityB, relationsA, relationsB) satisfies BarRow[];
  const maxValue = metrics.reduce((acc, m) => Math.max(acc, m.valueA, m.valueB), 0);
  const safeMax = maxValue <= 0 ? 1 : maxValue;
  const rowHeight = BAR_HEIGHT * 2 + BAR_GAP + LABEL_HEIGHT;
  const computedHeight = PADDING_TOP + PADDING_BOTTOM + metrics.length * rowHeight;
  const finalHeight = Math.max(height, computedHeight);
  const chartWidth = width - PADDING_X * 2;
  const labelWidth = 140;

  return (
    <figure
      className="border-border bg-surface-card overflow-hidden rounded-lg border p-4"
      aria-label={`${title} for ${entityA.name} and ${entityB.name}`}
    >
      <figcaption className="text-text mb-3 flex items-center justify-between gap-2">
        <span className="text-small font-semibold">{title}</span>
        <span className="text-tiny text-text-muted font-mono tracking-wide uppercase">A vs B</span>
      </figcaption>
      <svg
        role="img"
        aria-label={`Bar chart comparing ${entityA.name} and ${entityB.name} across ${metrics.length} metrics`}
        viewBox={`0 0 ${width} ${finalHeight}`}
        width="100%"
        height={finalHeight}
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{title}</title>
        <desc>
          Bar chart comparing {entityA.name} and {entityB.name} on{' '}
          {metrics.map((m) => m.label).join(', ')}.
        </desc>

        {/* Legend */}
        <g transform={`translate(${PADDING_X}, 0)`}>
          <rect x={0} y={0} width={10} height={10} fill="var(--color-primary-orange)" rx={2} />
          <text x={16} y={9} className="fill-text text-tiny" fontSize={11}>
            {entityA.name}
          </text>
          <rect x={120} y={0} width={10} height={10} fill="var(--color-info, #4dabf7)" rx={2} />
          <text x={136} y={9} className="fill-text-muted text-tiny" fontSize={11}>
            {entityB.name}
          </text>
        </g>

        {metrics.map((metric, index) => {
          const rowTop = PADDING_TOP + index * rowHeight;
          const ratioA = safeMax === 0 ? 0 : metric.valueA / safeMax;
          const ratioB = safeMax === 0 ? 0 : metric.valueB / safeMax;
          const barTrackWidth = chartWidth - labelWidth;
          const aWidth = Math.max(0, Math.round(barTrackWidth * ratioA));
          const bWidth = Math.max(0, Math.round(barTrackWidth * ratioB));

          return (
            <g
              key={metric.id}
              transform={`translate(${PADDING_X}, ${rowTop})`}
              aria-label={`${metric.label}: ${entityA.name} ${metric.valueA}, ${entityB.name} ${metric.valueB}`}
            >
              <text
                x={0}
                y={12}
                className="fill-text-muted text-small"
                fontSize={12}
                dominantBaseline="middle"
              >
                {metric.label}
              </text>
              {/* A bar */}
              <rect
                x={labelWidth}
                y={0}
                width={barTrackWidth}
                height={BAR_HEIGHT}
                fill="var(--color-surface-elevated, #2a2a2a)"
                rx={3}
              />
              <rect
                x={labelWidth}
                y={0}
                width={aWidth}
                height={BAR_HEIGHT}
                fill={
                  metric.winner === 'a'
                    ? 'var(--color-primary-orange, #FF6A00)'
                    : 'var(--color-primary-orange, #FF6A00)'
                }
                opacity={metric.valueA === 0 ? 0.35 : metric.winner === 'b' ? 0.55 : 1}
                rx={3}
              />
              <text
                x={labelWidth + aWidth + 6}
                y={BAR_HEIGHT / 2}
                className="fill-text text-tiny"
                fontSize={11}
                dominantBaseline="middle"
              >
                {metric.valueA}
              </text>

              {/* B bar */}
              <rect
                x={labelWidth}
                y={BAR_HEIGHT + BAR_GAP}
                width={barTrackWidth}
                height={BAR_HEIGHT}
                fill="var(--color-surface-elevated, #2a2a2a)"
                rx={3}
              />
              <rect
                x={labelWidth}
                y={BAR_HEIGHT + BAR_GAP}
                width={bWidth}
                height={BAR_HEIGHT}
                fill="var(--color-info, #4dabf7)"
                opacity={metric.valueB === 0 ? 0.35 : metric.winner === 'a' ? 0.55 : 1}
                rx={3}
              />
              <text
                x={labelWidth + bWidth + 6}
                y={BAR_HEIGHT + BAR_GAP + BAR_HEIGHT / 2}
                className="fill-text text-tiny"
                fontSize={11}
                dominantBaseline="middle"
              >
                {metric.valueB}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export default BenchmarkChart;
