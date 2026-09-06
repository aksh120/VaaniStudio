/**
 * Project File Schema Definition, Validation, Migration, and Atomic Persistence
 * Handles .vsp (Vaani Studio Project) file operations with atomic temporary writes,
 * fsync physical disk flushing, schema version migration, and relative media path resolution.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ProjectData,
  CURRENT_PROJECT_VERSION,
  SubtitleEvent,
} from '../../shared/types/models.js';
import { DEFAULT_SETTINGS, DEFAULT_STYLE, DEFAULT_ANIMATION } from '../../shared/defaults.js';
import { logger } from '../logger.js';

export interface ProjectLoadResult {
  project: ProjectData;
  warnings: string[];
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  migratedProject?: ProjectData;
}

/**
 * Validates the schema of a project object.
 * Returns validation status, error messages, and a migrated project if recovery is possible.
 */
export function validateProjectSchema(raw: unknown): SchemaValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { isValid: false, errors: ['Project data must be a non-null object.'] };
  }

  const obj = raw as Record<string, any>;

  if (!obj.projectId || typeof obj.projectId !== 'string') {
    errors.push('Missing or invalid projectId.');
  }

  if (!obj.projectName || typeof obj.projectName !== 'string') {
    errors.push('Missing or invalid projectName.');
  }

  if (!Array.isArray(obj.events)) {
    errors.push('Missing or invalid events array.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Schema version check and migration
  const version = typeof obj.projectVersion === 'number' ? obj.projectVersion : 0;
  if (version < CURRENT_PROJECT_VERSION) {
    const migrated = migrateProjectSchema(obj);
    return { isValid: true, errors: [], migratedProject: migrated };
  }

  return { isValid: true, errors: [], migratedProject: obj as ProjectData };
}

/**
 * Migrates older or unversioned project schemas to the current project schema version.
 */
export function migrateProjectSchema(data: Record<string, any>): ProjectData {
  const version = typeof data.projectVersion === 'number' ? data.projectVersion : 0;
  let migrated: ProjectData = {
    projectVersion: CURRENT_PROJECT_VERSION,
    projectId: data.projectId || `proj-${Date.now()}`,
    projectName: data.projectName || 'Untitled Project',
    createdAt: data.createdAt || new Date().toISOString(),
    modifiedAt: data.modifiedAt || new Date().toISOString(),
    media: data.media || null,
    relativeMediaPath: data.relativeMediaPath,
    mediaHash: data.mediaHash,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(data.settings || {}),
    },
    events: Array.isArray(data.events)
      ? data.events.map((evt: any, idx: number): SubtitleEvent => ({
          id: evt.id || `sub-${idx + 1}`,
          index: typeof evt.index === 'number' ? evt.index : idx + 1,
          startTime: typeof evt.startTime === 'number' ? evt.startTime : 0,
          endTime: typeof evt.endTime === 'number' ? evt.endTime : 1,
          text: typeof evt.text === 'string' ? evt.text : '',
          words: Array.isArray(evt.words) ? evt.words : [],
          speakerId: evt.speakerId,
          speakerLabel: evt.speakerLabel,
          cps: evt.cps,
          cpl: evt.cpl,
        }))
      : [],
    style: {
      ...DEFAULT_STYLE,
      ...(data.style || {}),
    },
    animation: {
      ...DEFAULT_ANIMATION,
      ...(data.animation || {}),
    },
    exportHistory: Array.isArray(data.exportHistory) ? data.exportHistory : [],
  };

  logger.info('PERSISTENCE', `Migrated project "${migrated.projectName}" from schema v${version} to v${CURRENT_PROJECT_VERSION}.`);
  return migrated;
}

/**
 * Atomically saves a project to the specified path.
 * 1. Computes relative media path for folder portability.
 * 2. Writes JSON to a temporary file (.tmp).
 * 3. Invokes fsync to flush kernel write buffers to physical disk.
 * 4. Atomically renames temporary file over target destination.
 */
export async function saveProjectAtomic(targetPath: string, projectData: ProjectData): Promise<string> {
  const projectDir = path.dirname(targetPath);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Clone project data to prevent mutating caller reference
  const cloned: ProjectData = JSON.parse(JSON.stringify(projectData));
  cloned.projectVersion = CURRENT_PROJECT_VERSION;
  cloned.modifiedAt = new Date().toISOString();

  // Compute relative media path if media exists
  if (cloned.media?.filePath) {
    try {
      const rel = path.relative(projectDir, cloned.media.filePath);
      // Only use relative path if on the same drive / filesystem
      if (!path.isAbsolute(rel) && !rel.startsWith('..\\..\\..\\..')) {
        cloned.relativeMediaPath = rel;
      }
    } catch {
      // Keep absolute path if cross-drive relative computation fails
    }
  }

  const content = JSON.stringify(cloned, null, 2);
  const tempPath = path.join(
    projectDir,
    `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`
  );

  let fd: number | null = null;
  try {
    // Write and fsync to ensure data reaches disk surface
    fd = fs.openSync(tempPath, 'w');
    fs.writeSync(fd, content, 0, 'utf-8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;

    // Atomic replace on target path
    if (process.platform === 'win32' && fs.existsSync(targetPath)) {
      try {
        fs.renameSync(tempPath, targetPath);
      } catch (renameErr) {
        // Fallback for Windows file locks: copy over and unlink temp
        fs.copyFileSync(tempPath, targetPath);
        fs.unlinkSync(tempPath);
      }
    } else {
      fs.renameSync(tempPath, targetPath);
    }

    logger.info('PERSISTENCE', `Atomically saved project to ${targetPath} (${cloned.events.length} events)`);
    return targetPath;
  } catch (err: any) {
    logger.error('PERSISTENCE', `Atomic save failed for ${targetPath}: ${err?.message}`);
    // Cleanup temporary file if it still exists
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore unlink error
      }
    }
    throw new Error(`Failed to save project file: ${err?.message}`);
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        // Ignore close error
      }
    }
  }
}

/**
 * Loads and validates a .vsp project file from disk.
 * Performs schema validation, migration, and relative media path resolution.
 */
export async function loadProjectFile(filePath: string): Promise<ProjectLoadResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Project file does not exist: ${filePath}`);
  }

  const warnings: string[] = [];
  let content = '';

  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (readErr: any) {
    throw new Error(`Failed to read project file: ${readErr.message}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (parseErr: any) {
    throw new Error(`The project file is corrupted and cannot be parsed as valid JSON: ${parseErr.message}`);
  }

  const validation = validateProjectSchema(parsed);
  if (!validation.isValid || !validation.migratedProject) {
    throw new Error(`Invalid project structure: ${validation.errors.join(', ')}`);
  }

  const project = validation.migratedProject;

  // Resolve media file if absolute path is not found
  if (project.media) {
    const absPathExists = fs.existsSync(project.media.filePath);
    if (!absPathExists && project.relativeMediaPath) {
      const projectDir = path.dirname(filePath);
      const resolvedPath = path.resolve(projectDir, project.relativeMediaPath);
      if (fs.existsSync(resolvedPath)) {
        logger.info('PERSISTENCE', `Resolved relocated media file via relative path: ${resolvedPath}`);
        project.media.filePath = resolvedPath;
        warnings.push(`Media file relocated to: ${resolvedPath}`);
      } else {
        warnings.push(`Media file not found at original location (${project.media.filePath}) or relative path (${project.relativeMediaPath}).`);
      }
    } else if (!absPathExists) {
      warnings.push(`Media file not found at original location: ${project.media.filePath}`);
    }
  }

  logger.info('PERSISTENCE', `Successfully loaded project "${project.projectName}" (${project.events.length} events).`);
  return { project, warnings };
}
