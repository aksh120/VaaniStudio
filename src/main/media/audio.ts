import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { runFFmpeg } from './ffmpeg.js';
import { logger } from '../logger.js';

export interface AudioExtractionOptions {
  normalize?: boolean;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
  durationSeconds?: number;
  streamIndex?: number;
  sourceStartSeconds?: number;
}

export interface AudioExtractionResult {
  success: boolean;
  outputPath?: string;
  durationSeconds?: number;
  sourceStartSeconds?: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Returns the directory for temporary audio extraction files.
 */
export function isNormalizedWav(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(44);
    const bytesRead = fs.readSync(fd, header, 0, header.length, 0);
    fs.closeSync(fd);
    if (bytesRead < 44 || header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WAVE') {
      return false;
    }
    return header.readUInt16LE(22) === 1 && header.readUInt32LE(24) === 16000 && header.readUInt16LE(34) === 16;
  } catch {
    return false;
  }
}

export function getAudioCacheDir(): string {
  const appData = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.config')
  );
  const audioDir = path.join(appData, 'VaaniStudio', 'cache', 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  return audioDir;
}

/**
 * Generates a deterministic hash for a media file to avoid redundant extraction.
 */
function getMediaHash(filePath: string, streamIndex?: number): string {
  const stat = fs.statSync(filePath);
  const identifier = `${filePath}:${stat.size}:${stat.mtimeMs}:${streamIndex ?? 'default'}`;
  return crypto.createHash('sha256').update(identifier).digest('hex').slice(0, 16);
}

/**
 * Extracts and normalizes audio from an input container to standardized 16 kHz 16-bit mono PCM WAV.
 */
export async function extractNormalizedAudio(
  inputFilePath: string,
  options: AudioExtractionOptions = {}
): Promise<AudioExtractionResult> {
  if (options.signal?.aborted) {
    return {
      success: false,
      errorCode: 'EXTRACTION_CANCELLED',
      errorMessage: 'Audio extraction was cancelled.',
    };
  }

  if (!fs.existsSync(inputFilePath)) {
    return {
      success: false,
      errorCode: 'INPUT_FILE_NOT_FOUND',
      errorMessage: `Input media file not found: ${inputFilePath}`,
    };
  }

  const cacheDir = getAudioCacheDir();
  const hash = getMediaHash(inputFilePath, options.streamIndex);
  const suffix = options.normalize ? '_norm16k_v2.wav' : '_16k_v2.wav';
  const outputPath = path.join(cacheDir, `${hash}${suffix}`);

  // If already extracted and file is intact, reuse cached WAV
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 44) {
    logger.info('MEDIA', `Reusing cached 16kHz audio: ${path.basename(outputPath)}`);
    return {
      success: true,
      outputPath,
      durationSeconds: options.durationSeconds,
      sourceStartSeconds: options.sourceStartSeconds,
    };
  }

  // Temporary path during extraction to ensure atomic creation
  const tempOutputPath = `${outputPath}.tmp.wav`;

  const args = [
    '-y',
    '-i', inputFilePath,
    ...(options.streamIndex !== undefined ? ['-map', `0:${options.streamIndex}`] : []),
    '-vn', // Disable video stream
    '-acodec', 'pcm_s16le', // 16-bit signed PCM
    '-ar', '16000', // 16 kHz sample rate
    '-ac', '1', // Mono audio
  ];

  const audioFilter = options.normalize
    ? 'volume=replaygain=track,asetpts=PTS-STARTPTS'
    : 'asetpts=PTS-STARTPTS';
  args.push('-filter:a', audioFilter);

  args.push(tempOutputPath);

  const totalDuration = options.durationSeconds || 0;

  try {
    const result = await runFFmpeg(args, {
      signal: options.signal,
      onProgress: (prog) => {
        if (options.onProgress && totalDuration > 0) {
          const percent = Math.min(100, Math.round((prog.timeSeconds / totalDuration) * 100));
          options.onProgress(percent);
        }
      },
    });

    if (result.exitCode !== 0) {
      if (fs.existsSync(tempOutputPath)) {
        fs.unlinkSync(tempOutputPath);
      }
      return {
        success: false,
        errorCode: 'EXTRACTION_FAILED',
        errorMessage: 'FFmpeg failed to extract audio track from media.',
      };
    }

    // Atomically rename temporary file to final cache path
    if (fs.existsSync(tempOutputPath)) {
      fs.renameSync(tempOutputPath, outputPath);
    }

    logger.info('MEDIA', `Extracted 16 kHz audio: ${path.basename(outputPath)} (${fs.statSync(outputPath).size} bytes)`);

    return {
      success: true,
      outputPath,
      durationSeconds: options.durationSeconds,
      sourceStartSeconds: options.sourceStartSeconds,
    };
  } catch (err: any) {
    if (fs.existsSync(tempOutputPath)) {
      try {
        fs.unlinkSync(tempOutputPath);
      } catch {}
    }

    if (options.signal?.aborted) {
      logger.info('MEDIA', 'Audio extraction cancelled by user.');
      return {
        success: false,
        errorCode: 'EXTRACTION_CANCELLED',
        errorMessage: 'Audio extraction was cancelled.',
      };
    }

    logger.error('MEDIA', `Audio extraction exception: ${err?.message}`);
    return {
      success: false,
      errorCode: 'EXTRACTION_EXCEPTION',
      errorMessage: err?.message || 'Unexpected failure during audio extraction.',
    };
  }
}
