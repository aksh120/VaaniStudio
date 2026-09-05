import { describe, it, expect } from 'vitest';
import { segmentWordsIntoSubtitles } from '../../src/shared/subtitles/segmenter.js';
import { WordTiming } from '../../src/shared/types/models.js';

describe('Linguistic Subtitle Segmentation Algorithm', () => {
  it('splits on silence pause boundaries (gap >= 350ms)', () => {
    const words: WordTiming[] = [
      { id: 'w1', word: 'First', startTime: 0.0, endTime: 0.4, confidence: 0.95 },
      { id: 'w2', word: 'sentence', startTime: 0.45, endTime: 0.9, confidence: 0.95 },
      // Pause of 600ms (1.5 - 0.9)
      { id: 'w3', word: 'Second', startTime: 1.5, endTime: 1.9, confidence: 0.95 },
      { id: 'w4', word: 'sentence', startTime: 1.95, endTime: 2.4, confidence: 0.95 },
    ];

    const events = segmentWordsIntoSubtitles(words, { maxSilenceGapSeconds: 0.35 });

    expect(events.length).toBe(2);
    expect(events[0].text).toBe('First sentence');
    expect(events[0].startTime).toBe(0.0);
    expect(events[0].endTime).toBe(0.9);

    expect(events[1].text).toBe('Second sentence');
    expect(events[1].startTime).toBe(1.5);
    expect(events[1].endTime).toBe(2.4);
  });

  it('splits on terminal sentence punctuation (. ? ! ।)', () => {
    const words: WordTiming[] = [
      { id: 'w1', word: 'Hello', startTime: 0.0, endTime: 0.3, confidence: 0.9 },
      { id: 'w2', word: 'world.', startTime: 0.35, endTime: 0.7, confidence: 0.9 }, // Terminal punctuation
      { id: 'w3', word: 'How', startTime: 0.75, endTime: 1.0, confidence: 0.9 },
      { id: 'w4', word: 'are', startTime: 1.05, endTime: 1.3, confidence: 0.9 },
      { id: 'w5', word: 'you?', startTime: 1.35, endTime: 1.7, confidence: 0.9 }, // Terminal punctuation
    ];

    const events = segmentWordsIntoSubtitles(words);

    expect(events.length).toBe(2);
    expect(events[0].text).toBe('Hello world.');
    expect(events[1].text).toBe('How are you?');
  });

  it('balances multi-line subtitles without exceeding maximum CPL', () => {
    // Generate a long sentence that exceeds single line limit (37 chars)
    const longWords: WordTiming[] = [
      { id: 'w1', word: 'Building', startTime: 0.0, endTime: 0.4, confidence: 0.9 },
      { id: 'w2', word: 'a', startTime: 0.45, endTime: 0.55, confidence: 0.9 },
      { id: 'w3', word: 'modern', startTime: 0.6, endTime: 0.9, confidence: 0.9 },
      { id: 'w4', word: 'subtitle', startTime: 0.95, endTime: 1.3, confidence: 0.9 },
      { id: 'w5', word: 'application', startTime: 1.35, endTime: 1.8, confidence: 0.9 },
      { id: 'w6', word: 'for', startTime: 1.85, endTime: 2.0, confidence: 0.9 },
      { id: 'w7', word: 'Windows', startTime: 2.05, endTime: 2.4, confidence: 0.9 },
      { id: 'w8', word: 'creators.', startTime: 2.45, endTime: 2.9, confidence: 0.9 },
    ];

    const events = segmentWordsIntoSubtitles(longWords, { maxCharactersPerLine: 30, maxLinesPerSubtitle: 2 });

    expect(events.length).toBe(1);
    expect(events[0].text).toContain('\n');
    const lines = events[0].text.split('\n');
    expect(lines.length).toBe(2);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(35);
    }
  });

  it('supports short_form preset for rapid vertical reels/shorts', () => {
    const words: WordTiming[] = [
      { id: 'w1', word: 'One', startTime: 0.0, endTime: 0.2, confidence: 0.9 },
      { id: 'w2', word: 'two', startTime: 0.25, endTime: 0.4, confidence: 0.9 },
      { id: 'w3', word: 'three', startTime: 0.45, endTime: 0.6, confidence: 0.9 },
      { id: 'w4', word: 'four', startTime: 0.65, endTime: 0.8, confidence: 0.9 },
      { id: 'w5', word: 'five', startTime: 0.85, endTime: 1.0, confidence: 0.9 },
      { id: 'w6', word: 'six', startTime: 1.05, endTime: 1.2, confidence: 0.9 },
      { id: 'w7', word: 'seven', startTime: 1.25, endTime: 1.4, confidence: 0.9 },
    ];

    const events = segmentWordsIntoSubtitles(words, { preset: 'short_form', maxWordsPerSubtitle: 3 });

    // Should chunk into groups of <= 3 words
    expect(events.length).toBeGreaterThanOrEqual(3);
    for (const evt of events) {
      expect(evt.words.length).toBeLessThanOrEqual(4);
      expect(evt.text).not.toContain('\n'); // Single line for reels
    }
  });
});
