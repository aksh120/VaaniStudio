import { describe, it, expect } from 'vitest';
import {
  MODEL_CATALOG,
  listModels,
  getModelsDir,
  getModelPath,
  isModelDownloaded,
} from '../../src/main/asr/modelManager.js';
import fs from 'node:fs';

describe('Model Manager Subsystem', () => {
  it('contains expected catalog models for fast, balanced, and quality modes', () => {
    expect(MODEL_CATALOG.length).toBeGreaterThanOrEqual(4);
    const ids = MODEL_CATALOG.map((m) => m.id);
    expect(ids).toContain('whisper-tiny-ct2-int8');
    expect(ids).toContain('whisper-base-ct2-int8');
    expect(ids).toContain('whisper-small-ct2-int8');
    expect(ids).toContain('whisper-medium-ct2-int8');

    const recommended = MODEL_CATALOG.find((m) => m.isRecommended);
    expect(recommended).toBeDefined();
    expect(recommended?.id).toBe('whisper-small-ct2-int8');
  });

  it('resolves valid models directory and model path', () => {
    const modelsDir = getModelsDir();
    expect(typeof modelsDir).toBe('string');
    expect(modelsDir.length).toBeGreaterThan(0);
    expect(fs.existsSync(modelsDir)).toBe(true);

    const tinyPath = getModelPath('whisper-tiny-ct2-int8');
    expect(tinyPath).toContain('whisper-tiny-ct2-int8');
  });

  it('lists models with isDownloaded flag properly set', () => {
    const models = listModels();
    expect(models.length).toBe(MODEL_CATALOG.length);
    for (const m of models) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.name).toBe('string');
      expect(typeof m.sizeMB).toBe('number');
      expect(typeof m.isDownloaded).toBe('boolean');
    }
  });

  it('detects un-downloaded model correctly', () => {
    const isDownloaded = isModelDownloaded('non-existent-model-id');
    expect(isDownloaded).toBe(false);
  });
});
