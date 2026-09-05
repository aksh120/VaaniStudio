import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {
  IPC_CHANNELS,
  IPCResult,
  HardwareProfile,
  ProjectData,
  MediaInfo,
} from '../shared/types/models.js';
import { detectHardwareProfile } from './hardware.js';
import { logger } from './logger.js';

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

  // Basic probe media (placeholder until Phase 2 FFprobe module)
  ipcMain.handle(IPC_CHANNELS.PROBE_MEDIA, async (_event, filePath: string): Promise<IPCResult<MediaInfo>> => {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: `Media file does not exist at path: ${filePath}`,
            actionableGuidance: 'Please verify that the file exists and has not been moved or deleted.',
          },
        };
      }

      const stats = fs.statSync(filePath);
      const mediaInfo: MediaInfo = {
        filePath,
        fileName: path.basename(filePath),
        durationSeconds: 0, // Populated via FFprobe in Phase 2
        fileSizeBytes: stats.size,
      };

      return { success: true, data: mediaInfo };
    } catch (err: any) {
      logger.error('IPC', `Media probe failed for ${filePath}: ${err?.message}`);
      return {
        success: false,
        error: { code: 'PROBE_FAILED', message: err?.message || 'Failed to inspect media file.' },
      };
    }
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
