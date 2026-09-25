import { SubtitleEvent, WordTiming } from '../types/models.js';

export interface SubtitleTimingContext {
  outputOriginSeconds?: number;
  globalSubtitleOffsetMs?: number;
}

export function resolveSubtitleTimelineOffset(
  workingAudioOriginSeconds?: number,
  outputOriginSeconds?: number
): number {
  const candidate = workingAudioOriginSeconds !== undefined
    ? workingAudioOriginSeconds
    : outputOriginSeconds;
  return candidate !== undefined && Number.isFinite(candidate) ? candidate : 0;
}

export function mapSubtitleTime(
  seconds: number,
  context: SubtitleTimingContext = {}
): number {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  const origin = context.outputOriginSeconds !== undefined && Number.isFinite(context.outputOriginSeconds)
    ? context.outputOriginSeconds
    : 0;
  const offset = context.globalSubtitleOffsetMs !== undefined && Number.isFinite(context.globalSubtitleOffsetMs)
    ? context.globalSubtitleOffsetMs / 1000
    : 0;
  return Math.max(0, safeSeconds + origin + offset);
}

export function mapWordTiming(
  word: WordTiming,
  context: SubtitleTimingContext = {}
): WordTiming {
  return {
    ...word,
    startTime: mapSubtitleTime(word.startTime, context),
    endTime: mapSubtitleTime(word.endTime, context),
  };
}

export function mapSubtitleEvent(
  event: SubtitleEvent,
  context: SubtitleTimingContext = {}
): SubtitleEvent {
  const startTime = mapSubtitleTime(event.startTime, context);
  const endTime = Math.max(startTime, mapSubtitleTime(event.endTime, context));
  return {
    ...event,
    startTime,
    endTime,
    words: event.words.map((word) => {
      const mapped = mapWordTiming(word, context);
      return {
        ...mapped,
        startTime: Math.max(startTime, mapped.startTime),
        endTime: Math.max(mapped.startTime, Math.min(endTime, mapped.endTime)),
      };
    }),
  };
}

export function mapSubtitleEvents(
  events: SubtitleEvent[],
  context: SubtitleTimingContext = {}
): SubtitleEvent[] {
  return events
    .map((event) => mapSubtitleEvent(event, context))
    .sort((a, b) => a.startTime - b.startTime);
}

export function findActiveSubtitleEvent(
  events: SubtitleEvent[],
  currentTime: number
): SubtitleEvent | null {
  if (events.length === 0) return null;

  let low = 0;
  let high = events.length - 1;
  let candidateIndex = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (events[mid].startTime <= currentTime) {
      candidateIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (candidateIndex < 0) return null;
  const candidate = events[candidateIndex];
  if (currentTime < candidate.endTime) {
    return candidate;
  }

  for (let index = candidateIndex - 1; index >= 0; index--) {
    const event = events[index];
    if (event.endTime <= currentTime) break;
    if (currentTime >= event.startTime && currentTime < event.endTime) {
      return event;
    }
  }

  return Math.abs(candidate.endTime - currentTime) <= 0.0005 ? candidate : null;
}
