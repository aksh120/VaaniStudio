/**
 * Unit Tests - Hardware Optimization & Performance Profiling
 * Phase 10: TASK-047, TASK-048, TASK-049
 */

import { describe, it, expect } from 'vitest';
import {
  PERFORMANCE_PROFILES,
  getPerformanceProfileConfig,
  calculateThreadAllocation,
} from '../../src/shared/hardware/hardwareProfiles.js';
import {
  getOptimalASRThreads,
  getOptimalFFmpegThreads,
  getCPUAllocationConfig,
  applyWorkerProcessPriority,
} from '../../src/main/hardware/cpuAllocation.js';
import {
  getMemorySnapshot,
  isMemoryUnderPressure,
  cleanupApplicationCache,
  DEFAULT_RSS_PRESSURE_THRESHOLD_MB,
} from '../../src/main/hardware/memoryManager.js';
import { buildBurnInArgs } from '../../src/main/media/videoRenderer.js';
import { detectHardwareProfile } from '../../src/main/hardware.js';

describe('Phase 10: Hardware Optimization & Performance Profiling', () => {
  describe('TASK-047: Hardware Performance Profiles', () => {
    it('provides distinct configurations for fast, balanced, and quality modes', () => {
      expect(PERFORMANCE_PROFILES.fast).toBeDefined();
      expect(PERFORMANCE_PROFILES.balanced).toBeDefined();
      expect(PERFORMANCE_PROFILES.quality).toBeDefined();

      // Fast mode
      expect(PERFORMANCE_PROFILES.fast.beamSize).toBe(1);
      expect(PERFORMANCE_PROFILES.fast.crf).toBe(24);
      expect(PERFORMANCE_PROFILES.fast.modelSize).toBe('tiny');
      expect(PERFORMANCE_PROFILES.fast.ffmpegPreset).toBe('fast');

      // Balanced mode (Target Core i7-3770 default)
      expect(PERFORMANCE_PROFILES.balanced.beamSize).toBe(2);
      expect(PERFORMANCE_PROFILES.balanced.crf).toBe(22);
      expect(PERFORMANCE_PROFILES.balanced.modelSize).toBe('small');
      expect(PERFORMANCE_PROFILES.balanced.ffmpegPreset).toBe('medium');

      // Quality mode
      expect(PERFORMANCE_PROFILES.quality.beamSize).toBe(5);
      expect(PERFORMANCE_PROFILES.quality.crf).toBe(18);
      expect(PERFORMANCE_PROFILES.quality.modelSize).toBe('medium');
      expect(PERFORMANCE_PROFILES.quality.ffmpegPreset).toBe('slow');
    });

    it('resolves complete configuration adjusted for host CPU', () => {
      const config = getPerformanceProfileConfig('balanced', {
        physicalCores: 4,
        logicalCores: 8,
      });

      expect(config.mode).toBe('balanced');
      expect(config.asrThreads).toBe(4);
      expect(config.ffmpegThreads).toBe(6);
      expect(config.beamSize).toBe(2);
    });

    it('falls back cleanly to balanced when given undefined or unrecognized mode', () => {
      const fallback = getPerformanceProfileConfig(undefined as any);
      expect(fallback.mode).toBe('balanced');
      expect(fallback.modelSize).toBe('small');
    });
  });

  describe('TASK-049: CPU Core Allocation and Process Priority', () => {
    it('allocates ASR threads matching physical cores to prevent hyper-threading thrashing', () => {
      // 4 physical cores -> 4 threads
      expect(getOptimalASRThreads(4)).toBe(4);
      // 8 physical cores -> 8 threads
      expect(getOptimalASRThreads(8)).toBe(8);
      // Minimum 1 thread
      expect(getOptimalASRThreads(0)).toBeGreaterThanOrEqual(1);
    });

    it('allocates FFmpeg threads reserving at least 2 logical threads for UI responsiveness', () => {
      // 8 logical threads -> 6 FFmpeg threads (leaving 2 for UI)
      expect(getOptimalFFmpegThreads(8)).toBe(6);
      // 16 logical threads -> 14 FFmpeg threads
      expect(getOptimalFFmpegThreads(16)).toBe(14);
      // 4 logical threads -> 2 FFmpeg threads
      expect(getOptimalFFmpegThreads(4)).toBe(2);
      // Edge case: 2 logical threads -> 1 FFmpeg thread
      expect(getOptimalFFmpegThreads(2)).toBe(1);
    });

    it('returns valid CPU allocation config with UI reserve', () => {
      const config = getCPUAllocationConfig();
      expect(config.asrThreads).toBeGreaterThanOrEqual(1);
      expect(config.ffmpegThreads).toBeGreaterThanOrEqual(1);
      expect(config.reservedUIThreads).toBeGreaterThanOrEqual(1);
    });

    it('thread allocation calculator adapts to custom core specs', () => {
      const alloc = calculateThreadAllocation({ physicalCores: 4, logicalCores: 8 });
      expect(alloc.asrThreads).toBe(4);
      expect(alloc.ffmpegThreads).toBe(6);
    });

    it('safely applies below-normal process priority without throwing', () => {
      // Current process PID
      const result = applyWorkerProcessPriority(process.pid);
      expect(typeof result).toBe('boolean');

      // Invalid PID returns false
      expect(applyWorkerProcessPriority(0)).toBe(false);
      expect(applyWorkerProcessPriority(undefined)).toBe(false);
    });

    it('burn-in argument builder includes -threads parameter', () => {
      const args = buildBurnInArgs({
        inputVideoPath: 'input.mp4',
        outputPath: 'output.mp4',
        assFilePath: 'subs.ass',
        threads: 6,
      });

      const threadIndex = args.indexOf('-threads');
      expect(threadIndex).toBeGreaterThan(-1);
      expect(args[threadIndex + 1]).toBe('6');
    });
  });

  describe('TASK-048: Memory Management and Cache Monitoring', () => {
    it('captures process and system memory metrics snapshot', () => {
      const stats = getMemorySnapshot();
      expect(stats).toBeDefined();
      expect(stats.rssMB).toBeGreaterThan(0);
      expect(stats.heapUsedMB).toBeGreaterThan(0);
      expect(stats.heapTotalMB).toBeGreaterThanOrEqual(stats.heapUsedMB);
      expect(stats.systemTotalMB).toBeGreaterThan(0);
      expect(stats.systemFreeMB).toBeGreaterThan(0);
      expect(typeof stats.timestamp).toBe('string');
    });

    it('evaluates memory pressure against the 4 GB ceiling threshold', () => {
      expect(DEFAULT_RSS_PRESSURE_THRESHOLD_MB).toBe(3500);

      // A giant threshold (e.g. 1,000,000 MB) should evaluate to false
      expect(isMemoryUnderPressure(1_000_000)).toBe(false);

      // A tiny threshold (e.g. 1 MB) should evaluate to true
      expect(isMemoryUnderPressure(1)).toBe(true);
    });

    it('executes cache cleanup safely without throwing', () => {
      const cleanup = cleanupApplicationCache({ olderThanMs: 0 });
      expect(cleanup).toBeDefined();
      expect(cleanup.filesDeleted).toBeGreaterThanOrEqual(0);
      expect(cleanup.bytesReclaimed).toBeGreaterThanOrEqual(0);
      expect(typeof cleanup.freedMB).toBe('number');
    });
  });

  describe('System Hardware Profiler Integration', () => {
    it('detectHardwareProfile returns complete hardware profile with thread allocations and memory stats', () => {
      const profile = detectHardwareProfile();
      expect(profile).toBeDefined();
      expect(profile.cpuModel.length).toBeGreaterThan(0);
      expect(profile.physicalCores).toBeGreaterThanOrEqual(1);
      expect(profile.logicalCores).toBeGreaterThanOrEqual(1);
      expect(profile.totalMemoryMB).toBeGreaterThan(0);
      expect(['cpu', 'cuda']).toContain(profile.inferenceDevice);
      expect(['fast', 'balanced', 'quality']).toContain(profile.recommendedMode);

      // Allocated threads
      expect(profile.allocatedThreads).toBeDefined();
      expect(profile.allocatedThreads?.asrThreads).toBeGreaterThanOrEqual(1);
      expect(profile.allocatedThreads?.ffmpegThreads).toBeGreaterThanOrEqual(1);
      expect(profile.allocatedThreads?.reservedUIThreads).toBeGreaterThanOrEqual(1);

      // Memory stats
      expect(profile.memoryStats).toBeDefined();
      expect(profile.memoryStats?.rssMB).toBeGreaterThan(0);
    }, 15000);
  });
});
