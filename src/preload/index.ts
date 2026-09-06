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
} from '../shared/types/models.js';

export const vaaniAPI = {
  getHardwareProfile: (): Promise<IPCResult<HardwareProfile>> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_HARDWARE_PROFILE);
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
