import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {
  IPC_CHANNELS,
  IPCResult,
  HardwareProfile,
  ProjectData,
  MediaInfo,
  WaveformData,
  ThumbnailInfo,
  ModelInfo,
  TranscriptionOptions,
  SubtitleEvent,
  WordTiming,
} from '../shared/types/models.js';
import { detectHardwareProfile } from './hardware.js';
import { logger } from './logger.js';
import { probeMediaFile } from './media/probe.js';
import { extractNormalizedAudio } from './media/audio.js';
import { generateWaveformData } from './media/waveform.js';
import { extractFrameThumbnail } from './media/frames.js';
import { listModels, downloadModel, deleteModel } from './asr/modelManager.js';
import { FasterWhisperEngine } from './asr/fasterWhisperEngine.js';
import { fuseVocabularyInEvents } from '../shared/intelligence/fusionEngine.js';
import { transformScript } from '../shared/intelligence/transliteration.js';
import { normalizeSubtitleEvent } from '../shared/intelligence/textNormalizer.js';

const asrEngine = new FasterWhisperEngine();
let activeTranscriptionController: AbortController | null = null;
let activeDownloadController: AbortController | null = null;

export function registerIPCHandlers(mainWindow: BrowserWindow): void {
  // Get Hardware Profile
  ipcMain.handle(IPC_CHANNELS.GET_HARDWARE_PROFILE, async (): Promise<IPCResult<HardwareProfile>> => {
    try {
      const profile = detectHardwareProfile();
      return { success: true, data: profile };
    } catch (err: any) {
      logger.error('IPC', `Failed to detect hardware profile: ${err?.message}`);
      return {
        success: false,
        error: {
          code: 'HARDWARE_DETECT_ERROR',
          message: err?.message || 'Failed to detect system hardware profile.',
        },
      };
    }
  });

  // Select Media File via Native Windows Dialog
  ipcMain.handle(IPC_CHANNELS.SELECT_MEDIA_FILE, async (): Promise<IPCResult<string>> => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select Video or Audio File',
        properties: ['openFile'],
        filters: [
          {
            name: 'Supported Media Files',
            extensions: ['mp4', 'mkv', 'mov', 'avi', 'mp3', 'wav', 'aac', 'm4a', 'flac'],
          },
          { name: 'Video Files', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm'] },
          { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'm4a', 'flac'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: { code: 'SELECTION_CANCELLED', message: 'User cancelled file selection.' } };
      }

      const filePath = result.filePaths[0];
      logger.info('IPC', `User selected media file: ${path.basename(filePath)}`);
      return { success: true, data: filePath };
    } catch (err: any) {
      logger.error('IPC', `Error in file selection dialog: ${err?.message}`);
      return {
        success: false,
        error: { code: 'FILE_SELECTION_FAILED', message: err?.message || 'Failed to open file dialog.' },
      };
    }
  });

  // Probe media using FFprobe
  ipcMain.handle(IPC_CHANNELS.PROBE_MEDIA, async (_event, filePath: string): Promise<IPCResult<MediaInfo>> => {
    try {
      const probeRes = await probeMediaFile(filePath);
      if (!probeRes.success || !probeRes.mediaInfo) {
        return {
          success: false,
          error: {
            code: probeRes.errorCode || 'PROBE_FAILED',
            message: probeRes.errorMessage || 'Failed to inspect media file.',
            actionableGuidance: probeRes.actionableGuidance,
          },
        };
      }
      return { success: true, data: probeRes.mediaInfo };
    } catch (err: any) {
      logger.error('IPC', `Media probe exception for ${filePath}: ${err?.message}`);
      return {
        success: false,
        error: { code: 'PROBE_EXCEPTION', message: err?.message || 'Unexpected failure while probing media.' },
      };
    }
  });

  // Extract normalized 16 kHz mono PCM audio
  ipcMain.handle(
    IPC_CHANNELS.EXTRACT_AUDIO,
    async (_event, filePath: string, options?: { normalize?: boolean; durationSeconds?: number }): Promise<IPCResult<string>> => {
      try {
        const result = await extractNormalizedAudio(filePath, {
          normalize: options?.normalize,
          durationSeconds: options?.durationSeconds,
          onProgress: (percent) => {
            mainWindow.webContents.send(IPC_CHANNELS.PROGRESS_EVENT, {
              stage: 'extracting_audio',
              percent,
              message: `Extracting audio: ${percent}%`,
            });
          },
        });

        if (!result.success || !result.outputPath) {
          return {
            success: false,
            error: {
              code: result.errorCode || 'AUDIO_EXTRACTION_FAILED',
              message: result.errorMessage || 'Failed to extract audio track.',
            },
          };
        }

        return { success: true, data: result.outputPath };
      } catch (err: any) {
        logger.error('IPC', `Audio extraction exception: ${err?.message}`);
        return {
          success: false,
          error: { code: 'AUDIO_EXTRACTION_EXCEPTION', message: err?.message || 'Error extracting audio.' },
        };
      }
    }
  );

  // Generate audio waveform peaks
  ipcMain.handle(
    IPC_CHANNELS.GENERATE_WAVEFORM,
    async (_event, wavFilePath: string, options?: { bucketsPerSecond?: number }): Promise<IPCResult<WaveformData>> => {
      try {
        const waveform = await generateWaveformData(wavFilePath, options);
        return { success: true, data: waveform };
      } catch (err: any) {
        logger.error('IPC', `Waveform generation exception: ${err?.message}`);
        return {
          success: false,
          error: { code: 'WAVEFORM_EXCEPTION', message: err?.message || 'Error generating waveform.' },
        };
      }
    }
  );

  // Extract video frame thumbnail
  ipcMain.handle(
    IPC_CHANNELS.EXTRACT_FRAME,
    async (_event, videoFilePath: string, timestampSeconds: number, options?: { width?: number }): Promise<IPCResult<ThumbnailInfo>> => {
      try {
        const thumb = await extractFrameThumbnail(videoFilePath, timestampSeconds, options);
        return { success: true, data: thumb };
      } catch (err: any) {
        logger.error('IPC', `Frame extraction exception: ${err?.message}`);
        return {
          success: false,
          error: { code: 'FRAME_EXTRACTION_EXCEPTION', message: err?.message || 'Error extracting frame.' },
        };
      }
    }
  );

  // Model Management Handlers
  ipcMain.handle(IPC_CHANNELS.GET_MODELS, async (): Promise<IPCResult<ModelInfo[]>> => {
    try {
      const models = listModels();
      return { success: true, data: models };
    } catch (err: any) {
      logger.error('IPC', `Failed to list models: ${err?.message}`);
      return {
        success: false,
        error: { code: 'GET_MODELS_ERROR', message: err?.message || 'Failed to list models.' },
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_MODEL, async (_event, modelId: string): Promise<IPCResult<string>> => {
    try {
      if (activeDownloadController) {
        activeDownloadController.abort();
      }
      activeDownloadController = new AbortController();

      const modelPath = await downloadModel(
        modelId,
        (percent, message) => {
          mainWindow.webContents.send(IPC_CHANNELS.PROGRESS_EVENT, {
            stage: 'idle',
            percent,
            message,
          });
        },
        activeDownloadController.signal
      );

      activeDownloadController = null;
      return { success: true, data: modelPath };
    } catch (err: any) {
      activeDownloadController = null;
      logger.error('IPC', `Model download error for ${modelId}: ${err?.message}`);
      return {
        success: false,
        error: { code: 'DOWNLOAD_MODEL_ERROR', message: err?.message || 'Failed to download model.' },
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_MODEL, async (_event, modelId: string): Promise<IPCResult<boolean>> => {
    try {
      const success = deleteModel(modelId);
      return { success: true, data: success };
    } catch (err: any) {
      logger.error('IPC', `Failed to delete model ${modelId}: ${err?.message}`);
      return {
        success: false,
        error: { code: 'DELETE_MODEL_ERROR', message: err?.message || 'Failed to delete model.' },
      };
    }
  });

  // Speech Transcription Handlers
  ipcMain.handle(
    IPC_CHANNELS.START_TRANSCRIPTION,
    async (
      _event,
      mediaOrAudioPath: string,
      options: TranscriptionOptions
    ): Promise<IPCResult<{ events: SubtitleEvent[]; language: string; durationSeconds: number; classification?: string }>> => {
      try {
        if (activeTranscriptionController) {
          activeTranscriptionController.abort();
        }
        activeTranscriptionController = new AbortController();
        const signal = activeTranscriptionController.signal;

        let wavPath = mediaOrAudioPath;
        // If not already 16k WAV, extract normalized audio
        if (!mediaOrAudioPath.toLowerCase().endsWith('.wav')) {
          mainWindow.webContents.send(IPC_CHANNELS.PROGRESS_EVENT, {
            stage: 'extracting_audio',
            percent: 0,
            message: 'Extracting 16kHz audio for speech recognition...',
          });

          const extractResult = await extractNormalizedAudio(mediaOrAudioPath, {
            normalize: true,
            signal,
            onProgress: (percent) => {
              mainWindow.webContents.send(IPC_CHANNELS.PROGRESS_EVENT, {
                stage: 'extracting_audio',
                percent,
                message: `Extracting audio: ${percent}%`,
              });
            },
          });

          if (!extractResult.success || !extractResult.outputPath) {
            throw new Error(extractResult.errorMessage || 'Failed to extract audio track.');
          }
          wavPath = extractResult.outputPath;
        }

        const asrResult = await asrEngine.transcribe(
          wavPath,
          options,
          (progress) => {
            mainWindow.webContents.send(IPC_CHANNELS.PROGRESS_EVENT, progress);
          },
          undefined,
          signal
        );

        // Map ASR segments to SubtitleEvent schema
        let events: SubtitleEvent[] = asrResult.segments.map((seg, idx) => {
          const duration = Math.max(0.1, seg.endTime - seg.startTime);
          const words: WordTiming[] = (seg.words || []).map((w, wIdx) => ({
            id: `${seg.id}-w${wIdx + 1}`,
            word: w.word.trim(),
            startTime: w.startTime,
            endTime: w.endTime,
            confidence: w.confidence,
          }));

          return {
            id: seg.id || `sub-${idx + 1}`,
            index: idx + 1,
            startTime: seg.startTime,
            endTime: seg.endTime,
            text: seg.text,
            words,
            cps: Math.round((seg.text.length / duration) * 10) / 10,
            cpl: seg.text.length,
          };
        });

        // 1. Vocabulary fusion: Restore English technical terms in code-switched speech
        events = fuseVocabularyInEvents(events);

        // 2. Script transformation if requested by project settings
        if (options.scriptMode && options.scriptMode !== 'exact') {
          events = events.map((evt) => ({
            ...evt,
            text: transformScript(evt.text, options.scriptMode!),
            words: (evt.words || []).map((w) => ({
              ...w,
              word: transformScript(w.word, options.scriptMode!),
            })),
          }));
        }

        // 3. Indian number and text normalization
        events = events.map((evt) =>
          normalizeSubtitleEvent(evt, {
            normalizeNumbers: true,
            removeFillerWords: options.scriptMode === 'cleaned',
            formatPunctuation: true,
          })
        );

        activeTranscriptionController = null;
        logger.info('IPC', `Transcription complete: ${events.length} subtitle events produced (Classification: ${asrResult.classification || 'unknown'}).`);

        return {
          success: true,
          data: {
            events,
            language: asrResult.language,
            durationSeconds: asrResult.durationSeconds,
            classification: asrResult.classification,
          },
        };
      } catch (err: any) {
        activeTranscriptionController = null;
        logger.error('IPC', `Transcription failed: ${err?.message}`);
        return {
          success: false,
          error: {
            code: 'TRANSCRIPTION_FAILED',
            message: err?.message || 'Speech recognition failed.',
          },
        };
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.CANCEL_TRANSCRIPTION, async (): Promise<IPCResult<boolean>> => {
    if (activeTranscriptionController) {
      logger.info('IPC', 'User requested transcription cancellation.');
      activeTranscriptionController.abort();
      activeTranscriptionController = null;
      return { success: true, data: true };
    }
    return { success: true, data: false };
  });

  // Save Project (.vsp) with atomic write
  ipcMain.handle(
    IPC_CHANNELS.SAVE_PROJECT,
    async (_event, projectData: ProjectData, targetPath?: string): Promise<IPCResult<string>> => {
      try {
        let savePath = targetPath;
        if (!savePath) {
          const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Vaani Studio Project',
            defaultPath: `${projectData.projectName || 'project'}.vsp`,
            filters: [{ name: 'Vaani Studio Project (*.vsp)', extensions: ['vsp'] }],
          });

          if (result.canceled || !result.filePath) {
            return { success: false, error: { code: 'SAVE_CANCELLED', message: 'Project save cancelled.' } };
          }
          savePath = result.filePath;
        }

        // Atomic write pattern: write to .tmp then rename
        const tempPath = `${savePath}.tmp`;
        projectData.modifiedAt = new Date().toISOString();
        const content = JSON.stringify(projectData, null, 2);

        fs.writeFileSync(tempPath, content, 'utf-8');
        fs.renameSync(tempPath, savePath);

        logger.info('IPC', `Project saved successfully to ${path.basename(savePath)}`);
        return { success: true, data: savePath };
      } catch (err: any) {
        logger.error('IPC', `Failed to save project: ${err?.message}`);
        return {
          success: false,
          error: { code: 'SAVE_FAILED', message: err?.message || 'Could not save project file.' },
        };
      }
    }
  );

  // Load Project (.vsp)
  ipcMain.handle(IPC_CHANNELS.LOAD_PROJECT, async (_event, filePath?: string): Promise<IPCResult<ProjectData>> => {
    try {
      let openPath = filePath;
      if (!openPath) {
        const result = await dialog.showOpenDialog(mainWindow, {
          title: 'Open Vaani Studio Project',
          properties: ['openFile'],
          filters: [{ name: 'Vaani Studio Project (*.vsp)', extensions: ['vsp'] }],
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, error: { code: 'LOAD_CANCELLED', message: 'Project load cancelled.' } };
        }
        openPath = result.filePaths[0];
      }

      const content = fs.readFileSync(openPath, 'utf-8');
      const parsed = JSON.parse(content) as ProjectData;

      if (!parsed.projectVersion || !parsed.events) {
        return {
          success: false,
          error: {
            code: 'INVALID_PROJECT_FORMAT',
            message: 'The selected file is not a valid Vaani Studio project.',
            actionableGuidance: 'Ensure you are opening a genuine .vsp file created with Vaani Studio.',
          },
        };
      }

      logger.info('IPC', `Loaded project: ${parsed.projectName} (${parsed.events.length} subtitle events)`);
      return { success: true, data: parsed };
    } catch (err: any) {
      logger.error('IPC', `Failed to load project: ${err?.message}`);
      return {
        success: false,
        error: { code: 'LOAD_FAILED', message: err?.message || 'Could not read project file.' },
      };
    }
  });

  // Client log relay
  ipcMain.on(IPC_CHANNELS.LOG_MESSAGE, (_event, payload: { level: string; category: string; message: string }) => {
    const { level, category, message } = payload;
    if (level === 'ERROR') logger.error(category, message);
    else if (level === 'WARN') logger.warn(category, message);
    else if (level === 'DEBUG') logger.debug(category, message);
    else logger.info(category, message);
  });
}
