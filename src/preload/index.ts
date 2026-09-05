import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CHANNELS,
  IPCResult,
  HardwareProfile,
  ProjectData,
  MediaInfo,
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
  // @ts-ignore (for fallback if contextIsolation is disabled in tests)
  window.vaaniAPI = vaaniAPI;
}

export type VaaniAPI = typeof vaaniAPI;
