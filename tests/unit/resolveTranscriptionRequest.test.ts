import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/shared/defaults.js';
import {
  mapLanguageModeToEngineLanguage,
  resolveTranscriptionRequest,
} from '../../src/shared/resolveTranscriptionRequest.js';

describe('resolveTranscriptionRequest', () => {
  it('maps project language modes to faster-whisper language values', () => {
    expect(mapLanguageModeToEngineLanguage('english')).toBe('en');
    expect(mapLanguageModeToEngineLanguage('hindi')).toBe('hi');
    expect(mapLanguageModeToEngineLanguage('hinglish')).toBe('auto');
    expect(mapLanguageModeToEngineLanguage('auto')).toBe('auto');
  });

  it('honors the profile-recommended model and profile decoding defaults', () => {
    const request = resolveTranscriptionRequest({
      settings: {
        ...DEFAULT_SETTINGS,
        modelId: 'whisper-large-v3-ct2-int8',
        modelSelectionSource: 'profile',
      },
      hardware: {
        inferenceDevice: 'cpu',
        inferenceComputeType: 'int8',
        physicalCores: 4,
        logicalCores: 8,
      },
    });

    expect(request).toMatchObject({
      engineId: 'faster-whisper',
       modelId: 'whisper-large-v3-ct2-int8',
       modelSelectionSource: 'profile',
       performanceMode: 'balanced',
      language: 'auto',
      beamSize: 2,
      temperature: 0,
      vadFilter: true,
      device: 'cpu',
      computeType: 'int8',
      cpuThreads: 4,
    });
  });

  it('lets an explicit user model override the profile while retaining profile decoding', () => {
    const request = resolveTranscriptionRequest({
      settings: {
        ...DEFAULT_SETTINGS,
        performanceMode: 'quality',
        modelId: 'whisper-large-v3-ct2-int8',
        modelSelectionSource: 'user',
      },
      hardware: {
        inferenceDevice: 'cpu',
        inferenceComputeType: 'int8',
        physicalCores: 8,
        logicalCores: 16,
      },
    });

    expect(request.modelId).toBe('whisper-large-v3-ct2-int8');
    expect(request.modelSelectionSource).toBe('user');
    expect(request.performanceMode).toBe('quality');
    expect(request.beamSize).toBe(5);
  });

  it('treats an explicit request model as a user override', () => {
    const request = resolveTranscriptionRequest({
      settings: {
        ...DEFAULT_SETTINGS,
        performanceMode: 'quality',
        modelId: 'whisper-small-ct2-int8',
        modelSelectionSource: 'profile',
      },
      options: {
        modelId: 'whisper-large-v3-ct2-int8',
      },
    });
    expect(request.modelId).toBe('whisper-large-v3-ct2-int8');
    expect(request.modelSelectionSource).toBe('user');
  });

  it('retains explicit request defaults and a probed CUDA compute type', () => {
    const request = resolveTranscriptionRequest({
      settings: {
        ...DEFAULT_SETTINGS,
        languageMode: 'hindi',
      },
      hardware: {
        inferenceDevice: 'cuda',
        inferenceComputeType: 'float16',
        physicalCores: 8,
        logicalCores: 16,
        allocatedThreads: {
          asrThreads: 6,
        },
      },
      options: {
        vadFilter: false,
        beamSize: 1,
        cpuThreads: 2,
      },
    });

    expect(request.language).toBe('hi');
    expect(request.device).toBe('cuda');
    expect(request.computeType).toBe('float16');
    expect(request.vadFilter).toBe(false);
    expect(request.beamSize).toBe(1);
    expect(request.cpuThreads).toBe(2);
  });
});
