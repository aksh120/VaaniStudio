import { ipcMain, dialog, BrowserWindow, app, shell } from 'electron';
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
  SubtitleStyle,
  StylePreset,
  SubtitleExportOptions,
  VideoRenderOptions,
  RenderProgressUpdate,
  AnimationConfig,
  MemoryStats,
} from '../shared/types/models.js';
import { detectHardwareProfile } from './hardware.js';
import { getMemorySnapshot, cleanupApplicationCache } from './hardware/memoryManager.js';
import { logger } from './logger.js';
import { probeMediaFile } from './media/probe.js';
import { extractNormalizedAudio } from './media/audio.js';
import { generateWaveformData } from './media/waveform.js';
import { extractFrameThumbnail } from './media/frames.js';
import { listModels, downloadModel, deleteModel } from './asr/modelManager.js';
import { FasterWhisperEngine } from './asr/fasterWhisperEngine.js';
import { exportToSrt, exportToVtt, exportToAss } from '../shared/subtitles/subtitleExporters.js';
import { exportJobManager } from './media/exportJobManager.js';
import { fuseVocabularyInEvents } from '../shared/intelligence/fusionEngine.js';
import { transformScript } from '../shared/intelligence/transliteration.js';
import { normalizeSubtitleEvent } from '../shared/intelligence/textNormalizer.js';
import { cleanAndAlignWords } from '../shared/subtitles/wordAlignment.js';
import { segmentWordsIntoSubtitles } from '../shared/subtitles/segmenter.js';
import { validateSubtitles } from '../shared/subtitles/validator.js';
import { saveProjectAtomic, loadProjectFile } from './persistence/projectPersistence.js';
import {
  saveAutosaveSnapshot,
  checkCrashRecovery,
  discardRecovery,
  clearAutosaveForProject,
} from './persistence/autosaveManager.js';
import { translateError, formatDiagnosticBundle } from '../shared/errors/errorTranslator.js';
import { CrashRecoveryEntry } from '../shared/types/models.js';

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

  // Get Memory Stats
  ipcMain.handle(IPC_CHANNELS.GET_MEMORY_STATS, async (): Promise<IPCResult<MemoryStats>> => {
    try {
      const stats = getMemorySnapshot();
      return { success: true, data: stats };
    } catch (err: any) {
      logger.error('IPC', `Failed to get memory stats: ${err?.message}`);
      return {
        success: false,
        error: { code: 'MEMORY_STATS_ERROR', message: err?.message || 'Failed to get memory stats.' },
      };
    }
  });

  // Clean Application Cache
  ipcMain.handle(IPC_CHANNELS.CLEAN_CACHE, async (_event, options?: { clearAllAudio?: boolean }): Promise<IPCResult<{ filesDeleted: number; freedMB: number }>> => {
    try {
      const result = cleanupApplicationCache(options);
      return { success: true, data: { filesDeleted: result.filesDeleted, freedMB: result.freedMB } };
    } catch (err: any) {
      logger.error('IPC', `Failed to clean cache: ${err?.message}`);
      return {
        success: false,
        error: { code: 'CLEAN_CACHE_ERROR', message: err?.message || 'Failed to clean cache.' },
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

        // 1. Gather all raw words across ASR segments and align cleanly
        const allRawWords: WordTiming[] = [];
        for (const seg of asrResult.segments) {
          for (const w of (seg.words || [])) {
            allRawWords.push({
              id: `w-${allRawWords.length + 1}`,
              word: w.word,
              startTime: w.startTime,
              endTime: w.endTime,
              confidence: w.confidence,
            });
          }
        }

        const cleanedWords = cleanAndAlignWords(allRawWords);

        // 2. Run linguistic segmentation with syntax and pause awareness
        let events: SubtitleEvent[] = cleanedWords.length > 0
          ? segmentWordsIntoSubtitles(cleanedWords, {
              maxCharactersPerLine: 37,
              maxLinesPerSubtitle: 2,
            })
          : asrResult.segments.map((seg, idx) => {
              const duration = Math.max(0.1, seg.endTime - seg.startTime);
              return {
                id: seg.id || `sub-${idx + 1}`,
                index: idx + 1,
                startTime: seg.startTime,
                endTime: seg.endTime,
                text: seg.text,
                words: [],
                cps: Math.round((seg.text.length / duration) * 10) / 10,
                cpl: seg.text.length,
              };
            });

        // 3. Vocabulary fusion: Restore English technical terms in code-switched speech
        events = fuseVocabularyInEvents(events);

        // 4. Script transformation if requested by project settings
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

        // 5. Indian number and text normalization
        events = events.map((evt) =>
          normalizeSubtitleEvent(evt, {
            normalizeNumbers: true,
            removeFillerWords: options.scriptMode === 'cleaned',
            formatPunctuation: true,
          })
        );

        // 6. Validate constraints and log metrics
        const validationReport = validateSubtitles(events);

        activeTranscriptionController = null;
        logger.info(
          'IPC',
          `Transcription complete: ${events.length} subtitle events produced (Classification: ${asrResult.classification || 'unknown'}, Issues: ${validationReport.issues.length}, Avg CPS: ${validationReport.averageCps}).`
        );

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

        await saveProjectAtomic(savePath, projectData);
        // Clear autosave journal since file is cleanly persisted
        await clearAutosaveForProject(projectData.projectId);

        logger.info('IPC', `Project saved successfully to ${path.basename(savePath)}`);
        return { success: true, data: savePath };
      } catch (err: any) {
        const translated = translateError(err, 'Project Save');
        logger.error('IPC', `Failed to save project: ${err?.message}`);
        return {
          success: false,
          error: {
            code: translated.code,
            message: translated.summary,
            actionableGuidance: translated.actionableGuidance.join(' '),
          },
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

      const { project, warnings } = await loadProjectFile(openPath);
      if (warnings.length > 0) {
        logger.warn('IPC', `Warnings while loading project: ${warnings.join('; ')}`);
      }

      logger.info('IPC', `Loaded project: ${project.projectName} (${project.events.length} subtitle events)`);
      return { success: true, data: project };
    } catch (err: any) {
      const translated = translateError(err, 'Project Open');
      logger.error('IPC', `Failed to load project: ${err?.message}`);
      return {
        success: false,
        error: {
          code: translated.code,
          message: translated.summary,
          actionableGuidance: translated.actionableGuidance.join(' '),
        },
      };
    }
  });

  // Check Crash Recovery
  ipcMain.handle(IPC_CHANNELS.CHECK_CRASH_RECOVERY, async (): Promise<IPCResult<CrashRecoveryEntry[]>> => {
    try {
      const recoveries = await checkCrashRecovery();
      return { success: true, data: recoveries };
    } catch (err: any) {
      logger.error('IPC', `Crash recovery check failed: ${err?.message}`);
      return { success: true, data: [] }; // Fail open with empty array
    }
  });

  // Discard Crash Recovery
  ipcMain.handle(IPC_CHANNELS.DISCARD_CRASH_RECOVERY, async (_event, projectId: string): Promise<IPCResult<boolean>> => {
    try {
      await discardRecovery(projectId);
      return { success: true, data: true };
    } catch (err: any) {
      logger.error('IPC', `Failed to discard recovery journal: ${err?.message}`);
      return { success: false, error: { code: 'DISCARD_RECOVERY_FAILED', message: err?.message } };
    }
  });

  // Save Autosave Snapshot
  ipcMain.handle(
    IPC_CHANNELS.SAVE_AUTOSAVE_SNAPSHOT,
    async (_event, projectData: ProjectData, originalFilePath?: string): Promise<IPCResult<string>> => {
      try {
        const savedPath = await saveAutosaveSnapshot(projectData, originalFilePath);
        return { success: true, data: savedPath };
      } catch (err: any) {
        logger.warn('IPC', `Autosave snapshot failed: ${err?.message}`);
        return { success: false, error: { code: 'AUTOSAVE_FAILED', message: err?.message } };
      }
    }
  );

  // Get Diagnostic Report
  ipcMain.handle(
    IPC_CHANNELS.GET_DIAGNOSTIC_REPORT,
    async (_event, errorDetails?: { code: string; message: string }): Promise<IPCResult<string>> => {
      try {
        const translated = translateError(errorDetails?.message || 'Diagnostic Snapshot');
        if (errorDetails?.code) translated.code = errorDetails.code;
        const memory = getMemorySnapshot();
        const hardware = detectHardwareProfile();
        const report = formatDiagnosticBundle(translated, {
          cpuModel: hardware.cpuModel,
          physicalCores: hardware.physicalCores,
          totalMemoryMB: hardware.totalMemoryMB,
          freeMemoryMB: memory.systemFreeMB,
          processRssMB: memory.rssMB,
        });
        return { success: true, data: report };
      } catch (err: any) {
        return { success: false, error: { code: 'DIAGNOSTIC_REPORT_FAILED', message: err?.message } };
      }
    }
  );

  // Custom Preset Management Handlers
  const getPresetsDirectory = (): string => {
    const dir = path.join(app.getPath('userData'), 'presets');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  };

  // Get Custom Presets
  ipcMain.handle(IPC_CHANNELS.GET_CUSTOM_PRESETS, async (): Promise<IPCResult<StylePreset[]>> => {
    try {
      const dir = getPresetsDirectory();
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.vstyle.json'));
      const presets: StylePreset[] = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(dir, file), 'utf-8');
          const parsed = JSON.parse(content);
          if (parsed && parsed.id && parsed.name && parsed.style) {
            presets.push(parsed);
          } else if (parsed && parsed.preset && parsed.preset.id) {
            presets.push(parsed.preset);
          }
        } catch {
          // Skip corrupt file
        }
      }
      return { success: true, data: presets };
    } catch (err: any) {
      return { success: false, error: { code: 'PRESETS_READ_FAILED', message: err?.message || 'Failed to read presets' } };
    }
  });

  // Save Custom Preset
  ipcMain.handle(IPC_CHANNELS.SAVE_CUSTOM_PRESET, async (_event, preset: StylePreset): Promise<IPCResult<boolean>> => {
    try {
      const dir = getPresetsDirectory();
      const filename = `${preset.id}.vstyle.json`;
      fs.writeFileSync(path.join(dir, filename), JSON.stringify(preset, null, 2), 'utf-8');
      return { success: true, data: true };
    } catch (err: any) {
      return { success: false, error: { code: 'PRESET_SAVE_FAILED', message: err?.message || 'Failed to save preset' } };
    }
  });

  // Delete Custom Preset
  ipcMain.handle(IPC_CHANNELS.DELETE_CUSTOM_PRESET, async (_event, presetId: string): Promise<IPCResult<boolean>> => {
    try {
      const dir = getPresetsDirectory();
      const filename = `${presetId}.vstyle.json`;
      const targetPath = path.join(dir, filename);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      return { success: true, data: true };
    } catch (err: any) {
      return { success: false, error: { code: 'PRESET_DELETE_FAILED', message: err?.message || 'Failed to delete preset' } };
    }
  });

  // Export Preset to File via Native Windows Save Dialog
  ipcMain.handle(IPC_CHANNELS.EXPORT_PRESET_FILE, async (_event, presetPayload: any): Promise<IPCResult<string>> => {
    try {
      const defaultName = `${(presetPayload.name || 'preset').replace(/[^a-zA-Z0-9_-]/g, '_')}.vstyle.json`;
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Subtitle Style Preset',
        defaultPath: defaultName,
        filters: [{ name: 'Vaani Style Preset (*.vstyle.json)', extensions: ['vstyle.json', 'json'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: { code: 'EXPORT_CANCELLED', message: 'Export cancelled.' } };
      }

      fs.writeFileSync(result.filePath, JSON.stringify(presetPayload, null, 2), 'utf-8');
      return { success: true, data: result.filePath };
    } catch (err: any) {
      return { success: false, error: { code: 'EXPORT_FAILED', message: err?.message || 'Failed to export preset.' } };
    }
  });

  // Import Preset File via Native Windows Open Dialog
  ipcMain.handle(IPC_CHANNELS.IMPORT_PRESET_FILE, async (): Promise<IPCResult<string>> => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Subtitle Style Preset',
        properties: ['openFile'],
        filters: [{ name: 'Vaani Style Preset (*.vstyle.json)', extensions: ['vstyle.json', 'json'] }],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: { code: 'IMPORT_CANCELLED', message: 'Import cancelled.' } };
      }

      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      return { success: true, data: content };
    } catch (err: any) {
      return { success: false, error: { code: 'IMPORT_FAILED', message: err?.message || 'Failed to import preset.' } };
    }
  });

  // Select Save Path via Native Windows Dialog
  ipcMain.handle(
    IPC_CHANNELS.SELECT_SAVE_PATH,
    async (
      _event,
      options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[]; title?: string }
    ): Promise<IPCResult<string>> => {
      try {
        const result = await dialog.showSaveDialog(mainWindow, {
          title: options?.title || 'Select Save Destination',
          defaultPath: options?.defaultPath,
          filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, error: { code: 'SAVE_CANCELLED', message: 'User cancelled destination selection.' } };
        }

        return { success: true, data: result.filePath };
      } catch (err: any) {
        return { success: false, error: { code: 'SAVE_DIALOG_ERROR', message: err?.message || 'Dialog error.' } };
      }
    }
  );

  // Export Subtitle File (SRT, VTT, ASS)
  ipcMain.handle(
    IPC_CHANNELS.EXPORT_SUBTITLES,
    async (
      _event,
      payload: {
        events: SubtitleEvent[];
        style: SubtitleStyle;
        options: SubtitleExportOptions;
      }
    ): Promise<IPCResult<string>> => {
      try {
        const { events, style, options } = payload;
        let content: string;

        switch (options.format) {
          case 'srt':
            content = exportToSrt(events);
            break;
          case 'vtt':
            content = exportToVtt(events);
            break;
          case 'ass':
          default:
            content = exportToAss(events, style, {
              includeKaraoke: options.includeKaraoke !== false,
            });
            break;
        }

        let targetPath = options.outputPath;

        if (!targetPath) {
          const ext = options.format === 'ass' ? 'ass' : options.format === 'vtt' ? 'vtt' : 'srt';
          const formatName = options.format.toUpperCase();
          const result = await dialog.showSaveDialog(mainWindow, {
            title: `Export ${formatName} Subtitle File`,
            defaultPath: `subtitles.${ext}`,
            filters: [{ name: `${formatName} Subtitle (*.${ext})`, extensions: [ext] }],
          });

          if (result.canceled || !result.filePath) {
            return { success: false, error: { code: 'EXPORT_CANCELLED', message: 'Export cancelled.' } };
          }
          targetPath = result.filePath;
        }

        // Write with optional UTF-8 BOM if requested
        let writeData: Buffer | string = content;
        if (options.encoding === 'utf-8-bom') {
          writeData = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(content, 'utf-8')]);
        }

        fs.writeFileSync(targetPath, writeData);
        logger.info('IPC', `Exported ${options.format.toUpperCase()} subtitles to: ${targetPath}`);
        return { success: true, data: targetPath };
      } catch (err: any) {
        logger.error('IPC', `Failed to export subtitles: ${err?.message}`);
        return { success: false, error: { code: 'SUBTITLE_EXPORT_FAILED', message: err?.message || 'Export failed.' } };
      }
    }
  );

  // Start Video Burn-In Rendering
  ipcMain.handle(
    IPC_CHANNELS.START_RENDER_VIDEO,
    async (
      _event,
      payload: {
        options: VideoRenderOptions;
        events: SubtitleEvent[];
        style: SubtitleStyle;
        totalDurationSeconds: number;
        animationConfig?: AnimationConfig;
      }
    ): Promise<IPCResult<RenderProgressUpdate>> => {
      try {
        const jobId = `render_${Date.now()}`;
        const { options, events, style, totalDurationSeconds, animationConfig } = payload;

        // Run asynchronously in background, sending updates through IPC
        exportJobManager
          .startExportJob(
            jobId,
            options,
            events,
            style,
            totalDurationSeconds,
            animationConfig,
            (update) => {
              if (!mainWindow.isDestroyed()) {
                mainWindow.webContents.send(IPC_CHANNELS.RENDER_PROGRESS_EVENT, update);
              }
            }
          )
          .catch((err) => {
            logger.error('IPC', `Async render error: ${err?.message}`);
          });

        return {
          success: true,
          data: {
            jobId,
            status: 'rendering',
            percent: 0,
            elapsedSeconds: 0,
            outputPath: options.outputPath,
          },
        };
      } catch (err: any) {
        logger.error('IPC', `Failed to start video rendering: ${err?.message}`);
        return { success: false, error: { code: 'RENDER_START_FAILED', message: err?.message || 'Failed to start render.' } };
      }
    }
  );

  // Cancel Video Burn-In Rendering
  ipcMain.handle(
    IPC_CHANNELS.CANCEL_RENDER_VIDEO,
    async (_event, jobId?: string): Promise<IPCResult<boolean>> => {
      try {
        const cancelled = exportJobManager.cancelJob(jobId);
        return { success: true, data: cancelled };
      } catch (err: any) {
        return { success: false, error: { code: 'CANCEL_FAILED', message: err?.message || 'Failed to cancel render.' } };
      }
    }
  );

  // Show Item in Native Windows Explorer Folder
  ipcMain.handle(
    IPC_CHANNELS.SHOW_ITEM_IN_FOLDER,
    async (_event, filePath: string): Promise<IPCResult<boolean>> => {
      try {
        if (filePath && fs.existsSync(filePath)) {
          shell.showItemInFolder(filePath);
          return { success: true, data: true };
        } else if (filePath && fs.existsSync(path.dirname(filePath))) {
          shell.openPath(path.dirname(filePath));
          return { success: true, data: true };
        }
        return { success: false, error: { code: 'PATH_NOT_FOUND', message: 'Target file or folder not found.' } };
      } catch (err: any) {
        return { success: false, error: { code: 'SHOW_IN_FOLDER_FAILED', message: err?.message || 'Could not open folder.' } };
      }
    }
  );

  // Client log relay
  ipcMain.on(IPC_CHANNELS.LOG_MESSAGE, (_event, payload: { level: string; category: string; message: string }) => {
    const { level, category, message } = payload;
    if (level === 'ERROR') logger.error(category, message);
    else if (level === 'WARN') logger.warn(category, message);
    else if (level === 'DEBUG') logger.debug(category, message);
    else logger.info(category, message);
  });
}
