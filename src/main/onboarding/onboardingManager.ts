/**
 * Vaani Studio - First-Run Onboarding Manager
 * Detects initial application state, recommends speech models based on hardware profile,
 * and manages user onboarding completion persistence.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { HardwareProfile, OnboardingStatus } from '../../shared/types/models.js';
import { isModelDownloaded, MODEL_CATALOG } from '../asr/modelManager.js';
import { logger } from '../logger.js';

export interface UserConfig {
  hasCompletedOnboarding: boolean;
  completedAt?: string;
  defaultModelId?: string;
}

/**
 * Returns the path to the user configuration directory.
 */
export function getUserConfigDir(): string {
  const appData = process.env.APPDATA || (
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.config')
  );
  const configDir = path.join(appData, 'VaaniStudio');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return configDir;
}

/**
 * Returns the path to config.json.
 */
export function getUserConfigPath(): string {
  return path.join(getUserConfigDir(), 'config.json');
}

/**
 * Reads user configuration from disk.
 */
export function readUserConfig(): UserConfig {
  const configPath = getUserConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw);
    } catch (err: any) {
      logger.warn('ONBOARDING', `Failed to parse user config at ${configPath}: ${err.message}`);
    }
  }
  return { hasCompletedOnboarding: false };
}

/**
 * Writes user configuration to disk.
 */
export function writeUserConfig(config: UserConfig): void {
  const configPath = getUserConfigPath();
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    logger.info('ONBOARDING', `Updated user configuration at ${configPath}`);
  } catch (err: any) {
    logger.error('ONBOARDING', `Failed to write user config to ${configPath}: ${err.message}`);
  }
}

/**
 * Evaluates hardware profile and determines the optimal initial model recommendation.
 * Machines with 8+ logical threads and 8+ GB RAM receive whisper-small (Balanced);
 * Entry-level or constrained hardware receives whisper-tiny (Fast).
 */
export function determineRecommendedModel(hardware?: HardwareProfile | null): string {
  if (!hardware) {
    return 'whisper-small-ct2-int8';
  }

  const hasHighMemory = hardware.totalMemoryMB >= 7500;
  const hasStrongCpu = hardware.logicalCores >= 8;

  if (hasHighMemory && hasStrongCpu) {
    return 'whisper-small-ct2-int8'; // Balanced
  }

  return 'whisper-tiny-ct2-int8'; // Fast
}

/**
 * Evaluates whether onboarding should be displayed to the user on application launch.
 */
export function checkOnboardingStatus(hardware?: HardwareProfile | null): OnboardingStatus {
  const config = readUserConfig();

  // Find all models currently downloaded on disk
  const downloadedModelIds = MODEL_CATALOG
    .filter((m) => isModelDownloaded(m.id))
    .map((m) => m.id);

  // If user explicitly finished onboarding previously, isFirstRun is false
  if (config.hasCompletedOnboarding) {
    return {
      isFirstRun: false,
      hasCompletedOnboarding: true,
      recommendedModelId: determineRecommendedModel(hardware),
      downloadedModelIds,
    };
  }

  // If user has not completed onboarding and has no models downloaded, trigger wizard
  const isFirstRun = downloadedModelIds.length === 0;

  return {
    isFirstRun,
    hasCompletedOnboarding: false,
    recommendedModelId: determineRecommendedModel(hardware),
    downloadedModelIds,
  };
}

/**
 * Marks onboarding as completed and persists user preference.
 */
export function completeOnboarding(selectedModelId?: string): void {
  const current = readUserConfig();
  const updated: UserConfig = {
    ...current,
    hasCompletedOnboarding: true,
    completedAt: new Date().toISOString(),
    defaultModelId: selectedModelId || current.defaultModelId,
  };
  writeUserConfig(updated);
  logger.info('ONBOARDING', `Onboarding marked completed. Default model: ${updated.defaultModelId || 'none'}`);
}
