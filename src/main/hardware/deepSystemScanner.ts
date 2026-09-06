/**
 * Vaani Studio - Deep System Hardware Scanner & Model Recommendation Engine
 *
 * Optional, user-consented diagnostic tool to inspect detailed CPU, GPU, and RAM metrics
 * via read-only system queries to suggest the optimal Whisper ASR model.
 * Strictly 100% offline, zero cloud connectivity, hardened child process execution.
 */

import os from 'node:os';
import { spawn } from 'node:child_process';
import { DeepSystemScanResult } from '../../shared/types/models.js';
import { resolveInferenceDevice } from '../asr/gpuFallback.js';
import { logger } from '../logger.js';

export interface RawHardwareMetrics {
  osName: string;
  cpuName: string;
  physicalCores: number;
  logicalCores: number;
  maxClockGhz?: number;
  hasAvx2: boolean;
  gpuName: string;
  gpuVramMB: number;
  isDedicatedGpu: boolean;
  hasCuda: boolean;
  totalRamMB: number;
  availableRamMB: number;
}

/**
 * Checks CPU name heuristics for AVX2 support (Intel 4th Gen Haswell+, AMD Zen+, Apple Silicon).
 */
export function checkAvx2Support(cpuName: string): boolean {
  if (!cpuName) return false;
  const lower = cpuName.toLowerCase();

  // Apple Silicon always supports Advanced SIMD/NEON equivalent
  if (lower.includes('apple') || lower.includes('m1') || lower.includes('m2') || lower.includes('m3') || lower.includes('m4')) {
    return true;
  }

  // AMD Ryzen / Threadripper / EPYC (Zen architecture, 2017+) supports AVX2
  if (lower.includes('ryzen') || lower.includes('threadripper') || lower.includes('epyc')) {
    return true;
  }

  // 1st Gen Intel Core (3-digit model numbers, e.g. i5-750, i7-920) lacked AVX entirely
  if (/i[3579]-\d{3}(?:[a-z]+)?\b/.test(lower)) {
    return false;
  }

  // 4-digit and 5-digit Intel Core (2nd Gen up to 14th Gen):
  // Haswell (4th Gen) and later introduced AVX2 instructions
  const intelMatch = lower.match(/i[3579]-(\d{1,2})\d{3}(?:[a-z]+)?\b/);
  if (intelMatch && intelMatch[1]) {
    const gen = parseInt(intelMatch[1], 10);
    return gen >= 4;
  }

  // Intel Core Ultra (Meteor Lake+), modern N-series, or Xeon v3/v4/Scalable with AVX2
  if (
    lower.includes('ultra') ||
    lower.includes('intel(r) n') ||
    (lower.includes('xeon') &&
      (lower.includes('v3') ||
        lower.includes('v4') ||
        lower.includes('scalable') ||
        lower.includes('gold') ||
        lower.includes('platinum')))
  ) {
    return true;
  }

  // Default fallback check based on core count and modern OS
  return false;
}

/**
 * Evaluates hardware metrics to compute the optimal model recommendation.
 */
export function evaluateModelRecommendation(metrics: RawHardwareMetrics): {
  recommendedModelId: string;
  recommendationReason: string;
  estimatedSpeedFactor: string;
} {
  const { totalRamMB, physicalCores, hasAvx2, isDedicatedGpu, gpuVramMB, hasCuda } = metrics;

  // Tier 1: High-end GPU acceleration (CUDA with >= 6 GB VRAM)
  if (hasCuda && isDedicatedGpu && gpuVramMB >= 6144) {
    return {
      recommendedModelId: 'whisper-medium-ct2-int8',
      recommendationReason: `Dedicated NVIDIA GPU (${metrics.gpuName}) with ${(gpuVramMB / 1024).toFixed(1)} GB VRAM detected. Whisper Medium provides the highest fidelity transcription with rapid GPU acceleration.`,
      estimatedSpeedFactor: '12.0x - 18.0x Realtime (CUDA GPU)',
    };
  }

  // Tier 2: Dedicated GPU with 4-6 GB VRAM or CUDA
  if (hasCuda && isDedicatedGpu && gpuVramMB >= 3500) {
    return {
      recommendedModelId: 'whisper-small-ct2-int8',
      recommendationReason: `NVIDIA GPU (${metrics.gpuName}) with ${(gpuVramMB / 1024).toFixed(1)} GB VRAM. Whisper Small runs with lightning speed on GPU while maintaining exceptional accuracy on code-switched Hinglish.`,
      estimatedSpeedFactor: '8.0x - 12.0x Realtime (CUDA GPU)',
    };
  }

  // Tier 3: Powerful CPU workstation (16+ GB RAM, AVX2, >= 6 physical cores)
  if (totalRamMB >= 16000 && hasAvx2 && physicalCores >= 6) {
    return {
      recommendedModelId: 'whisper-small-ct2-int8',
      recommendationReason: `Multi-core CPU with AVX2 instruction support and ${(totalRamMB / 1024).toFixed(1)} GB RAM. Whisper Small is the recommended default, providing studio-grade transcription accuracy with ample headroom.`,
      estimatedSpeedFactor: '4.5x - 6.5x Realtime (CPU Multi-threaded)',
    };
  }

  // Tier 4: Mainstream standard PC (8-16 GB RAM, 4+ physical cores)
  if (totalRamMB >= 8000 && physicalCores >= 4) {
    return {
      recommendedModelId: 'whisper-small-ct2-int8',
      recommendationReason: `Standard multi-core system (${physicalCores} cores, ${(totalRamMB / 1024).toFixed(1)} GB RAM). Whisper Small offers the optimal balance of speech accuracy and responsive performance without memory exhaustion.`,
      estimatedSpeedFactor: '2.5x - 4.0x Realtime (CPU Multi-threaded)',
    };
  }

  // Tier 5: Budget / Low-resource PC (8 GB RAM or older CPU without AVX2)
  if (totalRamMB >= 6000) {
    return {
      recommendedModelId: 'whisper-base-ct2-int8',
      recommendationReason: `Moderate system resources detected (${(totalRamMB / 1024).toFixed(1)} GB RAM). Whisper Base provides solid recognition for conversational English and common Hindi vocabulary with low CPU overhead.`,
      estimatedSpeedFactor: '3.0x - 5.0x Realtime (CPU)',
    };
  }

  // Tier 6: Constrained / Legacy Hardware (< 6 GB RAM or dual-core)
  return {
    recommendedModelId: 'whisper-tiny-ct2-int8',
    recommendationReason: `Resource-constrained system detected (< 6 GB RAM or limited CPU cores). Whisper Tiny ensures fast, dependable transcription with an ultra-compact memory footprint (< 250 MB).`,
    estimatedSpeedFactor: '4.0x - 7.0x Realtime (Fast Draft)',
  };
}

/**
 * Gathers baseline hardware metrics using standard Node.js OS APIs (zero command execution).
 */
export function getBaselineHardwareMetrics(): RawHardwareMetrics {
  const cpus = os.cpus();
  const cpuName = cpus.length > 0 ? cpus[0].model.trim() : 'Generic x86_64 CPU';
  const logicalCores = cpus.length;
  const physicalCores = logicalCores >= 4 ? Math.floor(logicalCores / 2) : logicalCores;
  const totalRamMB = Math.round(os.totalmem() / (1024 * 1024));
  const availableRamMB = Math.round(os.freemem() / (1024 * 1024));
  const hasAvx2 = checkAvx2Support(cpuName);

  const gpuResolution = resolveInferenceDevice();
  const isDedicatedGpu = Boolean(
    gpuResolution.gpuName &&
    !gpuResolution.gpuName.toLowerCase().includes('intel') &&
    !gpuResolution.gpuName.toLowerCase().includes('basic display')
  );

  return {
    osName: `${os.type()} ${os.release()}`,
    cpuName,
    physicalCores,
    logicalCores,
    maxClockGhz: cpus.length > 0 && cpus[0].speed ? cpus[0].speed / 1000 : undefined,
    hasAvx2,
    gpuName: gpuResolution.gpuName || 'Integrated Graphics',
    gpuVramMB: isDedicatedGpu ? 4096 : 1024,
    isDedicatedGpu,
    hasCuda: gpuResolution.device === 'cuda',
    totalRamMB,
    availableRamMB,
  };
}

/**
 * Runs deep PowerShell command diagnostic on Windows with strict timeout and discrete string arguments.
 */
export async function executeWindowsDeepScan(): Promise<Partial<RawHardwareMetrics>> {
  if (process.platform !== 'win32') {
    return {};
  }

  return new Promise((resolve) => {
    const psScript = `
$gpu = Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1 Name, AdapterRAM;
$cpu = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1 Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed;
$os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue | Select-Object TotalVisibleMemorySize, FreePhysicalMemory, Caption;
[PSCustomObject]@{
  GpuName = if ($gpu.Name) { $gpu.Name } else { '' };
  GpuVramBytes = if ($gpu.AdapterRAM) { [double]$gpu.AdapterRAM } else { 0 };
  CpuName = if ($cpu.Name) { $cpu.Name } else { '' };
  CpuCores = if ($cpu.NumberOfCores) { [int]$cpu.NumberOfCores } else { 0 };
  CpuThreads = if ($cpu.NumberOfLogicalProcessors) { [int]$cpu.NumberOfLogicalProcessors } else { 0 };
  CpuMaxClockMhz = if ($cpu.MaxClockSpeed) { [int]$cpu.MaxClockSpeed } else { 0 };
  RamTotalKB = if ($os.TotalVisibleMemorySize) { [double]$os.TotalVisibleMemorySize } else { 0 };
  RamFreeKB = if ($os.FreePhysicalMemory) { [double]$os.FreePhysicalMemory } else { 0 };
  OsName = if ($os.Caption) { $os.Caption } else { '' };
} | ConvertTo-Json -Compress
`;

    let stdout = '';
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', psScript],
      { windowsHide: true }
    );

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      resolve({});
    }, 4500);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0 || !stdout.trim()) {
        resolve({});
        return;
      }

      try {
        const data = JSON.parse(stdout.trim());
        const vramMB = Math.round((data.GpuVramBytes || 0) / (1024 * 1024));
        const gpuName = data.GpuName || '';
        const isDedicated = Boolean(
          gpuName &&
          !gpuName.toLowerCase().includes('intel') &&
          !gpuName.toLowerCase().includes('basic display') &&
          vramMB >= 1024
        );

        resolve({
          osName: data.OsName || undefined,
          cpuName: data.CpuName ? data.CpuName.trim() : undefined,
          physicalCores: data.CpuCores > 0 ? data.CpuCores : undefined,
          logicalCores: data.CpuThreads > 0 ? data.CpuThreads : undefined,
          maxClockGhz: data.CpuMaxClockMhz > 0 ? Number((data.CpuMaxClockMhz / 1000).toFixed(2)) : undefined,
          gpuName: gpuName || undefined,
          gpuVramMB: vramMB > 0 ? vramMB : undefined,
          isDedicatedGpu: isDedicated,
          totalRamMB: data.RamTotalKB > 0 ? Math.round(data.RamTotalKB / 1024) : undefined,
          availableRamMB: data.RamFreeKB > 0 ? Math.round(data.RamFreeKB / 1024) : undefined,
        });
      } catch {
        resolve({});
      }
    });

    child.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

/**
 * Main Controller: Coordinates deep system hardware inspection and model recommendation.
 */
export async function runDeepSystemScan(allowCommandExecution: boolean): Promise<DeepSystemScanResult> {
  const baseline = getBaselineHardwareMetrics();
  let finalMetrics: RawHardwareMetrics = { ...baseline };

  if (allowCommandExecution && process.platform === 'win32') {
    try {
      logger.info('HARDWARE', 'Running user-authorized deep system diagnostic command...');
      const deepData = await executeWindowsDeepScan();
      finalMetrics = {
        osName: deepData.osName || baseline.osName,
        cpuName: deepData.cpuName || baseline.cpuName,
        physicalCores: deepData.physicalCores || baseline.physicalCores,
        logicalCores: deepData.logicalCores || baseline.logicalCores,
        maxClockGhz: deepData.maxClockGhz || baseline.maxClockGhz,
        hasAvx2: deepData.cpuName ? checkAvx2Support(deepData.cpuName) : baseline.hasAvx2,
        gpuName: deepData.gpuName || baseline.gpuName,
        gpuVramMB: deepData.gpuVramMB || baseline.gpuVramMB,
        isDedicatedGpu: deepData.isDedicatedGpu !== undefined ? deepData.isDedicatedGpu : baseline.isDedicatedGpu,
        hasCuda: baseline.hasCuda,
        totalRamMB: deepData.totalRamMB || baseline.totalRamMB,
        availableRamMB: deepData.availableRamMB || baseline.availableRamMB,
      };
      logger.info(
        'HARDWARE',
        `Deep scan completed: ${finalMetrics.cpuName} | GPU: ${finalMetrics.gpuName} (${finalMetrics.gpuVramMB} MB VRAM) | RAM: ${finalMetrics.totalRamMB} MB`
      );
    } catch (err: any) {
      logger.warn('HARDWARE', `Deep scan encountered non-fatal error, falling back to baseline: ${err.message}`);
    }
  } else {
    logger.info('HARDWARE', 'User opted for standard baseline hardware inspection (no command execution).');
  }

  const recommendation = evaluateModelRecommendation(finalMetrics);

  return {
    allowed: allowCommandExecution,
    scannedAt: new Date().toISOString(),
    osName: finalMetrics.osName,
    cpuDetails: {
      name: finalMetrics.cpuName,
      physicalCores: finalMetrics.physicalCores,
      logicalCores: finalMetrics.logicalCores,
      maxClockGhz: finalMetrics.maxClockGhz,
      hasAvx2: finalMetrics.hasAvx2,
    },
    gpuDetails: {
      name: finalMetrics.gpuName,
      vramMB: finalMetrics.gpuVramMB,
      isDedicated: finalMetrics.isDedicatedGpu,
      hasCuda: finalMetrics.hasCuda,
    },
    ramDetails: {
      totalMB: finalMetrics.totalRamMB,
      availableMB: finalMetrics.availableRamMB,
    },
    recommendedModelId: recommendation.recommendedModelId,
    recommendationReason: recommendation.recommendationReason,
    estimatedSpeedFactor: recommendation.estimatedSpeedFactor,
  };
}
