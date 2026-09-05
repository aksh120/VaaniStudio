import { describe, it, expect } from 'vitest';
import { createEmptyProject, DEFAULT_STYLE, DEFAULT_SETTINGS } from '../../src/shared/defaults.js';
import { SubtitleEvent, WordTiming } from '../../src/shared/types/models.js';

describe('Domain Models and Serialization', () => {
  it('creates an empty project with valid schema version and defaults', () => {
    const project = createEmptyProject('Test Project');
    expect(project.projectVersion).toBe(1);
    expect(project.projectName).toBe('Test Project');
    expect(project.events).toHaveLength(0);
    expect(project.media).toBeNull();
    expect(project.settings.languageMode).toBe(DEFAULT_SETTINGS.languageMode);
    expect(project.style.primaryColor).toBe(DEFAULT_STYLE.primaryColor);
  });

  it('serializes and deserializes project data with complete fidelity', () => {
    const project = createEmptyProject('Serialization Test');
    const word: WordTiming = {
      id: 'w-01',
      word: 'Hinglish',
      startTime: 0.5,
      endTime: 0.9,
      confidence: 0.98,
    };
    const event: SubtitleEvent = {
      id: 'evt-01',
      index: 1,
      startTime: 0.5,
      endTime: 1.2,
      text: 'Hinglish subtitles',
      words: [word],
      cps: 18,
      cpl: 18,
    };
    project.events.push(event);

    const serialized = JSON.stringify(project);
    const parsed = JSON.parse(serialized);

    expect(parsed.projectVersion).toBe(1);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0].words[0].word).toBe('Hinglish');
    expect(parsed.events[0].words[0].confidence).toBe(0.98);
  });
});
