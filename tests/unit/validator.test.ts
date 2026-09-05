import { describe, it, expect } from 'vitest';
import { validateSubtitles } from '../../src/shared/subtitles/validator.js';
import { SubtitleEvent } from '../../src/shared/types/models.js';

describe('Subtitle Constraint Validator', () => {
  it('identifies reading speed (CPS) violations accurately', () => {
    const rapidSpeechEvent: SubtitleEvent = {
      id: 'sub-1',
      index: 1,
      startTime: 0.0,
      endTime: 0.5,
      // 35 characters in 0.5 seconds = 70 CPS!
      text: 'This sentence is spoken way too fast',
      words: [],
    };

    const report = validateSubtitles([rapidSpeechEvent]);

    expect(report.totalEvents).toBe(1);
    expect(report.errorsCount).toBeGreaterThanOrEqual(1);

    const issue = report.issues.find((i) => i.code === 'CRITICAL_CPS');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('error');
    expect(issue?.suggestedAction).toBe('split_event');
  });

  it('identifies character per line (CPL) overflows accurately', () => {
    const longLineEvent: SubtitleEvent = {
      id: 'sub-1',
      index: 1,
      startTime: 0.0,
      endTime: 4.0,
      // 55 characters on a single line
      text: 'This is an excessively long single line subtitle that should cause a line overflow error',
      words: [],
    };

    const report = validateSubtitles([longLineEvent], { warnCpl: 37, maxCpl: 42 });

    const issue = report.issues.find((i) => i.code === 'CRITICAL_LINE_OVERFLOW' || i.code === 'LINE_OVERFLOW');
    expect(issue).toBeDefined();
    expect(issue?.eventId).toBe('sub-1');
  });

  it('detects duration bounds (too short and too long)', () => {
    const events: SubtitleEvent[] = [
      {
        id: 'sub-1',
        index: 1,
        startTime: 0.0,
        endTime: 0.3, // 300ms is too short (< 0.8s)
        text: 'Quick',
        words: [],
      },
      {
        id: 'sub-2',
        index: 2,
        startTime: 1.0,
        endTime: 8.5, // 7.5s is too long (> 6.0s)
        text: 'This subtitle is staying on the screen for way too long without any cuts.',
        words: [],
      },
    ];

    const report = validateSubtitles(events);

    expect(report.issues.some((i) => i.code === 'TOO_SHORT')).toBe(true);
    expect(report.issues.some((i) => i.code === 'TOO_LONG')).toBe(true);
  });

  it('detects overlapping subtitle intervals and tight gaps', () => {
    const events: SubtitleEvent[] = [
      {
        id: 'sub-1',
        index: 1,
        startTime: 0.0,
        endTime: 2.0,
        text: 'First subtitle event',
        words: [],
      },
      {
        id: 'sub-2',
        index: 2,
        startTime: 1.8, // Starts before sub-1 ends (0.2s overlap)
        endTime: 3.5,
        text: 'Second overlapping subtitle',
        words: [],
      },
    ];

    const report = validateSubtitles(events);

    const overlap = report.issues.find((i) => i.code === 'OVERLAPPING_EVENTS');
    expect(overlap).toBeDefined();
    expect(overlap?.severity).toBe('error');
  });

  it('returns clean zero-issue report for compliant broadcast subtitles', () => {
    const events: SubtitleEvent[] = [
      {
        id: 'sub-1',
        index: 1,
        startTime: 0.0,
        endTime: 2.0, // 2s duration, ~14 CPS, 28 chars
        text: 'Welcome to the presentation.',
        words: [],
      },
      {
        id: 'sub-2',
        index: 2,
        startTime: 2.1, // 100ms gap (> 67ms)
        endTime: 4.1,
        text: 'Here is the next key point.',
        words: [],
      },
    ];

    const report = validateSubtitles(events);

    expect(report.errorsCount).toBe(0);
    expect(report.warningsCount).toBe(0);
    expect(report.validEventsCount).toBe(2);
  });
});
