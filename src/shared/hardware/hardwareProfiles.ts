/**
 * Hardware Performance Profile Configurations
 * Phase 10: TASK-047 & TASK-049
 *
 * Defines execution configurations for Fast, Balanced, and Quality performance modes,
 * tailoring ASR model choice, beam sizes, thread counts, and FFmpeg encoding presets
 * for the host hardware profile.
 */

import { ASREngineId, PerformanceMode } from '../types/models.js';

export interface PerformanceProfileConfig {
  mode: PerformanceMode;
  engineId: ASREngineId;
  name: string;
  description: string;
  modelId: string;
  modelSize: 'tiny' | 'base' | 'small' | 'medium';
  beamSize: number;
  vadFilter: boolean;
  temperature: number;
  ffmpegPreset: 'ultrafast' | 'fast' | 'medium' | 'slow';
  crf: number;
  audioChunkDurationSeconds: number;
  asrThreads: number;
  ffmpegThreads: number;
  recommendedHardware: string;
}

export interface CPUCoreInfo {
  physicalCores: number;
  logicalCores: number;
}

/**
 * Calculates optimal thread allocations:
 * - CTranslate2 (ASR): matches physical cores (e.g. 4 on Core i7-3770) to prevent hyper-threading contention.
 * - FFmpeg: reserves at least 2 logical threads for the OS and UI event loop (e.g. 6 threads on an 8-thread CPU).
 */
export function calculateThreadAllocation(cpu?: CPUCoreInfo): { asrThreads: number; ffmpegThreads: number } {
  const physical = cpu?.physicalCores && cpu.physicalCores > 0 ? cpu.physicalCores : 4;
  const logical = cpu?.logicalCores && cpu.logicalCores > 0 ? cpu.logicalCores : 8;

  const asrThreads = Math.max(1, physical);
  const ffmpegThreads = Math.max(1, logical <= 2 ? 1 : logical - 2);

  return { asrThreads, ffmpegThreads };
}

/**
 * Base profile templates
 */
export const PERFORMANCE_PROFILES: Record<PerformanceMode, Omit<PerformanceProfileConfig, 'asrThreads' | 'ffmpegThreads'>> = {
  fast: {
    mode: 'fast',
    engineId: 'faster-whisper',
    name: 'Fast Mode',
    description: 'Greedy decoding with fast preset. Maximum throughput for quick drafts and lower-spec machines.',
    modelId: 'whisper-tiny-ct2-int8',
    modelSize: 'tiny',
    beamSize: 1,
    vadFilter: true,
    temperature: 0.0,
    ffmpegPreset: 'fast',
    crf: 24,
    audioChunkDurationSeconds: 900, // 15 min chunks
    recommendedHardware: 'Dual-core CPUs, under 8 GB RAM, or when maximum turnaround speed is required.',
  },
  balanced: {
    mode: 'balanced',
    engineId: 'faster-whisper',
    name: 'Balanced Mode',
    description: 'Quantized INT8 model with beam search. Optimal balance of transcription accuracy and speed.',
    modelId: 'whisper-small-ct2-int8',
    modelSize: 'small',
    beamSize: 2,
    vadFilter: true,
    temperature: 0.0,
    ffmpegPreset: 'medium',
    crf: 22,
    audioChunkDurationSeconds: 1800, // 30 min chunks
    recommendedHardware: 'Recommended for Intel Core i7-3770 / 16 GB RAM baseline and quad-core desktop systems.',
  },
  quality: {
    mode: 'quality',
    engineId: 'faster-whisper',
    name: 'Maximum Quality',
    description: 'Medium model with deep beam search (5) and higher-grade video encoding for pristine results.',
    modelId: 'whisper-medium-ct2-int8',
    modelSize: 'medium',
    beamSize: 5,
    vadFilter: true,
    temperature: 0.0,
    ffmpegPreset: 'slow',
    crf: 18,
    audioChunkDurationSeconds: 1800,
    recommendedHardware: 'High-end multi-core CPUs with 32+ GB RAM or dedicated modern NVIDIA GPUs.',
  },
};

/**
 * Resolves complete performance profile configuration adjusted for the host CPU
 */
export function getPerformanceProfileConfig(
  mode: PerformanceMode = 'balanced',
  cpu?: CPUCoreInfo
): PerformanceProfileConfig {
  const base = PERFORMANCE_PROFILES[mode] || PERFORMANCE_PROFILES.balanced;
  const { asrThreads, ffmpegThreads } = calculateThreadAllocation(cpu);

  return {
    ...base,
    asrThreads,
    ffmpegThreads,
  };
}
