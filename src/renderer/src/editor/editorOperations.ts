/**
 * Subtitle Editing Operations for Desktop Subtitle Editor Workspace (TASK-034).
 * Transactional operations for splitting, merging, inserting, deleting, duplicating,
 * retiming, and search/replace across subtitle events.
 */

import { SubtitleEvent, WordTiming } from '../../../shared/types/models.js';
import { getWordDisplayText } from '../../../shared/subtitles/wordAlignment.js';

export interface SearchReplaceOptions {
  matchCase?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
}

export interface UpdateSubtitleTimingOptions {
  mode?: 'boundary' | 'proportional';
  proportional?: boolean;
  useProportionalScaling?: boolean;
  useProportional?: boolean;
}

const TIMING_TOKEN_EDGE_PUNCTUATION_REGEX = /^[.,?!:;\u0964\u0965\-–—'"()\[\]{}]+|[.,?!:;\u0964\u0965\-–—'"()\[\]{}]+$/g;
const TIMING_TRAILING_PUNCTUATION_REGEX = /[.,?!:;\u0964\u0965\-–—'"()\[\]{}]+$/;

function normalizeTimingToken(token: string): string {
  return token
    .normalize('NFKC')
    .replace(TIMING_TOKEN_EDGE_PUNCTUATION_REGEX, '')
    .toLowerCase();
}

function mapWordsToTextIfSafe(event: SubtitleEvent, newText: string): WordTiming[] | null {
  const textTokens = newText.replace(/\r?\n/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!event.words || textTokens.length === 0 || textTokens.length !== event.words.length) {
    return null;
  }

  const currentTokens = event.words.map((word) => normalizeTimingToken(getWordDisplayText(word)));
  if (currentTokens.some((token, index) => token !== normalizeTimingToken(textTokens[index]))) {
    return null;
  }

  return event.words.map((word, index) => {
    const token = textTokens[index];
    const punctuationMatch = token.match(TIMING_TRAILING_PUNCTUATION_REGEX);
    const punctuation = punctuationMatch?.[0] || '';
    return {
      ...word,
      word: token,
      punctuationFollows: punctuation || undefined,
    };
  });
}

function getWordTimingState(
  event: SubtitleEvent,
  newText: string,
  mappedWords: WordTiming[] | null
): SubtitleEvent['wordTimingState'] {
  if (newText === event.text) {
    return event.wordTimingState;
  }
  if (event.wordTimingState === 'stale' || event.wordTimingState === 'legacy-unverified') {
    return event.wordTimingState;
  }
  if (!mappedWords) {
    return 'stale';
  }
  return 'fresh';
}

function roundTiming(value: number): number {
  return Number(value.toFixed(3));
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clampTiming(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function shouldUseProportionalTiming(
  options?: UpdateSubtitleTimingOptions | boolean
): boolean {
  if (options === true) {
    return true;
  }
  if (!options || typeof options !== 'object') {
    return false;
  }
  return options.mode === 'proportional'
    || options.proportional === true
    || options.useProportionalScaling === true
    || options.useProportional === true;
}

function constrainWordTimings(
  words: WordTiming[],
  eventStart: number,
  eventEnd: number
): WordTiming[] {
  const boundedStart = roundTiming(eventStart);
  const boundedEnd = roundTiming(eventEnd);
  let previousEnd = boundedStart;

  return words.map((word) => {
    const rawStart = finiteOr(word.startTime, previousEnd);
    const rawEnd = finiteOr(word.endTime, rawStart);
    let start = clampTiming(rawStart, boundedStart, boundedEnd);
    let end = clampTiming(rawEnd, start, boundedEnd);

    if (start < previousEnd) {
      start = previousEnd;
    }
    if (end < start) {
      end = start;
    }

    const roundedStart = roundTiming(start);
    const roundedEnd = Math.max(roundedStart, roundTiming(end));
    previousEnd = Math.min(boundedEnd, roundedEnd);
    return {
      ...word,
      startTime: roundedStart,
      endTime: previousEnd,
    };
  });
}

function needsBoundaryRepair(
  words: WordTiming[],
  eventStart: number,
  eventEnd: number
): boolean {
  let previousEnd = eventStart;
  for (const word of words) {
    const start = finiteOr(word.startTime, previousEnd);
    const end = finiteOr(word.endTime, start);
    if (
      start < eventStart
      || start > eventEnd
      || end < eventStart
      || end > eventEnd
      || end < start
      || start < previousEnd
    ) {
      return true;
    }
    previousEnd = end;
  }
  return false;
}

function scaleWordsToEvent(
  words: WordTiming[],
  oldStart: number,
  oldEnd: number,
  newStart: number,
  newEnd: number
): WordTiming[] {
  const oldDuration = Math.max(0.01, oldEnd - oldStart);
  if (!Number.isFinite(oldDuration) || oldDuration <= 0) {
    return words.map((word) => ({ ...word }));
  }

  const scale = (newEnd - newStart) / oldDuration;
  return words.map((word) => {
    const start = finiteOr(word.startTime, oldStart);
    const end = finiteOr(word.endTime, start);
    return {
      ...word,
      startTime: roundTiming(newStart + (start - oldStart) * scale),
      endTime: roundTiming(newStart + (end - oldStart) * scale),
    };
  });
}

function retimeWordsAtBoundaries(
  words: WordTiming[],
  oldStart: number,
  oldEnd: number,
  newStart: number,
  newEnd: number,
  startChanged: boolean,
  endChanged: boolean
): WordTiming[] {
  if (words.length === 0) {
    return words;
  }

  let updatedWords = words.map((word) => ({ ...word }));
  const lastIndex = updatedWords.length - 1;
  if (startChanged) {
    updatedWords[0].startTime = newStart;
  }
  if (endChanged) {
    updatedWords[lastIndex].endTime = newEnd;
  }

  if (startChanged && endChanged) {
    const oldDuration = oldEnd - oldStart;
    const shift = newStart - oldStart;
    const sameDuration = Math.abs((newEnd - newStart) - oldDuration) < 0.0005;
    if (Number.isFinite(oldDuration) && oldDuration > 0 && sameDuration) {
      updatedWords = words.map((word) => ({
        ...word,
        startTime: roundTiming(finiteOr(word.startTime, oldStart) + shift),
        endTime: roundTiming(finiteOr(word.endTime, finiteOr(word.startTime, oldStart)) + shift),
      }));
      updatedWords[0].startTime = newStart;
      updatedWords[lastIndex].endTime = newEnd;
    } else if (needsBoundaryRepair(updatedWords, newStart, newEnd)) {
      updatedWords = scaleWordsToEvent(words, oldStart, oldEnd, newStart, newEnd);
      if (updatedWords.length > 0) {
        updatedWords[0].startTime = newStart;
        updatedWords[lastIndex].endTime = newEnd;
      }
    }
  }

  return constrainWordTimings(updatedWords, newStart, newEnd);
}

/**
 * Helper to compute character count, CPS, and CPL metrics
 */
export function calculateMetrics(text: string, durationSeconds: number): { charCount: number; cps: number; cpl: number } {
  const charCount = text.length;
  const safeDuration = Math.max(0.1, durationSeconds);
  const cps = Number((charCount / safeDuration).toFixed(1));
  const lines = text.split('\n');
  const maxLineLen = lines.reduce((max, l) => Math.max(max, l.length), 0);
  return { charCount, cps, cpl: maxLineLen };
}

/**
 * Re-indexes all subtitle events sequentially starting from 1
 */
export function reindexEvents(events: SubtitleEvent[]): SubtitleEvent[] {
  return events.map((evt, idx) => ({
    ...evt,
    index: idx + 1,
  }));
}

/**
 * Split active subtitle into two events at the specified playhead timecode.
 * Divides word timings appropriately and scales boundaries.
 */
export function splitAtPlayhead(
  events: SubtitleEvent[],
  eventId: string,
  playheadTime: number
): SubtitleEvent[] {
  const targetIndex = events.findIndex((e) => e.id === eventId);
  if (targetIndex === -1) return events;

  const target = events[targetIndex];
  // Require playhead to be reasonably within the subtitle (at least 50ms from boundaries)
  if (playheadTime <= target.startTime + 0.05 || playheadTime >= target.endTime - 0.05) {
    return events;
  }

  let leftWords: WordTiming[] = [];
  let rightWords: WordTiming[] = [];
  let leftText = '';
  let rightText = '';

  if (target.words && target.words.length > 0) {
    target.words.forEach((w) => {
      const midPoint = (w.startTime + w.endTime) / 2;
      if (midPoint < playheadTime) {
        leftWords.push({
          ...w,
          endTime: Math.min(w.endTime, playheadTime),
        });
      } else {
        rightWords.push({
          ...w,
          startTime: Math.max(w.startTime, playheadTime),
        });
      }
    });

    leftText = leftWords.map((w) => w.word).join(' ').trim();
    rightText = rightWords.map((w) => w.word).join(' ').trim();
  }

  // Fallback if words array was empty or split produced empty side
  if (!leftText || !rightText) {
    const rawWords = target.text.trim().split(/\s+/);
    if (rawWords.length >= 2) {
      const ratio = (playheadTime - target.startTime) / (target.endTime - target.startTime);
      const splitIdx = Math.max(1, Math.min(rawWords.length - 1, Math.round(rawWords.length * ratio)));
      leftText = rawWords.slice(0, splitIdx).join(' ');
      rightText = rawWords.slice(splitIdx).join(' ');
    } else {
      leftText = target.text;
      rightText = '...';
    }
  }

  const leftMetrics = calculateMetrics(leftText, playheadTime - target.startTime);
  const rightMetrics = calculateMetrics(rightText, target.endTime - playheadTime);

  const leftEvent: SubtitleEvent = {
    ...target,
    id: `${target.id}_a_${Date.now()}`,
    startTime: target.startTime,
    endTime: playheadTime,
    text: leftText,
    words: leftWords.length > 0 ? leftWords : [],
    cps: leftMetrics.cps,
    cpl: leftMetrics.cpl,
  };

  const rightEvent: SubtitleEvent = {
    ...target,
    id: `${target.id}_b_${Date.now()}`,
    startTime: playheadTime,
    endTime: target.endTime,
    text: rightText,
    words: rightWords.length > 0 ? rightWords : [],
    cps: rightMetrics.cps,
    cpl: rightMetrics.cpl,
  };

  const nextEvents = [...events];
  nextEvents.splice(targetIndex, 1, leftEvent, rightEvent);
  return reindexEvents(nextEvents);
}

/**
 * Merge two adjacent subtitle events into one unified event.
 */
export function mergeSubtitles(
  events: SubtitleEvent[],
  firstId: string,
  secondId: string
): SubtitleEvent[] {
  const idx1 = events.findIndex((e) => e.id === firstId);
  const idx2 = events.findIndex((e) => e.id === secondId);
  if (idx1 === -1 || idx2 === -1 || idx1 === idx2) return events;

  const earlierIdx = Math.min(idx1, idx2);
  const laterIdx = Math.max(idx1, idx2);

  const e1 = events[earlierIdx];
  const e2 = events[laterIdx];

  const mergedText = `${e1.text.trim()} ${e2.text.trim()}`;
  const mergedStartTime = Math.min(e1.startTime, e2.startTime);
  const mergedEndTime = Math.max(e1.endTime, e2.endTime);

  const mergedWords: WordTiming[] = [
    ...(e1.words || []),
    ...(e2.words || []),
  ].sort((a, b) => a.startTime - b.startTime);

  const metrics = calculateMetrics(mergedText, mergedEndTime - mergedStartTime);

  const mergedEvent: SubtitleEvent = {
    ...e1,
    id: `merged_${e1.id}_${Date.now()}`,
    startTime: mergedStartTime,
    endTime: mergedEndTime,
    text: mergedText,
     words: mergedWords.length > 0 ? mergedWords : [],
     wordTimingState:
       e1.wordTimingState === 'stale' ||
       e1.wordTimingState === 'legacy-unverified' ||
       e2.wordTimingState === 'stale' ||
       e2.wordTimingState === 'legacy-unverified'
         ? e1.wordTimingState === 'legacy-unverified' || e2.wordTimingState === 'legacy-unverified'
           ? 'legacy-unverified' as const
           : 'stale' as const
         : e1.wordTimingState || 'fresh',
     cps: metrics.cps,
    cpl: metrics.cpl,
  };

  const nextEvents = [...events];
  nextEvents.splice(laterIdx, 1);
  nextEvents.splice(earlierIdx, 1, mergedEvent);
  return reindexEvents(nextEvents);
}

/**
 * Insert a new subtitle event after the specified event or at given time
 */
export function insertSubtitle(
  events: SubtitleEvent[],
  afterId: string | null,
  startTime?: number,
  duration: number = 2.0,
  text: string = 'New subtitle'
): SubtitleEvent[] {
  let insertIndex = events.length;
  let computedStart = startTime ?? 0;

  if (afterId) {
    const idx = events.findIndex((e) => e.id === afterId);
    if (idx !== -1) {
      insertIndex = idx + 1;
      if (startTime === undefined) {
        computedStart = Number((events[idx].endTime + 0.1).toFixed(2));
      }
    }
  }

  const computedEnd = Number((computedStart + duration).toFixed(2));
  const metrics = calculateMetrics(text, duration);

  const newEvent: SubtitleEvent = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    index: insertIndex + 1,
    startTime: computedStart,
    endTime: computedEnd,
    text,
    words: [],
    cps: metrics.cps,
    cpl: metrics.cpl,
  };

  const nextEvents = [...events];
  nextEvents.splice(insertIndex, 0, newEvent);
  return reindexEvents(nextEvents);
}

/**
 * Duplicate a subtitle event and position it immediately following
 */
export function duplicateSubtitle(
  events: SubtitleEvent[],
  eventId: string
): SubtitleEvent[] {
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx === -1) return events;

  const target = events[idx];
  const duration = target.endTime - target.startTime;
  const newStart = Number((target.endTime + 0.1).toFixed(2));
  const newEnd = Number((newStart + duration).toFixed(2));
  const offset = newStart - target.startTime;

  const duplicatedWords = (target.words || []).map((w) => ({
    ...w,
    id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    startTime: Number((w.startTime + offset).toFixed(2)),
    endTime: Number((w.endTime + offset).toFixed(2)),
  }));

  const duplicatedEvent: SubtitleEvent = {
    ...target,
    id: `dup_${target.id}_${Date.now()}`,
    startTime: newStart,
    endTime: newEnd,
    words: duplicatedWords,
  };

  const nextEvents = [...events];
  nextEvents.splice(idx + 1, 0, duplicatedEvent);
  return reindexEvents(nextEvents);
}

/**
 * Delete a subtitle event by ID
 */
export function deleteSubtitle(
  events: SubtitleEvent[],
  eventId: string
): SubtitleEvent[] {
  const nextEvents = events.filter((e) => e.id !== eventId);
  return reindexEvents(nextEvents);
}

/**
 * Update the text of a subtitle event and recalculate metrics
 */
export function updateSubtitleText(
  events: SubtitleEvent[],
  eventId: string,
  newText: string
): SubtitleEvent[] {
  return events.map((e) => {
    if (e.id !== eventId) return e;
    const duration = e.endTime - e.startTime;
    const metrics = calculateMetrics(newText, duration);
    const textChanged = newText !== e.text;
    const mappedWords = textChanged && e.wordTimingState !== 'stale' && e.wordTimingState !== 'legacy-unverified'
      ? mapWordsToTextIfSafe(e, newText)
      : null;
    const wordTimingState = getWordTimingState(e, newText, mappedWords);
    return {
      ...e,
      text: newText,
      ...(mappedWords ? { words: mappedWords } : {}),
      ...(wordTimingState ? { wordTimingState } : {}),
      cps: metrics.cps,
      cpl: metrics.cpl,
    };
  });
}

/**
 * Update start and end timings of a subtitle event with boundary edits by default
 */
export function updateSubtitleTiming(
  events: SubtitleEvent[],
  eventId: string,
  newStartTime: number,
  newEndTime: number,
  options?: UpdateSubtitleTimingOptions | boolean
): SubtitleEvent[] {
  if (
    !Number.isFinite(newStartTime)
    || !Number.isFinite(newEndTime)
    || newStartTime >= newEndTime
  ) {
    return events;
  }

  const roundedStart = roundTiming(newStartTime);
  const roundedEnd = roundTiming(newEndTime);
  if (!Number.isFinite(newEndTime - newStartTime) || roundedStart >= roundedEnd) {
    return events;
  }
  const useProportionalTiming = shouldUseProportionalTiming(options);

  return events.map((e) => {
    if (e.id !== eventId) return e;

    const oldStart = e.startTime;
    const oldEnd = e.endTime;
    const newDuration = newEndTime - newStartTime;
    const startChanged = newStartTime !== oldStart;
    const endChanged = newEndTime !== oldEnd;
    const words = e.words || [];
    const updatedWords = useProportionalTiming
      ? constrainWordTimings(
        scaleWordsToEvent(words, oldStart, oldEnd, roundedStart, roundedEnd),
        roundedStart,
        roundedEnd
      )
      : retimeWordsAtBoundaries(
        words,
        oldStart,
        oldEnd,
        roundedStart,
        roundedEnd,
        startChanged,
        endChanged
      );

    const metrics = calculateMetrics(e.text, newDuration);
    return {
      ...e,
      startTime: roundedStart,
      endTime: roundedEnd,
      words: updatedWords,
      cps: metrics.cps,
      cpl: metrics.cpl,
    };
  });
}

/**
 * Search and replace text across all subtitle events with options
 */
export function searchAndReplace(
  events: SubtitleEvent[],
  searchPattern: string,
  replacement: string,
  options?: SearchReplaceOptions
): { events: SubtitleEvent[]; replacedCount: number } {
  if (!searchPattern) {
    return { events, replacedCount: 0 };
  }

  let regex: RegExp;
  try {
    let pattern = options?.useRegex ? searchPattern : searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (options?.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    const flags = options?.matchCase ? 'g' : 'gi';
    regex = new RegExp(pattern, flags);
  } catch {
    return { events, replacedCount: 0 };
  }

  let replacedCount = 0;
  const updatedEvents = events.map((e) => {
    if (!regex.test(e.text)) {
      return e;
    }
    // Count matches in this event
    const matches = e.text.match(regex);
    if (matches) {
      replacedCount += matches.length;
    }
    const nextText = e.text.replace(regex, replacement);
    const duration = e.endTime - e.startTime;
    const metrics = calculateMetrics(nextText, duration);
    const textChanged = nextText !== e.text;
    const mappedWords = textChanged && e.wordTimingState !== 'stale' && e.wordTimingState !== 'legacy-unverified'
      ? mapWordsToTextIfSafe(e, nextText)
      : null;
    const wordTimingState = getWordTimingState(e, nextText, mappedWords);

    return {
      ...e,
      text: nextText,
      ...(mappedWords ? { words: mappedWords } : {}),
      ...(wordTimingState ? { wordTimingState } : {}),
      cps: metrics.cps,
      cpl: metrics.cpl,
    };
  });

  return { events: updatedEvents, replacedCount };
}
