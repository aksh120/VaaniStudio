import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { runFFmpeg } from '../../src/main/media/ffmpeg.js';
import { generateWaveformData, downsamplePeaks } from '../../src/main/media/waveform.js';

const TEST_DIR = path.join(process.cwd(), 'tests', 'fixtures_waveform');
const TEST_WAV_PATH = path.join(TEST_DIR, 'sine_16k_3s.wav');

describe('Audio Waveform Peak Generator', () => {
  beforeAll(async () => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }

    // Generate 3 seconds of standardized 16 kHz 16-bit mono PCM WAV
    await runFFmpeg([
      '-y',
      '-f', 'lavfi',
      '-i', 'sine=frequency=1000:duration=3',
      '-ar', '16000',
      '-ac', '1',
      TEST_WAV_PATH,
    ]);
  });

  afterAll(() => {
    try {
      if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      }
    } catch {}
  });

  it('generates normalized peak data matching requested bucket rate', async () => {
    const bucketsPerSecond = 50; // 20ms resolution
    const data = await generateWaveformData(TEST_WAV_PATH, { bucketsPerSecond });

    expect(data.sampleRate).toBe(16000);
    expect(data.bucketsPerSecond).toBe(50);
    expect(data.durationSeconds).toBeCloseTo(3.0, 1);

    // Expected buckets = 3 seconds * 50 buckets/s = ~150 buckets
    expect(data.peaks.length).toBeGreaterThanOrEqual(149);
    expect(data.peaks.length).toBeLessThanOrEqual(151);

    // Verify all peaks are normalized strictly between 0.0 and 1.0
    for (const peak of data.peaks) {
      expect(peak).toBeGreaterThanOrEqual(0.0);
      expect(peak).toBeLessThanOrEqual(1.0);
    }
  });

  it('downsamples peak array for responsive visual canvas rendering', () => {
    const originalPeaks = [0.1, 0.4, 0.9, 0.3, 0.7, 0.2, 0.8, 0.5, 0.6, 0.1];
    const targetCount = 5;

    const downsampled = downsamplePeaks(originalPeaks, targetCount);
    expect(downsampled.length).toBe(targetCount);
    // Downsampling preserves the highest peak in each chunk
    expect(downsampled[0]).toBe(0.4); // max(0.1, 0.4)
    expect(downsampled[1]).toBe(0.9); // max(0.9, 0.3)
  });

  it('handles empty WAV and boundary conditions without throwing', async () => {
    const emptyPath = path.join(TEST_DIR, 'empty.wav');
    fs.writeFileSync(emptyPath, Buffer.alloc(44)); // Just a 44-byte empty header

    const data = await generateWaveformData(emptyPath);
    expect(data.peaks).toHaveLength(0);
    expect(data.durationSeconds).toBe(0);
  });
});
