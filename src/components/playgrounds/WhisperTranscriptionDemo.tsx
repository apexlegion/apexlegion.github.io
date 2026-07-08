import { useMemo, useState, type ReactNode } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PlaygroundShell } from '@/components/playground/PlaygroundShell';

export interface WhisperTranscriptionDemoProps {
  initialTranscript?: string;
  initialSegmentChars?: number;
  title?: string;
  description?: string;
  difficulty?: 'beginner' | 'student' | 'developer' | 'researcher';
  estimatedMinutes?: number;
  relatedConcepts?: string[];
}

export interface TranscriptSegment {
  id: number;
  start: number; // seconds
  end: number; // seconds
  text: string;
  wordCount: number;
}

/**
 * Words per minute used to estimate segment durations. Casual speech is
 * roughly 130–150 wpm; we pick 140 as a middle ground.
 */
const AVERAGE_WORDS_PER_MINUTE = 140;

function wordsPerSecond(): number {
  return AVERAGE_WORDS_PER_MINUTE / 60;
}

function countWords(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/u).length;
}

/**
 * Split a transcript into timestamped segments approximating Whisper's
 * `verbose_json` output. Pure function — exported for unit tests.
 */
export function segmentTranscript(transcript: string, targetChars: number): TranscriptSegment[] {
  const cleaned = transcript.replace(/\s+/gu, ' ').trim();
  if (!cleaned) return [];

  const safeChars = Math.max(20, Math.min(400, Math.round(targetChars)));
  const segments: TranscriptSegment[] = [];
  let cursor = 0;
  let id = 0;
  let elapsed = 0;

  while (cursor < cleaned.length) {
    let end = Math.min(cleaned.length, cursor + safeChars);
    // Prefer breaking on whitespace.
    if (end < cleaned.length) {
      const space = cleaned.lastIndexOf(' ', end);
      if (space > cursor + safeChars / 2) {
        end = space;
      }
    }
    const text = cleaned.slice(cursor, end).trim();
    if (text.length > 0) {
      const words = countWords(text);
      const duration = words / wordsPerSecond();
      const start = round(elapsed);
      elapsed += duration;
      segments.push({
        id: id++,
        start,
        end: round(elapsed),
        text,
        wordCount: words,
      });
    }
    cursor = end + 1;
  }

  return segments;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatTimestamp(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const DEFAULT_TRANSCRIPT =
  'Hello and welcome to the Whisper transcription demo. ' +
  'Whisper splits audio into timestamped segments so downstream tools can align text with sound. ' +
  'You can paste any text here and the playground will slice it into rough segments with start and end times. ' +
  'Tweak the segment length slider to see how Whisper would chunk longer audio files.';

export function WhisperTranscriptionDemo({
  initialTranscript = DEFAULT_TRANSCRIPT,
  initialSegmentChars = 120,
  title = 'Whisper Transcription Demo',
  description = 'Paste a transcript (simulating audio) and see how Whisper would segment it.',
  difficulty = 'beginner',
  estimatedMinutes = 4,
  relatedConcepts = ['speech-recognition', 'whisper', 'multimodal'],
}: WhisperTranscriptionDemoProps): ReactNode {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [segmentChars, setSegmentChars] = useState(initialSegmentChars);
  const [hasTranscribed, setHasTranscribed] = useState(false);

  const segments = useMemo(
    () => segmentTranscript(transcript, segmentChars),
    [transcript, segmentChars],
  );
  const totalDuration = segments[segments.length - 1]?.end ?? 0;
  const totalWords = segments.reduce((acc, segment) => acc + segment.wordCount, 0);

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
            label="Transcript (simulates audio)"
            helperText="Paste the words Whisper would have heard. The playground doesn't decode audio — it simulates the output."
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            rows={8}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="whisper-segment" className="text-small text-text font-medium">
              Segment length: <span className="text-text-muted">{segmentChars} characters</span>
            </label>
            <input
              id="whisper-segment"
              type="range"
              min={40}
              max={300}
              step={10}
              value={segmentChars}
              onChange={(event) => setSegmentChars(Number(event.target.value))}
              className="accent-primary-orange h-2 w-full"
              aria-valuemin={40}
              aria-valuemax={300}
              aria-valuenow={segmentChars}
            />
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setHasTranscribed(true)}
            disabled={transcript.trim().length === 0}
          >
            {hasTranscribed ? 'Re-run transcription' : 'Run mock transcription'}
          </Button>
        </div>
      }
      visualization={
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="info">{segments.length} segments</Badge>
            <Badge variant="success">{totalWords} words</Badge>
            <span className="text-tiny text-text-subtle">
              ~{formatTimestamp(totalDuration)} total
            </span>
          </div>
          {segments.length === 0 ? (
            <p className="text-small text-text-subtle">
              Paste a transcript and run the demo to see timestamped segments.
            </p>
          ) : (
            <ol className="flex flex-col gap-2" aria-label="Timestamped transcript segments">
              {segments.map((segment) => (
                <li
                  key={segment.id}
                  className="border-border bg-surface-elevated rounded-md border p-3"
                >
                  <div className="text-tiny text-text-muted mb-1 flex items-center justify-between font-mono">
                    <span>
                      [{formatTimestamp(segment.start)} → {formatTimestamp(segment.end)}]
                    </span>
                    <span>{segment.wordCount} words</span>
                  </div>
                  <p className="text-small text-text">{segment.text}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      }
      output={
        hasTranscribed
          ? `Mock verbose_json: ${segments.length} segments, ${totalWords} words, ~${formatTimestamp(totalDuration)} total.`
          : 'No transcription yet — press run to produce a mock verbose_json summary.'
      }
    />
  );
}
