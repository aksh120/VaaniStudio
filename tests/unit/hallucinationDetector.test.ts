import { describe, it, expect } from 'vitest';
import {
  isNaturalReduplication,
  cleanCharacterFloods,
  cleanSingleWordLoops,
  cleanMultiWordLoops,
  cleanHallucinations,
  isHallucinatorySegment,
  filterHallucinatedSegments,
} from '../../src/shared/intelligence/hallucinationDetector.js';
import { ASRSegment } from '../../src/shared/types/models.js';

describe('Hallucination Detector and Cleaner', () => {
  describe('isNaturalReduplication', () => {
    it('identifies valid Indian/English reduplications', () => {
      expect(isNaturalReduplication('dheere')).toBe(true);
      expect(isNaturalReduplication('jaldi')).toBe(true);
      expect(isNaturalReduplication('kabhi')).toBe(true);
      expect(isNaturalReduplication('bye')).toBe(true);
      expect(isNaturalReduplication('alag')).toBe(true);
    });

    it('returns false for arbitrary non-reduplication words', () => {
      expect(isNaturalReduplication('computer')).toBe(false);
      expect(isNaturalReduplication('database')).toBe(false);
      expect(isNaturalReduplication('video')).toBe(false);
    });
  });

  describe('cleanCharacterFloods', () => {
    it('collapses excessive periods to standard ellipsis', () => {
      const input = 'Waiting for input...........';
      const result = cleanCharacterFloods(input);
      expect(result.modified).toBe(true);
      expect(result.text).toBe('Waiting for input...');
    });

    it('collapses repeated question marks or exclamation marks', () => {
      const input = 'What is going on?????? Exactly!!!!!!';
      const result = cleanCharacterFloods(input);
      expect(result.modified).toBe(true);
      expect(result.text).toBe('What is going on? Exactly!');
    });

    it('collapses repeated alphabet runaway characters', () => {
      const input = 'Noooooooo that is not correct';
      const result = cleanCharacterFloods(input);
      expect(result.modified).toBe(true);
      expect(result.text).toBe('Noo that is not correct');
    });

    it('leaves standard text unchanged', () => {
      const input = 'This is completely normal text with punctuation.';
      const result = cleanCharacterFloods(input);
      expect(result.modified).toBe(false);
      expect(result.text).toBe(input);
    });
  });

  describe('cleanSingleWordLoops', () => {
    it('collapses runaway single word loops down to 1', () => {
      const input = 'the the the the the process is running';
      const result = cleanSingleWordLoops(input);
      expect(result.modified).toBe(true);
      expect(result.text).toBe('the process is running');
    });

    it('preserves dual occurrence for natural reduplications', () => {
      const input = 'aap dheere dheere boliye';
      const result = cleanSingleWordLoops(input);
      expect(result.modified).toBe(false);
      expect(result.text).toBe('aap dheere dheere boliye');
    });

    it('collapses excessive 3+ repeats of natural reduplications down to 2', () => {
      const input = 'aap dheere dheere dheere dheere boliye';
      const result = cleanSingleWordLoops(input);
      expect(result.modified).toBe(true);
      expect(result.text).toBe('aap dheere dheere boliye');
    });
  });

  describe('cleanMultiWordLoops', () => {
    it('collapses 2-word phrase loops', () => {
      const input = 'thank you thank you thank you very much';
      const result = cleanMultiWordLoops(input);
      expect(result.modified).toBe(true);
      expect(result.text).toBe('thank you very much');
    });

    it('collapses longer phrase loops', () => {
      const input = 'subscribe to the channel subscribe to the channel subscribe to the channel please';
      const result = cleanMultiWordLoops(input);
      expect(result.modified).toBe(true);
      expect(result.text).toBe('subscribe to the channel please');
    });
  });

  describe('cleanHallucinations (combined)', () => {
    it('cleans both character floods and loops in a single pass', () => {
      const input = 'hello hello hello hello......... world';
      const res = cleanHallucinations(input);
      expect(res.hasHallucination).toBe(true);
      expect(res.cleanedText).toBe('hello... world');
      expect(res.reasons).toContain('character_flood');
      expect(res.reasons).toContain('single_word_loop');
    });
  });

  describe('isHallucinatorySegment and filterHallucinatedSegments', () => {
    it('identifies subtitle credit hallucination templates', () => {
      const seg: ASRSegment = {
        id: 'seg-1',
        startTime: 0,
        endTime: 2,
        text: 'Subtitles by the Amara.org community',
        words: [],
      };
      expect(isHallucinatorySegment(seg)).toBe(true);
    });

    it('identifies repetitive single-word spam segment', () => {
      const seg: ASRSegment = {
        id: 'seg-2',
        startTime: 0,
        endTime: 3,
        text: 'you you you you you you you',
        words: [],
      };
      expect(isHallucinatorySegment(seg)).toBe(true);
    });

    it('preserves valid dialogue segments and cleans them', () => {
      const segments: ASRSegment[] = [
        {
          id: 'seg-1',
          startTime: 0,
          endTime: 2,
          text: 'Subtitles by the Amara.org community',
          words: [],
        },
        {
          id: 'seg-2',
          startTime: 2.1,
          endTime: 5.0,
          text: 'welcome to the tutorial thank you thank you',
          words: [
            { word: 'welcome', startTime: 2.1, endTime: 2.5, confidence: 0.95 },
            { word: 'tutorial', startTime: 2.6, endTime: 3.2, confidence: 0.92 },
          ],
        },
      ];

      const filtered = filterHallucinatedSegments(segments);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('seg-2');
      expect(filtered[0].text).toBe('welcome to the tutorial thank you');
    });
  });
});
