import { describe, it, expect } from 'vitest';
import {
  buildHinglishPrompt,
  fuseVocabularyInEvents,
} from '../../src/shared/intelligence/fusionEngine.js';
import { SubtitleEvent } from '../../src/shared/types/models.js';

describe('Transcription Fusion Engine', () => {
  it('builds domain-tailored Hinglish priming prompts', () => {
    const techPrompt = buildHinglishPrompt('tech');
    expect(techPrompt).toContain('Hinglish');
    expect(techPrompt).toContain('login');
    expect(techPrompt).toContain('database');
    expect(techPrompt).toContain('feature');

    const bizPrompt = buildHinglishPrompt('business');
    expect(bizPrompt).toContain('client');
    expect(bizPrompt).toContain('budget');
  });

  it('reconciles vocabulary conflicts by replacing Devanagari loanwords with English spelling in SubtitleEvents', () => {
    const mockEvents: SubtitleEvent[] = [
      {
        id: 'sub-1',
        index: 1,
        startTime: 1.0,
        endTime: 3.5,
        text: 'यूजर ने लॉगिन किया और डेटाबेस चेक किया।',
        words: [
          { id: 'w-1', word: 'यूजर', startTime: 1.0, endTime: 1.4, confidence: 0.95 },
          { id: 'w-2', word: 'ने', startTime: 1.4, endTime: 1.6, confidence: 0.98 },
          { id: 'w-3', word: 'लॉगिन', startTime: 1.6, endTime: 2.1, confidence: 0.92 },
          { id: 'w-4', word: 'किया', startTime: 2.1, endTime: 2.5, confidence: 0.96 },
          { id: 'w-5', word: 'और', startTime: 2.5, endTime: 2.7, confidence: 0.99 },
          { id: 'w-6', word: 'डेटाबेस', startTime: 2.7, endTime: 3.2, confidence: 0.91 },
          { id: 'w-7', word: 'चेक किया।', startTime: 3.2, endTime: 3.5, confidence: 0.94 },
        ],
      },
    ];

    const fused = fuseVocabularyInEvents(mockEvents);
    expect(fused[0].text).toContain('login');
    expect(fused[0].text).toContain('database');

    const loginWord = fused[0].words.find((w) => w.id === 'w-3');
    expect(loginWord).toBeDefined();
    expect(loginWord?.word).toBe('login');
    expect(loginWord?.startTime).toBe(1.6);
    expect(loginWord?.endTime).toBe(2.1);
  });
});
