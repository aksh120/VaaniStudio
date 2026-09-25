import { execSync } from 'node:child_process';
import { ASRComputeType, InferenceDevice } from '../../shared/types/models.js';
import { logger } from '../logger.js';
import { resolvePythonPath } from './pythonResolver.js';

export interface DeviceResolution {
  device: InferenceDevice;
  computeType: ASRComputeType;
  gpuName?: string;
  reason: string;
}

let cachedResolution: DeviceResolution | null = null;

/**
 * Checks if a specific GPU name is a known legacy architecture with compute capability < 5.0
 * (Fermi, Kepler, such as GT 710, GT 730, GTX 660, GTX 760, etc.)
 */
function isLegacyUnsupportedGpu(name: string): boolean {
  const lower = name.toLowerCase();
  const legacyPatterns = [
    /gt\s*7\d\d/i,      // GT 710, GT 720, GT 730, GT 740
    /gtx\s*6\d\d/i,     // GTX 650, GTX 660, etc.
    /gtx\s*7[0-5]\d/i,  // GTX 750 (first Maxwell, but older drivers), GTX 745
    /geforce\s*8\d\d/i,
    /geforce\s*9\d\d/i,
    /gt\s*6\d\d/i,
    /nvs\s*\d+/i,
    /quadro\s*k/i,      // Kepler Quadros
  ];
  return legacyPatterns.some((pattern) => pattern.test(lower));
}

/**
 * Probes the system video controllers and runtime for GPU acceleration compatibility.
 * Safely defaults to CPU INT8 if GPU support is missing, incompatible, or legacy.
 */
export function resolveInferenceDevice(): DeviceResolution {
  if (cachedResolution) {
    return cachedResolution;
  }

  // Check for environment variable override
  if (process.env.VAANI_FORCE_CPU === '1') {
    cachedResolution = {
      device: 'cpu',
      computeType: 'int8',
      reason: 'CPU forced via VAANI_FORCE_CPU environment variable.',
    };
    logger.info('HARDWARE', `Inference device: ${cachedResolution.device} (${cachedResolution.reason})`);
    return cachedResolution;
  }

  let detectedGpuName: string | undefined;

  // On Windows, query Win32_VideoController
  if (process.platform === 'win32') {
    let wmiOutput = '';
    try {
      // 1. Fast wmic query (~50-100ms)
      wmiOutput = execSync('wmic path win32_VideoController get name', {
        timeout: 1500,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString().trim();
    } catch {
      // 2. Fallback to PowerShell if wmic is not in PATH or disabled
      try {
        wmiOutput = execSync(
          'powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"',
          { timeout: 2500, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }
        ).toString().trim();
      } catch {
        // GPU query failed
      }
    }

    if (wmiOutput) {
      const lines = wmiOutput
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !/^name$/i.test(l));

      // Prioritize dedicated GPUs: NVIDIA first (for CUDA probe), then AMD Radeon, Intel Arc, or primary controller
      const nvidia = lines.find((l) => /nvidia|geforce|quadro|rtx|gtx/i.test(l));
      const amd = lines.find((l) => /amd|radeon/i.test(l));
      const intelArc = lines.find((l) => /arc\s+[a-z]?\d+/i.test(l));
      const anyRealGpu = lines.find((l) => !/basic\s+display|virtual|remote|microsoft\s+basic/i.test(l));

      detectedGpuName = nvidia || amd || intelArc || anyRealGpu || lines[0];
    }
  }

  if (detectedGpuName) {
    const isNvidia = /nvidia|geforce|quadro|rtx|gtx/i.test(detectedGpuName);

    if (isNvidia && isLegacyUnsupportedGpu(detectedGpuName)) {
      cachedResolution = {
        device: 'cpu',
        computeType: 'int8',
        gpuName: detectedGpuName,
        reason: `Detected legacy GPU (${detectedGpuName}) with Compute Capability < 5.0. Modern CUDA 12 runtimes require Compute Capability >= 5.0. Gracefully defaulted to CPU INT8.`,
      };
      logger.info('HARDWARE', `GPU Fallback: ${cachedResolution.reason}`);
      return cachedResolution;
    }

    if (isNvidia) {
      // For NVIDIA GPUs, test whether CTranslate2 can actually run with CUDA
      try {
        const pythonPath = resolvePythonPath();
        const testCode = 'import ctranslate2; print(ctranslate2.get_cuda_device_count())';
        const output = execSync(`"${pythonPath}" -c "${testCode}"`, {
          timeout: 4000,
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'ignore'],
        }).toString().trim();

        const count = parseInt(output, 10);
        if (!isNaN(count) && count > 0) {
          cachedResolution = {
            device: 'cuda',
            computeType: 'float16',
            gpuName: detectedGpuName,
            reason: `Detected compatible CUDA acceleration device: ${detectedGpuName}`,
          };
          logger.info('HARDWARE', `Inference device: cuda (${detectedGpuName})`);
          return cachedResolution;
        }
      } catch {
        // CUDA test failed, fall back cleanly to CPU
      }
    }
  }

  cachedResolution = {
    device: 'cpu',
    computeType: 'int8',
    gpuName: detectedGpuName,
    reason: detectedGpuName
      ? `Using ${detectedGpuName} with optimized CPU INT8 execution (CUDA requires compatible NVIDIA GPU).`
      : 'No dedicated GPU detected. Defaulted to optimized CPU INT8 execution.',
  };

  logger.info('HARDWARE', `Inference device: ${cachedResolution.device} (${cachedResolution.reason})`);
  return cachedResolution;
}
