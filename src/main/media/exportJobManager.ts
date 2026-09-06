/**
 * Export Queue, Progress Tracking, and Cancellation Controller
 * Phase 9: TASK-046
 *
 * Coordinates asynchronous video export jobs, calculates percentage completion,
 * estimated time remaining (ETA), handles safe cancellation, and cleans partial files.
 */

import fs from 'node:fs';
import {
  VideoRenderOptions,
  SubtitleEvent,
  SubtitleStyle,
  AnimationConfig,
  RenderProgressUpdate,
} from '../../shared/types/models.js';
import { executeBurnInRender } from './videoRenderer.js';
import { logger } from '../logger.js';

export interface ActiveRenderJob {
  jobId: string;
  options: VideoRenderOptions;
  totalDurationSeconds: number;
  startTime: number;
  controller: AbortController;
}

export class ExportJobManager {
  private currentJob: ActiveRenderJob | null = null;

  public get activeJob(): ActiveRenderJob | null {
    return this.currentJob;
  }

  public isBusy(): boolean {
    return this.currentJob !== null;
  }

  /**
   * Start a background video burn-in export job
   */
  public async startExportJob(
    jobId: string,
    options: VideoRenderOptions,
    events: SubtitleEvent[],
    style: SubtitleStyle,
    totalDurationSeconds: number,
    animationConfig?: AnimationConfig,
    onProgressUpdate?: (update: RenderProgressUpdate) => void
  ): Promise<RenderProgressUpdate> {
    if (this.currentJob) {
      throw new Error('Another video export job is currently in progress.');
    }

    const controller = new AbortController();
    const startTime = Date.now();

    this.currentJob = {
      jobId,
      options,
      totalDurationSeconds: Math.max(0.1, totalDurationSeconds),
      startTime,
      controller,
    };

    logger.info('MEDIA', `Started export job ${jobId} for ${options.outputPath}`);

    // Initial progress update
    onProgressUpdate?.({
      jobId,
      status: 'rendering',
      percent: 0,
      elapsedSeconds: 0,
      outputPath: options.outputPath,
    });

    try {
      const result = await executeBurnInRender(
        options,
        events,
        style,
        animationConfig,
        {
          onProgress: (prog) => {
            const elapsed = (Date.now() - startTime) / 1000;
            const percent = Math.min(
              99,
              Math.max(0, Math.round((prog.timeSeconds / this.currentJob!.totalDurationSeconds) * 100))
            );

            // Estimate time remaining using speed factor if available
            let etaSeconds: number | undefined = undefined;
            if (prog.speed) {
              const speedMultiplier = parseFloat(prog.speed.replace('x', ''));
              if (speedMultiplier > 0) {
                const remainingMediaSec = Math.max(0, this.currentJob!.totalDurationSeconds - prog.timeSeconds);
                etaSeconds = Math.round(remainingMediaSec / speedMultiplier);
              }
            }

            onProgressUpdate?.({
              jobId,
              status: 'rendering',
              percent,
              fps: prog.fps,
              speed: prog.speed,
              elapsedSeconds: Math.round(elapsed),
              etaSeconds,
              outputPath: options.outputPath,
            });
          },
        },
        controller.signal
      );

      const elapsedFinal = Math.round((Date.now() - startTime) / 1000);

      if (!result.success) {
        const failureUpdate: RenderProgressUpdate = {
          jobId,
          status: 'failed',
          percent: 0,
          elapsedSeconds: elapsedFinal,
          outputPath: options.outputPath,
          error: result.error || 'Video render failed.',
        };
        onProgressUpdate?.(failureUpdate);
        return failureUpdate;
      }

      const completedUpdate: RenderProgressUpdate = {
        jobId,
        status: 'completed',
        percent: 100,
        elapsedSeconds: elapsedFinal,
        outputPath: options.outputPath,
      };
      onProgressUpdate?.(completedUpdate);
      return completedUpdate;
    } catch (err: any) {
      const elapsedFinal = Math.round((Date.now() - startTime) / 1000);

      if (controller.signal.aborted) {
        logger.info('MEDIA', `Export job ${jobId} was cancelled by user.`);

        // Clean up partial output file on cancellation
        if (fs.existsSync(options.outputPath)) {
          try {
            fs.unlinkSync(options.outputPath);
            logger.info('MEDIA', `Cleaned partial output video file: ${options.outputPath}`);
          } catch (e: any) {
            logger.warn('MEDIA', `Failed to delete partial file: ${e?.message}`);
          }
        }

        const cancelUpdate: RenderProgressUpdate = {
          jobId,
          status: 'cancelled',
          percent: 0,
          elapsedSeconds: elapsedFinal,
          outputPath: options.outputPath,
        };
        onProgressUpdate?.(cancelUpdate);
        return cancelUpdate;
      }

      logger.error('MEDIA', `Export job ${jobId} encountered an unhandled error: ${err?.message}`);

      // Clean partial output file on failure
      if (fs.existsSync(options.outputPath)) {
        try {
          fs.unlinkSync(options.outputPath);
        } catch {
          // Ignore
        }
      }

      const errorUpdate: RenderProgressUpdate = {
        jobId,
        status: 'failed',
        percent: 0,
        elapsedSeconds: elapsedFinal,
        outputPath: options.outputPath,
        error: err?.message || 'Export error occurred',
      };
      onProgressUpdate?.(errorUpdate);
      return errorUpdate;
    } finally {
      this.currentJob = null;
    }
  }

  /**
   * Cancel the currently running export job
   */
  public cancelJob(jobId?: string): boolean {
    if (!this.currentJob) {
      return false;
    }

    if (jobId && this.currentJob.jobId !== jobId) {
      return false;
    }

    logger.info('MEDIA', `Cancelling active export job: ${this.currentJob.jobId}`);
    this.currentJob.controller.abort();
    return true;
  }
}

export const exportJobManager = new ExportJobManager();
