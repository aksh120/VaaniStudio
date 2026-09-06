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

  it('updates subtitle timing and proportionally scales word timestamps', () => {
    const retimed = updateSubtitleTiming(sampleEvents, 'sub_1', 1.0, 4.0);

    expect(retimed[0].startTime).toBe(1.0);
    expect(retimed[0].endTime).toBe(4.0);
    expect(retimed[0].words?.[0].startTime).toBe(1.0); // 1.0 + (0.0 - 0.0) * 1.0 = 1.0
    expect(retimed[0].words?.[4].endTime).toBe(3.9);   // 1.0 + (2.9 - 0.0) * 1.0 = 3.9
  });

  it('performs search and replace with regex and case sensitivity', () => {
    const res1 = searchAndReplace(sampleEvents, 'vaani', 'Voice', { matchCase: false });
    expect(res1.replacedCount).toBe(1);
    expect(res1.events[0].text).toContain('Voice Studio');

    // Case sensitive search for lowercase 'vaani' should not match uppercase 'Vaani'
    const res2 = searchAndReplace(sampleEvents, 'vaani', 'Voice', { matchCase: true });
    expect(res2.replacedCount).toBe(0);
  });
});
