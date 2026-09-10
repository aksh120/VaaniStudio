/**
 * Worker Script Path Resolver
 * Ensures worker.py is accessible to external Python runtime across development,
 * packaged asar archives, and unpacked portable executables.
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { app } from 'electron';
import { logger } from '../logger.js';

let cachedWorkerPath: string | null = null;

export function resolveWorkerScriptPath(): string {
  if (cachedWorkerPath && fs.existsSync(cachedWorkerPath)) {
    return cachedWorkerPath;
  }

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths: string[] = [
    path.join(currentDir, 'worker.py'),
    path.join(process.cwd(), 'dist-electron', 'main', 'worker.py'),
    path.join(process.cwd(), 'src', 'main', 'asr', 'worker.py'),
  ];

  if (process.resourcesPath) {
    candidatePaths.unshift(
      path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'main', 'worker.py'),
      path.join(process.resourcesPath, 'worker.py')
    );
  }

  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    candidatePaths.unshift(
      path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'worker.py'),
      path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'resources', 'worker.py'),
      path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'scripts', 'worker.py')
    );
  }

  let foundPath: string | null = null;
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    } catch {
      // Continue to next candidate
    }
  }

  if (!foundPath) {
    foundPath = candidatePaths[0];
  }

  // External Python cannot execute inside an asar virtual archive.
  // Extract to real filesystem if inside app.asar.
  if (foundPath.includes('app.asar')) {
    // 1. Check if electron-builder unpacked it
    const unpacked = foundPath.replace('app.asar', 'app.asar.unpacked');
    if (fs.existsSync(unpacked)) {
      cachedWorkerPath = unpacked;
      return unpacked;
    }

    // 2. Extract worker.py content out of asar into userData or temp directory
    try {
      let baseDir: string;
      try {
        baseDir = app ? app.getPath('userData') : path.join(os.homedir(), '.vaani-studio');
      } catch {
        baseDir = path.join(os.tmpdir(), 'VaaniStudio');
      }

      const scriptDir = path.join(baseDir, 'scripts');
      fs.mkdirSync(scriptDir, { recursive: true });
      const extractedPath = path.join(scriptDir, 'worker.py');

      // Node inside Electron reads from asar archive transparently
      const content = fs.readFileSync(foundPath);
      if (!fs.existsSync(extractedPath) || !fs.readFileSync(extractedPath).equals(content)) {
        fs.writeFileSync(extractedPath, content);
        logger.info('ASR', `Extracted/updated worker.py from asar archive to: ${extractedPath}`);
      }

      cachedWorkerPath = extractedPath;
      return extractedPath;
    } catch (err: any) {
      logger.error('ASR', `Failed to extract worker.py from asar: ${err.message}`);
    }
  }

  cachedWorkerPath = foundPath;
  return foundPath;
}
