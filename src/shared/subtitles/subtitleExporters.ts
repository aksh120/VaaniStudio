/**
 * Subtitle File Exporters (SRT, WebVTT, ASS)
 * Phase 9: TASK-043
 *
 * Implements standards-compliant subtitle file generators with precise millisecond timestamps,
 * robust multi-script UTF-8 handling (Devanagari, Roman, symbols), and clean formatting.
 */

import { SubtitleEvent, SubtitleStyle } from '../types/models.js';
import { generateAssScript, AssScriptOptions } from './assScriptGenerator.js';
import { mapSubtitleEvents, SubtitleTimingContext } from './timing.js';

export interface ExporterOptions {
  lineEnding?: 'crlf' | 'lf';
  includeHeaderNotes?: boolean;
  includeSpeakerLabels?: boolean;
  languageTag?: string;
  timing?: SubtitleTimingContext;
}

/**
 * Format timestamp into SubRip format: HH:MM:SS,mmm
 */
export function formatSrtTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const totalMillis = Math.round(safe * 1000);
  const hours = Math.floor(totalMillis / 3600000);
  const minutes = Math.floor((totalMillis % 3600000) / 60000);
  const secs = Math.floor((totalMillis % 60000) / 1000);
  const millis = totalMillis % 1000;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');
  const msStr = String(millis).padStart(3, '0');

  return `${hStr}:${mStr}:${sStr},${msStr}`;
}

/**
 * Format timestamp into WebVTT format: HH:MM:SS.mmm
 */
export function formatVttTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const totalMillis = Math.round(safe * 1000);
  const hours = Math.floor(totalMillis / 3600000);
  const minutes = Math.floor((totalMillis % 3600000) / 60000);
  const secs = Math.floor((totalMillis % 60000) / 1000);
  const millis = totalMillis % 1000;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');
  const msStr = String(millis).padStart(3, '0');

  return `${hStr}:${mStr}:${sStr}.${msStr}`;
}

/**
 * Export subtitle events to SubRip (.srt) format
 */
export function exportToSrt(
  events: SubtitleEvent[],
  options: ExporterOptions = {}
): string {
  const eol = options.lineEnding === 'crlf' ? '\r\n' : '\n';
  const sorted = mapSubtitleEvents(events, options.timing);

  const blocks: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const index = i + 1;
    const startStr = formatSrtTimestamp(ev.startTime);
    const endStr = formatSrtTimestamp(ev.endTime);
    let text = (ev.text || '').trim();

    if (options.includeSpeakerLabels && ev.speakerLabel) {
      text = `[${ev.speakerLabel}]: ${text}`;
    }

    blocks.push(`${index}${eol}${startStr} --> ${endStr}${eol}${text}`);
  }

  return blocks.join(`${eol}${eol}`) + (blocks.length > 0 ? eol : '');
}

/**
 * Export subtitle events to WebVTT (.vtt) format
 */
export function exportToVtt(
  events: SubtitleEvent[],
  options: ExporterOptions = {}
): string {
  const eol = options.lineEnding === 'crlf' ? '\r\n' : '\n';
  const sorted = mapSubtitleEvents(events, options.timing);

  const header = ['WEBVTT'];
  if (options.includeHeaderNotes !== false) {
    header.push('Kind: captions');
    if (options.languageTag) {
      header.push(`Language: ${options.languageTag}`);
    }
  }

  const cues: string[] = [header.join(eol)];

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const index = i + 1;
    const startStr = formatVttTimestamp(ev.startTime);
    const endStr = formatVttTimestamp(ev.endTime);
    let text = (ev.text || '').trim();

    if (options.includeSpeakerLabels && ev.speakerLabel) {
      text = `<v ${ev.speakerLabel}>${text}</v>`;
    }

    cues.push(`${index}${eol}${startStr} --> ${endStr}${eol}${text}`);
  }

  return cues.join(`${eol}${eol}`) + (cues.length > 0 ? eol : '');
}

/**
 * Export subtitle events to Advanced SubStation Alpha (.ass) format with full styling and karaoke
 */
export function exportToAss(
  events: SubtitleEvent[],
  style: SubtitleStyle,
  options?: AssScriptOptions
): string {
  return generateAssScript(events, style, options);
}
