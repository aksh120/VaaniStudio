// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  parseArgs,
  formatTimestampSrt,
  formatTimestampVtt,
  formatTimestampAss,
  exportToSrt,
  exportToVtt,
  exportToAss,
  diarizeEvents,
  MODEL_CATALOG,
} from '../../bin/vaani-cli.js';

describe('Headless Command-Line Interface (Phase 14: TASK-062)', () => {
  const sampleEvents = [
    {
      id: 'e1',
      startTime: 1.0,
      endTime: 3.5,
      text: 'Good morning everyone, let us begin.',
      speaker: 'Speaker 1',
    },
    {
      id: 'e2',
      startTime: 4.5,
      endTime: 6.0,
      text: 'Yes sir, all participants are ready.',
      speaker: 'Speaker 2',
    },
  ];

  describe('Argument Parsing (parseArgs)', () => {
    it('should parse --version and -v flags', () => {
      const res1 = parseArgs(['node', 'vaani', '--version']);
      expect(res1.showVersion).toBe(true);

      const res2 = parseArgs(['node', 'vaani', '-v']);
      expect(res2.showVersion).toBe(true);
    });

    it('should parse --help and -h flags', () => {
      const res1 = parseArgs(['node', 'vaani', '--help']);
      expect(res1.showHelp).toBe(true);

      const res2 = parseArgs(['node', 'vaani', '-h']);
      expect(res2.showHelp).toBe(true);
    });

    it('should parse transcribe command and options', () => {
      const parsed = parseArgs([
        'node',
        'vaani',
        'transcribe',
        'podcast.mp4',
        '-m',
        'whisper-tiny-ct2-int8',
        '-l',
        'hinglish',
        '-f',
        'vtt',
        '--diarize',
      ]);

      expect(parsed.command).toBe('transcribe');
      expect(parsed.target).toBe('podcast.mp4');
      expect(parsed.options.m).toBe('whisper-tiny-ct2-int8');
      expect(parsed.options.l).toBe('hinglish');
      expect(parsed.options.f).toBe('vtt');
      expect(parsed.options.diarize).toBe(true);
    });

    it('should parse render command with subtitle path and resolution', () => {
      const parsed = parseArgs([
        'node',
        'vaani',
        'render',
        'video.mp4',
        '-s',
        'subs.srt',
        '-o',
        'output.mp4',
        '-p',
        'ultrafast',
        '--json',
      ]);

      expect(parsed.command).toBe('render');
      expect(parsed.target).toBe('video.mp4');
      expect(parsed.options.s).toBe('subs.srt');
      expect(parsed.options.o).toBe('output.mp4');
      expect(parsed.options.p).toBe('ultrafast');
      expect(parsed.isJson).toBe(true);
    });

    it('should parse models list and verify subcommands', () => {
      const parsedList = parseArgs(['node', 'vaani', 'models', 'list', '--json']);
      expect(parsedList.command).toBe('models');
      expect(parsedList.target).toBe('list');
      expect(parsedList.isJson).toBe(true);

      const parsedVerify = parseArgs(['node', 'vaani', 'models', 'verify', 'whisper-small-ct2-int8']);
      expect(parsedVerify.command).toBe('models');
      expect(parsedVerify.target).toBe('verify');
      expect(parsedVerify.extraArgs).toEqual(['whisper-small-ct2-int8']);
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format SRT timestamps (HH:MM:SS,mmm)', () => {
      expect(formatTimestampSrt(0)).toBe('00:00:00,000');
      expect(formatTimestampSrt(65.123)).toBe('00:01:05,123');
      expect(formatTimestampSrt(3661.5)).toBe('01:01:01,500');
    });

    it('should format WebVTT timestamps (HH:MM:SS.mmm)', () => {
      expect(formatTimestampVtt(0)).toBe('00:00:00.000');
      expect(formatTimestampVtt(65.123)).toBe('00:01:05.123');
      expect(formatTimestampVtt(3661.5)).toBe('01:01:01.500');
    });

    it('should format ASS timestamps (H:MM:SS.cs)', () => {
      expect(formatTimestampAss(0)).toBe('0:00:00.00');
      expect(formatTimestampAss(65.12)).toBe('0:01:05.12');
      expect(formatTimestampAss(3661.5)).toBe('1:01:01.50');
    });
  });

  describe('Subtitle Serialization with Diarization Labels', () => {
    it('should export SRT without speaker labels by default', () => {
      const srt = exportToSrt(sampleEvents, false);
      expect(srt).toContain('Good morning everyone, let us begin.');
      expect(srt).not.toContain('[Speaker 1]');
    });

    it('should export SRT with [Speaker Name]: prefixes when speaker labels enabled', () => {
      const srt = exportToSrt(sampleEvents, true);
      expect(srt).toContain('[Speaker 1]: Good morning everyone, let us begin.');
      expect(srt).toContain('[Speaker 2]: Yes sir, all participants are ready.');
    });

    it('should export WebVTT with <v Speaker Name> tags when enabled', () => {
      const vtt = exportToVtt(sampleEvents, true);
      expect(vtt).toContain('WEBVTT');
      expect(vtt).toContain('<v Speaker 1>Good morning everyone, let us begin.</v>');
      expect(vtt).toContain('<v Speaker 2>Yes sir, all participants are ready.</v>');
    });

    it('should export ASS script with styles and dialogue entries', () => {
      const ass = exportToAss(sampleEvents, true);
      expect(ass).toContain('[Script Info]');
      expect(ass).toContain('[V4+ Styles]');
      expect(ass).toContain('[Events]');
      expect(ass).toContain('Dialogue: 0,0:00:01.00,0:00:03.50,Default,Speaker 1');
    });
  });

  describe('Acoustic Diarization Turn-Taking (diarizeEvents)', () => {
    it('should assign distinct speakers across conversational pauses', () => {
      const rawEvents = [
        { id: '1', startTime: 0.0, endTime: 2.0, text: 'First segment.' },
        { id: '2', startTime: 2.2, endTime: 3.5, text: 'Second segment quickly following.' }, // 0.2s gap
        { id: '3', startTime: 4.8, endTime: 6.0, text: 'Third segment after long pause.' }, // 1.3s gap
      ];

      const { events, speakers } = diarizeEvents(rawEvents, 'mock.wav');
      expect(events).toHaveLength(3);
      expect(speakers.length).toBeGreaterThanOrEqual(2);

      // Event 1 and 2 share same speaker
      expect(events[0].speaker).toBe('Speaker 1');
      expect(events[1].speaker).toBe('Speaker 1');

      // Event 3 alternates speaker due to >0.7s conversational silence
      expect(events[2].speaker).toBe('Speaker 2');
    });
  });

  describe('Model Catalog Sanity', () => {
    it('should contain all four supported Whisper model entries', () => {
      expect(MODEL_CATALOG).toHaveLength(4);
      const ids = MODEL_CATALOG.map((m: any) => m.id);
      expect(ids).toContain('whisper-tiny-ct2-int8');
      expect(ids).toContain('whisper-base-ct2-int8');
      expect(ids).toContain('whisper-small-ct2-int8');
      expect(ids).toContain('whisper-medium-ct2-int8');

      MODEL_CATALOG.forEach((m: any) => {
        expect(m.sizeMB).toBeGreaterThan(0);
        expect(m.repoId).toContain('Systran/faster-whisper');
      });
    });
  });
});
