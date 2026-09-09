import { app, BrowserWindow, shell, protocol } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { registerIPCHandlers } from './ipc.js';
import { logger } from './logger.js';

// Register privileged custom scheme for zero-sandbox local media playback with HTTP range support
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ └─┬ preload
// │   └── index.js
// ├─┬ dist
// │ └── index.html

process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

// Enforce single-instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

process.on('uncaughtException', (error) => {
  logger.error('CRASH', `Uncaught exception: ${error.stack || error}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('CRASH', `Unhandled rejection: ${reason}`);
});

function createWindow(): void {
  try {
    const appIconPath = path.join(process.env.APP_ROOT || path.join(__dirname, '../..'), 'assets/icons/icon.png');

    mainWindow = new BrowserWindow({
      title: 'Vaani Studio',
      width: 1360,
      height: 860,
      minWidth: 1024,
      minHeight: 700,
      icon: appIconPath,
      backgroundColor: '#090D16', // Deep slate obsidian background
      show: false,
      autoHideMenuBar: true,
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    registerIPCHandlers(mainWindow);

    mainWindow.on('ready-to-show', () => {
      mainWindow?.show();
      logger.info('LIFECYCLE', 'Main application window shown.');
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      logger.error('LIFECYCLE', `Failed to load ${validatedURL}: ${errorCode} (${errorDescription})`);
    });

    // Handle external link clicks securely
    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });

    if (VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
  } catch (err: any) {
    logger.error('LIFECYCLE', `Failed to initialize window: ${err?.stack || err?.message}`);
    throw err;
  }
}

app.whenReady().then(() => {
  logger.info('LIFECYCLE', 'Vaani Studio application initializing.');

  // Handle streaming local media files with byte-range support for smooth seeking
  protocol.handle('media-file', (request) => {
    try {
      const url = new URL(request.url);
      let targetPath = url.searchParams.get('path');

      if (!targetPath) {
        // Fallback for pathname-based URLs (media-file://video/C:/... or media-file:///C:/...)
        let raw = decodeURIComponent(url.pathname);
        if (raw.startsWith('/video/')) {
          raw = raw.slice(7);
        }
        if (process.platform === 'win32') {
          raw = raw.replace(/^\/+([a-zA-Z]:)/, '$1');
        }
        targetPath = raw;
      }

      if (!targetPath) {
        logger.error('MEDIA', `No path specified in media-file request: ${request.url}`);
        return new Response('Path missing', { status: 400 });
      }

      // Check if file exists on disk
      if (!fs.existsSync(targetPath)) {
        logger.error('MEDIA', `Media file not found: ${targetPath}`);
        return new Response('File not found', { status: 404 });
      }

      const stat = fs.statSync(targetPath);
      const fileSize = stat.size;

      // Determine content type based on file extension
      const ext = path.extname(targetPath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.m4v': 'video/mp4',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.ogg': 'audio/ogg',
        '.flac': 'audio/flac',
      };
      const contentType = mimeTypes[ext] || 'video/mp4';

      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        // Parse HTTP byte-range header (e.g., "bytes=10485760-" or "bytes=0-1048575")
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] && parts[1].length > 0 ? parseInt(parts[1], 10) : fileSize - 1;

        if (isNaN(start) || start >= fileSize || (parts[1] && end >= fileSize) || start > end) {
          return new Response('Requested range not satisfiable', {
            status: 416,
            headers: { 'Content-Range': `bytes */${fileSize}` },
          });
        }

        const chunkSize = end - start + 1;
        const nodeStream = fs.createReadStream(targetPath, { start, end });
        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        return new Response(webStream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': contentType,
          },
        });
      } else {
        const nodeStream = fs.createReadStream(targetPath);
        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        return new Response(webStream, {
          status: 200,
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Length': fileSize.toString(),
            'Content-Type': contentType,
          },
        });
      }
    } catch (err: any) {
      logger.error('MEDIA', `Failed to stream media-file protocol: ${err.message}`);
      return new Response('File not found', { status: 404 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logger.info('LIFECYCLE', 'All application windows closed.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
