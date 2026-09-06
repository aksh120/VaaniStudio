/**
 * Autosave Engine and Crash Recovery Manager
 * Periodically journals unsaved project edits to %APPDATA%/VaaniStudio/autosave/
 * and detects abnormal process terminations on startup to offer project recovery.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { app } from 'electron';
import {
  ProjectData,
  CrashRecoveryEntry,
} from '../../shared/types/models.js';
import { saveProjectAtomic, loadProjectFile } from './projectPersistence.js';
import { logger } from '../logger.js';

interface RegistryRecord extends CrashRecoveryEntry {
  pid: number;
}

let customAutosaveDir: string | null = null;

/**
 * Sets a custom autosave directory for testing purposes.
 */
export function setCustomAutosaveDir(dir: string | null): void {
  customAutosaveDir = dir;
}

/**
 * Resolves the path to the autosave directory.
 */
export function getAutosaveDir(): string {
  if (customAutosaveDir) {
    if (!fs.existsSync(customAutosaveDir)) {
      fs.mkdirSync(customAutosaveDir, { recursive: true });
    }
    return customAutosaveDir;
  }

  let baseDir: string;
  try {
    baseDir = app ? app.getPath('userData') : path.join(os.homedir(), '.vaani-studio');
  } catch {
    baseDir = path.join(os.tmpdir(), 'VaaniStudio');
  }

  const autosaveDir = path.join(baseDir, 'autosave');
  if (!fs.existsSync(autosaveDir)) {
    fs.mkdirSync(autosaveDir, { recursive: true });
  }
  return autosaveDir;
}

function getRegistryFilePath(): string {
  return path.join(getAutosaveDir(), 'recovery_registry.json');
}

function readRegistry(): Record<string, RegistryRecord> {
  const regPath = getRegistryFilePath();
  if (!fs.existsSync(regPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(regPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeRegistry(registry: Record<string, RegistryRecord>): void {
  const regPath = getRegistryFilePath();
  try {
    fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), 'utf-8');
  } catch (err: any) {
    logger.error('AUTOSAVE', `Failed to update recovery registry: ${err?.message}`);
  }
}

/**
 * Checks if a process PID is currently active on the host operating system.
 */
export function isProcessRunning(pid: number): boolean {
  if (!pid || pid <= 0) return false;
  try {
    // process.kill(pid, 0) tests process existence without terminating it
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    // ESRCH means process does not exist; EPERM means exists but without signal permissions
    return err?.code === 'EPERM';
  }
}

/**
 * Saves a background autosave snapshot of the current project.
 */
export async function saveAutosaveSnapshot(
  project: ProjectData,
  originalFilePath?: string
): Promise<string> {
  const dir = getAutosaveDir();
  const autosaveFileName = `autosave_${project.projectId}.vsp`;
  const autosavePath = path.join(dir, autosaveFileName);

  // Write snapshot atomically
  await saveProjectAtomic(autosavePath, project);

  // Update registry
  const registry = readRegistry();
  registry[project.projectId] = {
    projectId: project.projectId,
    projectName: project.projectName || 'Untitled Project',
    originalFilePath,
    autosavePath,
    timestamp: new Date().toISOString(),
    eventCount: project.events.length,
    mediaFileName: project.media?.fileName,
    pid: process.pid,
  };

  writeRegistry(registry);
  logger.info('AUTOSAVE', `Autosaved project "${project.projectName}" (${project.events.length} events)`);
  return autosavePath;
}

/**
 * Scans the autosave registry on application startup for orphaned sessions.
 * Returns entries whose owner process PID is no longer alive.
 */
export async function checkCrashRecovery(): Promise<CrashRecoveryEntry[]> {
  const registry = readRegistry();
  const recoveryEntries: CrashRecoveryEntry[] = [];
  const currentPid = process.pid;
  let registryModified = false;

  for (const [projectId, entry] of Object.entries(registry)) {
    // If the autosave file no longer exists, prune the dead registry record
    if (!fs.existsSync(entry.autosavePath)) {
      delete registry[projectId];
      registryModified = true;
      continue;
    }

    // Check if the process that recorded this autosave is no longer running
    const isOrphan = entry.pid !== currentPid && !isProcessRunning(entry.pid);
    if (isOrphan) {
      recoveryEntries.push({
        projectId: entry.projectId,
        projectName: entry.projectName,
        originalFilePath: entry.originalFilePath,
        autosavePath: entry.autosavePath,
        timestamp: entry.timestamp,
        eventCount: entry.eventCount,
        mediaFileName: entry.mediaFileName,
      });
    }
  }

  if (registryModified) {
    writeRegistry(registry);
  }

  if (recoveryEntries.length > 0) {
    logger.warn('AUTOSAVE', `Detected ${recoveryEntries.length} orphaned autosave journal(s) available for crash recovery.`);
  }

  return recoveryEntries;
}

/**
 * Recovers project data from an autosave snapshot.
 */
export async function recoverProject(projectId: string): Promise<ProjectData> {
  const registry = readRegistry();
  const entry = registry[projectId];
  if (!entry) {
    throw new Error(`No crash recovery entry found for project ID: ${projectId}`);
  }

  if (!fs.existsSync(entry.autosavePath)) {
    throw new Error(`Autosave file missing: ${entry.autosavePath}`);
  }

  const { project } = await loadProjectFile(entry.autosavePath);
  logger.info('AUTOSAVE', `Successfully recovered project "${project.projectName}" from autosave journal.`);
  return project;
}

/**
 * Discards an autosave recovery journal (e.g. user chose not to recover).
 */
export async function discardRecovery(projectId: string): Promise<void> {
  const registry = readRegistry();
  const entry = registry[projectId];
  if (entry && fs.existsSync(entry.autosavePath)) {
    try {
      fs.unlinkSync(entry.autosavePath);
    } catch {
      // Ignore unlink error
    }
  }

  delete registry[projectId];
  writeRegistry(registry);
  logger.info('AUTOSAVE', `Discarded recovery journal for project ${projectId}.`);
}

/**
 * Clears the autosave journal for a project upon clean save or normal close.
 */
export async function clearAutosaveForProject(projectId: string): Promise<void> {
  const registry = readRegistry();
  const entry = registry[projectId];
  if (entry && fs.existsSync(entry.autosavePath)) {
    try {
      fs.unlinkSync(entry.autosavePath);
    } catch {
      // Ignore unlink error
    }
  }

  delete registry[projectId];
  writeRegistry(registry);
  logger.info('AUTOSAVE', `Cleared autosave journal for project ${projectId}.`);
}
