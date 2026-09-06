/**
 * Memory Management and Cache Reclamation Subsystem
 * Phase 10: TASK-048
 *
 * Monitors process Resident Set Size (RSS) and heap allocations,
 * enforces memory ceilings (< 4 GB allocation budget on 16 GB baseline),
 * triggers Node.js garbage collection, and provides safe disk cache eviction.
 */

import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger.js';
import { MemoryStats } from '../../shared/types/models.js';
import { getAudioCacheDir } from '../media/audio.js';

// 3.5 GB threshold to ensure process stays comfortably under 4 GB ceiling
export const DEFAULT_RSS_PRESSURE_THRESHOLD_MB = 3500;

/**
 * Returns current snapshot of memory metrics (MB)
 */
export function getMemorySnapshot(): MemoryStats {
  const mem = process.memoryUsage();
  const toMB = (bytes: number) => Math.round(bytes / (1024 * 1024));

  return {
    rssMB: toMB(mem.rss),
    heapUsedMB: toMB(mem.heapUsed),
    heapTotalMB: toMB(mem.heapTotal),
    externalMB: toMB(mem.external),
    systemFreeMB: Math.round(os.freemem() / (1024 * 1024)),
    systemTotalMB: Math.round(os.totalmem() / (1024 * 1024)),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Checks whether process memory is approaching the 4 GB ceiling
 */
export function isMemoryUnderPressure(thresholdMB: number = DEFAULT_RSS_PRESSURE_THRESHOLD_MB): boolean {
  const stats = getMemorySnapshot();
  const underPressure = stats.rssMB >= thresholdMB;
  if (underPressure) {
    logger.warn(
      'HARDWARE',
      `Memory pressure detected: RSS is ${stats.rssMB} MB (ceiling threshold: ${thresholdMB} MB).`
    );
  }
  return underPressure;
}

/**
 * Triggers Node.js garbage collection if runtime flag is enabled (--expose-gc)
 */
export function triggerGarbageCollection(): boolean {
  if (typeof (global as any).gc === 'function') {
    try {
      (global as any).gc();
      logger.info('HARDWARE', 'Explicit garbage collection executed.');
      return true;
    } catch (err: any) {
      logger.warn('HARDWARE', `Failed to invoke garbage collector: ${err?.message}`);
      return false;
    }
  }
  return false;
}

export interface CacheCleanupOptions {
  olderThanMs?: number; // Delete files older than this duration
  clearAllAudio?: boolean; // If true, clears audio cache files
  clearThumbnails?: boolean; // If true, clears thumbnail cache
}

export interface CacheCleanupResult {
  filesDeleted: number;
  bytesReclaimed: number;
  freedMB: number;
}

/**
 * Safely sweeps cache directories to free disk space and reduce process memory
 */
export function cleanupApplicationCache(options: CacheCleanupOptions = {}): CacheCleanupResult {
  let filesDeleted = 0;
  let bytesReclaimed = 0;
  const now = Date.now();
  const maxAge = options.olderThanMs ?? (24 * 60 * 60 * 1000); // 24h default

  const dirsToClean: string[] = [];

  // Audio cache
  try {
    const audioDir = getAudioCacheDir();
    if (fs.existsSync(audioDir)) {
      dirsToClean.push(audioDir);
    }
  } catch {}

  // System temporary render files
  try {
    const tempRenderDir = path.join(os.tmpdir(), 'vaani_render');
    if (fs.existsSync(tempRenderDir)) {
      dirsToClean.push(tempRenderDir);
    }
  } catch {}

  for (const dir of dirsToClean) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            const age = now - stat.mtimeMs;
            const isTemp = file.endsWith('.tmp.wav') || file.endsWith('.ass') || file.startsWith('burnin_');

            if (options.clearAllAudio || isTemp || age >= maxAge) {
              fs.unlinkSync(fullPath);
              filesDeleted++;
              bytesReclaimed += stat.size;
            }
          }
        } catch {
          // Skip file if currently in use or unlinked
        }
      }
    } catch (dirErr: any) {
      logger.warn('HARDWARE', `Failed to clean cache directory ${dir}: ${dirErr?.message}`);
    }
  }

  // Trigger GC after clearing caches
  triggerGarbageCollection();

  const freedMB = Math.round((bytesReclaimed / (1024 * 1024)) * 10) / 10;
  logger.info('HARDWARE', `Cache cleanup complete: removed ${filesDeleted} files, freed ${freedMB} MB`);

  return {
    filesDeleted,
    bytesReclaimed,
    freedMB,
  };
}
