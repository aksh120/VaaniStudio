import { describe, it, expect } from 'vitest';
import {
  splitAtPlayhead,
  mergeSubtitles,
  insertSubtitle,
  duplicateSubtitle,
  deleteSubtitle,
  updateSubtitleText,
  updateSubtitleTiming,
  searchAndReplace,
} from '../../src/renderer/src/editor/editorOperations.js';
import { SubtitleEvent } from '../../src/shared/types/models.js';

describe('Subtitle Editor Operations (TASK-034)', () => {
  const sampleEvents: SubtitleEvent[] = [
    {
      id: 'sub_1',
      index: 1,
      startTime: 0.0,
      endTime: 3.0,
      text: 'Vaani Studio is lightning fast',
      words: [
        { id: 'w1', word: 'Vaani', startTime: 0.0, endTime: 0.5, confidence: 0.98 },
        { id: 'w2', word: 'Studio', startTime: 0.5, endTime: 1.2, confidence: 0.95 },
        { id: 'w3', word: 'is', startTime: 1.2, endTime: 1.5, confidence: 0.99 },
        { id: 'w4', word: 'lightning', startTime: 1.5, endTime: 2.2, confidence: 0.92 },
        { id: 'w5', word: 'fast', startTime: 2.2, endTime: 2.9, confidence: 0.96 },
      ],
      cps: 10,
      cpl: 30,
    },
    {
      id: 'sub_2',
      index: 2,
      startTime: 3.2,
      endTime: 5.5,
      text: 'Local AI transcription for Windows',
      words: [
        { id: 'w6', word: 'Local', startTime: 3.2, endTime: 3.6, confidence: 0.95 },
        { id: 'w7', word: 'AI', startTime: 3.6, endTime: 3.9, confidence: 0.99 },
        { id: 'w8', word: 'transcription', startTime: 3.9, endTime: 4.8, confidence: 0.94 },
        { id: 'w9', word: 'for', startTime: 4.8, endTime: 5.0, confidence: 0.97 },
        { id: 'w10', word: 'Windows', startTime: 5.0, endTime: 5.5, confidence: 0.98 },
      ],
      cps: 15,
      cpl: 34,
    },
  ];

  it('splits subtitle at playhead and partitions words accurately', () => {
    const splitResult = splitAtPlayhead(sampleEvents, 'sub_1', 1.4);

    expect(splitResult.length).toBe(3);
    expect(splitResult[0].index).toBe(1);
    expect(splitResult[1].index).toBe(2);
    expect(splitResult[2].index).toBe(3);

    // Left split
    expect(splitResult[0].startTime).toBe(0.0);
    expect(splitResult[0].endTime).toBe(1.4);
    expect(splitResult[0].text).toContain('Vaani Studio');

    // Right split
    expect(splitResult[1].startTime).toBe(1.4);
    expect(splitResult[1].endTime).toBe(3.0);
    expect(splitResult[1].text).toContain('lightning fast');

    // Untouched sub_2 moved to index 3
    expect(splitResult[2].id).toBe('sub_2');
  });

  it('merges adjacent subtitles and combines word timings', () => {
    const merged = mergeSubtitles(sampleEvents, 'sub_1', 'sub_2');

    expect(merged.length).toBe(1);
    expect(merged[0].startTime).toBe(0.0);
    expect(merged[0].endTime).toBe(5.5);
    expect(merged[0].text).toBe('Vaani Studio is lightning fast Local AI transcription for Windows');
    expect(merged[0].words?.length).toBe(10);
    expect(merged[0].index).toBe(1);
  });

  it('inserts a new subtitle and reindexes', () => {
    const inserted = insertSubtitle(sampleEvents, 'sub_1', undefined, 2.0, 'Inserted Subtitle');

    expect(inserted.length).toBe(3);
    expect(inserted[1].text).toBe('Inserted Subtitle');
    expect(inserted[1].startTime).toBe(3.1);
    expect(inserted[1].endTime).toBe(5.1);
    expect(inserted[1].index).toBe(2);
    expect(inserted[2].index).toBe(3);
  });

  it('duplicates subtitle with proper time offset', () => {
    const duplicated = duplicateSubtitle(sampleEvents, 'sub_1');

    expect(duplicated.length).toBe(3);
    expect(duplicated[1].startTime).toBe(3.1);
    expect(duplicated[1].endTime).toBe(6.1);
    expect(duplicated[1].text).toBe(sampleEvents[0].text);
  });

  it('deletes a subtitle and reindexes remaining', () => {
    const remaining = deleteSubtitle(sampleEvents, 'sub_1');

    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('sub_2');
    expect(remaining[0].index).toBe(1);
  });

  it('updates subtitle text and recalculates metrics', () => {
    const updated = updateSubtitleText(sampleEvents, 'sub_1', 'Updated text');

    expect(updated[0].text).toBe('Updated text');
    expect(updated[0].cps).toBeGreaterThan(0);
    expect(updated[0].cpl).toBe(12);
  });

  it('updates only the first word boundary for a start-only edit', () => {
    const retimed = updateSubtitleTiming(sampleEvents, 'sub_1', 0.25, 3.0);

    expect(retimed[0].startTime).toBe(0.25);
    expect(retimed[0].words?.[0].startTime).toBe(0.25);
    expect(retimed[0].words?.[0].endTime).toBe(0.5);
    expect(retimed[0].words?.[1].startTime).toBe(0.5);
  });

  it('updates only the last word boundary for an end-only edit', () => {
    const retimed = updateSubtitleTiming(sampleEvents, 'sub_1', 0.0, 3.5);

    expect(retimed[0].endTime).toBe(3.5);
    expect(retimed[0].words?.[3].endTime).toBe(2.2);
    expect(retimed[0].words?.[4].startTime).toBe(2.2);
    expect(retimed[0].words?.[4].endTime).toBe(3.5);
  });

  it('edits both boundaries without scaling unaffected words when they fit', () => {
    const retimed = updateSubtitleTiming(sampleEvents, 'sub_1', 0.25, 3.5);

    expect(retimed[0].words?.[0].startTime).toBe(0.25);
    expect(retimed[0].words?.[1].startTime).toBe(0.5);
    expect(retimed[0].words?.[3].endTime).toBe(2.2);
    expect(retimed[0].words?.[4].endTime).toBe(3.5);
  });

  it('keeps finite word times inside narrowed event bounds', () => {
    const retimed = updateSubtitleTiming(sampleEvents, 'sub_1', 2.8, 3.0);
    const words = retimed[0].words || [];

    expect(words.length).toBe(5);
    for (const word of words) {
      expect(Number.isFinite(word.startTime)).toBe(true);
      expect(Number.isFinite(word.endTime)).toBe(true);
      expect(word.startTime).toBeGreaterThanOrEqual(2.8);
      expect(word.endTime).toBeLessThanOrEqual(3.0);
      expect(word.startTime).toBeLessThanOrEqual(word.endTime);
    }
  });

  it('keeps proportional retiming available as an explicit opt-in', () => {
    const retimed = updateSubtitleTiming(sampleEvents, 'sub_1', 1.0, 4.0, true);

    expect(retimed[0].words?.[0].startTime).toBe(1.0);
    expect(retimed[0].words?.[4].endTime).toBe(3.9);
  });

  it('marks unsafe manual text edits stale and preserves safe token mappings', () => {
    const unsafe = updateSubtitleText(sampleEvents, 'sub_1', 'Completely different caption');
    expect(unsafe[0].wordTimingState).toBe('stale');

    const safe = updateSubtitleText(sampleEvents, 'sub_1', 'Vaani Studio is lightning FAST');
    expect(safe[0].wordTimingState).toBe('fresh');
    expect(safe[0].words?.[4].word).toBe('FAST');
  });

  it('performs search and replace with regex and case sensitivity', () => {
    const res1 = searchAndReplace(sampleEvents, 'vaani', 'Voice', { matchCase: false });
    expect(res1.replacedCount).toBe(1);
    expect(res1.events[0].text).toContain('Voice Studio');
    expect(res1.events[0].wordTimingState).toBe('stale');

    // Case sensitive search for lowercase 'vaani' should not match uppercase 'Vaani'
    const res2 = searchAndReplace(sampleEvents, 'vaani', 'Voice', { matchCase: true });
    expect(res2.replacedCount).toBe(0);
  });
});
