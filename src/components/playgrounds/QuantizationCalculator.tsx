import { useMemo, useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface QuantizationCalculatorProps {
  initialParamsBillions?: number;
  initialBits?: number;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

/**
 * Estimate model on-disk size in MB given a parameter count (in billions)
 * and a per-weight bit width.
 *
 * Formula: size_GB = params * 1e9 * bits / 8 / 1024^3
 */
export function estimateSizeGigabytes(paramsBillions: number, bits: number): number {
  if (paramsBillions <= 0 || bits <= 0) return 0;
  return (paramsBillions * 1e9 * bits) / 8 / 1024 / 1024 / 1024;
}

const PRESETS: { label: string; params: number; bits: number }[] = [
  { label: 'Llama 3 8B · Q4', params: 8, bits: 4 },
  { label: 'Llama 3 70B · Q4', params: 70, bits: 4 },
  { label: 'Mistral 7B · FP16', params: 7, bits: 16 },
  { label: 'Llama 3 70B · FP16', params: 70, bits: 16 },
];

export function QuantizationCalculator({
  initialParamsBillions = 7,
  initialBits = 4,
  title = 'Quantization Calculator',
  description = 'Estimate the on-disk size of a model at different quantization levels.',
  difficulty = 'developer',
  estimatedMinutes = 3,
  relatedConcepts = ['quantization', 'gguf'],
}: QuantizationCalculatorProps): ReactNode {
  const [params, setParams] = useState(initialParamsBillions);
  const [bits, setBits] = useState(initialBits);

  const stats = useMemo(() => {
    const gb = estimateSizeGigabytes(params, bits);
    const mb = gb * 1024;
    return { gb, mb };
  }, [params, bits]);

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
            label="Parameter count (billions)"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={params}
            onChange={(event) => {
              const next = Number(event.target.value);
              setParams(Number.isFinite(next) && next >= 0 ? next : 0);
            }}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bits-slider" className="text-small text-text font-medium">
              Bits per weight: <span className="text-text-muted">{bits}</span>
            </label>
            <input
              id="bits-slider"
              type="range"
              min={1}
              max={16}
              step={1}
              value={bits}
              onChange={(event) => setBits(Number(event.target.value))}
              aria-valuemin={1}
              aria-valuemax={16}
              aria-valuenow={bits}
              className="accent-primary-orange h-2 w-full"
            />
            <div className="text-tiny text-text-subtle flex justify-between">
              <span>1 — aggressive</span>
              <span>16 — fp16</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-tiny text-text-muted font-semibold tracking-wide uppercase">
              Quick presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setParams(preset.params);
                    setBits(preset.bits);
                  }}
                  className="border-border bg-surface-elevated text-text-muted hover:text-text text-tiny rounded-md border px-2 py-1 font-medium transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
      visualization={
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <Badge variant="info">{stats.gb.toFixed(2)} GB</Badge>
          <span className="text-small text-text-muted">≈ {stats.mb.toFixed(0)} MB on disk</span>
          <p className="text-tiny text-text-subtle max-w-prose">
            Estimate only. Real-world files add metadata, tokenizer data, and per-format overhead.
          </p>
        </div>
      }
    />
  );
}
