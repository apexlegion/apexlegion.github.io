/**
 * Barrel export for the comparison engine components.
 *
 * The comparison components are React islands rendered from
 * `src/pages/compare/[a]-vs-[b].astro`. Logic shared between the islands
 * lives in `@/lib/compare`.
 */
export {
  ComparisonTable,
  type ComparisonTableProps,
  default as ComparisonTableDefault,
} from './ComparisonTable';
export {
  BenchmarkChart,
  type BenchmarkChartProps,
  default as BenchmarkChartDefault,
} from './BenchmarkChart';
export {
  TimelineCompare,
  type TimelineCompareProps,
  default as TimelineCompareDefault,
} from './TimelineCompare';
