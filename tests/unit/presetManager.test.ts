import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PresetManager, LOCAL_STORAGE_CUSTOM_PRESETS_KEY } from '../../src/renderer/src/editor/presetManager.js';
import { BUILT_IN_PRESETS } from '../../src/shared/subtitles/defaultPresets.js';
import { SubtitleStyle } from '../../src/shared/types/models.js';

describe('PresetManager', () => {
  // Mock localStorage in node/vitest environment
  let storageMap: Record<string, string> = {};

  beforeEach(() => {
    storageMap = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storageMap[key] || null,
      setItem: (key: string, val: string) => {
        storageMap[key] = val;
      },
      removeItem: (key: string) => {
        delete storageMap[key];
      },
      clear: () => {
        storageMap = {};
      },
    });
  });

  it('loads all 7 built-in presets on initialization', () => {
    const manager = new PresetManager();
    const presets = manager.getAllPresets();

    expect(presets.length).toBe(BUILT_IN_PRESETS.length);
    expect(presets.map((p) => p.name)).toEqual(
      expect.arrayContaining(['Clean', 'Minimal Pill', 'Podcast Warm', 'Karaoke Pop', 'Punch Reels', 'Neon Glow', 'Cinematic Serif'])
    );
  });

  it('retrieves preset by ID correctly', () => {
    const manager = new PresetManager();
    const cleanPreset = manager.getPresetById('preset_clean');
    expect(cleanPreset).toBeDefined();
    expect(cleanPreset?.name).toBe('Clean');
    expect(cleanPreset?.isBuiltIn).toBe(true);
  });

  it('saves a new custom preset and marks isBuiltIn as false', () => {
    const manager = new PresetManager();
    const baseStyle: SubtitleStyle = BUILT_IN_PRESETS[0].style;

    const custom = manager.saveCustomPreset(
      'My Custom Vlog Style',
      'High energy vlog subtitles',
      { ...baseStyle, fontSize: 50, primaryColor: '#00FFCC' }
    );

    expect(custom.id).toMatch(/^custom_/);
    expect(custom.name).toBe('My Custom Vlog Style');
    expect(custom.description).toBe('High energy vlog subtitles');
    expect(custom.isBuiltIn).toBe(false);
    expect(custom.style.primaryColor).toBe('#00FFCC');

    // Available in all presets
    expect(manager.getAllPresets().length).toBe(BUILT_IN_PRESETS.length + 1);
    expect(manager.getCustomPresets().length).toBe(1);

    // Persisted to storage
    expect(storageMap[LOCAL_STORAGE_CUSTOM_PRESETS_KEY]).toContain('My Custom Vlog Style');
  });

  it('updates an existing custom preset', () => {
    const manager = new PresetManager();
    const baseStyle = BUILT_IN_PRESETS[0].style;

    const custom = manager.saveCustomPreset('Draft Style', 'Draft', baseStyle);
    const updated = manager.updateCustomPreset(custom.id, {
      name: 'Finalized Style',
      description: 'Ready for production',
    });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('Finalized Style');
    expect(updated?.description).toBe('Ready for production');
    expect(manager.getPresetById(custom.id)?.name).toBe('Finalized Style');
  });

  it('deletes a custom preset successfully', () => {
    const manager = new PresetManager();
    const baseStyle = BUILT_IN_PRESETS[0].style;

    const custom = manager.saveCustomPreset('To Delete', '', baseStyle);
    expect(manager.getCustomPresets().length).toBe(1);

    const deleted = manager.deleteCustomPreset(custom.id);
    expect(deleted).toBe(true);
    expect(manager.getCustomPresets().length).toBe(0);
    expect(manager.getPresetById(custom.id)).toBeUndefined();
  });

  it('strictly protects built-in factory presets against deletion', () => {
    const manager = new PresetManager();
    const deleted = manager.deleteCustomPreset('preset_punch');

    expect(deleted).toBe(false);
    expect(manager.getPresetById('preset_punch')).toBeDefined();
    expect(manager.getAllPresets().length).toBe(BUILT_IN_PRESETS.length);
  });

  it('exports preset to formatted .vstyle.json string', () => {
    const manager = new PresetManager();
    const punchPreset = manager.getPresetById('preset_punch')!;

    const json = manager.exportPresetToJson(punchPreset);
    expect(json).toContain('"format": "vaani-style-preset"');
    expect(json).toContain('"version": 1');
    expect(json).toContain('"name": "Punch Reels"');
  });

  it('imports preset from valid .vstyle.json string with schema validation', () => {
    const manager = new PresetManager();
    const validJson = JSON.stringify({
      format: 'vaani-style-preset',
      version: 1,
      preset: {
        name: 'Shared Creator Style',
        description: 'Imported from team',
        style: BUILT_IN_PRESETS[1].style,
      },
    });

    const result = manager.importPresetFromJson(validJson);
    expect(result.success).toBe(true);
    expect(result.preset).toBeDefined();
    expect(result.preset?.name).toBe('Shared Creator Style');
    expect(manager.getCustomPresets().length).toBe(1);
  });

  it('gracefully rejects corrupted or invalid preset JSON with clear error feedback', () => {
    const manager = new PresetManager();

    // Invalid JSON syntax
    const badSyntaxResult = manager.importPresetFromJson('{ invalid json');
    expect(badSyntaxResult.success).toBe(false);
    expect(badSyntaxResult.error).toContain('JSON Parse error');

    // Missing style definition
    const missingStyleResult = manager.importPresetFromJson(JSON.stringify({ randomKey: 'no_preset' }));
    expect(missingStyleResult.success).toBe(false);
    expect(missingStyleResult.error).toContain('Unrecognized preset format');

    // Invalid style properties
    const invalidStyleResult = manager.importPresetFromJson(
      JSON.stringify({
        name: 'Bad Style',
        style: { fontFamily: '', fontSize: -5 },
      })
    );
    expect(invalidStyleResult.success).toBe(false);
    expect(invalidStyleResult.error).toContain('Invalid style schema');
  });

  it('notifies subscribers on catalog mutations', () => {
    const manager = new PresetManager();
    let callCount = 0;
    const unsubscribe = manager.subscribe(() => {
      callCount++;
    });

    const p = manager.saveCustomPreset('Sub Test', '', BUILT_IN_PRESETS[0].style);
    expect(callCount).toBe(1);

    manager.updateCustomPreset(p.id, { name: 'Sub Test 2' });
    expect(callCount).toBe(2);

    manager.deleteCustomPreset(p.id);
    expect(callCount).toBe(3);

    unsubscribe();
    manager.saveCustomPreset('After Unsubscribe', '', BUILT_IN_PRESETS[0].style);
    expect(callCount).toBe(3); // Did not increase
  });
});
