import fs from 'node:fs';
import { WaveformData } from '../../shared/types/models.js';
import { logger } from '../logger.js';

export interface WaveformOptions {
  bucketsPerSecond?: number; // Default: 100 (10ms resolution)
}

/**
 * Parses a 16 kHz 16-bit mono PCM WAV file and computes normalized amplitude peaks.
 */
export async function generateWaveformData(
  wavFilePath: string,
  options: WaveformOptions = {}
): Promise<WaveformData> {
  const bucketsPerSecond = options.bucketsPerSecond || 100;

  if (!fs.existsSync(wavFilePath)) {
    throw new Error(`WAV file not found for waveform generation: ${wavFilePath}`);
  }

  const startTime = performance.now();
  const buffer = await fs.promises.readFile(wavFilePath);

  // Standard WAV header is 44 bytes
  if (buffer.length <= 44) {
    return {
      peaks: [],
      durationSeconds: 0,
      sampleRate: 16000,
      bucketsPerSecond,
    };
  }

  // Verify 'RIFF' and 'WAVE' magic signatures
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`File is not a valid RIFF/WAVE audio file: ${wavFilePath}`);
  }

  // Fast TypedArray view over 16-bit PCM samples
  // Subarray excludes 44-byte WAV header
  const pcmBytes = buffer.subarray(44);
  const sampleCount = Math.floor(pcmBytes.length / 2);
  const int16Samples = new Int16Array(
    pcmBytes.buffer,
    pcmBytes.byteOffset,
    sampleCount
  );

  const sampleRate = 16000;
  const durationSeconds = sampleCount / sampleRate;
  const samplesPerBucket = Math.max(1, Math.floor(sampleRate / bucketsPerSecond));
  const totalBuckets = Math.ceil(sampleCount / samplesPerBucket);
  const peaks: number[] = new Array(totalBuckets);

  let bucketIdx = 0;
  for (let i = 0; i < sampleCount; i += samplesPerBucket) {
    let maxVal = 0;
    const end = Math.min(i + samplesPerBucket, sampleCount);

    for (let j = i; j < end; j++) {
      const absVal = Math.abs(int16Samples[j]);
      if (absVal > maxVal) {
        maxVal = absVal;
      }
    }

    // Normalize to 0.0 - 1.0 (Int16 range max is 32767)
    peaks[bucketIdx++] = Math.round((maxVal / 32767) * 1000) / 1000;
  }

  const elapsed = (performance.now() - startTime).toFixed(1);
  logger.info(
    'MEDIA',
    `Computed waveform: ${peaks.length} peaks (${durationSeconds.toFixed(1)}s, ${bucketsPerSecond} peaks/s) in ${elapsed}ms`
  );

  return {
    peaks,
    durationSeconds,
    sampleRate,
    bucketsPerSecond,
  };
}

/**
 * Downsamples peak array to a specific visual width for responsive canvas rendering.
 */
export function downsamplePeaks(peaks: number[], targetCount: number): number[] {
  if (peaks.length <= targetCount || targetCount <= 0) {
    return peaks;
  }

  const result: number[] = new Array(targetCount);
  const step = peaks.length / targetCount;

  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * step);
    const end = Math.min(peaks.length, Math.floor((i + 1) * step));
    let max = 0;

    for (let j = start; j < end; j++) {
      if (peaks[j] > max) max = peaks[j];
    }
    result[i] = max;
  }

  return result;
}
