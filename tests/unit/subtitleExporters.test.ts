import { describe, it, expect } from 'vitest';
import {
  formatSrtTimestamp,
  formatVttTimestamp,
  exportToSrt,
  exportToVtt,
  exportToAss,
} from '../../src/shared/subtitles/subtitleExporters.js';
import { generateAssScript } from '../../src/shared/subtitles/assScriptGenerator.js';
import { SubtitleEvent, SubtitleStyle } from '../../src/shared/types/models.js';

describe('Subtitle File Exporters (Phase 9: TASK-043, TASK-044)', () => {
  const mockEvents: SubtitleEvent[] = [
    {
      id: 'evt-1',
      index: 1,
      startTime: 1.25,
      endTime: 3.5,
      text: 'Hello world, welcome to Vaani Studio!',
      words: [
        { id: 'w1', word: 'Hello', startTime: 1.25, endTime: 1.6, confidence: 0.95 },
        { id: 'w2', word: 'world,', startTime: 1.65, endTime: 2.1, confidence: 0.96 },
        { id: 'w3', word: 'welcome', startTime: 2.15, endTime: 2.55, confidence: 0.92 },
        { id: 'w4', word: 'to', startTime: 2.6, endTime: 2.75, confidence: 0.98 },
        { id: 'w5', word: 'Vaani', startTime: 2.8, endTime: 3.15, confidence: 0.99 },
        { id: 'w6', word: 'Studio!', startTime: 3.2, endTime: 3.5, confidence: 0.97 },
      ],
    },
    {
      id: 'evt-2',
      index: 2,
      startTime: 4.0,
      endTime: 6.2,
      text: 'नमस्ते दोस्तों, यह दूसरा वाक्य है।',
      words: [
        { id: 'w7', word: 'नमस्ते', startTime: 4.0, endTime: 4.6, confidence: 0.94 },
        { id: 'w8', word: 'दोस्तों,', startTime: 4.7, endTime: 5.2, confidence: 0.91 },
        { id: 'w9', word: 'यह', startTime: 5.3, endTime: 5.5, confidence: 0.95 },
        { id: 'w10', word: 'दूसरा', startTime: 5.55, endTime: 5.85, confidence: 0.93 },
        { id: 'w11', word: 'वाक्य', startTime: 5.9, endTime: 6.1, confidence: 0.96 },
        { id: 'w12', word: 'है।', startTime: 6.12, endTime: 6.2, confidence: 0.98 },
      ],
    },
  ];

  const mockStyle: SubtitleStyle = {
    id: 'test-style',
    name: 'Test Style',
    fontFamily: 'Inter, sans-serif',
    fontSize: 48,
    fontWeight: 700,
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 1.3,
    primaryColor: '#FFFFFF',
    primaryOpacity: 1.0,
    activeWordColor: '#FFD700',
    strokeColor: '#000000',
    strokeWidth: 3,
    shadowColor: '#000000',
    shadowBlur: 8,
    shadowOffsetX: 1,
    shadowOffsetY: 2,
    hasBackgroundBox: false,
    backgroundColor: '#000000',
    backgroundOpacity: 0.8,
    boxPaddingX: 14,
    boxPaddingY: 6,
    boxBorderRadius: 6,
    position: {
      alignment: 'center',
      verticalPercent: 85,
    },
  };

  describe('Timestamp Formatters', () => {
    it('formats SubRip timestamps (HH:MM:SS,mmm)', () => {
      expect(formatSrtTimestamp(0)).toBe('00:00:00,000');
      expect(formatSrtTimestamp(1.25)).toBe('00:00:01,250');
      expect(formatSrtTimestamp(65.08)).toBe('00:01:05,080');
      expect(formatSrtTimestamp(3661.5)).toBe('01:01:01,500');
    });

    it('formats WebVTT timestamps (HH:MM:SS.mmm)', () => {
      expect(formatVttTimestamp(0)).toBe('00:00:00.000');
      expect(formatVttTimestamp(1.25)).toBe('00:00:01.250');
      expect(formatVttTimestamp(72.4)).toBe('00:01:12.400');
      expect(formatVttTimestamp(3600)).toBe('01:00:00.000');
    });
  });

  describe('SubRip (.srt) Exporter', () => {
    it('generates compliant SRT output with sequential numbering', () => {
      const srt = exportToSrt(mockEvents);

      expect(srt).toContain('1\n00:00:01,250 --> 00:00:03,500\nHello world, welcome to Vaani Studio!');
      expect(srt).toContain('2\n00:00:04,000 --> 00:00:06,200\nनमस्ते दोस्तों, यह दूसरा वाक्य है।');
    });

    it('supports CRLF line endings', () => {
      const srt = exportToSrt(mockEvents, { lineEnding: 'crlf' });
      expect(srt).toContain('\r\n00:00:01,250 --> 00:00:03,500\r\n');
    });

    it('sorts events chronologically before exporting', () => {
      const outOfOrder = [mockEvents[1], mockEvents[0]];
      const srt = exportToSrt(outOfOrder);

      const firstIndexPos = srt.indexOf('1\n00:00:01,250');
      const secondIndexPos = srt.indexOf('2\n00:00:04,000');

      expect(firstIndexPos).toBeGreaterThan(-1);
      expect(secondIndexPos).toBeGreaterThan(firstIndexPos);
    });

    it('handles empty events array cleanly', () => {
      expect(exportToSrt([])).toBe('');
    });
  });

  describe('WebVTT (.vtt) Exporter', () => {
    it('generates compliant WebVTT output with WEBVTT header and dot separators', () => {
      const vtt = exportToVtt(mockEvents);

      expect(vtt.startsWith('WEBVTT')).toBe(true);
      expect(vtt).toContain('00:00:01.250 --> 00:00:03.500');
      expect(vtt).toContain('00:00:04.000 --> 00:00:06.200');
      expect(vtt).toContain('नमस्ते दोस्तों, यह दूसरा वाक्य है।');
    });
  });

  describe('ASS Subtitle Script Generator (TASK-044)', () => {
    it('generates valid ASS v4.00+ script with all required sections', () => {
      const ass = generateAssScript(mockEvents, mockStyle, { title: 'Test Project' });

      expect(ass).toContain('[Script Info]');
      expect(ass).toContain('ScriptType: v4.00+');
      expect(ass).toContain('Title: Test Project');
      expect(ass).toContain('PlayResX: 1920');
      expect(ass).toContain('PlayResY: 1080');

      expect(ass).toContain('[V4+ Styles]');
      expect(ass).toContain('Format: Name, Fontname, Fontsize, PrimaryColour');
      expect(ass).toContain('Style: Default,Inter');
      expect(ass).toContain('Style: Karaoke,Inter');

      expect(ass).toContain('[Events]');
      expect(ass).toContain('Format: Layer, Start, End, Style, Name');
      expect(ass).toContain('Dialogue: 0,0:00:01.25,0:00:03.50,Karaoke');
    });

    it('encodes word-level karaoke timing tags in dialogue events', () => {
      const ass = generateAssScript([mockEvents[0]], mockStyle, { includeKaraoke: true });
      expect(ass).toContain('{\\k');
      expect(ass).toContain('Hello');
      expect(ass).toContain('Vaani');
    });

    it('cleanly falls back to plain text when karaoke is disabled or words are absent', () => {
      const eventNoWords: SubtitleEvent = {
        id: 'no-words',
        index: 1,
        startTime: 0.5,
        endTime: 2.0,
        text: 'Plain line without word timings',
        words: [],
      };

      const ass = generateAssScript([eventNoWords], mockStyle, { includeKaraoke: false });
      expect(ass).toContain('Plain line without word timings');
      expect(ass).toContain('Style: Default');
    });

    it('exports ASS using exportToAss wrapper', () => {
      const ass = exportToAss(mockEvents, mockStyle);
      expect(ass).toContain('[Script Info]');
      expect(ass).toContain('[Events]');
    });

    it('generates word-level active highlighting dialogue slices when burnIn is true', () => {
      const ass = generateAssScript([mockEvents[0]], mockStyle, { burnIn: true, includeKaraoke: true });
      expect(ass).toContain('[Events]');
      // Each word is rendered in its active interval with \c and activeWordColor
      expect(ass).toContain('\\c&H00D7FF&'); // activeColorAss BGR for #FFD700
      expect(ass).toContain('\\c&HFFFFFF&'); // baseColorAss
      expect(ass).toContain('Hello');
      expect(ass).toContain('Studio!');
    });
  });
});
