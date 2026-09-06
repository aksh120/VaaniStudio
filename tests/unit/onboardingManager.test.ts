import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  determineRecommendedModel,
  checkOnboardingStatus,
  completeOnboarding,
  readUserConfig,
  writeUserConfig,
} from '../../src/main/onboarding/onboardingManager.js';
import { verifyModelIntegrity, getModelPath } from '../../src/main/asr/modelManager.js';
import { HardwareProfile } from '../../src/shared/types/models.js';

describe('Phase 13: First-Run Onboarding and Model Management (TASK-057)', () => {
  let tempConfigDir: string;
  const originalAppData = process.env.APPDATA;

  beforeEach(() => {
    tempConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vaani-onboarding-test-'));
    process.env.APPDATA = tempConfigDir;
  });

  afterEach(() => {
    process.env.APPDATA = originalAppData;
    if (fs.existsSync(tempConfigDir)) {
      fs.rmSync(tempConfigDir, { recursive: true, force: true });
    }
  });

  it('recommends whisper-small for high-spec systems (8+ threads, 8+ GB RAM)', () => {
    const highSpec: HardwareProfile = {
      cpuModel: 'AMD Ryzen 7 5800X',
      physicalCores: 8,
      logicalCores: 16,
      totalMemoryMB: 16384,
      gpuName: 'NVIDIA RTX 3070',
      gpuVramMB: 8192,
      hasCudaSupport: true,
      recommendedMode: 'balanced',
      inferenceDevice: 'cuda',
    };

    const recommended = determineRecommendedModel(highSpec);
    expect(recommended).toBe('whisper-small-ct2-int8');
  });

  it('recommends whisper-tiny for constrained or low-spec systems', () => {
    const lowSpec: HardwareProfile = {
      cpuModel: 'Intel Core i3-4130',
      physicalCores: 2,
      logicalCores: 4,
      totalMemoryMB: 4096,
      gpuName: 'Intel HD Graphics 4400',
      gpuVramMB: 0,
      hasCudaSupport: false,
      recommendedMode: 'fast',
      inferenceDevice: 'cpu',
    };

    const recommended = determineRecommendedModel(lowSpec);
    expect(recommended).toBe('whisper-tiny-ct2-int8');
  });

  it('safely defaults recommendation when hardware profile is unavailable', () => {
    expect(determineRecommendedModel(null)).toBe('whisper-small-ct2-int8');
  });

  it('manages user onboarding state and persistence cleanly', () => {
    const initial = readUserConfig();
    expect(initial.hasCompletedOnboarding).toBe(false);

    completeOnboarding('whisper-small-ct2-int8');

    const updated = readUserConfig();
    expect(updated.hasCompletedOnboarding).toBe(true);
    expect(updated.defaultModelId).toBe('whisper-small-ct2-int8');
    expect(updated.completedAt).toBeDefined();
  });

  it('correctly reports onboarding status as completed when user config exists', () => {
    writeUserConfig({ hasCompletedOnboarding: true, defaultModelId: 'whisper-base-ct2-int8' });

    const status = checkOnboardingStatus(null);
    expect(status.hasCompletedOnboarding).toBe(true);
    expect(status.isFirstRun).toBe(false);
  });

  it('verifies model integrity reporting error for missing directory', async () => {
    const result = await verifyModelIntegrity('nonexistent-model-id-xyz');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Model directory not found on disk');
  });

  it('validates model integrity on valid model directory mock', async () => {
    const testModelId = 'test-mock-model';
    const testDir = getModelPath(testModelId);

    try {
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, 'config.json'), JSON.stringify({ model_type: 'whisper' }));
      fs.writeFileSync(path.join(testDir, 'model.bin'), Buffer.alloc(1024 * 64, 42));

      const result = await verifyModelIntegrity(testModelId);
      expect(result.valid).toBe(true);
      expect(result.modelId).toBe(testModelId);
      expect(result.filesChecked).toContain('config.json');
      expect(result.filesChecked).toContain('model.bin');
      expect(result.sha256).toBeDefined();
      expect(result.totalBytes).toBeGreaterThan(0);
    } finally {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    }
  });
});
