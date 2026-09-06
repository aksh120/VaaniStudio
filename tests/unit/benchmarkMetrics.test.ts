import { describe, it, expect } from 'vitest';
import {
  computeWER,
  computeCER,
  computeKeywordAccuracy,
  computeTimestampMAE,
  normalizeForEvaluation,
} from '../../src/shared/benchmarks/metrics.js';

describe('Speech Recognition Benchmark Metrics', () => {
  describe('normalizeForEvaluation', () => {
    it('normalizes case, punctuation, and whitespace', () => {
      const input = '  Hello, World! This is a TEST...  ';
      const expected = 'hello world this is a test';
      expect(normalizeForEvaluation(input)).toBe(expected);
    });

    it('removes Devanagari punctuation symbols', () => {
      const input = 'नमस्ते दुनिया। यह एक परीक्षण है॥';
      const result = normalizeForEvaluation(input);
      expect(result).toBe('नमस्ते दुनिया यह एक परीक्षण है');
    });

    it('handles empty or blank string gracefully', () => {
      expect(normalizeForEvaluation('')).toBe('');
      expect(normalizeForEvaluation('   ')).toBe('');
    });
  });

  describe('computeWER (Word Error Rate)', () => {
    it('computes 0% WER for identical strings', () => {
      const ref = 'the quick brown fox jumps over the lazy dog';
      const hyp = 'The Quick Brown Fox Jumps Over The Lazy Dog.';
      const res = computeWER(ref, hyp);

      expect(res.wer).toBe(0.0);
      expect(res.hits).toBe(9);
      expect(res.substitutions).toBe(0);
      expect(res.deletions).toBe(0);
      expect(res.insertions).toBe(0);
      expect(res.referenceWordCount).toBe(9);
    });

    it('correctly calculates single substitution error', () => {
      const ref = 'speech recognition is fast';
      const hyp = 'speech recognition is slow';
      const res = computeWER(ref, hyp);

      expect(res.wer).toBe(0.25);
      expect(res.substitutions).toBe(1);
      expect(res.deletions).toBe(0);
      expect(res.insertions).toBe(0);
      expect(res.hits).toBe(3);
    });

    it('correctly calculates single deletion error', () => {
      const ref = 'speech recognition is very fast';
      const hyp = 'speech recognition is fast';
      const res = computeWER(ref, hyp);

      expect(res.wer).toBe(0.2); // 1 error / 5 words
      expect(res.deletions).toBe(1);
      expect(res.substitutions).toBe(0);
      expect(res.insertions).toBe(0);
      expect(res.hits).toBe(4);
    });

    it('correctly calculates single insertion error', () => {
      const ref = 'speech recognition is fast';
      const hyp = 'speech recognition really is fast';
      const res = computeWER(ref, hyp);

      expect(res.wer).toBe(0.25); // 1 error / 4 words
      expect(res.insertions).toBe(1);
      expect(res.deletions).toBe(0);
      expect(res.substitutions).toBe(0);
      expect(res.hits).toBe(4);
    });

    it('handles completely disjoint reference and hypothesis', () => {
      const ref = 'one two three';
      const hyp = 'four five six';
      const res = computeWER(ref, hyp);

      expect(res.wer).toBe(1.0);
      expect(res.hits).toBe(0);
      expect(res.substitutions).toBe(3);
    });

    it('handles empty reference or empty hypothesis', () => {
      expect(computeWER('', '').wer).toBe(0.0);
      expect(computeWER('one two three', '').wer).toBe(1.0);
      expect(computeWER('', 'one two').wer).toBe(1.0);
    });
  });

  describe('computeCER (Character Error Rate)', () => {
    it('computes 0% CER for identical character strings', () => {
      const ref = 'नमस्ते भारत';
      const hyp = 'नमस्ते भारत';
      const res = computeCER(ref, hyp);

      expect(res.cer).toBe(0.0);
      expect(res.substitutions).toBe(0);
      expect(res.deletions).toBe(0);
      expect(res.insertions).toBe(0);
    });

    it('computes CER on Latin strings with typos', () => {
      const ref = 'subtitle';
      const hyp = 'subtitel';
      const res = computeCER(ref, hyp);

      expect(res.cer).toBeGreaterThan(0);
      expect(res.referenceCharCount).toBe(8);
    });

    it('handles empty inputs in CER', () => {
      expect(computeCER('', '').cer).toBe(0.0);
      expect(computeCER('abc', '').cer).toBe(1.0);
    });
  });

  describe('computeKeywordAccuracy', () => {
    it('computes 100% accuracy when all keywords are present', () => {
      const hyp = 'Vaani Studio uses whisper for offline transcription and fast subtitle rendering.';
      const keywords = ['Vaani Studio', 'whisper', 'offline transcription', 'subtitle rendering'];
      const res = computeKeywordAccuracy(hyp, keywords);

      expect(res.accuracy).toBe(1.0);
      expect(res.totalKeywords).toBe(4);
      expect(res.matchedKeywords).toBe(4);
      expect(res.missingKeywords.length).toBe(0);
    });

    it('computes partial accuracy and identifies missing keywords', () => {
      const hyp = 'Vaani Studio runs locally on your PC.';
      const keywords = ['Vaani Studio', 'whisper', 'offline', 'locally'];
      const res = computeKeywordAccuracy(hyp, keywords);

      expect(res.accuracy).toBe(0.5);
      expect(res.matchedKeywords).toBe(2);
      expect(res.missingKeywords).toEqual(['whisper', 'offline']);
    });

    it('returns 100% if expected keyword list is empty', () => {
      const res = computeKeywordAccuracy('Some text', []);
      expect(res.accuracy).toBe(1.0);
      expect(res.totalKeywords).toBe(0);
    });
  });

  describe('computeTimestampMAE', () => {
    it('computes accurate Mean Absolute Error across segment intervals', () => {
      const refTimings = [
        { start: 0.0, end: 2.0 },
        { start: 2.5, end: 4.5 },
      ];
      const hypTimings = [
        { start: 0.1, end: 2.0 }, // diff: start 0.1, end 0.0 -> avg 0.05
        { start: 2.4, end: 4.7 }, // diff: start 0.1, end 0.2 -> avg 0.15
      ];
      const res = computeTimestampMAE(refTimings, hypTimings);

      expect(res.sampleCount).toBe(2);
      expect(res.maeStartSeconds).toBe(0.1);
      expect(res.maeEndSeconds).toBe(0.1);
      expect(res.maeSeconds).toBe(0.1);
    });

    it('handles empty timing arrays safely', () => {
      const res = computeTimestampMAE([], []);
      expect(res.maeSeconds).toBe(0);
      expect(res.sampleCount).toBe(0);
    });
  });
});
