/**
 * Vaani Studio - Batch Media Processing Queue Manager
 * Coordinates sequential automated transcription, formatting, diarization, and export
 * across batches of media files with per-item error isolation.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  BatchJobItem,
  BatchJobConfig,
  BatchQueueState,
  ProgressUpdate,
} from '../../shared/types/models.js';
import { extractNormalizedAudio } from './audio.js';
import { probeMediaFile } from './probe.js';
import { createASREngine } from '../asr/engineFactory.js';
import { AcousticDiarizer } from '../asr/diarizationEngine.js';
import { buildSubtitleEvents } from '../../shared/subtitles/transcriptPipeline.js';
import { resolveSubtitleTimelineOffset } from '../../shared/subtitles/timing.js';
import { resolveTranscriptionRequest } from '../../shared/resolveTranscriptionRequest.js';
import { normalizeSubtitleEvent } from '../../shared/intelligence/textNormalizer.js';
import { transformScript } from '../../shared/intelligence/transliteration.js';
import { fuseVocabularyInEvents } from '../../shared/intelligence/fusionEngine.js';
import { exportToSrt, exportToVtt, exportToAss } from '../../shared/subtitles/subtitleExporters.js';
import { DEFAULT_STYLE } from '../../shared/defaults.js';
import { logger } from '../logger.js';
import { detectHardwareProfile } from '../hardware.js';

export class BatchQueueManager {
  private isProcessing: boolean = false;
  private isCancelled: boolean = false;
  private activeItemId: string | null = null;
  private activeAbortController: AbortController | null = null;
  private items: BatchJobItem[] = [];
  private onProgressCallback?: (state: BatchQueueState) => void;

  public getQueueState(): BatchQueueState {
    const completedCount = this.items.filter((i) => i.status === 'completed').length;
    return {
      isProcessing: this.isProcessing,
      activeItemId: this.activeItemId,
      items: [...this.items],
      completedCount,
      totalCount: this.items.length,
    };
  }

  public clearQueue(): void {
    if (this.isProcessing) {
      this.cancelQueue();
      return;
    }
    this.items = [];
    this.activeAbortController = null;
    this.activeItemId = null;
    this.isProcessing = false;
    this.isCancelled = false;
  }

  public cancelQueue(): void {
    if (this.isProcessing) {
      this.isCancelled = true;
      this.activeAbortController?.abort();
      logger.info('BATCH', 'Batch processing queue cancellation requested.');
    }
  }

  public async startQueue(
    inputItems: { filePath: string; fileName: string }[],
    config: BatchJobConfig,
    onProgress?: (state: BatchQueueState) => void
  ): Promise<BatchQueueState> {
    if (this.isProcessing) {
      throw new Error('Batch queue is already actively processing.');
    }

    this.isProcessing = true;
    this.isCancelled = false;
    const controller = new AbortController();
    this.activeAbortController = controller;
    this.onProgressCallback = onProgress;

    this.items = inputItems.map((item, idx) => ({
      id: `batch_${Date.now()}_${idx}`,
      filePath: item.filePath,
      fileName: item.fileName,
      status: 'queued',
      progress: 0,
    }));

    this.emitProgress();

    // Ensure output directory exists
    if (!fs.existsSync(config.outputDirectory)) {
      try {
        fs.mkdirSync(config.outputDirectory, { recursive: true });
      } catch (err: any) {
        logger.error('BATCH', `Failed to create output directory ${config.outputDirectory}: ${err.message}`);
      }
    }

    try {
      const hardware = detectHardwareProfile();
      const diarizer = new AcousticDiarizer();

      for (let i = 0; i < this.items.length; i++) {
      if (this.isCancelled) {
        logger.warn('BATCH', 'Batch processing halted due to cancellation.');
        for (let j = i; j < this.items.length; j++) {
          if (this.items[j].status === 'queued') {
            this.items[j].status = 'cancelled';
          }
        }
        break;
      }

      const item = this.items[i];
      this.activeItemId = item.id;
      logger.info('BATCH', `Processing batch item ${i + 1}/${this.items.length}: ${item.fileName}`);

       try {
         const mediaProbe = await probeMediaFile(item.filePath, { signal: controller.signal });
          const audioOffsetSeconds = resolveSubtitleTimelineOffset(
            mediaProbe.mediaInfo?.workingAudioOriginSeconds ?? mediaProbe.mediaInfo?.audioStreamStartSeconds,
            mediaProbe.mediaInfo?.outputOriginSeconds
          );

         // Step 1: Extract normalized 16kHz audio
         item.status = 'extracting';
        item.progress = 10;
        this.emitProgress();

         const extractRes = await extractNormalizedAudio(item.filePath, {
           normalize: true,
           streamIndex: mediaProbe.mediaInfo?.audioStreamIndex,
           sourceStartSeconds: audioOffsetSeconds,
           signal: controller.signal,
         });
         if (!extractRes.success || !extractRes.outputPath) {
           throw new Error(extractRes.errorMessage || 'Failed to extract normalized audio.');
         }
         const audioPath = extractRes.outputPath;

         if (this.isCancelled || controller.signal.aborted) {
           item.status = 'cancelled';
           item.error = 'Cancelled';
           break;
         }

        // Step 2: Transcribe via the selected engine
        item.status = 'transcribing';
        item.progress = 30;
        this.emitProgress();

        const transcriptionRequest = resolveTranscriptionRequest({
          settings: {
            languageMode: config.languageMode,
            scriptMode: config.scriptMode,
            performanceMode: config.performanceMode,
            modelId: config.modelId,
            modelSelectionSource: config.modelSelectionSource,
          },
           hardware: {
             inferenceDevice: hardware.inferenceDevice,
             inferenceComputeType: hardware.inferenceComputeType,
             physicalCores: hardware.physicalCores,
             logicalCores: hardware.logicalCores,
             allocatedThreads: hardware.allocatedThreads,
           },
        });
        const asrEngine = createASREngine(transcriptionRequest.engineId);

        const rawResult = await asrEngine.transcribe(
          audioPath,
          transcriptionRequest,
           (progress: ProgressUpdate) => {
             item.progress = 30 + Math.floor((progress.percent / 100) * 45);
             this.emitProgress();
           },
           undefined,
            controller.signal
         );

         if (this.isCancelled || controller.signal.aborted) {
           item.status = 'cancelled';
           item.error = 'Cancelled';
           break;
         }

        // Step 3: Segment & Format
        item.progress = 80;
        this.emitProgress();

         let events = buildSubtitleEvents(rawResult.segments, {
           maxCharactersPerLine: 42,
           maxLinesPerSubtitle: 2,
           maxDurationSeconds: 6.0,
           preserveSegmentText: config.scriptMode === 'exact',
           timeOffsetSeconds: audioOffsetSeconds,
         });

        if (config.scriptMode !== 'exact') {
          events = fuseVocabularyInEvents(events);
        }

         if (config.scriptMode === 'devanagari' || config.scriptMode === 'roman') {
           events = events.map((event) => {
             const text = transformScript(event.text, config.scriptMode);
             const words = (event.words || []).map((word) => ({
               ...word,
               word: transformScript(word.word, config.scriptMode),
             }));
             return {
               ...event,
               text,
               words,
               wordTimingState:
                 text === event.text && words.every((word, index) => word.word === event.words[index]?.word)
                   ? event.wordTimingState || 'fresh'
                   : 'stale' as const,
             };
           });
         }

        events = events.map((event) =>
          normalizeSubtitleEvent(event, {
             normalizeNumbers: config.scriptMode !== 'exact',
             removeFillerWords: config.scriptMode === 'cleaned',
             formatPunctuation: config.scriptMode !== 'exact',
             preserveWordTiming: config.scriptMode !== 'cleaned',
          })
        );

         if (this.isCancelled || controller.signal.aborted) {
           item.status = 'cancelled';
           item.error = 'Cancelled';
           break;
         }

         // Step 4: Optional Diarization
        if (config.autoDiarize) {
          try {
             const diarized = await diarizer.diarize(events, audioPath, {
               maxSpeakers: 2,
               audioOffsetSeconds,
             });
            events = diarized.events;
          } catch (diarizeErr: any) {
            logger.warn('BATCH', `Diarization skipped for ${item.fileName}: ${diarizeErr.message}`);
          }
        }

         if (this.isCancelled || controller.signal.aborted) {
           item.status = 'cancelled';
           item.error = 'Cancelled';
           break;
         }

         // Step 5: Export Subtitles
        item.progress = 95;
        this.emitProgress();

        const baseName = path.parse(item.fileName).name;
        const outputPath = path.join(config.outputDirectory, `${baseName}.${config.exportFormat}`);

        let subtitleContent = '';
        if (config.exportFormat === 'srt') {
          subtitleContent = exportToSrt(events, { includeSpeakerLabels: config.autoDiarize });
        } else if (config.exportFormat === 'vtt') {
           subtitleContent = exportToVtt(events, {
             includeSpeakerLabels: config.autoDiarize,
             languageTag: config.languageMode === 'hindi' ? 'hi-IN' : config.languageMode === 'english' ? 'en-US' : undefined,
           });
        } else {
          subtitleContent = exportToAss(events, DEFAULT_STYLE);
        }

        fs.writeFileSync(outputPath, subtitleContent, 'utf8');

        item.status = 'completed';
        item.progress = 100;
        item.outputPath = outputPath;
        logger.info('BATCH', `Completed batch item: ${item.fileName} -> ${outputPath}`);
      } catch (itemErr: any) {
        logger.error('BATCH', `Batch item ${item.fileName} failed: ${itemErr.message}`);
         item.status = this.isCancelled || controller.signal.aborted ? 'cancelled' : 'failed';
         item.error = this.isCancelled || controller.signal.aborted ? 'Cancelled' : itemErr.message || 'Processing failed';
        item.progress = 0;
      }

        this.emitProgress();
      }
    } finally {
      if (this.isCancelled) {
        for (const item of this.items) {
          if (item.status === 'queued' || item.status === 'extracting' || item.status === 'transcribing') {
            item.status = 'cancelled';
            item.error = 'Cancelled';
          }
        }
      }
      this.isProcessing = false;
      this.activeAbortController = null;
      this.activeItemId = null;
      this.emitProgress();
    }

    return this.getQueueState();
  }

  private emitProgress(): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(this.getQueueState());
    }
  }
}

export const batchQueueManager = new BatchQueueManager();
