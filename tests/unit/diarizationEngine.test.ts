import { describe, it, expect } from 'vitest';
import {
  AcousticDiarizer,
  DEFAULT_SPEAKER_COLORS,
} from '../../src/main/asr/diarizationEngine.js';
import { SubtitleEvent } from '../../src/shared/types/models.js';

describe('Acoustic Speaker Diarization Engine (Phase 14: TASK-060)', () => {
  const mockEvents: SubtitleEvent[] = [
    {
      id: 'evt-1',
      index: 1,
      startTime: 0.0,
      endTime: 2.0,
      text: 'First speaker opening remark.',
      words: [
        { id: 'w1', word: 'First', startTime: 0.0, endTime: 0.5, confidence: 0.95 },
        { id: 'w2', word: 'speaker', startTime: 0.6, endTime: 1.1, confidence: 0.95 },
        { id: 'w3', word: 'opening', startTime: 1.2, endTime: 1.6, confidence: 0.95 },
        { id: 'w4', word: 'remark.', startTime: 1.7, endTime: 2.0, confidence: 0.95 },
      ],
    },
    {
      id: 'evt-2',
      index: 2,
      startTime: 2.1,
      endTime: 3.5,
      text: 'First speaker continuing uninterrupted.',
      words: [
        { id: 'w5', word: 'First', startTime: 2.1, endTime: 2.5, confidence: 0.95 },
        { id: 'w6', word: 'speaker', startTime: 2.6, endTime: 3.0, confidence: 0.95 },
        { id: 'w7', word: 'continuing.', startTime: 3.1, endTime: 3.5, confidence: 0.95 },
      ],
    },
    {
      id: 'evt-3',
      index: 3,
      startTime: 4.8, // 1.3s conversational pause -> turn taking
      endTime: 6.2,
      text: 'Second speaker chiming in with an answer.',
      words: [
        { id: 'w8', word: 'Second', startTime: 4.8, endTime: 5.2, confidence: 0.95 },
        { id: 'w9', word: 'speaker', startTime: 5.3, endTime: 5.7, confidence: 0.95 },
        { id: 'w10', word: 'answering.', startTime: 5.8, endTime: 6.2, confidence: 0.95 },
      ],
    },
    {
      id: 'evt-4',
      index: 4,
      startTime: 7.2, // 1.0s pause -> turn taking back
      endTime: 8.9,
      text: 'First speaker response back.',
      words: [
        { id: 'w11', word: 'First', startTime: 7.2, endTime: 7.8, confidence: 0.95 },
        { id: 'w12', word: 'speaker', startTime: 7.9, endTime: 8.3, confidence: 0.95 },
        { id: 'w13', word: 'response.', startTime: 8.4, endTime: 8.9, confidence: 0.95 },
      ],
    },
  ];

  it('should initialize with default 8 accessible colors in speaker palette', () => {
    expect(DEFAULT_SPEAKER_COLORS.length).toBe(8);
    expect(DEFAULT_SPEAKER_COLORS[0]).toBe('#3b82f6'); // Blue
    expect(DEFAULT_SPEAKER_COLORS[1]).toBe('#10b981'); // Emerald
  });

  it('should return empty speakers and empty events for empty input', async () => {
    const diarizer = new AcousticDiarizer();
    const result = await diarizer.diarize([], 'nonexistent.wav');
    expect(result.events).toHaveLength(0);
    expect(result.speakers).toHaveLength(0);
  });

  it('should detect turn-taking boundaries and cluster speakers across events', async () => {
    const diarizer = new AcousticDiarizer();
    const result = await diarizer.diarize(mockEvents, undefined, { maxSpeakers: 2 });

    expect(result.events).toHaveLength(4);
    expect(result.speakers.length).toBeGreaterThanOrEqual(1);

    // Event 1 and Event 2 have small gap (0.1s) -> same speaker
    expect(result.events[0].speakerId).toBe(result.events[1].speakerId);

    // Event 2 and Event 3 have long gap (1.3s >= 0.65s threshold) -> turn-taking triggers alternate speaker
    expect(result.events[2].speakerId).not.toBe(result.events[1].speakerId);

    // Verify word timing propagation
    result.events.forEach((ev) => {
      expect(ev.speakerLabel).toBeDefined();
      expect(ev.speakerId).toBeDefined();
      if (ev.words) {
        ev.words.forEach((w) => {
          expect(w.speakerId).toBe(ev.speakerId);
        });
      }
    });
  });

  it('should generate valid speaker profiles with distinct names and colors', async () => {
    const diarizer = new AcousticDiarizer();
    const result = await diarizer.diarize(mockEvents, undefined, { maxSpeakers: 2 });

    expect(result.speakers.length).toBeGreaterThanOrEqual(2);
    result.speakers.forEach((speaker) => {
      expect(speaker.id).toMatch(/^spk_\d+$/);
      expect(speaker.name).toMatch(/^Speaker \d+$/);
      expect(speaker.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    // Ensure distinct colors
    const colors = new Set(result.speakers.map((s) => s.color));
    expect(colors.size).toBe(result.speakers.length);
  });

  it('should respect requested maxSpeakers parameter if provided', async () => {
    const diarizer = new AcousticDiarizer();
    const result = await diarizer.diarize(mockEvents, undefined, { maxSpeakers: 1 });
    expect(result.speakers.length).toBe(1);
    expect(result.events.every((e) => e.speakerId === 'spk_1')).toBe(true);
  });
});
