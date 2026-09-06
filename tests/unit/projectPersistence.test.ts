import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  saveProjectAtomic,
  loadProjectFile,
  validateProjectSchema,
  migrateProjectSchema,
} from '../../src/main/persistence/projectPersistence.js';
import { createEmptyProject } from '../../src/shared/defaults.js';
import { ProjectData, CURRENT_PROJECT_VERSION } from '../../src/shared/types/models.js';

describe('Phase 12: Project File Schema & Atomic Persistence (TASK-053)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vaani-project-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('atomically saves a project file and cleans up temporary files', async () => {
    const project = createEmptyProject('Atomic Save Test');
    project.events = [
      {
        id: 'sub-1',
        index: 1,
        startTime: 0.5,
        endTime: 2.5,
        text: 'Atomic persistence guarantees data safety.',
        words: [],
      },
    ];

    const targetPath = path.join(tempDir, 'test_project.vsp');
    const savedPath = await saveProjectAtomic(targetPath, project);

    expect(savedPath).toBe(targetPath);
    expect(fs.existsSync(targetPath)).toBe(true);

    // Verify no temporary .tmp files left in directory
    const dirFiles = fs.readdirSync(tempDir);
    const tmpFiles = dirFiles.filter((f) => f.endsWith('.tmp'));
    expect(tmpFiles.length).toBe(0);

    // Read back and verify content
    const raw = fs.readFileSync(targetPath, 'utf-8');
    const parsed: ProjectData = JSON.parse(raw);
    expect(parsed.projectVersion).toBe(CURRENT_PROJECT_VERSION);
    expect(parsed.projectName).toBe('Atomic Save Test');
    expect(parsed.events.length).toBe(1);
    expect(parsed.events[0].text).toBe('Atomic persistence guarantees data safety.');
  });

  it('computes and stores relativeMediaPath when media resides alongside project', async () => {
    const mediaDir = path.join(tempDir, 'media');
    fs.mkdirSync(mediaDir);
    const mediaFilePath = path.join(mediaDir, 'sample_video.mp4');
    fs.writeFileSync(mediaFilePath, 'fake video content');

    const project = createEmptyProject('Relative Media Test');
    project.media = {
      filePath: mediaFilePath,
      fileName: 'sample_video.mp4',
      durationSeconds: 10,
      fileSizeBytes: 1024,
    };

    const targetPath = path.join(tempDir, 'projects', 'my_project.vsp');
    await saveProjectAtomic(targetPath, project);

    const { project: loaded } = await loadProjectFile(targetPath);
    expect(loaded.relativeMediaPath).toBeDefined();
    expect(loaded.media?.filePath).toBe(mediaFilePath);
  });

  it('resolves relocated media via relativeMediaPath when absolute path is missing', async () => {
    // Simulate original project location
    const originalProjectDir = path.join(tempDir, 'original');
    fs.mkdirSync(originalProjectDir);
    const mediaPath = path.join(originalProjectDir, 'video.mp4');
    fs.writeFileSync(mediaPath, 'video content');

    const project = createEmptyProject('Relocation Test');
    const fakeBrokenPath =
      process.platform === 'win32'
        ? 'Z:\\NonExistentOriginalDrive\\video.mp4'
        : '/non_existent_original_mount/video.mp4';
    project.media = {
      filePath: fakeBrokenPath, // Broken absolute path
      fileName: 'video.mp4',
      durationSeconds: 5,
      fileSizeBytes: 500,
    };
    project.relativeMediaPath = 'video.mp4'; // Relative to project file

    const projectFilePath = path.join(originalProjectDir, 'project.vsp');
    await saveProjectAtomic(projectFilePath, project);

    const { project: loaded, warnings } = await loadProjectFile(projectFilePath);
    expect(loaded.media?.filePath).toBe(mediaPath);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('relocated');
  });

  it('validates project schema and flags invalid structures', () => {
    const invalidObj = { foo: 'bar' };
    const res = validateProjectSchema(invalidObj);
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('migrates unversioned or v0 project schemas to current version', () => {
    const legacyProject = {
      projectId: 'legacy-123',
      projectName: 'Legacy Project',
      events: [
        {
          id: 'sub-1',
          startTime: 1,
          endTime: 3,
          text: 'Legacy subtitle event',
        },
      ],
    };

    const migrated = migrateProjectSchema(legacyProject);
    expect(migrated.projectVersion).toBe(CURRENT_PROJECT_VERSION);
    expect(migrated.projectName).toBe('Legacy Project');
    expect(migrated.settings).toBeDefined();
    expect(migrated.style).toBeDefined();
    expect(migrated.events[0].text).toBe('Legacy subtitle event');
    expect(migrated.exportHistory).toEqual([]);
  });

  it('throws descriptive error on corrupted non-JSON project files', async () => {
    const corruptPath = path.join(tempDir, 'corrupt.vsp');
    fs.writeFileSync(corruptPath, '{ this is not valid json : [ }');

    await expect(loadProjectFile(corruptPath)).rejects.toThrow(/corrupted and cannot be parsed/);
  });
});
