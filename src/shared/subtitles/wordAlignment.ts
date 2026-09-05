/**
 * Word-Level Timestamp Extraction and Alignment Engine
 * Processes raw ASR word tokens to produce clean, monotonic, non-overlapping
 * word timing records with proper punctuation association and confidence normalization.
 */

import { WordTiming } from '../types/models.js';

export interface RawASRWord {
  word: string;
  start: number;
  end: number;
  probability?: number;
}

export interface WordAlignmentOptions {
  minWordDurationSeconds?: number;
  defaultConfidence?: number;
  resolveOverlaps?: boolean;
}

const DEFAULT_OPTIONS: Required<WordAlignmentOptions> = {
  minWordDurationSeconds: 0.04, // 40ms minimum word duration
  defaultConfidence: 0.90,
  resolveOverlaps: true,
};

const PUNCTUATION_REGEX = /^[.,?!:;\u0964\u0965\-–—'"()\[\]{}]+$/;

/**
 * Cleans and aligns a sequence of raw ASR word tokens.
 * Enforces monotonic timestamps, removes negative durations, resolves overlaps,
 * and attaches orphaned punctuation to preceding word tokens.
 */
export function cleanAndAlignWords(
  rawWords: (RawASRWord | WordTiming)[],
  options?: WordAlignmentOptions
): WordTiming[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!rawWords || rawWords.length === 0) {
    return [];
  }

  const intermediateWords: WordTiming[] = [];

  for (let i = 0; i < rawWords.length; i++) {
    const raw = rawWords[i];
    const rawWord = 'word' in raw ? raw.word : '';
    const rawStart = 'startTime' in raw ? raw.startTime : (raw as RawASRWord).start;
    const rawEnd = 'endTime' in raw ? raw.endTime : (raw as RawASRWord).end;
    const rawConf = 'confidence' in raw
      ? raw.confidence
      : ((raw as RawASRWord).probability !== undefined ? (raw as RawASRWord).probability! : opts.defaultConfidence);

    const trimmedWord = rawWord.trim();
    if (!trimmedWord) {
      continue;
    }

    // Check if current token is standalone punctuation
    if (PUNCTUATION_REGEX.test(trimmedWord)) {
      if (intermediateWords.length > 0) {
        const prev = intermediateWords[intermediateWords.length - 1];
        prev.word = `${prev.word}${trimmedWord}`;
        prev.punctuationFollows = trimmedWord;
        // Slightly extend previous word end time to include punctuation boundary if valid
        if (rawEnd > prev.endTime) {
          prev.endTime = Number(Math.max(prev.endTime, rawEnd).toFixed(3));
        }
      }
      continue;
    }

    // Validate and clamp raw start and end timestamps
    let start = Number(Math.max(0, rawStart).toFixed(3));
    let end = Number(Math.max(start, rawEnd).toFixed(3));

    // Ensure minimum duration
    if (end - start < opts.minWordDurationSeconds) {
      end = Number((start + opts.minWordDurationSeconds).toFixed(3));
    }

    // Clamp confidence to [0.0, 1.0]
    const confidence = Number(Math.max(0.0, Math.min(1.0, rawConf)).toFixed(3));

    intermediateWords.push({
      id: `w-${i + 1}-${Math.random().toString(36).substring(2, 7)}`,
      word: trimmedWord,
      startTime: start,
      endTime: end,
      confidence,
    });
  }

  if (intermediateWords.length === 0) {
    return [];
  }

  // Ensure chronological ordering by start time
  intermediateWords.sort((a, b) => a.startTime - b.startTime);

  // Resolve overlaps and enforce strict monotonicity
  if (opts.resolveOverlaps) {
    for (let i = 1; i < intermediateWords.length; i++) {
      const prev = intermediateWords[i - 1];
      const curr = intermediateWords[i];

      // If current starts before previous ends, resolve boundary overlap
      if (curr.startTime < prev.endTime) {
        if (curr.startTime < prev.startTime) {
          curr.startTime = prev.startTime;
        }

        // Calculate midpoint overlap resolution
        const midPoint = Number(((prev.endTime + curr.startTime) / 2).toFixed(3));

        // Ensure both maintain at least minimum duration
        if (midPoint - prev.startTime >= opts.minWordDurationSeconds) {
          prev.endTime = midPoint;
          curr.startTime = midPoint;
        } else {
          // Keep prev minimum, shift curr.startTime to prev.endTime
          prev.endTime = Number((prev.startTime + opts.minWordDurationSeconds).toFixed(3));
          curr.startTime = prev.endTime;
        }

        if (curr.endTime - curr.startTime < opts.minWordDurationSeconds) {
          curr.endTime = Number((curr.startTime + opts.minWordDurationSeconds).toFixed(3));
        }
      }
    }
  }

  // Final validation pass: re-assign sequential IDs and verify integrity
  return intermediateWords.map((w, idx) => ({
    id: `w-${idx + 1}`,
    word: w.word,
    startTime: Number(w.startTime.toFixed(3)),
    endTime: Number(w.endTime.toFixed(3)),
    confidence: w.confidence,
    punctuationFollows: w.punctuationFollows,
  }));
}
