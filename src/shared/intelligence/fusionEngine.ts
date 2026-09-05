/**
 * Transcription Fusion Engine
 * Reconciles multilingual outputs, resolves English technical loanwords in code-switched
 * Hinglish, and constructs prompt priming contexts for the ASR worker.
 */

import { SubtitleEvent, WordTiming } from '../types/models.js';
import { ENGLISH_LOANWORD_MAP } from './transliteration.js';

export interface FusionOptions {
  preserveEnglishTechnicalTerms?: boolean;
  domainContext?: 'tech' | 'general' | 'business';
}

/**
 * Builds an optimal prompt priming string to guide the Whisper ASR decoder
 * towards keeping code-switched technical loanwords in standard English.
 */
export function buildHinglishPrompt(domain: 'tech' | 'general' | 'business' = 'tech'): string {
  switch (domain) {
    case 'tech':
      return 'Ye conversational Hinglish transcript hai with technical terms like login, database, API, code, error, bug, feature, update, server, download, deploy, GitHub, project, meeting.';
    case 'business':
      return 'Ye Hinglish business discussion hai with terms like client, customer, budget, payment, invoice, revenue, market, report, presentation, team, target, deadline.';
    case 'general':
    default:
      return 'Ye conversational Hindi and English mixed Hinglish speech hai with common English words like message, call, video, screen, photo, location, app, online.';
  }
}

/**
 * Fuses code-switched vocabulary in subtitle events, restoring English loanwords
 * to standard Latin spelling while keeping Hindi phrasing intact.
 */
export function fuseVocabularyInEvents(
  events: SubtitleEvent[],
  options: FusionOptions = { preserveEnglishTechnicalTerms: true }
): SubtitleEvent[] {
  if (!options.preserveEnglishTechnicalTerms) {
    return events;
  }

  return events.map((event) => {
    let textModified = false;
    let newText = event.text;

    // Process individual word timings
    const newWords: WordTiming[] = (event.words || []).map((w) => {
      const cleanWord = w.word.trim().replace(/[^\u0900-\u097F]/g, '');
      if (ENGLISH_LOANWORD_MAP[cleanWord]) {
        const replacement = ENGLISH_LOANWORD_MAP[cleanWord];
        textModified = true;
        return {
          ...w,
          word: replacement,
        };
      }
      return w;
    });

    if (textModified) {
      // Reconstruct segment text from updated word array or regex replacement
      for (const [deva, eng] of Object.entries(ENGLISH_LOANWORD_MAP)) {
        if (newText.includes(deva)) {
          newText = newText.replaceAll(deva, eng);
        }
      }
    }

    return {
      ...event,
      text: newText,
      words: newWords,
    };
  });
}
