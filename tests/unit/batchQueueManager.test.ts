import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { BatchQueueManager } from '../../src/main/media/batchQueueManager.js';
import { BatchJobConfig } from '../../src/shared/types/models.js';

// Mock audio extraction and faster whisper to keep unit tests fast and independent
vi.mock('../../src/main/media/audio.js', () => ({
  extractNormalizedAudio: vi.fn().mockImplementation(async (filePath: string) => {
    if (filePath.includes('corrupt')) {
      throw new Error('Corrupted container or missing audio track');
    }
    return 'mock_audio.wav';
  }),
}));

vi.mock('../../src/main/asr/fasterWhisperEngine.js', () => ({
  FasterWhisperEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    transcribe: vi.fn().mockResolvedValue({
      segments: [
        {
          id: 1,
          seek: 0,
          start: 0.0,
          end: 2.0,
          text: 'Batch test transcript.',
          tokens: [],
          temperature: 0,
          avgLogprob: -0.2,
          compressionRatio: 1.2,
          noSpeechProb: 0.01,
          words: [
            { word: 'Batch', start: 0.0, end: 0.5, probability: 0.95 },
            { word: 'test', start: 0.5, end: 1.2, probability: 0.96 },
            { word: 'transcript.', start: 1.2, end: 2.0, probability: 0.98 },
          ],
        },
      ],
      language: 'en',
    }),
  })),
}));

describe('Batch Media Processing Queue (Phase 14: TASK-061)', () => {
  let tempDir: string;
  let sampleMedia1: string;
  let sampleMedia2: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vaani_batch_test_'));
    sampleMedia1 = path.join(tempDir, 'clip1.mp4');
    sampleMedia2 = path.join(tempDir, 'clip2.mp4');
    fs.writeFileSync(sampleMedia1, 'fake mp4 content 1');
    fs.writeFileSync(sampleMedia2, 'fake mp4 content 2');
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    vi.clearAllMocks();
  });

  it('should initialize with idle state and 0 items', () => {
    const manager = new BatchQueueManager();
    const state = manager.getQueueState();

    expect(state.isProcessing).toBe(false);
    expect(state.totalCount).toBe(0);
    expect(state.completedCount).toBe(0);
    expect(state.items).toHaveLength(0);
  });

  it('should process batch items sequentially and generate subtitles', async () => {
    const manager = new BatchQueueManager();
    const inputItems = [
      { filePath: sampleMedia1, fileName: 'clip1.mp4' },
      { filePath: sampleMedia2, fileName: 'clip2.mp4' },
    ];
    const config: BatchJobConfig = {
      outputDirectory: tempDir,
      exportFormat: 'srt',
      modelId: 'whisper-tiny-ct2-int8',
      languageMode: 'auto',
      scriptMode: 'roman',
      autoDiarize: false,
    };

    const progressUpdates: any[] = [];
    const state = await manager.startQueue(inputItems, config, (s) => {
      progressUpdates.push(s);
    });

    expect(state.isProcessing).toBe(false);
    expect(state.totalCount).toBe(2);
    expect(state.completedCount).toBe(2);
    expect(state.items[0].status).toBe('completed');
    expect(state.items[1].status).toBe('completed');
    expect(progressUpdates.length).toBeGreaterThan(0);

    // Verify output files exist
    const out1 = path.join(tempDir, 'clip1.srt');
    const out2 = path.join(tempDir, 'clip2.srt');
    expect(fs.existsSync(out1)).toBe(true);
    expect(fs.existsSync(out2)).toBe(true);
    expect(fs.readFileSync(out1, 'utf8')).toContain('Batch test transcript.');
  });

  it('should isolate errors per item so failed files do not halt queue', async () => {
    const manager = new BatchQueueManager();
    const corruptFile = path.join(tempDir, 'corrupt_video.mp4');
    fs.writeFileSync(corruptFile, 'corrupted data');

    const inputItems = [
      { filePath: corruptFile, fileName: 'corrupt_video.mp4' },
      { filePath: sampleMedia2, fileName: 'clip2.mp4' },
    ];
    const config: BatchJobConfig = {
      outputDirectory: tempDir,
      exportFormat: 'srt',
      modelId: 'whisper-tiny-ct2-int8',
      languageMode: 'auto',
      scriptMode: 'roman',
      autoDiarize: false,
    };

    const state = await manager.startQueue(inputItems, config);

    expect(state.isProcessing).toBe(false);
    expect(state.totalCount).toBe(2);
    expect(state.completedCount).toBe(1);

    // Item 1 failed with error isolation
    expect(state.items[0].status).toBe('failed');
    expect(state.items[0].error).toContain('Corrupted container or missing audio track');

    // Item 2 succeeded uninterrupted
    expect(state.items[1].status).toBe('completed');
    expect(state.items[1].outputPath).toBe(path.join(tempDir, 'clip2.srt'));
  });

  it('should support queue cancellation', async () => {
    const manager = new BatchQueueManager();
    const inputItems = [
      { filePath: sampleMedia1, fileName: 'clip1.mp4' },
      { filePath: sampleMedia2, fileName: 'clip2.mp4' },
    ];
    const config: BatchJobConfig = {
      outputDirectory: tempDir,
      exportFormat: 'srt',
      modelId: 'whisper-tiny-ct2-int8',
      languageMode: 'auto',
      scriptMode: 'roman',
      autoDiarize: false,
    };

    // Trigger cancel immediately after starting
    const queuePromise = manager.startQueue(inputItems, config);
    manager.cancelQueue();
    await queuePromise;

    const finalState = manager.getQueueState();
    expect(finalState.isProcessing).toBe(false);
  });

  it('should clear queue and reset state', () => {
    const manager = new BatchQueueManager();
    manager.clearQueue();
    const state = manager.getQueueState();
    expect(state.items).toHaveLength(0);
    expect(state.totalCount).toBe(0);
    expect(state.isProcessing).toBe(false);
  });
});
