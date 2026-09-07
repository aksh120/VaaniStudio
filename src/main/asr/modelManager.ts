import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, ChildProcess } from 'node:child_process';
import readline from 'node:readline';
import { ModelInfo, ModelIntegrityResult, ModelsStorageSummary } from '../../shared/types/models.js';
import { logger } from '../logger.js';
import { resolvePythonPath } from './pythonResolver.js';
import { resolveWorkerScriptPath } from './workerResolver.js';

export interface ModelCatalogEntry {
  id: string;
  name: string;
  description: string;
  sizeMB: number;
  parameters: string;
  isRecommended: boolean;
  repoId: string; // HuggingFace repository identifier or local directory
}

export const MODEL_CATALOG: ModelCatalogEntry[] = [
  {
    id: 'whisper-tiny-ct2-int8',
    name: 'Whisper Tiny (INT8)',
    description: 'Ultra-fast draft transcription. Lowest memory footprint, recommended for testing and rapid drafting.',
    sizeMB: 42,
    parameters: '39M',
    isRecommended: false,
    repoId: 'Systran/faster-whisper-tiny',
  },
  {
    id: 'whisper-base-ct2-int8',
    name: 'Whisper Base (INT8)',
    description: 'Fast speech recognition. Balanced speed and basic accuracy across English and common Hindi vocabulary.',
    sizeMB: 75,
    parameters: '74M',
    isRecommended: false,
    repoId: 'Systran/faster-whisper-base',
  },
  {
    id: 'whisper-small-ct2-int8',
    name: 'Whisper Small (INT8)',
    description: 'Recommended default for English, Hindi, and Hinglish. High accuracy on code-switched conversational speech.',
    sizeMB: 245,
    parameters: '244M',
    isRecommended: true,
    repoId: 'Systran/faster-whisper-small',
  },
  {
    id: 'whisper-medium-ct2-int8',
    name: 'Whisper Medium (INT8)',
    description: 'Highest transcription fidelity for complex multi-speaker audio and subtle Indian English phrasing.',
    sizeMB: 780,
    parameters: '769M',
    isRecommended: false,
    repoId: 'Systran/faster-whisper-medium',
  },
];

/**
 * Checks whether a directory exists and has write permissions.
 */
function isDirectoryWritable(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const testFile = path.join(dirPath, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'test');
    fs.rmSync(testFile, { force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the local models storage directory.
 * When running an installed setup (not portable), prefers the setup directory
 * (<SetupFolder>/models) if writable. Otherwise falls back to %LOCALAPPDATA%/VaaniStudio/models.
 */
export function getModelsDir(): string {
  const isPortable = Boolean(process.env.PORTABLE_EXECUTABLE_DIR);

  // If installed via setup (not portable), prefer setup folder's models directory if writable
  if (!isPortable && process.execPath) {
    const setupDir = path.dirname(process.execPath);
    // Ignore development electron runner directory
    if (!setupDir.toLowerCase().includes('node_modules')) {
      const candidateSetupModels = path.join(setupDir, 'models');
      if (isDirectoryWritable(candidateSetupModels)) {
        return candidateSetupModels;
      }
    }
  }

  const localAppData = process.env.LOCALAPPDATA || (
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.local', 'share')
  );
  const modelsDir = path.join(localAppData, 'VaaniStudio', 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  return modelsDir;
}

/**
 * Validates whether essential model weight files exist at a target directory.
 */
function isModelValidAtDir(modelDir: string): boolean {
  if (!fs.existsSync(modelDir)) return false;
  const hasModel = fs.existsSync(path.join(modelDir, 'model.bin')) ||
                   fs.existsSync(path.join(modelDir, 'model.safetensors'));
  const hasConfig = fs.existsSync(path.join(modelDir, 'config.json'));
  return hasModel && hasConfig;
}

/**
 * Returns the local path for a model ID.
 * First checks the active modelsDir. If not present there, checks the fallback
 * LOCALAPPDATA location so existing downloads are always recognized seamlessly.
 */
export function getModelPath(modelId: string): string {
  const primaryPath = path.join(getModelsDir(), modelId);
  if (isModelValidAtDir(primaryPath)) {
    return primaryPath;
  }

  const localAppData = process.env.LOCALAPPDATA || (
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.local', 'share')
  );
  const fallbackPath = path.join(localAppData, 'VaaniStudio', 'models', modelId);
  if (fallbackPath !== primaryPath && isModelValidAtDir(fallbackPath)) {
    return fallbackPath;
  }

  return primaryPath;
}

/**
 * Checks if a model's weights exist locally on disk and are valid.
 */
export function isModelDownloaded(modelId: string): boolean {
  return isModelValidAtDir(getModelPath(modelId));
}

/**
 * Lists all catalog models annotated with current local download status.
 */
export function listModels(): ModelInfo[] {
  return MODEL_CATALOG.map((entry) => {
    const downloaded = isModelDownloaded(entry.id);
    const localPath = downloaded ? getModelPath(entry.id) : undefined;
    return {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      sizeMB: entry.sizeMB,
      parameters: entry.parameters,
      isDownloaded: downloaded,
      isRecommended: entry.isRecommended,
      localPath,
    };
  });
}

/**
 * Resolves the path to worker.py.
 */
function getWorkerScriptPath(): string {
  return resolveWorkerScriptPath();
}

/**
 * Formats structured download progress for UI consumption.
 */
export function formatDownloadProgress(
  entryName: string,
  downloadedBytes: number,
  totalBytes: number,
  speedMBs?: number,
  fallbackSizeMB?: number
): { percent: number; message: string } {
  const dlMB = (downloadedBytes / (1024 * 1024)).toFixed(1);
  const totalMB = totalBytes > 0
    ? (totalBytes / (1024 * 1024)).toFixed(1)
    : String(fallbackSizeMB || 0);
  const speed = speedMBs && speedMBs > 0 ? ` (${speedMBs.toFixed(1)} MB/s)` : '';
  const rawPct = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 5;
  const pct = Math.min(99, Math.max(5, Math.round(rawPct)));
  return {
    percent: pct,
    message: `Downloading ${entryName}: ${dlMB} / ${totalMB} MB${speed}`,
  };
}

/**
 * Downloads a model to the local models directory with progress reporting.
 */
export async function downloadModel(
  modelId: string,
  onProgress?: (percent: number, message: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const entry = MODEL_CATALOG.find((m) => m.id === modelId);
  if (!entry) {
    throw new Error(`Unknown model ID: ${modelId}`);
  }

  const targetDir = getModelPath(modelId);
  if (isModelDownloaded(modelId)) {
    logger.info('MODELS', `Model ${modelId} already downloaded at ${targetDir}`);
    onProgress?.(100, 'Model already downloaded.');
    return targetDir;
  }

  if (signal?.aborted) {
    throw new Error('Download aborted prior to execution.');
  }

  const pythonPath = resolvePythonPath();
  const workerScript = getWorkerScriptPath();

  onProgress?.(0, `Starting download for ${entry.name} (${entry.sizeMB} MB)...`);
  logger.info('MODELS', `Initiating download of ${entry.repoId} into ${targetDir}`);

  return new Promise<string>((resolve, reject) => {
    let child: ChildProcess | null = null;
    let isSettled = false;
    let stderrOutput = '';

    const cleanup = () => {
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
    };

    const handleAbort = () => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      logger.warn('MODELS', `Download of ${modelId} cancelled by user.`);
      if (child && child.pid) {
        try {
          if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { windowsHide: true });
          } else {
            child.kill('SIGTERM');
          }
        } catch {
          // Ignore kill error
        }
      }
      // Clean up partially downloaded directory
      try {
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true, force: true });
        }
      } catch {
        // Ignore cleanup failure
      }
      reject(new Error('Model download cancelled.'));
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort);
    }

    try {
      child = spawn(
        pythonPath,
        [workerScript, 'download', '--model', entry.repoId, '--output', targetDir],
        { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
      );
    } catch (err: any) {
      cleanup();
      return reject(new Error(`Failed to spawn download process: ${err?.message}`));
    }

    const rl = readline.createInterface({
      input: child.stdout!,
      terminal: false,
    });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('{')) return;

      try {
        const msg = JSON.parse(trimmed);
        if (msg.type === 'download_start') {
          onProgress?.(5, `Connecting to Hugging Face for ${entry.name}...`);
        } else if (msg.type === 'download_progress') {
          const { percent, message } = formatDownloadProgress(
            entry.name,
            msg.downloaded_bytes,
            msg.total_bytes,
            msg.speed_mbs,
            entry.sizeMB
          );
          onProgress?.(percent, message);
        } else if (msg.type === 'download_done') {
          onProgress?.(100, `Download complete: ${entry.name}`);
        } else if (msg.type === 'error') {
          logger.error('MODELS', `Download error: ${msg.message}`);
          if (!isSettled) {
            isSettled = true;
            cleanup();
            reject(new Error(msg.message));
          }
        }
      } catch {
        // Non-JSON ignored
      }
    });

    child.stderr?.on('data', (chunk) => {
      stderrOutput += chunk.toString();
    });

    child.on('error', (err) => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        reject(new Error(`Download worker error: ${err.message}`));
      }
    });

    child.on('close', (code) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();

      if (code === 0 && isModelDownloaded(modelId)) {
        logger.info('MODELS', `Successfully downloaded model ${modelId} to ${targetDir}`);
        onProgress?.(100, `Model ready: ${entry.name}`);
        resolve(targetDir);
      } else {
        logger.error('MODELS', `Download failed with exit code ${code}. Stderr: ${stderrOutput}`);
        try {
          if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
          }
        } catch {
          // Ignore cleanup error
        }
        reject(new Error(`Failed to download model ${entry.name}: ${stderrOutput || 'Incomplete model files'}`));
      }
    });
  });
}

/**
 * Deletes a downloaded model from local storage and cleans associated Hugging Face hub cache.
 */
export function deleteModel(modelId: string): boolean {
  const entry = MODEL_CATALOG.find((m) => m.id === modelId);
  let deletedSomething = false;

  // 1. Delete active model directory
  const primaryDir = path.join(getModelsDir(), modelId);
  if (fs.existsSync(primaryDir)) {
    try {
      fs.rmSync(primaryDir, { recursive: true, force: true });
      deletedSomething = true;
      logger.info('MODELS', `Deleted primary model directory: ${primaryDir}`);
    } catch (err: any) {
      logger.error('MODELS', `Failed to delete primary model dir ${primaryDir}: ${err?.message}`);
    }
  }

  // 2. Delete fallback model directory if present in LOCALAPPDATA
  const localAppData = process.env.LOCALAPPDATA || '';
  if (localAppData) {
    const fallbackDir = path.join(localAppData, 'VaaniStudio', 'models', modelId);
    if (fallbackDir !== primaryDir && fs.existsSync(fallbackDir)) {
      try {
        fs.rmSync(fallbackDir, { recursive: true, force: true });
        deletedSomething = true;
        logger.info('MODELS', `Deleted fallback model directory: ${fallbackDir}`);
      } catch {
        // Ignore fallback deletion error
      }
    }
  }

  // 3. Purge corresponding Hugging Face hub cache directory (~/.cache/huggingface/hub/models--org--repo)
  if (entry?.repoId) {
    try {
      const hfOrgRepo = entry.repoId.replace('/', '--');
      const hfCacheDir = path.join(os.homedir(), '.cache', 'huggingface', 'hub', `models--${hfOrgRepo}`);
      if (fs.existsSync(hfCacheDir)) {
        fs.rmSync(hfCacheDir, { recursive: true, force: true });
        deletedSomething = true;
        logger.info('MODELS', `Purged Hugging Face cache for ${entry.repoId} at ${hfCacheDir}`);
      }
    } catch (err: any) {
      logger.warn('MODELS', `Could not purge HF cache for ${entry.repoId}: ${err?.message}`);
    }
  }

  return deletedSomething;
}

/**
 * Returns comprehensive storage summary for models.
 */
export function getModelsStorageSummary(): ModelsStorageSummary {
  const activeDir = getModelsDir();
  const isPortable = Boolean(process.env.PORTABLE_EXECUTABLE_DIR);
  let totalBytes = 0;
  let downloadedCount = 0;

  for (const entry of MODEL_CATALOG) {
    if (isModelDownloaded(entry.id)) {
      downloadedCount++;
      const p = getModelPath(entry.id);
      try {
        if (fs.existsSync(p)) {
          const files = fs.readdirSync(p);
          for (const f of files) {
            try {
              totalBytes += fs.statSync(path.join(p, f)).size;
            } catch {
              // Ignore stat failure
            }
          }
        }
      } catch {
        // Ignore read failure
      }
    }
  }

  return {
    storagePath: activeDir,
    isSetupFolder: !isPortable && Boolean(process.execPath && activeDir.includes(path.dirname(process.execPath))),
    totalModelsSizeMB: Math.round(totalBytes / (1024 * 1024)),
    downloadedCount,
  };
}

/**
 * Verifies the integrity of a locally downloaded model.
 * Validates presence of essential model assets and computes a SHA-256 fingerprint.
 */
export async function verifyModelIntegrity(modelId: string): Promise<ModelIntegrityResult> {
  const modelDir = getModelPath(modelId);
  if (!fs.existsSync(modelDir)) {
    return {
      valid: false,
      modelId,
      filesChecked: [],
      totalBytes: 0,
      error: `Model directory not found on disk: ${modelDir}`,
    };
  }

  const filesChecked: string[] = [];
  let totalBytes = 0;

  // Check config.json
  const configPath = path.join(modelDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    return {
      valid: false,
      modelId,
      filesChecked,
      totalBytes,
      error: 'Missing required configuration file: config.json',
    };
  }
  try {
    const configRaw = fs.readFileSync(configPath, 'utf8');
    JSON.parse(configRaw);
    filesChecked.push('config.json');
    totalBytes += fs.statSync(configPath).size;
  } catch (err: any) {
    return {
      valid: false,
      modelId,
      filesChecked,
      totalBytes,
      error: `Invalid or corrupted config.json: ${err.message}`,
    };
  }

  // Check weights (model.bin or model.safetensors)
  const binPath = path.join(modelDir, 'model.bin');
  const safePath = path.join(modelDir, 'model.safetensors');
  let weightsPath: string | null = null;
  if (fs.existsSync(binPath)) {
    weightsPath = binPath;
    filesChecked.push('model.bin');
  } else if (fs.existsSync(safePath)) {
    weightsPath = safePath;
    filesChecked.push('model.safetensors');
  }

  if (!weightsPath) {
    return {
      valid: false,
      modelId,
      filesChecked,
      totalBytes,
      error: 'Missing model weights (neither model.bin nor model.safetensors found)',
    };
  }

  const weightsStat = fs.statSync(weightsPath);
  if (weightsStat.size === 0) {
    return {
      valid: false,
      modelId,
      filesChecked,
      totalBytes,
      error: 'Model weights file is empty (0 bytes)',
    };
  }
  totalBytes += weightsStat.size;

  // Check vocabulary or tokenizer if present
  for (const optionalFile of ['vocabulary.json', 'tokenizer.json', 'vocabulary.txt']) {
    const optPath = path.join(modelDir, optionalFile);
    if (fs.existsSync(optPath)) {
      filesChecked.push(optionalFile);
      totalBytes += fs.statSync(optPath).size;
    }
  }

  // Compute fast SHA-256 fingerprint from config + sample of weights
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(configPath));
  const fd = fs.openSync(weightsPath, 'r');
  const buffer = Buffer.alloc(Math.min(65536, weightsStat.size));
  fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  hash.update(buffer);
  const sha256 = hash.digest('hex');

  return {
    valid: true,
    modelId,
    filesChecked,
    totalBytes,
    sha256,
  };
}

