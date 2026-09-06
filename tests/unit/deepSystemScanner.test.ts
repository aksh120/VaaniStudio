/**
 * Unit Tests - Deep System Hardware Scanner & Model Advisor
 * Verifies AVX2 instruction detection, hardware tier evaluation,
 * opt-in command execution privacy safeguards, and model recommendation heuristics.
 */

import { describe, it, expect } from 'vitest';
import {
  checkAvx2Support,
  evaluateModelRecommendation,
  getBaselineHardwareMetrics,
  runDeepSystemScan,
} from '../../src/main/hardware/deepSystemScanner.js';

describe('Deep System Hardware Scanner & Model Advisor', () => {
  describe('checkAvx2Support: CPU Instruction Set Detection', () => {
    it('accurately identifies Intel processors with AVX2 instruction sets', () => {
      // Haswell (4th Gen) and later introduced AVX2
      expect(checkAvx2Support('Intel(R) Core(TM) i7-4770 CPU @ 3.40GHz')).toBe(true);
      expect(checkAvx2Support('Intel(R) Core(TM) i5-8400 CPU @ 2.80GHz')).toBe(true);
      expect(checkAvx2Support('12th Gen Intel(R) Core(TM) i7-12700K')).toBe(true);
      expect(checkAvx2Support('Intel(R) Core(TM) i9-13900K')).toBe(true);
      expect(checkAvx2Support('Intel(R) Core(TM) Ultra 7 155H')).toBe(true);
      expect(checkAvx2Support('Intel(R) Xeon(R) CPU E5-2680 v3 @ 2.50GHz')).toBe(true);
    });

    it('accurately identifies AMD Ryzen and modern server processors with AVX2', () => {
      // AMD Zen microarchitectures support AVX2
      expect(checkAvx2Support('AMD Ryzen 5 3600 6-Core Processor')).toBe(true);
      expect(checkAvx2Support('AMD Ryzen 7 5800X 8-Core Processor')).toBe(true);
      expect(checkAvx2Support('AMD Ryzen 9 7950X 16-Core Processor')).toBe(true);
      expect(checkAvx2Support('AMD Ryzen Threadripper 3960X 24-Core Processor')).toBe(true);
      expect(checkAvx2Support('AMD EPYC 7002 64-Core Processor')).toBe(true);
    });

    it('identifies Apple Silicon architectures as supporting high-performance vector operations', () => {
      expect(checkAvx2Support('Apple M1')).toBe(true);
      expect(checkAvx2Support('Apple M2 Pro')).toBe(true);
      expect(checkAvx2Support('Apple M3 Max')).toBe(true);
    });

    it('accurately detects legacy Intel CPUs lacking AVX2 instructions', () => {
      // Core 2 Duo, Lynnfield (i5-750), Sandy Bridge (AVX1 only), Ivy Bridge (AVX1 only)
      expect(checkAvx2Support('Intel(R) Core(TM)2 Duo CPU E8400 @ 3.00GHz')).toBe(false);
      expect(checkAvx2Support('Intel(R) Core(TM) i5-750 @ 2.67GHz')).toBe(false);
      expect(checkAvx2Support('Intel(R) Core(TM) i7-2600K CPU @ 3.40GHz')).toBe(false);
      expect(checkAvx2Support('Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz')).toBe(false);
      expect(checkAvx2Support('Intel(R) Celeron(R) CPU G4900 @ 3.10GHz')).toBe(false);
      expect(checkAvx2Support('Intel(R) Pentium(R) CPU G2030 @ 3.00GHz')).toBe(false);
    });

    it('accurately detects legacy AMD CPUs lacking AVX2 instructions', () => {
      // Phenom, Athlon, Bulldozer (FX-8350 has AVX1 / FMA4, no AVX2)
      expect(checkAvx2Support('AMD Phenom(TM) II X4 965 Processor')).toBe(false);
      expect(checkAvx2Support('AMD Athlon(TM) 64 X2 Dual Core Processor 5200+')).toBe(false);
      expect(checkAvx2Support('AMD FX(tm)-8350 Eight-Core Processor')).toBe(false);
    });

    it('handles empty or unrecognized strings safely without throwing', () => {
      expect(checkAvx2Support('')).toBe(false);
      expect(checkAvx2Support('Unknown Architecture Processor')).toBe(false);
    });
  });

  describe('evaluateModelRecommendation: Hardware Tier Evaluation', () => {
    it('recommends Whisper Medium when a high-end dedicated NVIDIA GPU is present', () => {
      const rec = evaluateModelRecommendation({
        osName: 'Windows 11 Pro',
        cpuName: 'AMD Ryzen 7 5800X',
        totalRamMB: 32768,
        availableRamMB: 20480,
        physicalCores: 8,
        logicalCores: 16,
        hasAvx2: true,
        isDedicatedGpu: true,
        gpuVramMB: 8192,
        hasCuda: true,
        gpuName: 'NVIDIA GeForce RTX 3070',
      });

      expect(rec.recommendedModelId).toBe('whisper-medium-ct2-int8');
      expect(rec.estimatedSpeedFactor).toContain('Realtime (CUDA GPU)');
      expect(rec.recommendationReason).toContain('Dedicated NVIDIA GPU');
      expect(rec.recommendationReason).toContain('Whisper Medium');
    });

    it('recommends Whisper Small when a mid-range dedicated NVIDIA GPU is present', () => {
      const rec = evaluateModelRecommendation({
        osName: 'Windows 10 Home',
        cpuName: 'Intel Core i5-10400',
        totalRamMB: 16384,
        availableRamMB: 10240,
        physicalCores: 6,
        logicalCores: 12,
        hasAvx2: true,
        isDedicatedGpu: true,
        gpuVramMB: 4096,
        hasCuda: true,
        gpuName: 'NVIDIA GeForce GTX 1650',
      });

      expect(rec.recommendedModelId).toBe('whisper-small-ct2-int8');
      expect(rec.estimatedSpeedFactor).toContain('Realtime (CUDA GPU)');
      expect(rec.recommendationReason).toContain('Whisper Small');
    });

    it('recommends Whisper Small with high throughput for modern multi-core AVX2 workstations with ample RAM', () => {
      const rec = evaluateModelRecommendation({
        osName: 'Windows 11 Enterprise',
        cpuName: 'Intel Core i7-12700',
        totalRamMB: 32768,
        availableRamMB: 18432,
        physicalCores: 8,
        logicalCores: 16,
        hasAvx2: true,
        isDedicatedGpu: false,
        gpuVramMB: 0,
        hasCuda: false,
        gpuName: 'Intel UHD Graphics 770',
      });

      expect(rec.recommendedModelId).toBe('whisper-small-ct2-int8');
      expect(rec.estimatedSpeedFactor).toContain('Realtime (CPU Multi-threaded)');
      expect(rec.recommendationReason).toContain('Multi-core CPU with AVX2');
      expect(rec.recommendationReason).toContain('Whisper Small');
    });

    it('recommends Whisper Small with balanced throughput for 8-16 GB RAM quad-core systems', () => {
      const rec = evaluateModelRecommendation({
        osName: 'Windows 10 Pro',
        cpuName: 'Intel Core i7-3770',
        totalRamMB: 8192,
        availableRamMB: 4096,
        physicalCores: 4,
        logicalCores: 8,
        hasAvx2: false,
        isDedicatedGpu: false,
        gpuVramMB: 0,
        hasCuda: false,
        gpuName: 'Intel HD Graphics 4000',
      });

      expect(rec.recommendedModelId).toBe('whisper-small-ct2-int8');
      expect(rec.estimatedSpeedFactor).toContain('Realtime (CPU Multi-threaded)');
      expect(rec.recommendationReason).toContain('Standard multi-core system');
    });

    it('recommends Whisper Base for memory-constrained machines (6-8 GB RAM)', () => {
      const rec = evaluateModelRecommendation({
        osName: 'Windows 10',
        cpuName: 'Intel Core i3-4130',
        totalRamMB: 6144,
        availableRamMB: 2048,
        physicalCores: 2,
        logicalCores: 4,
        hasAvx2: true,
        isDedicatedGpu: false,
        gpuVramMB: 0,
        hasCuda: false,
        gpuName: 'Intel HD Graphics 4400',
      });

      expect(rec.recommendedModelId).toBe('whisper-base-ct2-int8');
      expect(rec.estimatedSpeedFactor).toContain('Realtime (CPU)');
      expect(rec.recommendationReason).toContain('Whisper Base');
    });

    it('recommends Whisper Tiny for heavily constrained hardware (< 6 GB RAM or legacy dual core)', () => {
      const rec = evaluateModelRecommendation({
        osName: 'Windows 7',
        cpuName: 'Intel Core 2 Duo E8400',
        totalRamMB: 4096,
        availableRamMB: 1200,
        physicalCores: 2,
        logicalCores: 2,
        hasAvx2: false,
        isDedicatedGpu: false,
        gpuVramMB: 0,
        hasCuda: false,
        gpuName: 'VGA Compatible Controller',
      });

      expect(rec.recommendedModelId).toBe('whisper-tiny-ct2-int8');
      expect(rec.estimatedSpeedFactor).toContain('Realtime (Fast Draft)');
      expect(rec.recommendationReason).toContain('Resource-constrained system');
      expect(rec.recommendationReason).toContain('Whisper Tiny');
    });
  });

  describe('getBaselineHardwareMetrics: Non-Intrusive OS Fallback', () => {
    it('retrieves host hardware metrics via standard Node.js APIs without executing commands', () => {
      const baseline = getBaselineHardwareMetrics();

      expect(baseline.totalRamMB).toBeGreaterThan(0);
      expect(baseline.availableRamMB).toBeGreaterThan(0);
      expect(baseline.physicalCores).toBeGreaterThanOrEqual(1);
      expect(baseline.logicalCores).toBeGreaterThanOrEqual(1);
      expect(typeof baseline.cpuName).toBe('string');
      expect(typeof baseline.hasAvx2).toBe('boolean');
    });
  });

  describe('runDeepSystemScan: User Consent Enforcement', () => {
    it('strictly respects user consent by avoiding external command execution when disallowed', async () => {
      const result = await runDeepSystemScan(false);

      expect(result.allowed).toBe(false);
      expect(result.ramDetails.totalMB).toBeGreaterThan(0);
      expect(result.ramDetails.availableMB).toBeGreaterThan(0);
      expect(result.cpuDetails.physicalCores).toBeGreaterThanOrEqual(1);
      expect(result.cpuDetails.logicalCores).toBeGreaterThanOrEqual(1);
      expect(result.recommendedModelId).toBeDefined();
      expect(result.recommendationReason).toBeDefined();
      expect(result.estimatedSpeedFactor).toBeDefined();
      expect(result.scannedAt).toBeDefined();
    });

    it('returns valid scan and recommendation when command execution is permitted', async () => {
      const result = await runDeepSystemScan(true);

      expect(result.allowed).toBe(true);
      expect(result.ramDetails.totalMB).toBeGreaterThan(0);
      expect(result.cpuDetails.physicalCores).toBeGreaterThanOrEqual(1);
      expect(result.recommendedModelId).toBeDefined();
      expect(result.recommendationReason.length).toBeGreaterThan(10);
      expect(result.estimatedSpeedFactor).toContain('Realtime');
    });
  });
});
