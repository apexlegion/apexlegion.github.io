import { useMemo, useState, type ReactNode } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface DiffusionPlaygroundProps {
  initialPrompt?: string;
  initialSteps?: number;
  initialCfg?: number;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

export interface DiffusionFrame {
  step: number;
  noiseLevel: number; // 1.0 = pure noise, 0.0 = final image
}

export interface DiffusionRun {
  frames: DiffusionFrame[];
  caption: string;
  guidanceNote: string;
}

/**
 * Build a deterministic mock diffusion run. Returns a list of frames showing
 * the noise level decreasing per step, plus a placeholder caption describing
 * the would-be image.
 *
 * CFG scale: higher values amplify prompt adherence; extreme values produce
 * oversaturated / artifact-heavy outputs (we surface this as a guidance note).
 */
export function simulateDiffusion(
  prompt: string,
  steps: number,
  cfgScale: number,
  frameCount = 8,
): DiffusionRun {
  const safeSteps = Math.max(1, Math.min(100, Math.round(steps)));
  const safeCfg = Math.max(1, Math.min(20, cfgScale));
  const safeFrameCount = Math.max(2, Math.min(safeSteps, frameCount));

  const frames: DiffusionFrame[] = [];
  for (let i = 0; i < safeFrameCount; i++) {
    const step = Math.round(((i + 1) / safeFrameCount) * safeSteps);
    const progress = (i + 1) / safeFrameCount;
    // Smooth easing: noise decays quickly at first, then asymptotically.
    const noise = Math.exp(-3 * progress);
    frames.push({ step, noiseLevel: round(noise) });
  }

  const trimmedPrompt = prompt.trim();
  const caption =
    trimmedPrompt.length > 0
      ? `Mock render of "${trimmedPrompt.slice(0, 80)}${trimmedPrompt.length > 80 ? '…' : ''}" — a ${safeSteps}-step denoising pass.`
      : 'Mock render of an empty prompt — diffuse a blob of noise.';

  let guidanceNote: string;
  if (safeCfg < 4) {
    guidanceNote = `CFG ${safeCfg.toFixed(1)} is low — outputs will be more diverse but may drift from the prompt.`;
  } else if (safeCfg <= 10) {
    guidanceNote = `CFG ${safeCfg.toFixed(1)} is in the sweet spot — strong prompt adherence with natural detail.`;
  } else {
    guidanceNote = `CFG ${safeCfg.toFixed(1)} is high — expect oversaturated colours and possible artefacts.`;
  }

  return { frames, caption, guidanceNote };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

const DEFAULT_PROMPT =
  'A serene mountain lake at sunrise, soft mist over the water, photorealistic, 35mm film grain.';

export function DiffusionPlayground({
  initialPrompt = DEFAULT_PROMPT,
  initialSteps = 30,
  initialCfg = 7.5,
  title = 'Diffusion Playground',
  description = 'Trigger a mock diffusion run with prompt, steps, and CFG scale.',
  difficulty = 'student',
  estimatedMinutes = 4,
  relatedConcepts = ['diffusion', 'image-generation', 'guidance'],
}: DiffusionPlaygroundProps): ReactNode {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [steps, setSteps] = useState(initialSteps);
  const [cfg, setCfg] = useState(initialCfg);
  const [hasRun, setHasRun] = useState(false);

  const run = useMemo(() => simulateDiffusion(prompt, steps, cfg), [prompt, steps, cfg]);

  const latestFrame = run.frames[run.frames.length - 1];

  return (
    <PlaygroundShell
      title={title}
      description={description}
      difficulty={difficulty}
      estimatedMinutes={estimatedMinutes}
      relatedConcepts={relatedConcepts}
      controls={
        <div className="flex flex-col gap-4">
          <Textarea
            label="Prompt"
            helperText="Describe the image you want the diffusion model to imagine."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="diffusion-steps" className="text-small text-text font-medium">
              Steps: <span className="text-text-muted">{steps}</span>
            </label>
            <input
              id="diffusion-steps"
              type="range"
              min={1}
              max={100}
              step={1}
              value={steps}
              onChange={(event) => setSteps(Number(event.target.value))}
              className="accent-primary-orange h-2 w-full"
              aria-valuemin={1}
              aria-valuemax={100}
              aria-valuenow={steps}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="diffusion-cfg" className="text-small text-text font-medium">
              CFG scale: <span className="text-text-muted">{cfg.toFixed(1)}</span>
            </label>
            <input
              id="diffusion-cfg"
              type="range"
              min={1}
              max={20}
              step={0.1}
              value={cfg}
              onChange={(event) => setCfg(Number(event.target.value))}
              className="accent-primary-orange h-2 w-full"
              aria-valuemin={1}
              aria-valuemax={20}
              aria-valuenow={cfg}
            />
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setHasRun(true)}
            disabled={!prompt.trim()}
          >
            {hasRun ? 'Re-run generation' : 'Run mock generation'}
          </Button>
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="info">{steps} steps</Badge>
            <Badge variant="warning">CFG {cfg.toFixed(1)}</Badge>
            <span className="text-tiny text-text-subtle">
              {hasRun
                ? `final noise ${((latestFrame?.noiseLevel ?? 0) * 100).toFixed(1)}%`
                : 'Press run to simulate'}
            </span>
          </div>
          <div
            aria-label="Mock diffusion preview"
            className="border-border bg-surface-elevated flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border"
          >
            <NoisePreview frames={run.frames} running={hasRun} />
          </div>
          <p className="text-small text-text-muted">{run.guidanceNote}</p>
        </div>
      }
      output={hasRun ? run.caption : 'No generation yet — press run to see a mock caption.'}
    />
  );
}

interface NoisePreviewProps {
  frames: { step: number; noiseLevel: number }[];
  running: boolean;
}

function NoisePreview({ frames, running }: NoisePreviewProps): ReactNode {
  // Build a deterministic dot field whose intensity scales with the latest frame.
  const seed = frames[frames.length - 1]?.noiseLevel ?? 1;
  const cellSize = 14;
  const cols = 18;
  const rows = 14;

  return (
    <svg
      viewBox={`0 0 ${cols * cellSize} ${rows * cellSize}`}
      role="img"
      aria-hidden="true"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x={0} y={0} width={cols * cellSize} height={rows * cellSize} className="fill-surface" />
      {Array.from({ length: rows }).flatMap((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const idx = row * cols + col;
          // Cheap deterministic hash so the pattern doesn't shift on each render.
          const v = ((idx * 9301 + 49297) % 233280) / 233280;
          const intensity = running ? v * seed : 1;
          const alpha = 0.05 + intensity * 0.9;
          return (
            <rect
              key={`${row}-${col}`}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize - 1}
              height={cellSize - 1}
              fill={`rgba(244, 114, 33, ${alpha.toFixed(3)})`}
            />
          );
        }),
      )}
    </svg>
  );
}
