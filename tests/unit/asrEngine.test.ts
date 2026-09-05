import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { FasterWhisperEngine } from '../../src/main/asr/fasterWhisperEngine.js';
import { ASRSegment, ProgressUpdate } from '../../src/shared/types/models.js';

describe('FasterWhisper ASR Engine', () => {
  let engine: FasterWhisperEngine;
  const testSpeechPath = path.join(os.tmpdir(), 'test_speech_16k.wav');

  beforeAll(() => {
    engine = new FasterWhisperEngine();
  });

  it('initializes cleanly on target CPU', async () => {
    await engine.initialize();
    expect(engine.name).toBe('faster-whisper');
    expect(engine.isInitialized).toBe(true);
  });

  it('rejects transcription when audio file does not exist', async () => {
    await expect(
      engine.transcribe('non_existent_audio_path_xyz.wav', {
        modelId: 'whisper-tiny-ct2-int8',
      })
    ).rejects.toThrow('Audio file does not exist');
  });

  it('handles immediate cancellation gracefully', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      engine.transcribe(
        testSpeechPath,
        { modelId: 'whisper-tiny-ct2-int8' },
        undefined,
        undefined,
        controller.signal
      )
    ).rejects.toThrow('aborted');
  });

  it('transcribes spoken audio producing segments and word timings if test speech exists', async () => {
    if (!fs.existsSync(testSpeechPath)) {
      console.warn('Skipping live audio transcription test: test_speech_16k.wav not found');
      return;
    }

    const progressUpdates: ProgressUpdate[] = [];
    const segments: ASRSegment[] = [];

    const result = await engine.transcribe(
      testSpeechPath,
      {
        modelId: 'whisper-tiny-ct2-int8',
        language: 'en',
      },
      (prog) => progressUpdates.push(prog),
      (seg) => segments.push(seg)
    );

    expect(result).toBeDefined();
    expect(result.durationSeconds).toBeGreaterThan(0);
    expect(result.language).toBe('en');
    expect(result.segments.length).toBeGreaterThan(0);

    const firstSeg = result.segments[0];
    expect(firstSeg.text.toLowerCase()).toMatch(/v(a|aa)ni studio/);
    expect(firstSeg.text.toLowerCase()).toContain('subtitle');
    expect(firstSeg.words.length).toBeGreaterThan(0);

    const firstWord = firstSeg.words[0];
    expect(firstWord.word.length).toBeGreaterThan(0);
    expect(typeof firstWord.startTime).toBe('number');
    expect(typeof firstWord.endTime).toBe('number');
    expect(firstWord.endTime).toBeGreaterThanOrEqual(firstWord.startTime);
  }, 30000);
});
