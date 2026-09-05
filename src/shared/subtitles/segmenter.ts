/**
 * Linguistic Subtitle Segmentation Algorithm
 * Chunks continuous streams of timed words into syntactically natural,
 * readable, and well-proportioned subtitle events.
 */

import { WordTiming, SubtitleEvent } from '../types/models.js';

export interface SegmentationOptions {
  preset?: 'standard' | 'short_form';
  maxCharactersPerLine?: number; // Default 37
  maxLinesPerSubtitle?: number;  // Default 2
  maxDurationSeconds?: number;   // Default 5.0
  minDurationSeconds?: number;   // Default 0.8
  maxSilenceGapSeconds?: number; // Default 0.35 (350ms)
  maxWordsPerSubtitle?: number;  // Default 16 for standard, 5 for short_form
}

export const DEFAULT_SEGMENTATION_OPTIONS: Required<SegmentationOptions> = {
  preset: 'standard',
  maxCharactersPerLine: 37,
  maxLinesPerSubtitle: 2,
  maxDurationSeconds: 5.0,
  minDurationSeconds: 0.8,
  maxSilenceGapSeconds: 0.35,
  maxWordsPerSubtitle: 16,
};

export const SHORT_FORM_OPTIONS: Required<SegmentationOptions> = {
  preset: 'short_form',
  maxCharactersPerLine: 24,
  maxLinesPerSubtitle: 1,
  maxDurationSeconds: 2.5,
  minDurationSeconds: 0.4,
  maxSilenceGapSeconds: 0.25,
  maxWordsPerSubtitle: 5,
};

// Sentence-ending terminal punctuation
const TERMINAL_PUNCTUATION_REGEX = /[.?!।॥]$/;

// Weak punctuation (commas, colons, semicolons, dashes) that suggest good potential break points
const CLAUSE_PUNCTUATION_REGEX = /[,;:\-–—]$/;

// Disallow ending a subtitle on these prepositions/particles if more words remain in the phrase
const HINDI_ENGLISH_PREPOSITIONS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'from',
  'and', 'or', 'but', 'nor', 'ka', 'ke', 'ki', 'ko', 'se', 'me', 'mein', 'par',
  'pe', 'aur', 'ya', 'lekin', 'agar', 'toh'
]);

/**
 * Checks whether breaking after the current word is linguistically cohesive.
 */
function shouldAvoidBreakAfter(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z\u0900-\u097F]/g, '');
  return HINDI_ENGLISH_PREPOSITIONS.has(clean);
}

/**
 * Breaks an array of words within an event into 1 or 2 visually balanced lines.
 */
function formatEventLines(words: WordTiming[], maxCpl: number, maxLines: number): string {
  if (words.length === 0) return '';
  const textWords = words.map(w => w.word);

  if (maxLines <= 1) {
    return textWords.join(' ');
  }

  const fullText = textWords.join(' ');
  if (fullText.length <= maxCpl) {
    return fullText;
  }

  // Find the most balanced split point around the middle
  const targetSplitIndex = Math.floor(textWords.length / 2);
  let bestSplit = targetSplitIndex;
  let bestScore = Infinity;

  // Search in a window around the midpoint
  const minIdx = Math.max(1, targetSplitIndex - 2);
  const maxIdx = Math.min(textWords.length - 1, targetSplitIndex + 2);

  for (let i = minIdx; i <= maxIdx; i++) {
    const line1 = textWords.slice(0, i).join(' ');
    const line2 = textWords.slice(i).join(' ');

    let penalty = Math.abs(line1.length - line2.length);
    if (line1.length > maxCpl) penalty += (line1.length - maxCpl) * 5;
    if (line2.length > maxCpl) penalty += (line2.length - maxCpl) * 5;

    // Prefer splitting after punctuation
    if (CLAUSE_PUNCTUATION_REGEX.test(textWords[i - 1])) {
      penalty -= 10;
    }

    // Avoid splitting after dangling prepositions
    if (shouldAvoidBreakAfter(textWords[i - 1])) {
      penalty += 15;
    }

    if (penalty < bestScore) {
      bestScore = penalty;
      bestSplit = i;
    }
  }

  const line1 = textWords.slice(0, bestSplit).join(' ');
  const line2 = textWords.slice(bestSplit).join(' ');
  return `${line1}\n${line2}`;
}

/**
 * Segments a sequence of aligned words into subtitle events.
 */
export function segmentWordsIntoSubtitles(
  words: WordTiming[],
  options?: SegmentationOptions
): SubtitleEvent[] {
  if (!words || words.length === 0) {
    return [];
  }

  const opts = options?.preset === 'short_form'
    ? { ...SHORT_FORM_OPTIONS, ...options }
    : { ...DEFAULT_SEGMENTATION_OPTIONS, ...options };

  const events: SubtitleEvent[] = [];
  let currentWords: WordTiming[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);

    const isLastWord = i === words.length - 1;
    if (isLastWord) {
      break;
    }

    const nextWord = words[i + 1];
    const durationSoFar = word.endTime - currentWords[0].startTime;
    const silenceGap = nextWord.startTime - word.endTime;
    const currentText = currentWords.map(w => w.word).join(' ');

    // Rule 1: Silence pause boundary (speaker paused for >= maxSilenceGap)
    const hasSilenceBoundary = silenceGap >= opts.maxSilenceGapSeconds;

    // Rule 2: Terminal sentence punctuation boundary (. ? ! ।)
    const hasTerminalPunctuation = TERMINAL_PUNCTUATION_REGEX.test(word.word);

    // Rule 3: Word count limit reached
    const hasWordCountLimit = currentWords.length >= opts.maxWordsPerSubtitle;

    // Rule 4: Maximum duration reached
    const hasDurationLimit = durationSoFar >= opts.maxDurationSeconds;

    // Rule 5: Character capacity limit for multi-line block
    const maxCapacity = opts.maxCharactersPerLine * opts.maxLinesPerSubtitle;
    const hasCharCapacityLimit = currentText.length >= maxCapacity - 5;

    // Terminal punctuation is a hard sentence boundary break
    const isSentenceEnd = hasTerminalPunctuation && !shouldAvoidBreakAfter(word.word);

    // Determine if we must break
    const mustBreak = hasDurationLimit || currentText.length >= maxCapacity;

    // Determine if it is a natural break (silence gap, word count, character capacity)
    const shouldBreakNaturally = (hasSilenceBoundary || hasWordCountLimit || hasCharCapacityLimit)
      && durationSoFar >= opts.minDurationSeconds
      && !shouldAvoidBreakAfter(word.word);

    if (mustBreak || isSentenceEnd || shouldBreakNaturally) {
      const eventText = formatEventLines(currentWords, opts.maxCharactersPerLine, opts.maxLinesPerSubtitle);
      const startTime = currentWords[0].startTime;
      const endTime = currentWords[currentWords.length - 1].endTime;
      const duration = Math.max(0.1, endTime - startTime);
      const pureText = eventText.replace(/\n/g, ' ');
      const cps = Number((pureText.length / duration).toFixed(1));
      const lines = eventText.split('\n');
      const cpl = Math.max(...lines.map(l => l.length));

      events.push({
        id: `sub-${events.length + 1}`,
        index: events.length + 1,
        startTime,
        endTime,
        text: eventText,
        words: [...currentWords],
        cps,
        cpl,
      });

      currentWords = [];
    }
  }

  // Push remaining trailing words
  if (currentWords.length > 0) {
    const eventText = formatEventLines(currentWords, opts.maxCharactersPerLine, opts.maxLinesPerSubtitle);
    const startTime = currentWords[0].startTime;
    const endTime = currentWords[currentWords.length - 1].endTime;
    const duration = Math.max(0.1, endTime - startTime);
    const pureText = eventText.replace(/\n/g, ' ');
    const cps = Number((pureText.length / duration).toFixed(1));
    const lines = eventText.split('\n');
    const cpl = Math.max(...lines.map(l => l.length));

    events.push({
      id: `sub-${events.length + 1}`,
      index: events.length + 1,
      startTime,
      endTime,
      text: eventText,
      words: [...currentWords],
      cps,
      cpl,
    });
  }

  return events;
}
