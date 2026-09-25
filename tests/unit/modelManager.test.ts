import { describe, it, expect } from 'vitest';
import {
  MODEL_CATALOG,
  listModels,
  getModelsDir,
  getModelPath,
  isModelDownloaded,
  formatDownloadProgress,
} from '../../src/main/asr/modelManager.js';
import fs from 'node:fs';

describe('Model Manager Subsystem', () => {
  it('contains expected catalog models for fast, balanced, and quality modes', () => {
    expect(MODEL_CATALOG).toHaveLength(5);
    const ids = MODEL_CATALOG.map((m) => m.id);
    expect(ids).toContain('whisper-tiny-ct2-int8');
    expect(ids).toContain('whisper-base-ct2-int8');
    expect(ids).toContain('whisper-small-ct2-int8');
    expect(ids).toContain('whisper-medium-ct2-int8');
    expect(ids).toContain('whisper-large-v3-ct2-int8');

    const recommended = MODEL_CATALOG.find((m) => m.isRecommended);
    expect(recommended).toBeDefined();
    expect(recommended?.id).toBe('whisper-small-ct2-int8');
  });

  it('describes Large v3 without making it the recommended model', () => {
    const large = MODEL_CATALOG.find(
      (model) => model.id === 'whisper-large-v3-ct2-int8'
    );
    expect(large).toMatchObject({
      engineId: 'faster-whisper',
      repoId: 'Systran/faster-whisper-large-v3',
      sizeMB: 3000,
      parameters: '1.55B',
      isRecommended: false,
    });
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

  it('formats download progress with megabytes, percentage, and transfer speed', () => {
    const progress = formatDownloadProgress(
      'Whisper Medium (INT8)',
      500 * 1024 * 1024,
      1500 * 1024 * 1024,
      12.5,
      780
    );

    expect(progress.percent).toBe(33);
    expect(progress.message).toContain('Whisper Medium (INT8)');
    expect(progress.message).toContain('500.0 / 1500.0 MB');
    expect(progress.message).toContain('(12.5 MB/s)');
  });

  it('clamps download progress percentage between 5% and 99% until fully complete', () => {
    const minProgress = formatDownloadProgress('Whisper Small (INT8)', 0, 1000 * 1024 * 1024);
    expect(minProgress.percent).toBe(5);

    const maxProgress = formatDownloadProgress('Whisper Small (INT8)', 1000 * 1024 * 1024, 1000 * 1024 * 1024);
    expect(maxProgress.percent).toBe(99);
  });
});
