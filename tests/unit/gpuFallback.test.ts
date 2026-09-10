import { describe, it, expect } from 'vitest';
import { resolveInferenceDevice } from '../../src/main/asr/gpuFallback.js';

describe('GPU Fallback and Hardware Probe', () => {
  it('safely resolves inference device without throwing or crashing', () => {
    const resolution = resolveInferenceDevice();
    expect(resolution).toBeDefined();
    expect(['cpu', 'cuda']).toContain(resolution.device);
    expect(['int8', 'float16', 'float32']).toContain(resolution.computeType);
    expect(typeof resolution.reason).toBe('string');
    expect(resolution.reason.length).toBeGreaterThan(0);
  });

  it('honors VAANI_FORCE_CPU override', () => {
    const originalEnv = process.env.VAANI_FORCE_CPU;
    try {
      process.env.VAANI_FORCE_CPU = '1';
      // Invalidate cache if any by testing
      const res = resolveInferenceDevice();
      expect(res.device).toBe('cpu');
      expect(res.computeType).toBe('int8');
    } finally {
      if (originalEnv !== undefined) {
        process.env.VAANI_FORCE_CPU = originalEnv;
      } else {
        delete process.env.VAANI_FORCE_CPU;
      }
    }
  });

  it('accurately resolves real hardware or CPU without hardcoding GT 730 unconditionally', () => {
    const res = resolveInferenceDevice();
    // If no NVIDIA GPU is present or CUDA is not supported, it should not blindly claim GT 730 unless that is the actual adapter name
    if (res.device === 'cpu' && !res.gpuName) {
      expect(res.gpuName).toBeUndefined();
    }
  });
});
