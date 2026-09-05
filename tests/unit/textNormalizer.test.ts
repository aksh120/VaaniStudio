import { describe, it, expect } from 'vitest';
import {
  formatIndianNumber,
  normalizeIndianNumbers,
  removeFillers,
  formatPunctuation,
  normalizeText,
  normalizeSubtitleEvent,
} from '../../src/shared/intelligence/textNormalizer.js';
import { SubtitleEvent } from '../../src/shared/types/models.js';

describe('Text Normalizer and Indian Number Formatting', () => {
  it('formats raw integers into standard Indian comma grouping', () => {
    expect(formatIndianNumber(500)).toBe('500');
    expect(formatIndianNumber(10000)).toBe('10,000');
    expect(formatIndianNumber(250000)).toBe('2,50,000');
    expect(formatIndianNumber(10000000)).toBe('1,00,00,000');
  });

  it('normalizes spoken Indian numbering expressions to formatted digits', () => {
    expect(normalizeIndianNumbers('hamare paas pachas hazar users hain')).toBe('hamare paas 50,000 users hain');
    expect(normalizeIndianNumbers('iss project ka budget do lakh hai')).toBe('iss project ka budget 2,00,000 hai');
    expect(normalizeIndianNumbers('valuation das crore pahunch gayi')).toBe('valuation 10 Crore pahunch gayi');
    expect(normalizeIndianNumbers('price is fifty rupees')).toBe('price is ₹50');
    expect(normalizeIndianNumbers('growth rate is twenty percent')).toBe('growth rate is 20%');
  });

  it('removes conversational filler words cleanly', () => {
    const raw = 'um basically ye feature uh bohot fast hai';
    const cleaned = removeFillers(raw);
    expect(cleaned).not.toContain('um');
    expect(cleaned).not.toContain('uh');
    expect(cleaned).not.toContain('basically');
    expect(cleaned).toContain('ye feature bohot fast hai');
  });

  it('formats punctuation and detects questions from interrogative openings', () => {
    const question = formatPunctuation('kya ye feature ready hai');
    expect(question).toBe('Kya ye feature ready hai?');

    const statement = formatPunctuation('welcome to vaani studio');
    expect(statement).toBe('Welcome to vaani studio.');
  });

  it('runs complete end-to-end string normalization via normalizeText', () => {
    const raw = 'um hamare paas pachas hazar users hain';
    const normalized = normalizeText(raw, {
      normalizeNumbers: true,
      removeFillerWords: true,
      formatPunctuation: true,
    });
    expect(normalized).toBe('Hamare paas 50,000 users hain.');
  });

  it('normalizes SubtitleEvents non-destructively and recalculates reading metrics', () => {
    const event: SubtitleEvent = {
      id: 'sub-1',
      index: 1,
      startTime: 0.0,
      endTime: 2.0,
      text: 'um pachas hazar users registered',
      words: [
        { id: 'w1', word: 'um', startTime: 0.0, endTime: 0.3, confidence: 0.8 },
        { id: 'w2', word: 'pachas', startTime: 0.3, endTime: 0.8, confidence: 0.95 },
        { id: 'w3', word: 'hazar', startTime: 0.8, endTime: 1.2, confidence: 0.94 },
        { id: 'w4', word: 'users', startTime: 1.2, endTime: 1.6, confidence: 0.98 },
        { id: 'w5', word: 'registered', startTime: 1.6, endTime: 2.0, confidence: 0.97 },
      ],
    };

    const normalized = normalizeSubtitleEvent(event, {
      normalizeNumbers: true,
      removeFillerWords: true,
      formatPunctuation: true,
    });

    expect(normalized.text).toContain('50,000 users registered.');
    expect(normalized.text).not.toContain('um');
    expect(normalized.words.some((w) => w.word.toLowerCase() === 'um')).toBe(false);
    expect(normalized.cps).toBeGreaterThan(0);
  });
});
