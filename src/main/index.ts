import { app, BrowserWindow, shell, protocol, net } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
    mainWindow = new BrowserWindow({
      title: 'Vaani Studio',
      width: 1360,
      height: 860,
      minWidth: 1024,
      minHeight: 700,
      backgroundColor: '#090D16', // Deep slate obsidian background
      show: false,
      autoHideMenuBar: true,
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
      const rawUrl = request.url;
      let cleanPath = decodeURIComponent(rawUrl.replace(/^media-file:\/\//, ''));
      if (cleanPath.startsWith('video/')) {
        cleanPath = cleanPath.slice(6);
      }
      if (process.platform === 'win32' && cleanPath.startsWith('/') && /^[a-zA-Z]:/.test(cleanPath.slice(1))) {
        cleanPath = cleanPath.slice(1);
      }
      const fileUrl = pathToFileURL(cleanPath).toString();
      return net.fetch(fileUrl, {
        bypassCustomProtocolHandlers: true,
      });
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
