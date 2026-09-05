import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getFFmpegPaths, runFFmpeg } from '../../src/main/media/ffmpeg.js';
import { probeMediaFile } from '../../src/main/media/probe.js';
import { extractNormalizedAudio } from '../../src/main/media/audio.js';
import { extractFrameThumbnail } from '../../src/main/media/frames.js';

const TEST_DIR = path.join(process.cwd(), 'tests', 'fixtures_temp');
const TEST_AUDIO_PATH = path.join(TEST_DIR, 'test_sine_2s.wav');
const TEST_VIDEO_PATH = path.join(TEST_DIR, 'test_video_2s.mp4');

describe('Media Engine Subsystem (FFmpeg & FFprobe)', () => {
  beforeAll(async () => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }

    // Generate a 2-second synthetic 44.1kHz stereo audio WAV file
    await runFFmpeg([
      '-y',
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=2',
      '-ar', '44100',
      '-ac', '2',
      TEST_AUDIO_PATH,
    ]);

    // Generate a 2-second synthetic test MP4 video with a test pattern and tone
    await runFFmpeg([
      '-y',
      '-f', 'lavfi',
      '-i', 'testsrc=duration=2:size=320x240:rate=30',
      '-f', 'lavfi',
      '-i', 'sine=frequency=1000:duration=2',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      TEST_VIDEO_PATH,
    ]);
  });

  afterAll(() => {
    // Cleanup generated temporary test fixtures
    try {
      if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      }
    } catch {}
  });

  it('locates valid FFmpeg and FFprobe binary paths on the system', () => {
    const paths = getFFmpegPaths();
    expect(paths.isAvailable).toBe(true);
    expect(paths.ffmpegPath).toBeDefined();
    expect(paths.ffprobePath).toBeDefined();
  });

  it('probes audio media file and extracts accurate stream metadata', async () => {
    const res = await probeMediaFile(TEST_AUDIO_PATH);
    expect(res.success).toBe(true);
    expect(res.mediaInfo).toBeDefined();

    const info = res.mediaInfo!;
    expect(info.fileName).toBe('test_sine_2s.wav');
    expect(info.durationSeconds).toBeCloseTo(2.0, 1);
    expect(info.audioSampleRate).toBe(44100);
    expect(info.audioChannels).toBe(2);
    expect(info.audioCodec).toBe('pcm_s16le');
    expect(info.width).toBeUndefined();
  });

  it('probes video media file and extracts video geometry and audio streams', async () => {
    const res = await probeMediaFile(TEST_VIDEO_PATH);
    expect(res.success).toBe(true);
    expect(res.mediaInfo).toBeDefined();

    const info = res.mediaInfo!;
    expect(info.fileName).toBe('test_video_2s.mp4');
    expect(info.durationSeconds).toBeCloseTo(2.0, 1);
    expect(info.width).toBe(320);
    expect(info.height).toBe(240);
    expect(info.fps).toBe(30);
    expect(info.videoCodec).toBe('h264');
    expect(info.audioCodec).toBe('aac');
  });

  it('extracts normalized 16 kHz mono PCM WAV from media file', async () => {
    const res = await extractNormalizedAudio(TEST_VIDEO_PATH, {
      normalize: true,
      durationSeconds: 2.0,
    });

    expect(res.success).toBe(true);
    expect(res.outputPath).toBeDefined();
    expect(fs.existsSync(res.outputPath!)).toBe(true);

    // Verify extracted WAV metadata via probe
    const probeExtracted = await probeMediaFile(res.outputPath!);
    expect(probeExtracted.success).toBe(true);
    expect(probeExtracted.mediaInfo?.audioSampleRate).toBe(16000);
    expect(probeExtracted.mediaInfo?.audioChannels).toBe(1);
    expect(probeExtracted.mediaInfo?.audioCodec).toBe('pcm_s16le');
  });

  it('gracefully handles non-existent file with actionable error code', async () => {
    const fakePath = path.join(TEST_DIR, 'non_existent_file.mp4');
    const res = await probeMediaFile(fakePath);
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('FILE_NOT_FOUND');
    expect(res.actionableGuidance).toBeDefined();
  });

  it('supports cancellation during audio extraction via AbortController', async () => {
    const controller = new AbortController();
    // Abort immediately
    controller.abort();

    const res = await extractNormalizedAudio(TEST_VIDEO_PATH, {
      signal: controller.signal,
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('EXTRACTION_CANCELLED');
  });

  it('extracts video frame thumbnail at specified timestamp', async () => {
    const thumb = await extractFrameThumbnail(TEST_VIDEO_PATH, 1.0, { width: 160 });
    expect(thumb.timestamp).toBe(1.0);
    expect(thumb.width).toBe(160);
    expect(thumb.filePath.endsWith('.jpg')).toBe(true);
    expect(fs.existsSync(thumb.filePath)).toBe(true);
    expect(fs.statSync(thumb.filePath).size).toBeGreaterThan(100);
  });
});
