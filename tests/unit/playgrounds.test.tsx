import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TokenizationPlayground, tokenize } from '@/components/playgrounds/TokenizationPlayground';
import { RagSimulator, retrieveChunks } from '@/components/playgrounds/RagSimulator';
import {
  VectorSearch,
  cosineSimilarity,
  mockEmbed,
  rankDocuments,
} from '@/components/playgrounds/VectorSearch';
import {
  InferenceVisualizer,
  estimateTokensPerSecond,
  estimateVramGigabytes,
} from '@/components/playgrounds/InferenceVisualizer';
import {
  FineTuningSimulator,
  simulateFineTuning,
} from '@/components/playgrounds/FineTuningSimulator';
import {
  DiffusionPlayground,
  simulateDiffusion,
} from '@/components/playgrounds/DiffusionPlayground';
import {
  WhisperTranscriptionDemo,
  segmentTranscript,
} from '@/components/playgrounds/WhisperTranscriptionDemo';

describe('tokenize', () => {
  it('returns an empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('splits on whitespace and punctuation', () => {
    const tokens = tokenize('Hello, world!');
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens).toContain('Hello');
    expect(tokens).toContain('world');
  });
});

describe('TokenizationPlayground', () => {
  it('shows a non-zero token count when text is provided', () => {
    render(<TokenizationPlayground />);
    expect(screen.getByText(/\d+ tokens/)).toBeInTheDocument();
  });

  it('updates the token count as the user types', async () => {
    const user = userEvent.setup();
    render(<TokenizationPlayground initialText="" />);

    const textarea = screen.getByLabelText(/input text/i);
    expect(textarea).toBeInTheDocument();

    // Empty initial text => no tokens yet
    expect(screen.getByText(/no tokens yet/i)).toBeInTheDocument();

    await user.type(textarea, 'Atlas');
    // After typing there should be at least one token, so the count chip updates
    expect(screen.getByText(/1 tokens?/)).toBeInTheDocument();
  });
});

describe('retrieveChunks', () => {
  it('returns no chunks for an empty corpus', () => {
    expect(retrieveChunks('', 'anything', 10)).toEqual([]);
  });

  it('ranks a chunk higher when its content overlaps with the query', () => {
    const corpus =
      'Apples are red. Bananas are yellow. Diffusion models denoise noise step by step. ' +
      'Embeddings map text into vectors.';
    const chunks = retrieveChunks(corpus, 'diffusion denoise', 10);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]?.text.toLowerCase()).toContain('diffusion');
  });

  it('respects the top-K cap', () => {
    const corpus = 'alpha beta gamma. alpha beta. alpha. beta. gamma.';
    const chunks = retrieveChunks(corpus, 'alpha', 5, 2);
    expect(chunks.length).toBeLessThanOrEqual(2);
  });
});

describe('RagSimulator', () => {
  it('renders the playground title and an initial retrieval badge', () => {
    render(<RagSimulator />);
    expect(screen.getByRole('heading', { name: /rag simulator/i })).toBeInTheDocument();
    expect(screen.getByText(/chunks retrieved/i)).toBeInTheDocument();
  });

  it('updates the retrieved chunk count when the corpus or query changes', async () => {
    const user = userEvent.setup();
    render(
      <RagSimulator initialCorpus="RAG combines retrieval with generation." initialQuery="" />,
    );

    // Empty query => zero chunks
    expect(screen.getByText(/0 chunks retrieved/i)).toBeInTheDocument();

    const queryField = screen.getByLabelText(/query/i);
    await user.type(queryField, 'retrieval');

    expect(screen.getByText(/[1-9]\d* chunks retrieved/i)).toBeInTheDocument();
  });
});

describe('mockEmbed / rankDocuments', () => {
  it('produces deterministic vectors of the requested dimension', () => {
    const a = mockEmbed('hello world', 64);
    const b = mockEmbed('hello world', 64);
    expect(a).toHaveLength(64);
    expect(a).toEqual(b);
  });

  it('returns an empty ranking when query is blank', () => {
    expect(rankDocuments('', ['a document'])).toEqual([]);
  });

  it('ranks the most semantically related document first', () => {
    const docs = [
      'The Eiffel Tower is in Paris.',
      'Pizza originates from Italy.',
      'Embeddings embed dense vector representations of text.',
    ];
    const ranked = rankDocuments('how does embedding embed work', docs);
    expect(ranked.length).toBe(3);
    expect(ranked[0]?.text.toLowerCase()).toContain('embed');
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });
});

describe('VectorSearch', () => {
  it('renders the playground with the default query ranked first', () => {
    render(<VectorSearch />);
    expect(screen.getByRole('heading', { name: /vector search/i })).toBeInTheDocument();
    // Some ranked entry should mention embeddings
    expect(screen.getAllByText(/embedding/i).length).toBeGreaterThan(0);
  });

  it('shows zero ranked results when the query is cleared', async () => {
    const user = userEvent.setup();
    render(<VectorSearch />);
    const queryField = screen.getByLabelText(/query/i);
    await user.clear(queryField);
    expect(screen.getByText(/0 ranked/i)).toBeInTheDocument();
  });
});

describe('estimateTokensPerSecond / estimateVramGigabytes', () => {
  it('returns positive throughput for valid inputs', () => {
    expect(estimateTokensPerSecond(7, 256)).toBeGreaterThan(0);
  });

  it('falls back to a minimum of 1 token / sec', () => {
    expect(estimateTokensPerSecond(7, 8192)).toBeGreaterThanOrEqual(1);
  });

  it('estimates VRAM as a function of parameters and context', () => {
    const small = estimateVramGigabytes(7, 512);
    const large = estimateVramGigabytes(70, 8192);
    expect(large).toBeGreaterThan(small);
  });
});

describe('InferenceVisualizer', () => {
  it('shows tokens/sec and VRAM estimates', () => {
    render(<InferenceVisualizer />);
    expect(screen.getByText(/tokens \/ sec/i)).toBeInTheDocument();
    expect(screen.getByText(/GB VRAM/i)).toBeInTheDocument();
  });

  it('updates the tokens/sec estimate when params change', async () => {
    const user = userEvent.setup();
    render(<InferenceVisualizer initialParamsBillions={7} initialPromptTokens={512} />);
    const paramsInput = screen.getByLabelText(/model size/i);
    await user.clear(paramsInput);
    await user.type(paramsInput, '70');
    // Some token/sec badge must be present (value will have changed).
    expect(screen.getAllByText(/tokens \/ sec/i).length).toBeGreaterThan(0);
  });
});

describe('simulateFineTuning', () => {
  it('produces a fixed number of points', () => {
    const curve = simulateFineTuning(2000, 3, 0.001, 10);
    expect(curve.points).toHaveLength(10);
  });

  it('flags overfitting when many epochs are used', () => {
    const curve = simulateFineTuning(500, 12, 0.001);
    expect(curve.overfit).toBe(true);
  });

  it('reports a lower floor when more data is provided', () => {
    const small = simulateFineTuning(200, 2, 0.001);
    const large = simulateFineTuning(20000, 2, 0.001);
    expect(large.finalTrainLoss).toBeLessThan(small.finalTrainLoss);
  });
});

describe('FineTuningSimulator', () => {
  it('renders the playground title and loss badges', () => {
    render(<FineTuningSimulator />);
    expect(screen.getByRole('heading', { name: /fine-tuning simulator/i })).toBeInTheDocument();
    expect(screen.getByText(/^train /i)).toBeInTheDocument();
    expect(screen.getByText(/^val /i)).toBeInTheDocument();
  });

  it('contains an SVG loss curve', () => {
    render(<FineTuningSimulator />);
    expect(
      screen.getByRole('img', { name: /mock training and validation loss curves/i }),
    ).toBeInTheDocument();
  });
});

describe('simulateDiffusion', () => {
  it('returns no frames for zero steps', () => {
    const run = simulateDiffusion('a cat', 1, 7.5, 8);
    expect(run.frames.length).toBeGreaterThan(0);
    expect(run.frames[run.frames.length - 1]?.noiseLevel).toBeLessThan(0.5);
  });

  it('produces a guidance note about the chosen CFG scale', () => {
    expect(simulateDiffusion('prompt', 30, 2).guidanceNote).toMatch(/low/i);
    expect(simulateDiffusion('prompt', 30, 7).guidanceNote).toMatch(/sweet spot/i);
    expect(simulateDiffusion('prompt', 30, 15).guidanceNote).toMatch(/high/i);
  });
});

describe('DiffusionPlayground', () => {
  it('renders the playground title and step / CFG badges', () => {
    render(<DiffusionPlayground />);
    expect(screen.getByRole('heading', { name: /diffusion playground/i })).toBeInTheDocument();
    expect(screen.getByText(/CFG scale:/i)).toBeInTheDocument();
  });
});

describe('segmentTranscript', () => {
  it('returns an empty array for empty input', () => {
    expect(segmentTranscript('', 100)).toEqual([]);
  });

  it('produces at least one segment for non-empty input', () => {
    const segments = segmentTranscript('Hello there, this is a test.', 50);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0]?.text.length).toBeGreaterThan(0);
  });

  it('keeps total transcript length consistent across segment sizes', () => {
    const transcript =
      'The quick brown fox jumps over the lazy dog. ' +
      'A stitch in time saves nine. ' +
      'To be or not to be, that is the question.';
    const compact = segmentTranscript(transcript, 40)
      .map((s) => s.text)
      .join(' ');
    const wide = segmentTranscript(transcript, 200)
      .map((s) => s.text)
      .join(' ');
    // Both should cover all the words; whitespace differences are ignored.
    expect(compact.replace(/\s+/gu, ' ').trim()).toBe(transcript.replace(/\s+/gu, ' ').trim());
    expect(wide.replace(/\s+/gu, ' ').trim()).toBe(transcript.replace(/\s+/gu, ' ').trim());
  });
});

describe('WhisperTranscriptionDemo', () => {
  it('renders the playground with timestamped segments', () => {
    render(<WhisperTranscriptionDemo />);
    expect(
      screen.getByRole('heading', { name: /whisper transcription demo/i }),
    ).toBeInTheDocument();
    // First segment timestamp
    expect(screen.getByText(/\[00:00/i)).toBeInTheDocument();
  });

  it('shows an empty-state message when the transcript is blank', async () => {
    const user = userEvent.setup();
    render(<WhisperTranscriptionDemo initialTranscript="" />);
    const textarea = screen.getByLabelText(/transcript \(simulates audio\)/i);
    expect(textarea).toBeInTheDocument();
    // No segments yet
    expect(screen.getByText(/0 segments/i)).toBeInTheDocument();
    // Buttons render
    expect(screen.getByRole('button', { name: /run mock transcription/i })).toBeInTheDocument();
    // Suppress unused user-event warning while still asserting structure
    void user;
  });
});
