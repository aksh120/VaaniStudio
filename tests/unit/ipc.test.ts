import { describe, it, expect } from 'vitest';
import { IPC_CHANNELS, IPCResult } from '../../src/shared/types/models.js';
import { detectHardwareProfile } from '../../src/main/hardware.js';

describe('IPC Contracts and Hardware Profile Detection', () => {
  it('defines all required IPC channels as immutable constants', () => {
    expect(IPC_CHANNELS.GET_HARDWARE_PROFILE).toBe('vaani:get-hardware-profile');
    expect(IPC_CHANNELS.SELECT_MEDIA_FILE).toBe('vaani:select-media-file');
    expect(IPC_CHANNELS.SAVE_PROJECT).toBe('vaani:save-project');
    expect(IPC_CHANNELS.LOAD_PROJECT).toBe('vaani:load-project');
    expect(IPC_CHANNELS.OPEN_PATH).toBe('vaani:open-path');
  });

  it('detects system hardware and enforces CPU-first execution for legacy GPUs', () => {
    const profile = detectHardwareProfile();
    expect(profile.physicalCores).toBeGreaterThanOrEqual(1);
    expect(profile.logicalCores).toBeGreaterThanOrEqual(1);
    expect(profile.totalMemoryMB).toBeGreaterThanOrEqual(2048);
    // On the target PC, inferenceDevice must default to cpu
    expect(profile.inferenceDevice).toBe('cpu');
    expect(profile.hasCudaSupport).toBe(false);
  });

  it('formats standardized success and error IPC result envelopes', () => {
    const successResult: IPCResult<string> = {
      success: true,
      data: 'operation_complete',
    };
    expect(successResult.success).toBe(true);
    expect(successResult.data).toBe('operation_complete');

    const errorResult: IPCResult<void> = {
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: 'Something went wrong',
        actionableGuidance: 'Please retry the operation.',
      },
    };
    expect(errorResult.success).toBe(false);
    expect(errorResult.error?.code).toBe('TEST_ERROR');
    expect(errorResult.error?.actionableGuidance).toBeDefined();
  });
});
