import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn, ChildProcess } from 'node:child_process';
import readline from 'node:readline';
import { ModelInfo } from '../../shared/types/models.js';
import { logger } from '../logger.js';
import { resolvePythonPath } from './pythonResolver.js';

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
 * Resolves the local models storage directory.
 */
export function getModelsDir(): string {
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
 * Returns the expected local path for a model ID.
 */
export function getModelPath(modelId: string): string {
  return path.join(getModelsDir(), modelId);
}

/**
 * Checks if a model's weights exist locally on disk and are valid.
 */
export function isModelDownloaded(modelId: string): boolean {
  const modelDir = getModelPath(modelId);
  if (!fs.existsSync(modelDir)) {
    return false;
  }
  const hasModel = fs.existsSync(path.join(modelDir, 'model.bin')) ||
                   fs.existsSync(path.join(modelDir, 'model.safetensors'));
  const hasConfig = fs.existsSync(path.join(modelDir, 'config.json'));
  return hasModel && hasConfig;
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
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    path.join(currentDir, 'worker.py'),
    path.join(process.cwd(), 'src', 'main', 'asr', 'worker.py'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return candidatePaths[0];
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
          onProgress?.(10, `Downloading ${entry.name}...`);
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
 * Deletes a downloaded model from local storage.
 */
export function deleteModel(modelId: string): boolean {
  const modelDir = getModelPath(modelId);
  if (fs.existsSync(modelDir)) {
    try {
      fs.rmSync(modelDir, { recursive: true, force: true });
      logger.info('MODELS', `Deleted local model: ${modelId}`);
      return true;
    } catch (err: any) {
      logger.error('MODELS', `Failed to delete model ${modelId}: ${err?.message}`);
      return false;
    }
  }
  return false;
}
