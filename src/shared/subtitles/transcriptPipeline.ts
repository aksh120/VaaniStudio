import { ASRSegment, SubtitleEvent } from '../types/models.js';
import { cleanAndAlignWords, getWordDisplayText } from './wordAlignment.js';
import { segmentWordsIntoSubtitles, SegmentationOptions } from './segmenter.js';

export interface TranscriptPipelineOptions extends SegmentationOptions {
  maxCharactersPerLine?: number;
  maxLinesPerSubtitle?: number;
  timeOffsetSeconds?: number;
  preserveSegmentText?: boolean;
}

function clampWordToSegment(
  word: ASRSegment['words'][number],
  segment: ASRSegment
): { word: string; start: number; end: number; probability: number } {
  const segmentStart = Number.isFinite(segment.startTime) ? segment.startTime : 0;
  const segmentEnd = Number.isFinite(segment.endTime)
    ? Math.max(segmentStart, segment.endTime)
    : segmentStart;
  const rawStart = Number.isFinite(word.startTime) ? word.startTime : segmentStart;
  const rawEnd = Number.isFinite(word.endTime) ? word.endTime : rawStart;
  const start = Math.min(segmentEnd, Math.max(segmentStart, rawStart));
  const end = Math.min(segmentEnd, Math.max(start, rawEnd));
  return {
    word: word.word,
    start,
    end,
    probability: Number.isFinite(word.confidence) ? word.confidence : 0.9,
  };
}

function normalizeSegmentWordTimings(
  words: ASRSegment['words'],
  segment: ASRSegment
): ASRSegment['words'] {
  const segmentStart = Number.isFinite(segment.startTime) ? segment.startTime : 0;
  const segmentEnd = Number.isFinite(segment.endTime)
    ? Math.max(segmentStart, segment.endTime)
    : segmentStart;
  const validTimes = words
    .map((word) => ({ start: word.startTime, end: word.endTime }))
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end));
  if (validTimes.length === 0 || segmentStart <= 0.25) {
    return words;
  }

  const firstStart = Math.min(...validTimes.map(({ start }) => start));
  const lastEnd = Math.max(...validTimes.map(({ end }) => end));
  const segmentDuration = segmentEnd - segmentStart;
  const looksSegmentRelative =
    firstStart < segmentStart - 0.1 &&
    lastEnd < segmentStart + 0.05 &&
    lastEnd - firstStart <= segmentDuration + 0.25;

  if (!looksSegmentRelative) {
    return words;
  }

  return words.map((word) => ({
    ...word,
    startTime: word.startTime + segmentStart,
    endTime: word.endTime + segmentStart,
  }));
}

function withSegmentBounds(event: SubtitleEvent, segment: ASRSegment): SubtitleEvent {
  const startTime = Math.max(segment.startTime, Math.min(segment.endTime, event.startTime));
  const endTime = Math.max(startTime, Math.min(segment.endTime, event.endTime));
  const words = event.words.map((word) => ({
    ...word,
    startTime: Math.max(startTime, Math.min(endTime, word.startTime)),
    endTime: Math.max(startTime, Math.min(endTime, word.endTime)),
  }));
  const duration = Math.max(0.1, endTime - startTime);
  const text = event.text;
  return {
    ...event,
    startTime,
    endTime,
    words,
    cps: text.length > 0 ? Math.round((text.length / duration) * 10) / 10 : 0,
    cpl: Math.max(...text.split('\n').map((line) => line.length), 0),
  };
}

function shiftEvent(event: SubtitleEvent, offsetSeconds: number): SubtitleEvent {
  if (!offsetSeconds) return event;
  const shift = (value: number): number => Math.max(0, value + offsetSeconds);
  return {
    ...event,
    startTime: shift(event.startTime),
    endTime: shift(event.endTime),
    words: event.words.map((word) => ({
      ...word,
      startTime: shift(word.startTime),
      endTime: shift(word.endTime),
    })),
  };
}

function segmentToEvents(
  segment: ASRSegment,
  options: TranscriptPipelineOptions
): SubtitleEvent[] {
  const text = segment.text.trim();
  const segmentWords = normalizeSegmentWordTimings(segment.words || [], segment);
  const rawWords = segmentWords.map((word) => clampWordToSegment(word, segment));
  const alignedWords = cleanAndAlignWords(rawWords);
  if (options.preserveSegmentText) {
    if (!text) return [];
    const segmentStart = Number.isFinite(segment.startTime) ? segment.startTime : 0;
    const segmentEnd = Number.isFinite(segment.endTime)
      ? Math.max(segmentStart, segment.endTime)
      : segmentStart + 0.1;
    const wordText = alignedWords.map((word) => getWordDisplayText(word)).join(' ').replace(/\s+/g, ' ').trim();
    return [
      shiftEvent(
        withSegmentBounds(
          {
            id: segment.id || `sub-${segment.startTime}`,
            index: 1,
            startTime: segmentStart,
            endTime: segmentEnd,
            text,
            words: alignedWords,
            wordTimingState: wordText === text.replace(/\s+/g, ' ').trim() ? 'fresh' : 'stale',
          },
          segment
        ),
        options.timeOffsetSeconds || 0
      ),
    ];
  }

  if (alignedWords.length > 0) {
    return segmentWordsIntoSubtitles(alignedWords, options).map((event) => {
      const boundedEvent = withSegmentBounds(event, segment);
      const wordText = boundedEvent.words.map((word) => getWordDisplayText(word)).join(' ');
      const normalizedWordText = wordText.replace(/\s+/g, ' ').trim();
      const normalizedSegmentText = boundedEvent.text.replace(/\s+/g, ' ').trim();
      return shiftEvent(
        {
          ...boundedEvent,
          wordTimingState:
            normalizedWordText === normalizedSegmentText ? 'fresh' as const : 'stale' as const,
        },
        options.timeOffsetSeconds || 0
      );
    });
  }

  if (!text) {
    return [];
  }

  const startTime = Number.isFinite(segment.startTime) ? segment.startTime : 0;
  const endTime = Math.max(
    startTime + 0.1,
    Number.isFinite(segment.endTime) ? segment.endTime : startTime + 0.1
  );
  return [
    shiftEvent(
      {
        id: segment.id || `sub-${segment.startTime}`,
        index: 1,
        startTime,
        endTime,
        text,
        words: [],
        cps: Math.round((text.length / Math.max(0.1, endTime - startTime)) * 10) / 10,
        cpl: Math.max(...text.split('\n').map((line) => line.length), 0),
        wordTimingState: 'stale',
      },
      options.timeOffsetSeconds || 0
    ),
  ];
}

export function buildSubtitleEvents(
  segments: ASRSegment[],
  options: TranscriptPipelineOptions = {}
): SubtitleEvent[] {
  const events: SubtitleEvent[] = [];
  for (const segment of segments || []) {
    events.push(...segmentToEvents(segment, options));
  }

  return events.map((event, index) => ({
    ...event,
    id: `sub-${index + 1}`,
    index: index + 1,
    words: event.words.map((word, wordIndex) => ({
      ...word,
      id: `sub-${index + 1}-w-${wordIndex + 1}`,
    })),
  }));
}
