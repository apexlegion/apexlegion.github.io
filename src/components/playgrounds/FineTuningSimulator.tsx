import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface FineTuningSimulatorProps {
  initialDatasetSize?: number;
  initialEpochs?: number;
  initialLearningRate?: number;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

export interface LossPoint {
  step: number;
  trainLoss: number;
  valLoss: number;
}

export interface FineTuningCurve {
  points: LossPoint[];
  finalTrainLoss: number;
  finalValLoss: number;
  overfit: boolean;
}

/**
 * Build a deterministic mock training curve based on dataset size, epoch count,
 * and learning rate. The model is intentionally simple — it is designed for
 * intuition-building rather than numerical accuracy.
 *
 * Behaviour:
 *   - Larger datasets lower the floor of both curves.
 *   - Too many epochs overfit: validation loss climbs while training loss falls.
 *   - Too-high a learning rate diverges; too-low a learning rate converges slowly.
 *
 * Exported for unit tests.
 */
export function simulateFineTuning(
  datasetSize: number,
  epochs: number,
  learningRate: number,
  steps = 50,
): FineTuningCurve {
  const safeDataset = Math.max(50, datasetSize);
  const safeEpochs = Math.max(1, Math.min(20, Math.round(epochs)));
  const lr = Math.max(0.00001, learningRate);

  // Data floor — more data, lower irreducible loss.
  const dataFloor = 0.3 + 60 / safeDataset;

  // Learning-rate sweet spot is around 1e-3. Penalise distances.
  const lrPenalty = Math.abs(Math.log10(lr) + 3); // 0 at 1e-3
  const lrFactor = 1 + lrPenalty * 0.35;

  // Overfit penalty: 0 for epochs <= 3, grows linearly.
  const overfitPenalty = Math.max(0, safeEpochs - 3) * 0.08;

  const points: LossPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1); // 0..1
    const trainBase = dataFloor + (2.4 - dataFloor) * Math.exp(-3 * progress) * lrFactor;
    const valBase = dataFloor + (2.4 - dataFloor) * Math.exp(-2.4 * progress) * lrFactor;
    const trainLoss = trainBase + Math.max(0, 0.5 - progress) * 0.05;
    // Validation loss curves up if epochs imply overfit.
    const valLoss = valBase + overfitPenalty * progress * progress;
    points.push({
      step: Math.round(((i + 1) * safeEpochs * 10) / steps),
      trainLoss: round(trainLoss),
      valLoss: round(valLoss),
    });
  }

  const finalTrain = points[points.length - 1]?.trainLoss ?? 0;
  const finalVal = points[points.length - 1]?.valLoss ?? 0;
  const overfit = finalVal - finalTrain > 0.4 || overfitPenalty > 0.5;

  return { points, finalTrainLoss: finalTrain, finalValLoss: finalVal, overfit };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Map a loss value (typically 0..3) onto the SVG plot's y axis.
 */
function yForLoss(loss: number, height: number, maxLoss = 3.0): number {
  const clamped = Math.max(0, Math.min(maxLoss, loss));
  return height - (clamped / maxLoss) * height;
}

export function FineTuningSimulator({
  initialDatasetSize = 2000,
  initialEpochs = 3,
  initialLearningRate = 0.001,
  title = 'Fine-tuning Simulator',
  description = 'Watch a mock loss curve respond to dataset size, epoch count, and learning rate.',
  difficulty = 'developer',
  estimatedMinutes = 5,
  relatedConcepts = ['fine-tuning', 'training', 'learning-rate'],
}: FineTuningSimulatorProps): ReactNode {
  const [datasetSize, setDatasetSize] = useState(initialDatasetSize);
  const [epochs, setEpochs] = useState(initialEpochs);
  const [learningRate, setLearningRate] = useState(initialLearningRate);

  const curve = useMemo(
    () => simulateFineTuning(datasetSize, epochs, learningRate),
    [datasetSize, epochs, learningRate],
  );

  const plotWidth = 480;
  const plotHeight = 220;
  const padding = 24;
  const innerWidth = plotWidth - padding * 2;
  const innerHeight = plotHeight - padding * 2;

  const xForStep = (step: number, maxStep: number): number => {
    if (maxStep <= 0) return padding;
    return padding + (step / maxStep) * innerWidth;
  };

  const maxStep = curve.points[curve.points.length - 1]?.step ?? 1;

  const trainPath = curve.points
    .map((point, index) => {
      const x = xForStep(point.step, maxStep);
      const y = padding + yForLoss(point.trainLoss, innerHeight);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const valPath = curve.points
    .map((point, index) => {
      const x = xForStep(point.step, maxStep);
      const y = padding + yForLoss(point.valLoss, innerHeight);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <PlaygroundShell
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
      relatedConcepts={relatedConcepts}
      controls={
        <div className="flex flex-col gap-4">
          <SliderField
            id="ft-dataset"
            label="Dataset size"
            valueLabel={`${datasetSize.toLocaleString()} examples`}
            min={100}
            max={20000}
            step={100}
            value={datasetSize}
            onChange={setDatasetSize}
          />
          <SliderField
            id="ft-epochs"
            label="Epochs"
            valueLabel={`${epochs}`}
            min={1}
            max={15}
            step={1}
            value={epochs}
            onChange={(next) => setEpochs(Math.round(next))}
          />
          <SliderField
            id="ft-lr"
            label="Learning rate"
            valueLabel={learningRate.toExponential(2)}
            min={0.00001}
            max={0.1}
            step={0.00001}
            value={learningRate}
            onChange={setLearningRate}
            logarithmic
          />
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="info">train {curve.finalTrainLoss.toFixed(2)}</Badge>
            <Badge variant={curve.overfit ? 'danger' : 'success'}>
              val {curve.finalValLoss.toFixed(2)}
            </Badge>
            <span className="text-tiny text-text-subtle">
              {curve.overfit ? 'validation diverging — likely overfitting' : 'curves tracking'}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${plotWidth} ${plotHeight}`}
            role="img"
            aria-label="Mock training and validation loss curves"
            className="border-border bg-surface-elevated w-full rounded-md border"
          >
            {/* Axis grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const y = padding + tick * innerHeight;
              return (
                <line
                  key={`grid-${tick}`}
                  x1={padding}
                  x2={padding + innerWidth}
                  y1={y}
                  y2={y}
                  className="stroke-border"
                  strokeDasharray="3 4"
                  strokeWidth={1}
                />
              );
            })}
            {/* Loss curves */}
            <path d={trainPath} className="stroke-primary-orange" fill="none" strokeWidth={2.5} />
            <path
              d={valPath}
              className="stroke-info"
              fill="none"
              strokeWidth={2.5}
              strokeDasharray="6 4"
            />
            {/* Labels */}
            <text
              x={padding}
              y={padding - 6}
              className="fill-text-muted"
              fontSize={11}
              fontFamily="monospace"
            >
              loss
            </text>
            <text
              x={padding + innerWidth}
              y={plotHeight - 6}
              textAnchor="end"
              className="fill-text-muted"
              fontSize={11}
              fontFamily="monospace"
            >
              step {maxStep}
            </text>
          </svg>
          <div className="text-tiny text-text-subtle flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="bg-primary-orange inline-block h-2 w-4 rounded-full"
                aria-hidden="true"
              />
              training
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-info inline-block h-2 w-4 rounded-full" aria-hidden="true" />
              validation
            </span>
          </div>
        </div>
      }
    />
  );
}

interface SliderFieldProps {
  id: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (next: number) => void;
  logarithmic?: boolean;
}

function SliderField({
  id,
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  logarithmic = false,
}: SliderFieldProps): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small text-text font-medium">
        {label}: <span className="text-text-muted">{valueLabel}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={logarithmic ? undefined : step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (logarithmic) {
            const t = (next - min) / (max - min);
            onChange(Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min))));
          } else {
            onChange(next);
          }
        }}
        className="accent-primary-orange h-2 w-full"
        aria-valuetext={valueLabel}
      />
    </div>
  );
}
