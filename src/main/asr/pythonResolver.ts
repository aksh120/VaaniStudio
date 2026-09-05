import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { logger } from '../logger.js';

let cachedPythonPath: string | null = null;

/**
 * Validates whether a candidate python executable exists and can execute code.
 */
function testPythonExecutable(candidate: string): boolean {
  if (!fs.existsSync(candidate)) {
    return false;
  }

  // Guard against WindowsApps 0-byte execution alias stub
  try {
    const stats = fs.statSync(candidate);
    if (stats.size === 0) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const stdout = execSync(`"${candidate}" -c "import sys; print(sys.version_info[0])"`, {
      timeout: 4000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    return stdout === '3';
  } catch {
    return false;
  }
}

/**
 * Searches system and standard installation locations to resolve Python 3 executable.
 */
export function resolvePythonPath(): string {
  if (cachedPythonPath && fs.existsSync(cachedPythonPath)) {
    return cachedPythonPath;
  }

  // 1. Explicit environment variable override
  if (process.env.VAANI_PYTHON_PATH && testPythonExecutable(process.env.VAANI_PYTHON_PATH)) {
    cachedPythonPath = process.env.VAANI_PYTHON_PATH;
    logger.info('ASR', `Using VAANI_PYTHON_PATH: ${cachedPythonPath}`);
    return cachedPythonPath;
  }

  // 2. Standard Windows Local AppData installations (Python 3.12, 3.11, 3.10)
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const standardPaths = [
      path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
      path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe'),
      'C:\\Program Files\\Python312\\python.exe',
      'C:\\Program Files\\Python311\\python.exe',
    ];

    for (const candidate of standardPaths) {
      if (testPythonExecutable(candidate)) {
        cachedPythonPath = candidate;
        logger.info('ASR', `Found Python installation: ${cachedPythonPath}`);
        return cachedPythonPath;
      }
    }
  }

  // 3. Fall back to searching PATH via 'where' (Windows) or 'which' (POSIX)
  try {
    const lookupCmd = process.platform === 'win32' ? 'where.exe python' : 'which python3';
    const lines = execSync(lookupCmd, {
      timeout: 3000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    for (const candidate of lines) {
      // Skip Microsoft WindowsApps alias
      if (candidate.toLowerCase().includes('windowsapps')) {
        continue;
      }
      if (testPythonExecutable(candidate)) {
        cachedPythonPath = candidate;
        logger.info('ASR', `Resolved Python from PATH: ${cachedPythonPath}`);
        return cachedPythonPath;
      }
    }
  } catch {
    // PATH lookup failed or where.exe returned error
  }

  // Default fallback
  const fallback = 'python';
  logger.warn('ASR', `Python not explicitly resolved, falling back to default '${fallback}'`);
  return fallback;
}
