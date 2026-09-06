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
import { FasterWhisperEngine } from '../asr/fasterWhisperEngine.js';
import { AcousticDiarizer } from '../asr/diarizationEngine.js';
import { cleanAndAlignWords } from '../../shared/subtitles/wordAlignment.js';
import { segmentWordsIntoSubtitles } from '../../shared/subtitles/segmenter.js';
import { normalizeSubtitleEvent } from '../../shared/intelligence/textNormalizer.js';
import { transformScript } from '../../shared/intelligence/transliteration.js';
import { fuseVocabularyInEvents } from '../../shared/intelligence/fusionEngine.js';
import { exportToSrt, exportToVtt, exportToAss } from '../../shared/subtitles/subtitleExporters.js';
import { DEFAULT_STYLE } from '../../shared/defaults.js';
import { logger } from '../logger.js';

export class BatchQueueManager {
  private isProcessing: boolean = false;
  private isCancelled: boolean = false;
  private activeItemId: string | null = null;
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
    }
    this.items = [];
    this.activeItemId = null;
    this.isProcessing = false;
    this.isCancelled = false;
  }

  public cancelQueue(): void {
    if (this.isProcessing) {
      this.isCancelled = true;
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
        // Step 1: Extract normalized 16kHz audio
        item.status = 'extracting';
        item.progress = 10;
        this.emitProgress();

        const extractRes = await extractNormalizedAudio(item.filePath, { normalize: true });
        const audioPath = extractRes.outputPath || item.filePath;

        if (this.isCancelled) break;

        // Step 2: Transcribe via FasterWhisper
        item.status = 'transcribing';
        item.progress = 30;
        this.emitProgress();

        const asrEngine = new FasterWhisperEngine();
        await asrEngine.initialize({
          device: 'cpu',
          computeType: 'int8',
        });

        const rawResult = await asrEngine.transcribe(
          audioPath,
          {
            modelId: config.modelId,
            language: config.languageMode === 'auto' ? undefined : config.languageMode,
            scriptMode: config.scriptMode,
          },
          (progress: ProgressUpdate) => {
            item.progress = 30 + Math.floor((progress.percent / 100) * 45);
            this.emitProgress();
          }
        );

        if (this.isCancelled) break;

        // Step 3: Segment & Format
        item.progress = 80;
        this.emitProgress();

        const allRawWords: any[] = [];
        for (const seg of (rawResult.segments || [])) {
          for (const w of (seg.words || [])) {
            allRawWords.push({
              id: `w-${allRawWords.length + 1}`,
              word: w.word,
              startTime: w.startTime !== undefined ? w.startTime : (w as any).start,
              endTime: w.endTime !== undefined ? w.endTime : (w as any).end,
              confidence: w.confidence !== undefined ? w.confidence : (w as any).probability,
            });
          }
        }

        const alignedWords = cleanAndAlignWords(allRawWords);
        let events = alignedWords.length > 0
          ? segmentWordsIntoSubtitles(alignedWords, {
              maxCharactersPerLine: 42,
              maxLinesPerSubtitle: 2,
              maxDurationSeconds: 6.0,
            })
          : (rawResult.segments || []).map((seg: any, idx: number) => ({
              id: seg.id || `sub-${idx + 1}`,
              index: idx + 1,
              startTime: seg.startTime !== undefined ? seg.startTime : (seg.start || 0),
              endTime: seg.endTime !== undefined ? seg.endTime : (seg.end || 1),
              text: (seg.text || '').trim(),
              words: [],
            }));

        events = events.map((e) => normalizeSubtitleEvent(e));

        if (config.scriptMode === 'devanagari' || config.scriptMode === 'roman') {
          events = events.map((e) => ({
            ...e,
            text: transformScript(e.text, config.scriptMode),
          }));
        }

        events = fuseVocabularyInEvents(events);

        // Step 4: Optional Diarization
        if (config.autoDiarize) {
          try {
            const diarized = await diarizer.diarize(events, audioPath, { maxSpeakers: 2 });
            events = diarized.events;
          } catch (diarizeErr: any) {
            logger.warn('BATCH', `Diarization skipped for ${item.fileName}: ${diarizeErr.message}`);
          }
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
          subtitleContent = exportToVtt(events, { includeSpeakerLabels: config.autoDiarize });
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
        item.status = 'failed';
        item.error = itemErr.message || 'Processing failed';
        item.progress = 0;
      }

      this.emitProgress();
    }

    this.isProcessing = false;
    this.activeItemId = null;
    this.emitProgress();

    return this.getQueueState();
  }

  private emitProgress(): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(this.getQueueState());
    }
  }
}

export const batchQueueManager = new BatchQueueManager();
