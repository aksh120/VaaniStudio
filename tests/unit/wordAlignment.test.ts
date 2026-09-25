import { describe, it, expect } from 'vitest';
import {
  cleanAndAlignWords,
  getWordDisplayText,
  RawASRWord,
} from '../../src/shared/subtitles/wordAlignment.js';

describe('Word-Level Timestamp Extraction and Alignment Engine', () => {
  it('enforces strict monotonicity and non-overlapping word timings', () => {
    // Synthetic raw words with messy overlapping timestamps
    const rawTokens: RawASRWord[] = [
      { word: 'Welcome', start: 0.0, end: 0.5, probability: 0.95 },
      { word: 'to', start: 0.45, end: 0.8, probability: 0.92 }, // Overlaps with 'Welcome'
      { word: 'Vaani', start: 0.75, end: 1.3, probability: 0.98 }, // Overlaps with 'to'
      { word: 'Studio', start: 1.25, end: 1.8, probability: 0.96 }, // Overlaps with 'Vaani'
    ];

    const aligned = cleanAndAlignWords(rawTokens);

    expect(aligned.length).toBe(4);
    for (let i = 0; i < aligned.length; i++) {
      const w = aligned[i];
      // Start time must be strictly before end time
      expect(w.startTime).toBeLessThan(w.endTime);
      expect(w.confidence).toBeGreaterThan(0.0);
      expect(w.confidence).toBeLessThanOrEqual(1.0);

      if (i > 0) {
        // Monotonic progression: current start time must be >= previous start time
        expect(w.startTime).toBeGreaterThanOrEqual(aligned[i - 1].startTime);
        // Overlap resolved: current start time must be >= previous end time
        expect(w.startTime).toBeGreaterThanOrEqual(aligned[i - 1].endTime);
      }
    }
  });
  it('enforces minimum word duration and handles zero-duration tokens', () => {
    const rawTokens: RawASRWord[] = [

      { word: 'Namaste', start: 0.0, end: 0.6, probability: 0.97 },
      { word: ',', start: 0.6, end: 0.65, probability: 0.99 },
      { word: 'doston', start: 0.7, end: 1.2, probability: 0.94 },
      { word: '।', start: 1.2, end: 1.25, probability: 0.99 },
    ];

    const aligned = cleanAndAlignWords(rawTokens);

    expect(aligned.length).toBe(2);
    expect(aligned[0].word).toBe('Namaste,');
    expect(aligned[0].punctuationFollows).toBe(',');
    expect(aligned[1].word).toBe('doston।');
    expect(aligned[1].punctuationFollows).toBe('।');
  });

  it('accumulates multiple standalone punctuation tokens and keeps display exact once', () => {
    const rawTokens: RawASRWord[] = [
      { word: 'Ready', start: 0.0, end: 0.5, probability: 0.95 },
      { word: ',', start: 0.5, end: 0.55, probability: 0.99 },
      { word: ',', start: 0.55, end: 0.6, probability: 0.99 },
      { word: '!', start: 0.6, end: 0.65, probability: 0.99 },
    ];

    const aligned = cleanAndAlignWords(rawTokens);

    expect(aligned[0].word).toBe('Ready,,!');
    expect(aligned[0].punctuationFollows).toBe(',,!');
    expect(getWordDisplayText(aligned[0])).toBe('Ready,,!');
    expect(getWordDisplayText({ word: 'Ready', punctuationFollows: ',,!' })).toBe('Ready,,!');
    expect(getWordDisplayText({ word: 'Ready,', punctuationFollows: ',,!' })).toBe('Ready,,!');
  });

  it('enforces minimum word duration and handles zero-duration tokens', () => {
    const rawTokens: RawASRWord[] = [
      { word: 'Fast', start: 1.0, end: 1.0, probability: 0.8 }, // 0 duration
      { word: 'talker', start: 1.01, end: 1.02, probability: 0.85 }, // 10ms duration
    ];

    const aligned = cleanAndAlignWords(rawTokens, { minWordDurationSeconds: 0.05 });

    expect(aligned.length).toBe(2);
    expect(aligned[0].endTime - aligned[0].startTime).toBeGreaterThanOrEqual(0.05);
    expect(aligned[1].endTime - aligned[1].startTime).toBeGreaterThanOrEqual(0.05);
    expect(aligned[1].startTime).toBeGreaterThanOrEqual(aligned[0].endTime);
  });

  it('gracefully handles empty, whitespace, and invalid inputs', () => {
    expect(cleanAndAlignWords([])).toEqual([]);
    expect(cleanAndAlignWords([{ word: '   ', start: 0, end: 1 }])).toEqual([]);
  });
});
