import { describe, it, expect } from 'vitest';
import { classifyLanguage } from '../../src/shared/intelligence/languageClassifier.js';

describe('Language and Code-Switching Classifier', () => {
  it('classifies pure English sentences accurately', () => {
    const text = 'Welcome to the desktop subtitle generator application for video creators.';
    const result = classifyLanguage(text);

    expect(result.classification).toBe('pure_english');
    expect(result.dominantScript).toBe('latin');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.devanagariRatio).toBe(0);
  });

  it('classifies pure Devanagari Hindi sentences accurately', () => {
    const text = 'नमस्ते दोस्तों आज हम एक नए प्रोजेक्ट के बारे में बात करेंगे।';
    const result = classifyLanguage(text);

    expect(result.classification).toBe('pure_hindi');
    expect(result.dominantScript).toBe('devanagari');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.devanagariRatio).toBeGreaterThan(0.75);
  });

  it('classifies conversational Roman Hinglish sentences accurately', () => {
    const text = 'Ye feature bohot better hai aur database login fast ho gaya hai.';
    const result = classifyLanguage(text);

    expect(result.classification).toBe('code_switched_hinglish');
    expect(result.dominantScript).toBe('latin');
    expect(result.detectedHinglishTokens.length).toBeGreaterThanOrEqual(2);
    expect(result.detectedHinglishTokens).toContain('hai');
  });

  it('classifies mixed script Hinglish accurately', () => {
    const text = 'ये feature बहुत better है और database login fast हो गया है।';
    const result = classifyLanguage(text);

    expect(result.classification).toBe('code_switched_hinglish');
    expect(result.dominantScript).toBe('mixed');
    expect(result.devanagariRatio).toBeGreaterThan(0.15);
    expect(result.latinRatio).toBeGreaterThan(0.15);
  });

  it('handles empty or whitespace strings gracefully', () => {
    const result = classifyLanguage('   ');
    expect(result.classification).toBe('pure_english');
    expect(result.confidence).toBe(1.0);
  });
});
