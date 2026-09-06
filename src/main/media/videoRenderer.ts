/**
 * FFmpeg Video Burn-In Subtitle Rendering Engine
 * Phase 9: TASK-045
 *
 * Encodes styled and animated subtitles directly into the video stream using FFmpeg libass.
 * Features Windows filter path escaping, resolution scaling, CRF quality tuning,
 * hardware encoder adaptation, and cancellation support.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runFFmpeg, isFFmpegAvailable } from './ffmpeg.js';
import {
  VideoRenderOptions,
  VideoExportResolution,
  VideoExportPreset,
  SubtitleEvent,
  SubtitleStyle,
  AnimationConfig,
} from '../../shared/types/models.js';
import { generateAssScript } from '../../shared/subtitles/assScriptGenerator.js';
import { logger } from '../logger.js';

/**
 * Escape file paths for use inside FFmpeg filtergraphs (-vf).
 * On Windows, drive letters have a colon (C:) which FFmpeg parses as a filter separator.
 * Backslashes and colons must be properly escaped.
 */
export function escapeFfmpegFilterPath(filePath: string): string {
  if (!filePath) return '';
  // Convert backslashes to forward slashes, escape colons, and escape single quotes
  return filePath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'");
}

export interface BurnInArgsParams {
  inputVideoPath: string;
  outputPath: string;
  assFilePath: string;
  resolution?: VideoExportResolution;
  crf?: number;
  preset?: VideoExportPreset;
  encoder?: string;
  audioBitrate?: string;
}

/**
 * Build the argument vector for FFmpeg video burn-in
 */
export function buildBurnInArgs(params: BurnInArgsParams): string[] {
  const {
    inputVideoPath,
    outputPath,
    assFilePath,
    resolution = 'original',
    crf = 20,
    preset = 'fast',
    encoder = 'libx264',
    audioBitrate = '192k',
  } = params;

  const escapedAss = escapeFfmpegFilterPath(assFilePath);

  // Assemble video filters
  const filters: string[] = [];

  // Resolution scaling if requested
  switch (resolution) {
    case '720p':
      filters.push('scale=-2:720');
      break;
    case '1080p':
      filters.push('scale=-2:1080');
      break;
    case '4k':
      filters.push('scale=-2:2160');
      break;
    case 'original':
    default:
      break;
  }

  // Libass burned-in subtitle filter
  filters.push(`ass='${escapedAss}'`);

  const filterGraph = filters.join(',');

  const args: string[] = [
    '-y',
    '-i',
    inputVideoPath,
    '-vf',
    filterGraph,
    '-c:v',
    encoder,
    '-preset',
    preset,
    '-crf',
    String(crf),
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    audioBitrate,
    outputPath,
  ];

  return args;
}

export interface RenderCallbacks {
  onProgress?: (progress: { timeSeconds: number; speed?: string; fps?: number }) => void;
}

/**
 * Execute FFmpeg burn-in render with project subtitles and styles
 */
export async function executeBurnInRender(
  renderOptions: VideoRenderOptions,
  events: SubtitleEvent[],
  style: SubtitleStyle,
  animationConfig?: AnimationConfig,
  callbacks?: RenderCallbacks,
  signal?: AbortSignal
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  if (!isFFmpegAvailable()) {
    throw new Error('FFmpeg executable is not available on this system.');
  }

  if (!fs.existsSync(renderOptions.inputVideoPath)) {
    throw new Error(`Input video file not found: ${renderOptions.inputVideoPath}`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(renderOptions.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create temporary ASS file in system temp
  const tempDir = path.join(os.tmpdir(), 'vaani_render');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempAssPath = path.join(tempDir, `burnin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.ass`);

  try {
    const assScript = generateAssScript(events, style, {
      title: path.basename(renderOptions.outputPath, path.extname(renderOptions.outputPath)),
      includeKaraoke: renderOptions.includeKaraoke !== false,
      animationConfig: animationConfig || style.animation,
    });

    fs.writeFileSync(tempAssPath, assScript, 'utf-8');
    logger.info('MEDIA', `Wrote temporary ASS script for burn-in: ${tempAssPath}`);

    const args = buildBurnInArgs({
      inputVideoPath: renderOptions.inputVideoPath,
      outputPath: renderOptions.outputPath,
      assFilePath: tempAssPath,
      resolution: renderOptions.resolution,
      crf: renderOptions.crf,
      preset: renderOptions.preset,
      encoder: renderOptions.encoder,
      audioBitrate: renderOptions.audioBitrate,
    });

    logger.info('MEDIA', `Starting video burn-in render: ${renderOptions.inputVideoPath} -> ${renderOptions.outputPath}`);

    const result = await runFFmpeg(args, {
      signal,
      onProgress: callbacks?.onProgress,
    });

    if (result.exitCode !== 0) {
      // Clean partial output file if failed
      if (fs.existsSync(renderOptions.outputPath)) {
        try {
          fs.unlinkSync(renderOptions.outputPath);
        } catch {
          // Ignore unlink errors
        }
      }
      return {
        success: false,
        outputPath: renderOptions.outputPath,
        error: `FFmpeg exited with code ${result.exitCode}`,
      };
    }

    logger.info('MEDIA', `Video burn-in render completed successfully: ${renderOptions.outputPath}`);
    return {
      success: true,
      outputPath: renderOptions.outputPath,
    };
  } finally {
    // Clean temporary ASS file
    if (fs.existsSync(tempAssPath)) {
      try {
        fs.unlinkSync(tempAssPath);
      } catch (err: any) {
        logger.warn('MEDIA', `Failed to delete temp ASS file: ${err?.message}`);
      }
    }
  }
}
