import { spawn, execSync, ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger.js';

export interface FFmpegPaths {
  ffmpegPath: string;
  ffprobePath: string;
  isAvailable: boolean;
}

export interface RunOptions {
  signal?: AbortSignal;
  onProgress?: (progress: { timeSeconds: number; speed?: string; fps?: number }) => void;
  timeoutMs?: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

let cachedPaths: FFmpegPaths | null = null;

/**
 * Resolves verified executable paths for FFmpeg and FFprobe.
 */
export function getFFmpegPaths(): FFmpegPaths {
  if (cachedPaths && cachedPaths.isAvailable) {
    return cachedPaths;
  }

  // 1. Check custom environment variable
  const envFfmpeg = process.env.VAANI_FFMPEG_PATH;
  const envFfprobe = process.env.VAANI_FFPROBE_PATH;
  if (envFfmpeg && fs.existsSync(envFfmpeg) && envFfprobe && fs.existsSync(envFfprobe)) {
    cachedPaths = { ffmpegPath: envFfmpeg, ffprobePath: envFfprobe, isAvailable: true };
    return cachedPaths;
  }

  // 2. Check local bundled resources directory
  const baseDir = process.env.APP_ROOT || process.cwd();
  const exeSuffix = process.platform === 'win32' ? '.exe' : '';
  const bundledFfmpeg = path.join(baseDir, 'resources', 'ffmpeg', `ffmpeg${exeSuffix}`);
  const bundledFfprobe = path.join(baseDir, 'resources', 'ffmpeg', `ffprobe${exeSuffix}`);
  if (fs.existsSync(bundledFfmpeg) && fs.existsSync(bundledFfprobe)) {
    cachedPaths = { ffmpegPath: bundledFfmpeg, ffprobePath: bundledFfprobe, isAvailable: true };
    return cachedPaths;
  }

  // 3. Check known standard Windows locations
  if (process.platform === 'win32') {
    const standardFfmpeg = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
    const standardFfprobe = 'C:\\ffmpeg\\bin\\ffprobe.exe';
    if (fs.existsSync(standardFfmpeg) && fs.existsSync(standardFfprobe)) {
      cachedPaths = { ffmpegPath: standardFfmpeg, ffprobePath: standardFfprobe, isAvailable: true };
      return cachedPaths;
    }
  }

  // 4. Default to standard system PATH names
  cachedPaths = {
    ffmpegPath: 'ffmpeg',
    ffprobePath: 'ffprobe',
    isAvailable: true,
  };
  return cachedPaths;
}

/**
 * Checks whether FFmpeg executable is runnable on the current host.
 */
export function isFFmpegAvailable(): boolean {
  try {
    const { ffmpegPath } = getFFmpegPaths();
    execSync(`"${ffmpegPath}" -version`, { timeout: 3000, windowsHide: true, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Executes FFmpeg using direct native argument vectors to prevent command injection.
 */
export function runFFmpeg(args: string[], options: RunOptions = {}): Promise<ExecutionResult> {
  const { ffmpegPath } = getFFmpegPaths();
  return runProcess(ffmpegPath, args, options, 'FFmpeg');
}

/**
 * Executes FFprobe using direct native argument vectors.
 */
export function runFFprobe(args: string[], options: RunOptions = {}): Promise<ExecutionResult> {
  const { ffprobePath } = getFFmpegPaths();
  return runProcess(ffprobePath, args, options, 'FFprobe');
}

function runProcess(
  binaryPath: string,
  args: string[],
  options: RunOptions,
  processName: string
): Promise<ExecutionResult> {
  return new Promise((resolve, reject) => {
    let stdoutBuffer = '';
    let stderrBuffer = '';
    let timeoutId: NodeJS.Timeout | null = null;
    let child: ChildProcess | null = null;

    if (options.signal?.aborted) {
      return reject(new Error(`${processName} execution was cancelled before starting.`));
    }

    logger.debug('MEDIA', `Executing ${processName}: ${path.basename(binaryPath)} ${args.join(' ')}`);

    try {
      child = spawn(binaryPath, args, {
        windowsHide: true,
        shell: false, // Critical: execute directly without cmd.exe to prevent injection
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err: any) {
      logger.error('MEDIA', `Failed to spawn ${processName}: ${err?.message}`);
      return reject(new Error(`Failed to spawn ${processName} (${binaryPath}): ${err?.message}`));
    }

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        logger.info('MEDIA', `Cancellation requested for ${processName} process (PID: ${child?.pid})`);
        if (child && !child.killed) {
          child.kill('SIGTERM');
        }
      });
    }

    if (options.timeoutMs && options.timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        logger.warn('MEDIA', `${processName} exceeded timeout of ${options.timeoutMs}ms, terminating.`);
        if (child && !child.killed) {
          child.kill('SIGKILL');
        }
        reject(new Error(`${processName} process timed out after ${options.timeoutMs}ms`));
      }, options.timeoutMs);
    }

    child.stdout?.on('data', (data: Buffer) => {
      stdoutBuffer += data.toString('utf-8');
    });

    child.stderr?.on('data', (data: Buffer) => {
      const text = data.toString('utf-8');
      stderrBuffer += text;

      // Parse FFmpeg progress lines e.g. time=00:01:23.45 or speed= 15.3x
      if (options.onProgress) {
        const timeMatch = text.match(/time=(\d+):(\d+):(\d+\.\d+)/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = parseFloat(timeMatch[3]);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;

          const speedMatch = text.match(/speed=\s*([\d.]+x)/);
          const speed = speedMatch ? speedMatch[1] : undefined;

          const fpsMatch = text.match(/fps=\s*([\d.]+)/);
          const fps = fpsMatch ? parseFloat(fpsMatch[1]) : undefined;

          options.onProgress({ timeSeconds: totalSeconds, speed, fps });
        }
      }
    });

    child.on('error', (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      logger.error('MEDIA', `${processName} process error: ${err.message}`);
      reject(new Error(`${processName} execution failed: ${err.message}`));
    });

    child.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);

      const exitCode = code ?? 0;
      if (exitCode !== 0) {
        // Look for the last line of stderr for concise failure diagnostic
        const errLines = stderrBuffer.trim().split('\n');
        const lastErrLine = errLines[errLines.length - 1] || 'Unknown media error';
        logger.warn('MEDIA', `${processName} exited with non-zero code ${exitCode}: ${lastErrLine}`);
      }

      resolve({
        stdout: stdoutBuffer,
        stderr: stderrBuffer,
        exitCode,
      });
    });
  });
}
