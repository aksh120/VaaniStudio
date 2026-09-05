import { describe, it, expect } from 'vitest';
import {
  devanagariToRoman,
  romanToDevanagari,
  transformScript,
  ENGLISH_LOANWORD_MAP,
} from '../../src/shared/intelligence/transliteration.js';

describe('Script Representation and Transliteration System', () => {
  it('transliterates basic Devanagari Hindi into phonetic Roman script', () => {
    const deva = 'नमस्ते भारत';
    const roman = devanagariToRoman(deva);
    expect(roman.toLowerCase()).toContain('namaste');
    expect(roman.toLowerCase()).toMatch(/bha?arat/);
  });

  it('preserves verified English technical loanwords in Devanagari to Roman transliteration', () => {
    // "लॉगिन और डेटाबेस अपडेट हो गया" -> "login aur database update ho gaya"
    const deva = 'लॉगिन और डेटाबेस अपडेट हो गया';
    const roman = devanagariToRoman(deva);

    expect(roman).toContain('login');
    expect(roman).toContain('database');
    expect(roman).toContain('update');
    // Ensure English words are not phonetically butchered like 'detaabes' or 'apdet'
    expect(roman).not.toContain('detaabes');
    expect(roman).not.toContain('apdet');
  });

  it('transliterates Roman Hinglish to Devanagari while preserving English technical terms', () => {
    const roman = 'ye feature better hai';
    const deva = romanToDevanagari(roman);

    expect(deva).toContain('ये');
    expect(deva).toContain('feature'); // Preserved in Latin English!
    expect(deva).toContain('है');
  });

  it('transforms script according to ScriptMode enum', () => {
    const original = 'लॉगिन करो';

    const romanMode = transformScript(original, 'roman');
    expect(romanMode).toContain('login');
    expect(romanMode).toContain('karo');

    const exactMode = transformScript(original, 'exact');
    expect(exactMode).toBe(original);
  });

  it('has comprehensive coverage of technical and creative loanwords', () => {
    expect(ENGLISH_LOANWORD_MAP['लॉगिन']).toBe('login');
    expect(ENGLISH_LOANWORD_MAP['डेटाबेस']).toBe('database');
    expect(ENGLISH_LOANWORD_MAP['सॉफ्टवेयर']).toBe('software');
    expect(ENGLISH_LOANWORD_MAP['सबटाइटल']).toBe('subtitle');
    expect(ENGLISH_LOANWORD_MAP['सब्सक्राइब']).toBe('subscribe');
  });
});
