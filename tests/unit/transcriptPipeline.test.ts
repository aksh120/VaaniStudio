import { describe, expect, it } from 'vitest';
import { buildSubtitleEvents } from '../../src/shared/subtitles/transcriptPipeline.js';
import {
  mapSubtitleTime,
  resolveSubtitleTimelineOffset,
  findActiveSubtitleEvent,
} from '../../src/shared/subtitles/timing.js';
import { ASRSegment, SubtitleEvent } from '../../src/shared/types/models.js';

const segment = (overrides: Partial<ASRSegment> = {}): ASRSegment => ({
  id: 'seg-1',
  startTime: 0,
  endTime: 2,
  text: 'Hello world',
  words: [
    { word: 'Hello', startTime: 0.1, endTime: 0.6, confidence: 0.98 },
    { word: 'world', startTime: 0.7, endTime: 1.5, confidence: 0.97 },
  ],
  ...overrides,
});

describe('transcript pipeline', () => {
  it('preserves ASR segment boundaries and reindexes generated events', () => {
    const events = buildSubtitleEvents([
      segment(),
      segment({
        id: 'seg-2',
        startTime: 2.2,
        endTime: 4,
        text: 'Second segment',
        words: [
          { word: 'Second', startTime: 2.3, endTime: 2.8, confidence: 0.9 },
          { word: 'segment', startTime: 2.8, endTime: 3.6, confidence: 0.9 },
        ],
      }),
    ]);

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.index)).toEqual([1, 2]);
    expect(events[0].endTime).toBeLessThanOrEqual(2);
    expect(events[1].startTime).toBeGreaterThanOrEqual(2.2);
  });

  it('applies the source audio offset after alignment', () => {
    const events = buildSubtitleEvents([segment()], { timeOffsetSeconds: 2.5 });
    expect(events[0].startTime).toBe(2.6);
    expect(events[0].endTime).toBe(4.0);
    expect(events[0].words[0].startTime).toBe(2.6);
  });

  it('uses one canonical timeline offset and clamps negative media times', () => {
    expect(resolveSubtitleTimelineOffset(2, 2)).toBe(2);
     expect(resolveSubtitleTimelineOffset(2, undefined)).toBe(2);
     expect(resolveSubtitleTimelineOffset(-0.5, 0.5)).toBe(-0.5);
     expect(mapSubtitleTime(0.2, { outputOriginSeconds: -0.5 })).toBe(0);
    expect(mapSubtitleTime(0.8, { outputOriginSeconds: -0.5 })).toBeCloseTo(0.3);
  });

  it('preserves authoritative ASR text in exact mode', () => {
    const events = buildSubtitleEvents([
      segment({
        text: 'Hello, world!',
        words: [
          { word: 'Hello', startTime: 0.1, endTime: 0.6, confidence: 0.98 },
          { word: 'world', startTime: 0.7, endTime: 1.5, confidence: 0.97 },
        ],
      }),
    ], { preserveSegmentText: true });
    expect(events).toHaveLength(1);
    expect(events[0].text).toBe('Hello, world!');
  });

  it('retains a text-only segment as a stale-word event', () => {
    const events = buildSubtitleEvents([
      segment({ words: [], text: 'Words were not returned' }),
    ]);

    expect(events).toHaveLength(1);
    expect(events[0].text).toBe('Words were not returned');
    expect(events[0].words).toHaveLength(0);
    expect(events[0].wordTimingState).toBe('stale');
  });

  it('repairs segment-relative word timestamps before subtitle display', () => {
    const events = buildSubtitleEvents([
      segment({
        startTime: 10,
        endTime: 12,
        text: 'Hello world',
        words: [
          { word: 'Hello', startTime: 0.1, endTime: 0.6, confidence: 0.98 },
          { word: 'world', startTime: 0.7, endTime: 1.5, confidence: 0.97 },
        ],
      }),
    ]);

    expect(events[0].words[0].startTime).toBeCloseTo(10.1);
    expect(events[0].words[1].endTime).toBeCloseTo(11.5);
    expect(events[0].words[1].startTime).toBeGreaterThan(events[0].words[0].endTime);
  });

  it('selects the later subtitle at a shared boundary', () => {
    const events: SubtitleEvent[] = [
      { id: 'first', index: 1, startTime: 0, endTime: 1, text: 'Hello', words: [] },
      { id: 'second', index: 2, startTime: 1, endTime: 2, text: "I'm 2nd", words: [] },
    ];
    expect(findActiveSubtitleEvent(events, 1)?.id).toBe('second');
  });

  it('clamps words to their source segment', () => {
    const events = buildSubtitleEvents([
      segment({
        endTime: 1,
        words: [
          { word: 'before', startTime: -1, endTime: 0.4, confidence: 0.9 },
          { word: 'after', startTime: 0.8, endTime: 2, confidence: 0.9 },
        ],
      }),
    ]);

    expect(events[0].startTime).toBe(0);
    expect(events[0].endTime).toBeLessThanOrEqual(1);
    for (const word of events[0].words) {
      expect(word.startTime).toBeGreaterThanOrEqual(0);
      expect(word.endTime).toBeLessThanOrEqual(1);
    }
  });
});
