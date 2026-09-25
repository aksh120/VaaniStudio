import os from 'node:os';
import { HardwareProfile, PerformanceMode } from '../shared/types/models.js';
import { logger } from './logger.js';
import { getCPUAllocationConfig } from './hardware/cpuAllocation.js';
import { getMemorySnapshot } from './hardware/memoryManager.js';
import { resolveInferenceDevice } from './asr/gpuFallback.js';

export function detectHardwareProfile(): HardwareProfile {
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown x86_64 CPU';
  const logicalCores = cpus.length;
  // Estimate physical cores assuming typical hyperthreading ratio of 2:1 when >= 4 threads
  const physicalCores = logicalCores >= 4 ? Math.floor(logicalCores / 2) : logicalCores;
  const totalMemoryMB = Math.round(os.totalmem() / (1024 * 1024));

  // Determine baseline performance mode based on RAM and CPU cores
  let recommendedMode: PerformanceMode = 'balanced';
  if (totalMemoryMB < 8192 || physicalCores < 4) {
    recommendedMode = 'fast';
  } else if (totalMemoryMB >= 32768 && physicalCores >= 8) {
    recommendedMode = 'quality';
  }

  // Detect GPU / CUDA capability
  const gpuResolution = resolveInferenceDevice();
  const threadConfig = getCPUAllocationConfig();
  const memoryStats = getMemorySnapshot();

  const profile: HardwareProfile = {
    cpuModel,
    physicalCores,
    logicalCores,
    totalMemoryMB,
    gpuName: gpuResolution.gpuName || 'Integrated Graphics / CPU Execution',
    gpuVramMB: gpuResolution.device === 'cuda' ? 4096 : 1024,
    hasCudaSupport: gpuResolution.device === 'cuda',
    recommendedMode,
    inferenceDevice: gpuResolution.device,
    inferenceComputeType: gpuResolution.computeType,
    allocatedThreads: threadConfig,
    memoryStats,
  };

  logger.info('HARDWARE', `Detected CPU: ${cpuModel} (${physicalCores}P/${logicalCores}L cores), RAM: ${totalMemoryMB} MB`);
  logger.info('HARDWARE', `Allocated threads: ASR=${threadConfig.asrThreads}, FFmpeg=${threadConfig.ffmpegThreads}, UI Reserve=${threadConfig.reservedUIThreads}`);
  logger.info('HARDWARE', `Inference mode: ${profile.inferenceDevice} (${profile.recommendedMode})`);

  return profile;
}

