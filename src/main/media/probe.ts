import fs from 'node:fs';
import path from 'node:path';
import { runFFprobe } from './ffmpeg.js';
import { MediaInfo } from '../../shared/types/models.js';
import { logger } from '../logger.js';

export interface ProbeResult {
  success: boolean;
  mediaInfo?: MediaInfo;
  errorCode?: string;
  errorMessage?: string;
  actionableGuidance?: string;
}

/**
 * Inspects a media file using FFprobe and returns comprehensive container and stream metadata.
 */
export async function probeMediaFile(filePath: string): Promise<ProbeResult> {
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      errorCode: 'FILE_NOT_FOUND',
      errorMessage: `Media file does not exist: ${filePath}`,
      actionableGuidance: 'Please check that the file path is correct and has not been moved.',
    };
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    return {
      success: false,
      errorCode: 'EMPTY_FILE',
      errorMessage: 'The selected file is empty (0 bytes).',
      actionableGuidance: 'Please select a valid media file containing audio or video content.',
    };
  }

  const args = [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    filePath,
  ];

  try {
    const result = await runFFprobe(args, { timeoutMs: 15000 });
    if (result.exitCode !== 0) {
      return {
        success: false,
        errorCode: 'FFPROBE_PARSE_FAILED',
        errorMessage: 'FFprobe failed to parse media container.',
        actionableGuidance: 'The media file may be corrupt or encoded with an unsupported format.',
      };
    }

    const data = JSON.parse(result.stdout);
    const format = data.format || {};
    const streams = (data.streams || []) as Array<Record<string, any>>;

    // Parse audio stream
    const audioStream = streams.find((s) => s.codec_type === 'audio');
    if (!audioStream) {
      return {
        success: false,
        errorCode: 'NO_AUDIO_STREAM',
        errorMessage: 'The selected media file does not contain any audio streams.',
        actionableGuidance: 'Speech recognition requires audio. Please select a video or audio file with an active audio track.',
      };
    }

    // Parse video stream (optional, for video files)
    const videoStream = streams.find((s) => s.codec_type === 'video');

    // Parse duration: prioritize format.duration, fallback to audioStream.duration
    let durationSeconds = 0;
    if (format.duration) {
      durationSeconds = parseFloat(format.duration);
    } else if (audioStream.duration) {
      durationSeconds = parseFloat(audioStream.duration);
    }

    // Parse frame rate (e.g. "30/1" or "30000/1001")
    let fps: number | undefined;
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split('/');
      if (parts.length === 2 && parseFloat(parts[1]) > 0) {
        fps = Math.round((parseFloat(parts[0]) / parseFloat(parts[1])) * 100) / 100;
      } else {
        fps = parseFloat(videoStream.r_frame_rate) || undefined;
      }
    }

    const mediaInfo: MediaInfo = {
      filePath,
      fileName: path.basename(filePath),
      durationSeconds: Math.max(0, durationSeconds),
      width: videoStream?.width ? parseInt(videoStream.width, 10) : undefined,
      height: videoStream?.height ? parseInt(videoStream.height, 10) : undefined,
      fps,
      audioSampleRate: audioStream.sample_rate ? parseInt(audioStream.sample_rate, 10) : undefined,
      audioChannels: audioStream.channels ? parseInt(audioStream.channels, 10) : undefined,
      audioCodec: audioStream.codec_name,
      videoCodec: videoStream?.codec_name,
      bitrate: format.bit_rate ? parseInt(format.bit_rate, 10) : undefined,
      fileSizeBytes: stat.size,
    };

    logger.info(
      'MEDIA',
      `Probed media: ${mediaInfo.fileName} (${mediaInfo.durationSeconds.toFixed(1)}s, ` +
      `audio: ${mediaInfo.audioCodec}/${mediaInfo.audioSampleRate}Hz/${mediaInfo.audioChannels}ch, ` +
      `video: ${mediaInfo.videoCodec || 'none'}${mediaInfo.width ? ` ${mediaInfo.width}x${mediaInfo.height}` : ''})`
    );

    return {
      success: true,
      mediaInfo,
    };
  } catch (err: any) {
    logger.error('MEDIA', `Error probing media file ${filePath}: ${err?.message}`);
    return {
      success: false,
      errorCode: 'PROBE_EXCEPTION',
      errorMessage: err?.message || 'An unexpected error occurred while inspecting media.',
      actionableGuidance: 'Please verify the file is not locked by another process.',
    };
  }
}
