import { describe, it, expect } from 'vitest';
import {
  easeOutQuad,
  easeOutCubic,
  easeOutBack,
  getWordHighlightState,
  getActiveWordTiming,
  calculateTransitionState,
  formatAssTimestamp,
  compileAssTransitionTags,
  compileAssKaraokeText,
  compileAssDialogueLine,
} from '../../src/shared/subtitles/animationEngine.js';
import { WordTiming, SubtitleEvent, AnimationConfig } from '../../src/shared/types/models.js';

describe('Animation Engine (Phase 8: TASK-040, TASK-041, TASK-042)', () => {
  describe('Easing Functions', () => {
    it('evaluates easing curves at bounds (0 and 1)', () => {
      expect(easeOutQuad(0)).toBeCloseTo(0);
      expect(easeOutQuad(1)).toBeCloseTo(1);
      expect(easeOutCubic(0)).toBeCloseTo(0);
      expect(easeOutCubic(1)).toBeCloseTo(1);
      expect(easeOutBack(0)).toBeCloseTo(0);
      expect(easeOutBack(1)).toBeCloseTo(1);
    });

    it('easeOutBack produces overshoot > 1 at midpoint', () => {
      const mid = easeOutBack(0.7);
      expect(mid).toBeGreaterThan(1.0);
    });

    it('clamps negative values and values greater than 1', () => {
      expect(easeOutQuad(-0.5)).toBe(0);
      expect(easeOutQuad(1.5)).toBe(1);
      expect(easeOutCubic(-1)).toBe(0);
      expect(easeOutCubic(2)).toBe(1);
    });
  });

  describe('Word-Level Highlight Timing (TASK-040)', () => {
    const mockWords: WordTiming[] = [
      { id: 'w1', word: 'Hello', startTime: 1.0, endTime: 1.5, confidence: 0.95 },
      { id: 'w2', word: 'Namaste', startTime: 1.7, endTime: 2.2, confidence: 0.98 },
      { id: 'w3', word: 'Dosto', startTime: 2.3, endTime: 2.8, confidence: 0.92, punctuationFollows: '!' },
    ];

    it('determines individual word highlight states', () => {
      const w = mockWords[0];
      expect(getWordHighlightState(w, 0.5)).toBe('future');
      expect(getWordHighlightState(w, 1.25)).toBe('active');
      expect(getWordHighlightState(w, 1.8)).toBe('past');
    });

    it('handles empty words array gracefully without throwing', () => {
      const timing = getActiveWordTiming([], 1.2);
      expect(timing.activeIndex).toBe(-1);
      expect(timing.activeWord).toBeNull();
      expect(timing.progress).toBe(0);
      expect(timing.isGap).toBe(false);
    });

    it('handles time before the first word', () => {
      const timing = getActiveWordTiming(mockWords, 0.5);
      expect(timing.activeIndex).toBe(-1);
      expect(timing.activeWord).toBeNull();
      expect(timing.progress).toBe(0);
      expect(timing.isGap).toBe(true);
      expect(timing.state).toBe('future');
    });

    it('calculates accurate progress during an active word', () => {
      // w1 is from 1.0s to 1.5s. At 1.25s, it is 50% elapsed.
      const timing = getActiveWordTiming(mockWords, 1.25);
      expect(timing.activeIndex).toBe(0);
      expect(timing.activeWord?.word).toBe('Hello');
      expect(timing.progress).toBeCloseTo(0.5);
      expect(timing.isGap).toBe(false);
      expect(timing.state).toBe('active');
    });

    it('handles inter-word gap accurately', () => {
      // Between w1 (ends 1.5) and w2 (starts 1.7), time 1.6 is a gap
      const timing = getActiveWordTiming(mockWords, 1.6);
      expect(timing.activeIndex).toBe(0);
      expect(timing.activeWord?.word).toBe('Hello');
      expect(timing.progress).toBe(1.0);
      expect(timing.isGap).toBe(true);
      expect(timing.state).toBe('past');
    });

    it('handles time after the last word', () => {
      const timing = getActiveWordTiming(mockWords, 3.5);
      expect(timing.activeIndex).toBe(2);
      expect(timing.activeWord?.word).toBe('Dosto');
      expect(timing.progress).toBe(1.0);
      expect(timing.isGap).toBe(true);
      expect(timing.state).toBe('past');
    });
  });

  describe('Transition Easing & Keyframing (TASK-041)', () => {
    const config: AnimationConfig = {
      entrance: 'pop',
      exit: 'fade',
      durationMs: 200,
      activeWordEmphasis: true,
      activeWordScale: 1.08,
      karaokeMode: 'step',
    };

    it('returns hidden state when time is outside event boundary', () => {
      const before = calculateTransitionState(0.5, 1.0, 3.0, config);
      expect(before.isVisible).toBe(false);
      expect(before.phase).toBe('hidden');

      const after = calculateTransitionState(3.5, 1.0, 3.0, config);
      expect(after.isVisible).toBe(false);
      expect(after.phase).toBe('hidden');
    });

    it('calculates entrance pop scale and visibility', () => {
      // Start is 1.0, durationMs is 200ms (0.2s). At 1.1s, it is 50% through entrance.
      const entrance = calculateTransitionState(1.1, 1.0, 3.0, config);
      expect(entrance.isVisible).toBe(true);
      expect(entrance.phase).toBe('entrance');
      expect(entrance.opacity).toBeGreaterThan(0.5);
      expect(entrance.scale).toBeGreaterThan(0.5);
    });

    it('calculates steady display phase at midpoint', () => {
      const display = calculateTransitionState(2.0, 1.0, 3.0, config);
      expect(display.isVisible).toBe(true);
      expect(display.phase).toBe('display');
      expect(display.opacity).toBe(1);
      expect(display.scale).toBe(1);
      expect(display.translateY).toBe(0);
    });

    it('calculates exit fade out correctly', () => {
      // End is 3.0, durationMs is 200ms (0.2s). Exit starts at 2.8s. At 2.95s, opacity is fading out.
      const exit = calculateTransitionState(2.95, 1.0, 3.0, config);
      expect(exit.isVisible).toBe(true);
      expect(exit.phase).toBe('exit');
      expect(exit.opacity).toBeLessThan(0.5);
    });

    it('handles slide-up animation offsets', () => {
      const slideConfig: AnimationConfig = {
        entrance: 'slide-up',
        exit: 'slide-up',
        durationMs: 300,
        activeWordEmphasis: false,
        activeWordScale: 1.0,
        karaokeMode: 'sweep',
      };

      // Near start of entrance: translateY should be positive (displaced down)
      const entrance = calculateTransitionState(1.05, 1.0, 4.0, slideConfig);
      expect(entrance.phase).toBe('entrance');
      expect(entrance.translateY).toBeGreaterThan(0);

      // Near end of exit: translateY should be negative (sliding upwards away)
      const exit = calculateTransitionState(3.95, 1.0, 4.0, slideConfig);
      expect(exit.phase).toBe('exit');
      expect(exit.translateY).toBeLessThan(0);
    });

    it('handles bounce animation', () => {
      const bounceConfig: AnimationConfig = {
        entrance: 'bounce',
        exit: 'bounce',
        durationMs: 250,
        activeWordEmphasis: true,
        activeWordScale: 1.1,
        karaokeMode: 'step',
      };

      const entrance = calculateTransitionState(1.1, 1.0, 3.0, bounceConfig);
      expect(entrance.phase).toBe('entrance');
      expect(entrance.isVisible).toBe(true);
      expect(entrance.scale).toBeGreaterThan(0.7);
    });
  });

  describe('ASS Tag Compilation & Fallbacks', () => {
    it('formats timestamps accurately in H:MM:SS.cs format', () => {
      expect(formatAssTimestamp(0)).toBe('0:00:00.00');
      expect(formatAssTimestamp(65.45)).toBe('0:01:05.45');
      expect(formatAssTimestamp(3661.08)).toBe('1:01:01.08');
    });

    it('compiles ASS transition tags for fade and pop', () => {
      const fadeTag = compileAssTransitionTags({ entrance: 'fade', exit: 'fade', durationMs: 150 });
      expect(fadeTag).toBe('{\\fad(150,150)}');

      const popTag = compileAssTransitionTags({ entrance: 'pop', exit: 'none', durationMs: 200 });
      expect(popTag).toContain('\\fscx50\\fscy50');
      expect(popTag).toContain('\\t(0,200,\\fscx100\\fscy100)');
    });

    it('compiles step karaoke tags (\\k) with centisecond durations', () => {
      const event: SubtitleEvent = {
        id: 'e1',
        index: 1,
        startTime: 1.0,
        endTime: 2.5,
        text: 'Hello world',
        words: [
          { id: 'w1', word: 'Hello', startTime: 1.0, endTime: 1.5, confidence: 0.9 }, // 0.5s = 50cs
          { id: 'w2', word: 'world', startTime: 1.6, endTime: 2.2, confidence: 0.9 }, // 0.6s = 60cs, gap of 10cs
        ],
      };

      const compiled = compileAssKaraokeText(event, 'step');
      expect(compiled).toContain('{\\k50}Hello');
      expect(compiled).toContain('{\\k10}'); // Inter-word gap tag
      expect(compiled).toContain('{\\k60}world');
    });

    it('compiles smooth sweep karaoke tags (\\kf)', () => {
      const event: SubtitleEvent = {
        id: 'e2',
        index: 2,
        startTime: 0.0,
        endTime: 1.0,
        text: 'Vaani Studio',
        words: [
          { id: 'w1', word: 'Vaani', startTime: 0.0, endTime: 0.5, confidence: 1.0 }, // 50cs
          { id: 'w2', word: 'Studio', startTime: 0.5, endTime: 1.0, confidence: 1.0 }, // 50cs
        ],
      };

      const compiled = compileAssKaraokeText(event, 'sweep');
      expect(compiled).toContain('{\\kf50}Vaani');
      expect(compiled).toContain('{\\kf50}Studio');
    });

    it('cleanly falls back to plain event text when words are absent or empty (TASK-042 fallback)', () => {
      const eventWithoutWords: SubtitleEvent = {
        id: 'e3',
        index: 3,
        startTime: 1.0,
        endTime: 3.0,
        text: 'Fallback without word timestamps',
        words: [],
      };

      const compiled = compileAssKaraokeText(eventWithoutWords, 'step');
      expect(compiled).toBe('Fallback without word timestamps');

      const fullDialogue = compileAssDialogueLine(eventWithoutWords, 'Default', {
        entrance: 'fade',
        exit: 'fade',
        durationMs: 150,
      });
      expect(fullDialogue).toBe(
        'Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,{\\fad(150,150)}Fallback without word timestamps'
      );
    });
  });
});
