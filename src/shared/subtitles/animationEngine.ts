/**
 * Kinetic Typography, Highlighting, and Animation Engine
 * Phase 8: TASK-040, TASK-041, TASK-042
 *
 * Provides real-time timing interpolation, active word tracking,
 * entrance/exit easing math, ASS karaoke tag compilation, and fallback mechanisms.
 */

import {
  WordTiming,
  SubtitleEvent,
  AnimationConfig,
  AnimationType,
  KaraokeHighlightMode,
} from '../types/models.js';
import { getWordDisplayText } from './wordAlignment.js';

export type WordHighlightState = 'future' | 'active' | 'past';

export interface ActiveWordTimingResult {
  activeIndex: number; // -1 if before first word
  activeWord: WordTiming | null;
  progress: number; // 0.0 to 1.0 within the active word, 1.0 if past, 0.0 if future
  isGap: boolean; // True if in an inter-word pause or pre/post gap
  state: WordHighlightState;
}

export interface TransitionState {
  opacity: number; // 0.0 to 1.0
  scale: number; // e.g. 0.5 to 1.0
  translateY: number; // px offset (positive = downwards, negative = upwards)
  isVisible: boolean;
  phase: 'entrance' | 'display' | 'exit' | 'hidden';
}

/**
 * Standard Easing Functions for GPU-accelerated 60 FPS transitions
 */
export function easeOutQuad(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - (1 - clamped) * (1 - clamped);
}

export function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

export function easeOutBack(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
}

/**
 * Determine the highlight state of a single word timing at a given media playback time
 */
export function getWordHighlightState(word: WordTiming, currentTime: number): WordHighlightState {
  if (currentTime < word.startTime) {
    return 'future';
  }
  if (currentTime > word.endTime) {
    return 'past';
  }
  return 'active';
}

/**
 * Active Word Timing Engine
 * Accurately determines the active word index, interpolation progress (0.0 - 1.0),
 * and handles inter-word gaps gracefully.
 */
export function getActiveWordTiming(
  words: WordTiming[] | undefined | null,
  currentTime: number
): ActiveWordTimingResult {
  if (!words || words.length === 0) {
    return {
      activeIndex: -1,
      activeWord: null,
      progress: 0,
      isGap: false,
      state: 'future',
    };
  }

  // If time is before the first word
  if (currentTime < words[0].startTime) {
    return {
      activeIndex: -1,
      activeWord: null,
      progress: 0,
      isGap: true,
      state: 'future',
    };
  }

  // Search through words
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Inside current word
    if (currentTime >= word.startTime && currentTime <= word.endTime) {
      const duration = Math.max(0.001, word.endTime - word.startTime);
      const progress = Math.max(0, Math.min(1, (currentTime - word.startTime) / duration));
      return {
        activeIndex: i,
        activeWord: word,
        progress,
        isGap: false,
        state: 'active',
      };
    }

    // In a gap between this word and the next
    if (i < words.length - 1) {
      const nextWord = words[i + 1];
      if (currentTime > word.endTime && currentTime < nextWord.startTime) {
        return {
          activeIndex: i,
          activeWord: word,
          progress: 1,
          isGap: true,
          state: 'past',
        };
      }
    }
  }

  // After the last word
  const lastWord = words[words.length - 1];
  if (currentTime > lastWord.endTime) {
    return {
      activeIndex: words.length - 1,
      activeWord: lastWord,
      progress: 1,
      isGap: true,
      state: 'past',
    };
  }

  return {
    activeIndex: -1,
    activeWord: null,
    progress: 0,
    isGap: false,
    state: 'future',
  };
}

/**
 * Calculate Entrance, Display, and Exit transition states for a subtitle event
 * Supports 'pop', 'fade', 'slide-up', 'bounce', and 'none'
 */
export function synchronizeWordTimingsToEvent(
  event: Pick<SubtitleEvent, 'startTime' | 'endTime' | 'words'>
): WordTiming[] {
  const words = event.words || [];
  if (words.length === 0) {
    return [];
  }

  const eventDuration = Math.max(0.01, event.endTime - event.startTime);
  const firstStart = Math.min(...words.map((word) => word.startTime));
  const lastEnd = Math.max(...words.map((word) => word.endTime));
  const wordSpan = Math.max(0, lastEnd - firstStart);
  const wordsBeforeEvent = lastEnd <= event.startTime + 0.02;
  const wordsAfterEvent = firstStart >= event.endTime - 0.02;
  const degenerateTiming = wordSpan <= 0.001;

  if (!wordsBeforeEvent && !wordsAfterEvent && !degenerateTiming) {
    return words;
  }

  const sourceSpan = degenerateTiming ? 1 : wordSpan;
  return words.map((word) => {
    const relativeStart = (word.startTime - firstStart) / sourceSpan;
    const relativeEnd = (word.endTime - firstStart) / sourceSpan;
    const startTime = event.startTime + relativeStart * eventDuration;
    const endTime = event.startTime + relativeEnd * eventDuration;
    return {
      ...word,
      startTime,
      endTime: Math.max(startTime + 0.01, endTime),
    };
  });
}

export function getWordHighlightStates(
  words: WordTiming[] | undefined | null,
  currentTime: number
): WordHighlightState[] {
  if (!words || words.length === 0) {
    return [];
  }

  const timing = getActiveWordTiming(words, currentTime);
  if (timing.activeIndex < 0) {
    return words.map(() => 'future' as const);
  }

  if (timing.isGap) {
    const lastWord = words[words.length - 1];
    if (currentTime > lastWord.endTime) {
      return words.map(() => 'past' as const);
    }
    return words.map((_, index) => (index <= timing.activeIndex ? 'past' as const : 'future' as const));
  }

  return words.map((_, index) => {
    if (index < timing.activeIndex) return 'past' as const;
    if (index === timing.activeIndex) return 'active' as const;
    return 'future' as const;
  });
}

export function calculateTransitionState(
  currentTime: number,
  startTime: number,
  endTime: number,
  config: Partial<AnimationConfig> = {}
): TransitionState {
  if (currentTime < startTime || currentTime > endTime) {
    return {
      opacity: 0,
      scale: 1,
      translateY: 0,
      isVisible: false,
      phase: 'hidden',
    };
  }

  const duration = endTime - startTime;
  if (duration <= 0) {
    return {
      opacity: 0,
      scale: 1,
      translateY: 0,
      isVisible: false,
      phase: 'hidden',
    };
  }

  const animDurationSec = (config.durationMs ?? 150) / 1000;
  // Ensure transition duration does not exceed half the total duration
  const safeAnimSec = Math.min(animDurationSec, duration / 2);

  const entranceType: AnimationType = config.entrance ?? 'pop';
  const exitType: AnimationType = config.exit ?? 'fade';

  // Check Entrance Phase
  if (safeAnimSec > 0 && currentTime < startTime + safeAnimSec && entranceType !== 'none') {
    const rawT = (currentTime - startTime) / safeAnimSec;

    switch (entranceType) {
      case 'fade': {
        const t = easeOutQuad(rawT);
        return {
          opacity: t,
          scale: 1,
          translateY: 0,
          isVisible: true,
          phase: 'entrance',
        };
      }
      case 'pop': {
        const t = easeOutBack(rawT);
        return {
          opacity: Math.min(1, rawT * 2.5),
          scale: 0.5 + 0.5 * t,
          translateY: 0,
          isVisible: true,
          phase: 'entrance',
        };
      }
      case 'slide-up': {
        const t = easeOutCubic(rawT);
        return {
          opacity: t,
          scale: 1,
          translateY: (1 - t) * 24, // Slide up from +24px
          isVisible: true,
          phase: 'entrance',
        };
      }
      case 'bounce': {
        const t = easeOutBack(rawT);
        return {
          opacity: Math.min(1, rawT * 2),
          scale: 0.7 + 0.3 * t,
          translateY: (1 - easeOutQuad(rawT)) * 16,
          isVisible: true,
          phase: 'entrance',
        };
      }
      default:
        break;
    }
  }

  // Check Exit Phase
  if (safeAnimSec > 0 && currentTime > endTime - safeAnimSec && exitType !== 'none') {
    const rawT = (currentTime - (endTime - safeAnimSec)) / safeAnimSec;

    switch (exitType) {
      case 'fade': {
        const t = 1 - easeOutQuad(rawT);
        return {
          opacity: Math.max(0, t),
          scale: 1,
          translateY: 0,
          isVisible: true,
          phase: 'exit',
        };
      }
      case 'pop': {
        const t = Math.max(0, 1 - rawT);
        return {
          opacity: t,
          scale: 1 - 0.25 * rawT,
          translateY: 0,
          isVisible: true,
          phase: 'exit',
        };
      }
      case 'slide-up': {
        const t = Math.max(0, 1 - easeOutQuad(rawT));
        return {
          opacity: t,
          scale: 1,
          translateY: -rawT * 20, // Continues sliding upward
          isVisible: true,
          phase: 'exit',
        };
      }
      case 'bounce': {
        const t = Math.max(0, 1 - rawT);
        return {
          opacity: t,
          scale: 1 - 0.3 * rawT,
          translateY: rawT * 12,
          isVisible: true,
          phase: 'exit',
        };
      }
      default:
        break;
    }
  }

  // Steady Display Phase
  return {
    opacity: 1,
    scale: 1,
    translateY: 0,
    isVisible: true,
    phase: 'display',
  };
}

/**
 * Format timestamp in seconds to ASS timestamp H:MM:SS.cs (centiseconds)
 */
export function formatAssTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const totalCentiseconds = Math.round(safeSeconds * 100);
  const hours = Math.floor(totalCentiseconds / 360000);
  const minutes = Math.floor((totalCentiseconds % 360000) / 6000);
  const secs = Math.floor((totalCentiseconds % 6000) / 100);
  const centis = totalCentiseconds % 100;

  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');
  const csStr = String(centis).padStart(2, '0');

  return `${hours}:${mStr}:${sStr}.${csStr}`;
}

export function compileAssTransitionTags(
  config?: Partial<AnimationConfig>,
  phase: 'both' | 'entrance-only' | 'exit-only' | 'none' = 'both'
): string {
  if (!config || phase === 'none') return '';

  const durationMs = Math.max(0, Math.round(config.durationMs ?? 150));
  const entrance = config.entrance ?? 'none';
  const exit = config.exit ?? 'none';

  const tags: string[] = [];
  const allowEntrance = phase === 'both' || phase === 'entrance-only';
  const allowExit = phase === 'both' || phase === 'exit-only';

  // Fades
  const inFade = allowEntrance && entrance === 'fade' ? durationMs : 0;
  const outFade = allowExit && exit === 'fade' ? durationMs : 0;
  if (inFade > 0 || outFade > 0) {
    tags.push(`\\fad(${inFade},${outFade})`);
  }

  // Scale Pop
  if (allowEntrance && entrance === 'pop' && durationMs > 0) {
    tags.push(`\\fscx50\\fscy50\\t(0,${durationMs},\\fscx100\\fscy100)`);
  }

  if (tags.length === 0) return '';
  return `{${tags.join('')}}`;
}

/**
 * Compile dialogue text with word-level ASS karaoke tags (\\k or \\kf)
 * If words are missing or empty, cleanly falls back to plain event text.
 */
export function compileAssKaraokeText(
  event: Pick<SubtitleEvent, 'startTime' | 'endTime' | 'text' | 'words' | 'wordTimingState'>,
  karaokeMode: KaraokeHighlightMode = 'step'
): string {
  if (
    !event.words ||
    event.words.length === 0 ||
    event.wordTimingState === 'stale' ||
    event.wordTimingState === 'legacy-unverified'
  ) {
    return event.text || '';
  }

  const words = synchronizeWordTimingsToEvent(event);
  const tagPrefix = karaokeMode === 'sweep' ? '\\kf' : '\\k';
  const parts: string[] = [];

  // Pre-gap: silence before first word
  const firstWord = words[0];
  const preGapCs = Math.round((firstWord.startTime - event.startTime) * 100);
  if (preGapCs > 0) {
    parts.push(`{\\k${preGapCs}}`);
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const durCs = Math.max(1, Math.round((w.endTime - w.startTime) * 100));
    const wordText = getWordDisplayText(w);

    parts.push(`{${tagPrefix}${durCs}}${wordText}`);

    // Inter-word gap
    if (i < words.length - 1) {
      const nextW = words[i + 1];
      const gapCs = Math.round((nextW.startTime - w.endTime) * 100);
      if (gapCs > 0) {
        parts.push(` {\\k${gapCs}}`);
      } else {
        parts.push(' ');
      }
    }
  }

  // Post-gap: silence after last word
  const lastWord = words[words.length - 1];
  const postGapCs = Math.round((event.endTime - lastWord.endTime) * 100);
  if (postGapCs > 0) {
    parts.push(`{\\k${postGapCs}}`);
  }

  return parts.join('');
}

/**
 * Compile a complete ASS Dialogue line for a subtitle event
 */
export function compileAssDialogueLine(
  event: SubtitleEvent,
  styleName: string = 'Default',
  config?: Partial<AnimationConfig>
): string {
  const startAss = formatAssTimestamp(event.startTime);
  const endAss = formatAssTimestamp(event.endTime);
  const transitionTags = compileAssTransitionTags(config);
  const karaokeText = compileAssKaraokeText(event, config?.karaokeMode ?? 'step');

  return `Dialogue: 0,${startAss},${endAss},${styleName},,0,0,0,,${transitionTags}${karaokeText}`;
}
