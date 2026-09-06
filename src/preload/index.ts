import { contextBridge, ipcRenderer } from 'electron';
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
  SubtitleStyle,
  ProgressUpdate,
  StylePreset,
  SubtitleExportOptions,
  VideoRenderOptions,
  RenderProgressUpdate,
  AnimationConfig,
  MemoryStats,
  CrashRecoveryEntry,
  OnboardingStatus,
  ModelIntegrityResult,
  SpeakerProfile,
  BatchJobConfig,
  BatchQueueState,
} from '../shared/types/models.js';

export const vaaniAPI = {
  getHardwareProfile: (): Promise<IPCResult<HardwareProfile>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_HARDWARE_PROFILE);
  },

  getMemoryStats: (): Promise<IPCResult<MemoryStats>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_MEMORY_STATS);
  },

  cleanCache: (options?: { clearAllAudio?: boolean }): Promise<IPCResult<{ filesDeleted: number; freedMB: number }>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CLEAN_CACHE, options);
  },

  selectMediaFile: (): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SELECT_MEDIA_FILE);
  },

  probeMedia: (filePath: string): Promise<IPCResult<MediaInfo>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.PROBE_MEDIA, filePath);
  },

  extractAudio: (
    filePath: string,
    options?: { normalize?: boolean; durationSeconds?: number }
  ): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.EXTRACT_AUDIO, filePath, options);
  },

  generateWaveform: (
    wavFilePath: string,
    options?: { bucketsPerSecond?: number }
  ): Promise<IPCResult<WaveformData>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GENERATE_WAVEFORM, wavFilePath, options);
  },

  extractFrame: (
    videoFilePath: string,
    timestampSeconds: number,
    options?: { width?: number }
  ): Promise<IPCResult<ThumbnailInfo>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.EXTRACT_FRAME, videoFilePath, timestampSeconds, options);
  },

  getModels: (): Promise<IPCResult<ModelInfo[]>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_MODELS);
  },

  downloadModel: (modelId: string): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_MODEL, modelId);
  },

  deleteModel: (modelId: string): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.DELETE_MODEL, modelId);
  },

  startTranscription: (
    mediaOrAudioPath: string,
    options: TranscriptionOptions
  ): Promise<IPCResult<{ events: SubtitleEvent[]; language: string; durationSeconds: number; classification?: string }>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.START_TRANSCRIPTION, mediaOrAudioPath, options);
  },

  cancelTranscription: (): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CANCEL_TRANSCRIPTION);
  },

  onProgress: (callback: (progress: ProgressUpdate) => void): (() => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.PROGRESS_EVENT, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.PROGRESS_EVENT, listener);
    };
  },

  saveProject: (projectData: ProjectData, targetPath?: string): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_PROJECT, projectData, targetPath);
  },

  loadProject: (filePath?: string): Promise<IPCResult<ProjectData>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.LOAD_PROJECT, filePath);
  },

  checkCrashRecovery: (): Promise<IPCResult<CrashRecoveryEntry[]>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CHECK_CRASH_RECOVERY);
  },

  discardCrashRecovery: (projectId: string): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.DISCARD_CRASH_RECOVERY, projectId);
  },

  saveAutosaveSnapshot: (projectData: ProjectData, originalFilePath?: string): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_AUTOSAVE_SNAPSHOT, projectData, originalFilePath);
  },

  getDiagnosticReport: (errorDetails?: { code: string; message: string }): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_DIAGNOSTIC_REPORT, errorDetails);
  },

  checkOnboardingStatus: (): Promise<IPCResult<OnboardingStatus>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CHECK_ONBOARDING_STATUS);
  },

  completeOnboarding: (selectedModelId?: string): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.COMPLETE_ONBOARDING, selectedModelId);
  },

  verifyModelIntegrity: (modelId: string): Promise<IPCResult<ModelIntegrityResult>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.VERIFY_MODEL_INTEGRITY, modelId);
  },

  getCustomPresets: (): Promise<IPCResult<StylePreset[]>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_CUSTOM_PRESETS);
  },

  saveCustomPreset: (preset: StylePreset): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_CUSTOM_PRESET, preset);
  },

  deleteCustomPreset: (presetId: string): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.DELETE_CUSTOM_PRESET, presetId);
  },

  exportPresetFile: (presetPayload: any): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.EXPORT_PRESET_FILE, presetPayload);
  },

  importPresetFile: (): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.IMPORT_PRESET_FILE);
  },

  selectSavePath: (options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[]; title?: string }): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SELECT_SAVE_PATH, options);
  },

  exportSubtitles: (payload: {
    events: SubtitleEvent[];
    style: SubtitleStyle;
    options: SubtitleExportOptions;
  }): Promise<IPCResult<string>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.EXPORT_SUBTITLES, payload);
  },

  startRenderVideo: (payload: {
    options: VideoRenderOptions;
    events: SubtitleEvent[];
    style: SubtitleStyle;
    totalDurationSeconds: number;
    animationConfig?: AnimationConfig;
  }): Promise<IPCResult<RenderProgressUpdate>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.START_RENDER_VIDEO, payload);
  },

  cancelRenderVideo: (jobId?: string): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CANCEL_RENDER_VIDEO, jobId);
  },

  onRenderProgress: (callback: (progress: RenderProgressUpdate) => void): (() => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.RENDER_PROGRESS_EVENT, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.RENDER_PROGRESS_EVENT, listener);
    };
  },

  showItemInFolder: (filePath: string): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SHOW_ITEM_IN_FOLDER, filePath);
  },

  diarizeSubtitles: (payload: {
    audioPath: string;
    events: SubtitleEvent[];
    numSpeakers?: number;
  }): Promise<IPCResult<{ events: SubtitleEvent[]; speakers: SpeakerProfile[] }>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.DIARIZE_SUBTITLES, payload);
  },

  startBatchQueue: (
    files: { filePath: string; fileName: string }[],
    config: BatchJobConfig
  ): Promise<IPCResult<BatchQueueState>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.START_BATCH_QUEUE, { files, config });
  },

  cancelBatchQueue: (): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CANCEL_BATCH_QUEUE);
  },

  getBatchStatus: (): Promise<IPCResult<BatchQueueState>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_BATCH_STATUS);
  },

  clearBatchQueue: (): Promise<IPCResult<boolean>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CLEAR_BATCH_QUEUE);
  },

  onBatchProgress: (callback: (state: BatchQueueState) => void): (() => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.BATCH_PROGRESS_EVENT, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.BATCH_PROGRESS_EVENT, listener);
    };
  },

  log: (level: string, category: string, message: string): void => {
    ipcRenderer.send(IPC_CHANNELS.LOG_MESSAGE, { level, category, message });
  },
};

// Expose safe API to the renderer process
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('vaaniAPI', vaaniAPI);
  } catch (error) {
    console.error('Failed to expose vaaniAPI to main world:', error);
  }
} else {
  // @ts-ignore
  window.vaaniAPI = vaaniAPI;
}

export type VaaniAPI = typeof vaaniAPI;
