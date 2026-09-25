import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { useUIStore } from '../../src/renderer/src/store/uiStore.js';

describe('Compact first-run guide', () => {
  const rootDir = process.cwd();
  const tutorialPath = path.join(rootDir, 'src', 'renderer', 'src', 'components', 'TutorialDialog.tsx');
  const appPath = path.join(rootDir, 'src', 'renderer', 'src', 'App.tsx');
  const projectsPath = path.join(rootDir, 'src', 'renderer', 'src', 'components', 'ProjectsView.tsx');
  const settingsPath = path.join(rootDir, 'src', 'renderer', 'src', 'components', 'SettingsWorkspace.tsx');

  beforeEach(() => {
    const storage: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach((key) => delete storage[key]); },
      length: 0,
      key: () => null,
    };
    useUIStore.setState({ tutorialCompleted: false, isTutorialOpen: false });
  });

  it('uses a five-step task-oriented flow', () => {
    const content = fs.readFileSync(tutorialPath, 'utf8');
    expect(content).toContain('TOTAL_STEPS = 5');
    expect(content).toContain('Getting started');
    expect(content).toContain('Workspace');
    expect(content).toContain('Generate subtitles');
    expect(content).toContain('Edit and style');
    expect(content).toContain('Ready');
  });

  it('describes the real workflow without marketing claims', () => {
    const content = fs.readFileSync(tutorialPath, 'utf8');
    expect(content).toContain('Import your media');
    expect(content).toContain('Generate subtitles');
    expect(content).toContain('Adjust timing, speakers, typography, and export');
    expect(content).not.toContain('100% Offline & Private Guarantee');
    expect(content).not.toContain('Viral');
    expect(content).not.toContain('AI Magic');
  });

  it('provides accessible dialog navigation and finish actions', () => {
    const content = fs.readFileSync(tutorialPath, 'utf8');
    expect(content).toContain('<Dialog');
    expect(content).toContain('Skip tour');
    expect(content).toContain('Back');
    expect(content).toContain('Next');
    expect(content).toContain('Start using Vaani Studio');
    expect(content).toContain('onComplete');
    expect(content).toContain('setStep(1)');
  });

  it('keeps guide entry points available from the shell and projects page', () => {
    const appContent = fs.readFileSync(appPath, 'utf8');
    const projectsContent = fs.readFileSync(projectsPath, 'utf8');
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    expect(appContent).toContain('setIsTutorialOpen(true)');
    expect(appContent).toContain('hasCheckedTutorialRef');
    expect(projectsContent).toContain('Guide');
    expect(settingsContent).toContain('setIsTutorialOpen(true)');
  });

  it('contains no emoji in the redesigned guide surfaces', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const filePath of [tutorialPath, projectsPath, settingsPath, appPath]) {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content.match(emojiRegex), `Emoji detected in ${path.basename(filePath)}`).toBeNull();
    }
  });

  it('manages tutorialCompleted state correctly in uiStore', () => {
    const store = useUIStore.getState();
    expect(store.tutorialCompleted).toBe(false);
    store.setTutorialCompleted(true);
    expect(useUIStore.getState().tutorialCompleted).toBe(true);
    store.setIsTutorialOpen(true);
    expect(useUIStore.getState().isTutorialOpen).toBe(true);
    store.setIsTutorialOpen(false);
    expect(useUIStore.getState().isTutorialOpen).toBe(false);
  });
});
