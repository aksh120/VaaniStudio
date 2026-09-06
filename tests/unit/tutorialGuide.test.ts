import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { useUIStore } from '../../src/renderer/src/store/uiStore.js';

describe('Comprehensive Tutorial Guide & What-Does-What Tour', () => {
  const rootDir = process.cwd();
  const tutorialPath = path.join(
    rootDir,
    'src',
    'renderer',
    'src',
    'components',
    'TutorialDialog.tsx'
  );

  beforeEach(() => {
    // Mock localStorage for Node test environment
    const storage: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
      length: 0,
      key: () => null,
    };

    // Reset store state
    useUIStore.setState({
      tutorialCompleted: false,
      isTutorialOpen: false,
    });
  });

  it('verifies TutorialDialog.tsx file exists and defines all 7 required steps', () => {
    expect(fs.existsSync(tutorialPath)).toBe(true);
    const content = fs.readFileSync(tutorialPath, 'utf8');

    // Verify 7-step structure and titles
    expect(content).toContain('TOTAL_STEPS = 7');
    expect(content).toContain('Overview & Purpose');
    expect(content).toContain('Desktop Layout');
    expect(content).toContain('Editor & Timeline');
    expect(content).toContain('Subtitles & AI');
    expect(content).toContain('Style & Karaoke');
    expect(content).toContain('Export & Burn-In');
    expect(content).toContain('Quick Setup');
  });

  it('explains the core purpose, local-first offline architecture, and multilingual focus', () => {
    const content = fs.readFileSync(tutorialPath, 'utf8');

    expect(content).toContain('Welcome to Vaani Studio');
    expect(content).toContain('100% Offline & Private Guarantee');
    expect(content).toContain('never leave your computer');
    expect(content).toContain('CTranslate2 INT8 Whisper');
    expect(content).toContain('Zero telemetry');
    expect(content).toContain('English, Hindi, and mixed Hinglish');
  });

  it('thoroughly explains "what does what" across the desktop layout, editor, and timeline', () => {
    const content = fs.readFileSync(tutorialPath, 'utf8');

    // Desktop Layout "What Does What"
    expect(content).toContain('Desktop Layout & "What Does What"');
    expect(content).toContain('1. Titlebar (Top)');
    expect(content).toContain('2. Navigation Bar');
    expect(content).toContain('3. Main Workstation Viewport');
    expect(content).toContain('4. Status Bar (Bottom)');

    // Editor & Timeline
    expect(content).toContain('Multi-Format Video Preview Player');
    expect(content).toContain('16:9');
    expect(content).toContain('9:16');
    expect(content).toContain('1:1');
    expect(content).toContain('4:5');
    expect(content).toContain('Interactive Waveform Timeline');
    expect(content).toContain('Split at Playhead');
    expect(content).toContain('Merge with Adjacent');
    expect(content).toContain('Contextual Inspector');
  });

  it('covers advanced subtitles, Hinglish, transliteration, styling, and export features', () => {
    const content = fs.readFileSync(tutorialPath, 'utf8');

    // Subtitle & Transliteration
    expect(content).toContain('Mixed Hinglish Transcription');
    expect(content).toContain('Dual-Script Transliteration');
    expect(content).toContain('Devanagari');
    expect(content).toContain('Intelligent Text Normalization');
    expect(content).toContain('Automatic Speaker Diarization');

    // Style & Karaoke
    expect(content).toContain('10 Production Presets');
    expect(content).toContain('Word-by-Word Karaoke Animation');
    expect(content).toContain('High-Contrast Readability Controls');

    // Export & Burn-In
    expect(content).toContain('.SRT');
    expect(content).toContain('.VTT');
    expect(content).toContain('.ASS');
    expect(content).toContain('Burn-In Video (MP4)');
    expect(content).toContain('Batch Processing Queue');
  });

  it('provides Next, Previous, Never Show Again, and step pill navigation controls', () => {
    const content = fs.readFileSync(tutorialPath, 'utf8');

    expect(content).toContain('Never Show Again');
    expect(content).toContain('Previous');
    expect(content).toContain('Next');
    expect(content).toContain('tutorial-step-pill');
    expect(content).toContain('handleNeverShowAgain');
  });

  it('verifies reopen buttons exist in SettingsWorkspace, ProjectsView, and Titlebar', () => {
    const settingsPath = path.join(
      rootDir,
      'src',
      'renderer',
      'src',
      'components',
      'SettingsWorkspace.tsx'
    );
    const projectsPath = path.join(
      rootDir,
      'src',
      'renderer',
      'src',
      'components',
      'ProjectsView.tsx'
    );
    const appPath = path.join(rootDir, 'src', 'renderer', 'src', 'App.tsx');

    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    expect(settingsContent).toContain('Interactive Application Guide & Tour');
    expect(settingsContent).toContain('Open Feature Tour & Guide');
    expect(settingsContent).toContain('Launch Interactive App Guide');

    const projectsContent = fs.readFileSync(projectsPath, 'utf8');
    expect(projectsContent).toContain('App Guide');
    expect(projectsContent).toContain('Explore App Guide');

    const appContent = fs.readFileSync(appPath, 'utf8');
    expect(appContent).toContain('title="Open Interactive Feature Guide & Tour"');
    expect(appContent).toContain('hasCheckedTutorialRef');
  });

  it('enforces strict zero emoji policy across all updated UI component files', () => {
    const filesToAudit = [
      tutorialPath,
      path.join(rootDir, 'src', 'renderer', 'src', 'components', 'SettingsWorkspace.tsx'),
      path.join(rootDir, 'src', 'renderer', 'src', 'components', 'ProjectsView.tsx'),
      path.join(rootDir, 'src', 'renderer', 'src', 'App.tsx'),
    ];

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const filePath of filesToAudit) {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(emojiRegex);
      expect(match, `Emoji detected in ${path.basename(filePath)}: ${match?.[0]}`).toBeNull();
    }
  });

  it('manages tutorialCompleted state correctly in uiStore', () => {
    const store = useUIStore.getState();
    expect(store.tutorialCompleted).toBe(false);

    // Set completed
    store.setTutorialCompleted(true);
    expect(useUIStore.getState().tutorialCompleted).toBe(true);

    // Toggle guide visibility
    store.setIsTutorialOpen(true);
    expect(useUIStore.getState().isTutorialOpen).toBe(true);

    store.setIsTutorialOpen(false);
    expect(useUIStore.getState().isTutorialOpen).toBe(false);
  });
});
