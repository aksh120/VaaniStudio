import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { runFFmpeg } from './ffmpeg.js';
import { ThumbnailInfo } from '../../shared/types/models.js';
import { logger } from '../logger.js';

export interface FrameExtractionOptions {
  width?: number; // Default: 160px for timeline scrub thumbnails
  quality?: number; // 2 to 5 (2 is high quality JPEG)
}

/**
 * Returns thumbnail cache directory.
 */
export function getThumbnailCacheDir(): string {
  const appData = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.config')
  );
  const thumbDir = path.join(appData, 'VaaniStudio', 'cache', 'thumbnails');
  if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir, { recursive: true });
  }
  return thumbDir;
}

function getMediaIdentifier(filePath: string): string {
  const stat = fs.statSync(filePath);
  return crypto.createHash('sha256').update(`${filePath}:${stat.size}`).digest('hex').slice(0, 16);
}

/**
 * Extracts a single frame thumbnail at a specified timestamp using fast keyframe seeking.
 */
export async function extractFrameThumbnail(
  videoFilePath: string,
  timestampSeconds: number,
  options: FrameExtractionOptions = {}
): Promise<ThumbnailInfo> {
  if (!fs.existsSync(videoFilePath)) {
    throw new Error(`Video file not found: ${videoFilePath}`);
  }

  const width = options.width || 160;
  const quality = options.quality || 3;
  const mediaId = getMediaIdentifier(videoFilePath);
  const mediaThumbDir = path.join(getThumbnailCacheDir(), mediaId);

  if (!fs.existsSync(mediaThumbDir)) {
    fs.mkdirSync(mediaThumbDir, { recursive: true });
  }

  // Format timestamp e.g. 00012.35s
  const safeTime = timestampSeconds.toFixed(2).replace('.', '_');
  const outputPath = path.join(mediaThumbDir, `thumb_${safeTime}s_${width}w.jpg`);

  // Return existing cached thumbnail if present
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 100) {
    return {
      timestamp: timestampSeconds,
      filePath: outputPath,
      width,
      height: Math.round((width * 9) / 16),
    };
  }

  // Fast seek: -ss placed before -i
  const args = [
    '-y',
    '-ss', timestampSeconds.toString(),
    '-i', videoFilePath,
    '-vframes', '1',
    '-vf', `scale=${width}:-2`, // -2 ensures height is an even number
    '-q:v', quality.toString(),
    outputPath,
  ];

  const result = await runFFmpeg(args, { timeoutMs: 10000 });
  if (result.exitCode !== 0 || !fs.existsSync(outputPath)) {
    throw new Error(`Failed to extract frame at ${timestampSeconds}s: ${result.stderr.slice(-200)}`);
  }

  logger.debug('MEDIA', `Extracted frame at ${timestampSeconds}s: ${path.basename(outputPath)}`);

  return {
    timestamp: timestampSeconds,
    filePath: outputPath,
    width,
    height: Math.round((width * 9) / 16),
  };
}
