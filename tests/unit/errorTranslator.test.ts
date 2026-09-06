import { describe, it, expect } from 'vitest';
import {
  translateError,
  formatDiagnosticBundle,
} from '../../src/shared/errors/errorTranslator.js';

describe('Phase 12: User-Facing Error Translation & Actionable Guidance (TASK-055)', () => {
  it('translates missing file errors to MEDIA_NOT_FOUND with actionable steps', () => {
    const err = new Error('ENOENT: no such file or directory, open "C:\\Videos\\clip.mp4"');
    (err as any).code = 'ENOENT';

    const translated = translateError(err, 'Media Probe');
    expect(translated.code).toBe('MEDIA_NOT_FOUND');
    expect(translated.title).toBe('Media File Not Found');
    expect(translated.actionableGuidance.length).toBeGreaterThanOrEqual(2);
    expect(translated.likelyCause).toContain('moved, renamed, deleted');
  });

  it('translates disk capacity exhaustion to INSUFFICIENT_DISK_SPACE', () => {
    const err = new Error('ENOSPC: no space left on device');
    (err as any).code = 'ENOSPC';

    const translated = translateError(err, 'Video Export');
    expect(translated.code).toBe('INSUFFICIENT_DISK_SPACE');
    expect(translated.isCritical).toBe(true);
    expect(translated.actionableGuidance.some((g) => g.includes('Clean Cache'))).toBe(true);
  });

  it('translates file permission errors to FILE_ACCESS_DENIED', () => {
    const err = new Error('EPERM: operation not permitted');
    (err as any).code = 'EPERM';

    const translated = translateError(err);
    expect(translated.code).toBe('FILE_ACCESS_DENIED');
    expect(translated.actionableGuidance.length).toBeGreaterThan(0);
  });

  it('translates corrupt media errors to CORRUPT_MEDIA_FILE', () => {
    const err = new Error('FFmpeg error: Invalid data found when processing input stream');
    const translated = translateError(err);

    expect(translated.code).toBe('CORRUPT_MEDIA_FILE');
    expect(translated.actionableGuidance.some((g) => g.includes('VLC'))).toBe(true);
  });

  it('translates FFmpeg pipeline errors to FFMPEG_EXECUTION_FAILED', () => {
    const err = new Error('FFMPEG_LIBASS_FILTER_FAILED: Error during filtergraph execution');
    const translated = translateError(err);

    expect(translated.code).toBe('FFMPEG_EXECUTION_FAILED');
    expect(translated.isCritical).toBe(true);
  });

  it('translates network download drops to MODEL_DOWNLOAD_FAILED', () => {
    const err = new Error('getaddrinfo ENOTFOUND huggingface.co: model download failed');
    const translated = translateError(err);

    expect(translated.code).toBe('MODEL_DOWNLOAD_FAILED');
    expect(translated.actionableGuidance.some((g) => g.includes('connection'))).toBe(true);
  });

  it('translates ASR worker crashes to ASR_WORKER_FAILED', () => {
    const err = new Error('ASR worker process exited with code 1: CTranslate2 memory fault');
    const translated = translateError(err);

    expect(translated.code).toBe('ASR_WORKER_FAILED');
    expect(translated.isCritical).toBe(true);
    expect(translated.actionableGuidance.some((g) => g.includes('whisper-tiny'))).toBe(true);
  });

  it('translates corrupt project file errors to INVALID_PROJECT_FORMAT', () => {
    const err = new Error('The project file is corrupted and cannot be parsed as valid JSON');
    const translated = translateError(err);

    expect(translated.code).toBe('INVALID_PROJECT_FORMAT');
    expect(translated.actionableGuidance.some((g) => g.includes('autosave'))).toBe(true);
  });

  it('translates unhandled generic errors with context title', () => {
    const err = new Error('Unexpected undefined property access in render pipeline');
    const translated = translateError(err, 'Timeline');

    expect(translated.code).toBe('GENERAL_APPLICATION_ERROR');
    expect(translated.title).toBe('Timeline Error');
    expect(translated.actionableGuidance.length).toBeGreaterThan(0);
  });

  it('formats comprehensive diagnostic report with zero emojis', () => {
    const err = new Error('FFmpeg render worker failed at frame 1024');
    const translated = translateError(err, 'Export');

    const report = formatDiagnosticBundle(translated, {
      videoCodec: 'h264',
      resolution: '1080p',
      totalMemoryMB: 16384,
    });

    expect(report).toContain('=== VAANI STUDIO DIAGNOSTIC REPORT ===');
    expect(report).toContain('Error Code: FFMPEG_EXECUTION_FAILED');
    expect(report).toContain('videoCodec: h264');
    expect(report).toContain('=== END DIAGNOSTIC REPORT ===');

    // Strict no-emoji check
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(report)).toBe(false);
  });
});
