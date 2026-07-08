import { useMemo, useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface InferenceVisualizerProps {
  initialPromptTokens?: number;
  initialParamsBillions?: number;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

/**
 * Rough throughput estimate: tokens/sec scales inversely with parameter count
 * for a single consumer GPU. Calibrated to roughly match LLaMA.cpp FP16
 * performance on an RTX 3090.
 */
export function estimateTokensPerSecond(paramsBillions: number, promptTokens: number): number {
  if (paramsBillions <= 0) return 0;
  const baseTps = 120 / Math.sqrt(paramsBillions);
  const promptPenalty = promptTokens > 512 ? 512 / promptTokens : 1;
  return Math.max(1, baseTps * promptPenalty);
}

/**
 * Rough VRAM estimate in GB. Accounts for weights, KV cache, and overhead.
 */
export function estimateVramGigabytes(paramsBillions: number, contextTokens: number): number {
  const weights = paramsBillions * 2; // FP16 weights
  const kvCache = (contextTokens / 1000) * 0.12 * paramsBillions;
  const overhead = 1.2;
  return weights + kvCache + overhead;
}

export function InferenceVisualizer({
  initialPromptTokens = 512,
  initialParamsBillions = 7,
  title = 'Inference Visualizer',
  description = 'Estimate tokens-per-second and VRAM use for a local inference run.',
  difficulty = 'student',
  estimatedMinutes = 4,
  relatedConcepts = ['inference', 'gpu', 'quantization'],
}: InferenceVisualizerProps): ReactNode {
  const [promptTokens, setPromptTokens] = useState(initialPromptTokens);
  const [params, setParams] = useState(initialParamsBillions);

  const stats = useMemo(() => {
    const tps = estimateTokensPerSecond(params, promptTokens);
    const vram = estimateVramGigabytes(params, promptTokens);
    return { tps, vram };
  }, [params, promptTokens]);

  return (
    <PlaygroundShell
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
      relatedConcepts={relatedConcepts}
      controls={
        <div className="flex flex-col gap-4">
          <Input
            label="Prompt length (tokens)"
            type="number"
            inputMode="numeric"
            min={1}
            step={64}
            value={promptTokens}
            onChange={(event) => {
              const next = Number(event.target.value);
              setPromptTokens(Number.isFinite(next) && next > 0 ? next : 1);
            }}
          />
          <Input
            label="Model size (billions of parameters)"
            type="number"
            inputMode="decimal"
            min={0.1}
            step={0.1}
            value={params}
            onChange={(event) => {
              const next = Number(event.target.value);
              setParams(Number.isFinite(next) && next > 0 ? next : 0.1);
            }}
          />
        </div>
      }
      visualization={
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <Badge variant="info">{stats.tps.toFixed(1)} tokens / sec</Badge>
          <Badge variant="warning">~{stats.vram.toFixed(1)} GB VRAM</Badge>
          <p className="text-tiny text-text-subtle max-w-prose">
            Estimates assume FP16 weights on a single consumer GPU. Quantization can shrink the VRAM
            figure by 2–4×.
          </p>
        </div>
      }
    />
  );
}
