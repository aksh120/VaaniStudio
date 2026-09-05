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
  ProgressUpdate,
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
  ): Promise<IPCResult<{ events: SubtitleEvent[]; language: string; durationSeconds: number }>> => {
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
