/**
 * CPU Core Allocation and Process Priority Controller
 * Phase 10: TASK-049
 *
 * Allocates thread budgets for CTranslate2 ASR and FFmpeg video encoding,
 * and sets child process priorities to BELOW_NORMAL to guarantee that the
 * desktop UI shell remains responsive during 100% CPU loads.
 */

import os from 'node:os';
import { logger } from '../logger.js';
import { CPUAllocationConfig } from '../../shared/types/models.js';

/**
 * Returns optimal CTranslate2 ASR inference threads.
 * On Intel Core i7-3770 (4 physical cores / 8 threads), allocating 4 threads
 * prevents hyper-threading cache thrashing in dense matrix multiply routines.
 */
export function getOptimalASRThreads(physicalCores?: number): number {
  if (physicalCores && physicalCores > 0) {
    return Math.max(1, physicalCores);
  }
  const logical = os.cpus().length || 4;
  const estimatedPhysical = logical >= 4 ? Math.floor(logical / 2) : logical;
  return Math.max(1, estimatedPhysical);
}

/**
 * Returns optimal FFmpeg encoding threads.
 * Reserves at least 2 logical threads for the OS and UI event loop
 * (e.g., 6 threads on an 8-thread system).
 */
export function getOptimalFFmpegThreads(logicalCores?: number): number {
  const logical = logicalCores || os.cpus().length || 4;
  if (logical <= 2) {
    return 1;
  }
  return Math.max(1, logical - 2);
}

/**
 * Returns complete thread allocation configuration
 */
export function getCPUAllocationConfig(): CPUAllocationConfig {
  const logical = os.cpus().length || 4;
  const physical = logical >= 4 ? Math.floor(logical / 2) : logical;
  const asrThreads = getOptimalASRThreads(physical);
  const ffmpegThreads = getOptimalFFmpegThreads(logical);
  const reservedUIThreads = Math.max(1, logical - ffmpegThreads);

  return {
    asrThreads,
    ffmpegThreads,
    reservedUIThreads,
  };
}

/**
 * Applies below-normal process priority to a child worker process (Python or FFmpeg).
 * On Windows, this maps to BELOW_NORMAL_PRIORITY_CLASS, ensuring the desktop window
 * never enters a "Not Responding" state during heavy background processing.
 */
export function applyWorkerProcessPriority(pid?: number): boolean {
  if (!pid) return false;

  try {
    const priority = os.constants.priority?.PRIORITY_BELOW_NORMAL ?? 10;
    os.setPriority(pid, priority);
    logger.debug('HARDWARE', `Set process priority to BELOW_NORMAL (${priority}) for PID ${pid}`);
    return true;
  } catch (err: any) {
    logger.warn('HARDWARE', `Unable to set BELOW_NORMAL priority on PID ${pid}: ${err?.message}`);
    return false;
  }
}
