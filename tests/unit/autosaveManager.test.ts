import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  setCustomAutosaveDir,
  saveAutosaveSnapshot,
  checkCrashRecovery,
  recoverProject,
  discardRecovery,
  clearAutosaveForProject,
  isProcessRunning,
} from '../../src/main/persistence/autosaveManager.js';
import { createEmptyProject } from '../../src/shared/defaults.js';

describe('Phase 12: Autosave Engine & Crash Recovery Manager (TASK-054)', () => {
  let tempAutosaveDir: string;

  beforeEach(() => {
    tempAutosaveDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vaani-autosave-test-'));
    setCustomAutosaveDir(tempAutosaveDir);
  });

  afterEach(() => {
    setCustomAutosaveDir(null);
    if (fs.existsSync(tempAutosaveDir)) {
      fs.rmSync(tempAutosaveDir, { recursive: true, force: true });
    }
  });

  it('correctly determines process life cycle via isProcessRunning', () => {
    // Current test process PID is alive
    expect(isProcessRunning(process.pid)).toBe(true);
    // Highly unlikely PID 99999999 is dead
    expect(isProcessRunning(99999999)).toBe(false);
  });

  it('periodically journals unsaved edits and updates registry', async () => {
    const project = createEmptyProject('Autosave Snapshot Test');
    project.events = [
      {
        id: 'sub-1',
        index: 1,
        startTime: 0,
        endTime: 2,
        text: 'Unsaved subtitle edit',
        words: [],
      },
    ];

    const autosavePath = await saveAutosaveSnapshot(project, 'C:\\MyProjects\\test.vsp');
    expect(fs.existsSync(autosavePath)).toBe(true);

    const registryPath = path.join(tempAutosaveDir, 'recovery_registry.json');
    expect(fs.existsSync(registryPath)).toBe(true);

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    expect(registry[project.projectId]).toBeDefined();
    expect(registry[project.projectId].projectName).toBe('Autosave Snapshot Test');
    expect(registry[project.projectId].eventCount).toBe(1);
    expect(registry[project.projectId].pid).toBe(process.pid);
  });

  it('does not flag active current process sessions as crash recovery orphans', async () => {
    const project = createEmptyProject('Active Session');
    await saveAutosaveSnapshot(project);

    // Current PID is active, so checkCrashRecovery should not flag it as an orphan
    const recoveries = await checkCrashRecovery();
    expect(recoveries.length).toBe(0);
  });

  it('detects orphaned crash recovery journals from terminated processes', async () => {
    const project = createEmptyProject('Crashed Session');
    project.events = [
      {
        id: 'sub-1',
        index: 1,
        startTime: 1,
        endTime: 3,
        text: 'Important recovered transcript',
        words: [],
      },
    ];

    await saveAutosaveSnapshot(project);

    // Simulate an abnormal shutdown by modifying the registry PID to a dead PID
    const registryPath = path.join(tempAutosaveDir, 'recovery_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    registry[project.projectId].pid = 99999999; // Dead PID
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

    // checkCrashRecovery should now flag the orphaned project
    const recoveries = await checkCrashRecovery();
    expect(recoveries.length).toBe(1);
    expect(recoveries[0].projectId).toBe(project.projectId);
    expect(recoveries[0].projectName).toBe('Crashed Session');
    expect(recoveries[0].eventCount).toBe(1);

    // Recover project data
    const recovered = await recoverProject(project.projectId);
    expect(recovered.projectName).toBe('Crashed Session');
    expect(recovered.events[0].text).toBe('Important recovered transcript');
  });

  it('discards recovery journal and cleans up files when dismissed by user', async () => {
    const project = createEmptyProject('Discard Test');
    const autosavePath = await saveAutosaveSnapshot(project);
    expect(fs.existsSync(autosavePath)).toBe(true);

    await discardRecovery(project.projectId);
    expect(fs.existsSync(autosavePath)).toBe(false);

    const registry = JSON.parse(fs.readFileSync(path.join(tempAutosaveDir, 'recovery_registry.json'), 'utf-8'));
    expect(registry[project.projectId]).toBeUndefined();
  });

  it('clears autosave journal on clean project save or exit', async () => {
    const project = createEmptyProject('Clean Exit Test');
    const autosavePath = await saveAutosaveSnapshot(project);
    expect(fs.existsSync(autosavePath)).toBe(true);

    await clearAutosaveForProject(project.projectId);
    expect(fs.existsSync(autosavePath)).toBe(false);
  });
});
