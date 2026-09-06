/**
 * Preset Manager
 * Handles cataloging, creating, updating, importing, exporting, and persisting subtitle style presets.
 */

import { StylePreset, SubtitleStyle } from '../../../shared/types/models.js';
import { BUILT_IN_PRESETS } from '../../../shared/subtitles/defaultPresets.js';
import { validateStyleJson } from '../../../shared/subtitles/assStyleSerializer.js';

export const LOCAL_STORAGE_CUSTOM_PRESETS_KEY = 'vaani_custom_presets_v1';

export class PresetManager {
  private customPresets: StylePreset[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private getStorage(): Storage | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  /**
   * Load saved custom presets from local storage
   */
  public loadFromStorage(): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        const raw = storage.getItem(LOCAL_STORAGE_CUSTOM_PRESETS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.customPresets = parsed.filter(
              (p) => p && typeof p === 'object' && !p.isBuiltIn && p.id && p.name && p.style
            );
          }
        }
      }
    } catch {
      this.customPresets = [];
    }
  }

  /**
   * Persist custom presets to local storage
   */
  private saveToStorage(): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(
          LOCAL_STORAGE_CUSTOM_PRESETS_KEY,
          JSON.stringify(this.customPresets)
        );
      }
    } catch {
      // Storage unavailable
    }
  }

  /**
   * Return all presets (factory built-ins followed by user custom presets)
   */
  public getAllPresets(): StylePreset[] {
    return [...BUILT_IN_PRESETS, ...this.customPresets];
  }

  /**
   * Return only user custom presets
   */
  public getCustomPresets(): StylePreset[] {
    return [...this.customPresets];
  }

  /**
   * Find preset by ID
   */
  public getPresetById(id: string): StylePreset | undefined {
    return this.getAllPresets().find((p) => p.id === id);
  }

  /**
   * Save the current active style as a new custom preset
   */
  public saveCustomPreset(
    name: string,
    description: string,
    style: SubtitleStyle
  ): StylePreset {
    const trimmedName = name.trim() || 'Custom Style';
    const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newPreset: StylePreset = {
      id,
      name: trimmedName,
      description: description.trim() || 'Custom user preset',
      isBuiltIn: false,
      style: {
        ...style,
        id: `style_${id}`,
        name: trimmedName,
      },
    };

    this.customPresets.push(newPreset);
    this.saveToStorage();
    this.notifyListeners();
    return newPreset;
  }

  /**
   * Update an existing custom preset (cannot edit built-in presets)
   */
  public updateCustomPreset(
    presetId: string,
    updates: { name?: string; description?: string; style?: SubtitleStyle }
  ): StylePreset | null {
    const index = this.customPresets.findIndex((p) => p.id === presetId);
    if (index === -1) {
      return null;
    }

    const current = this.customPresets[index];
    const updatedName = updates.name !== undefined ? updates.name.trim() : current.name;
    const updatedDesc = updates.description !== undefined ? updates.description.trim() : current.description;

    const updated: StylePreset = {
      ...current,
      name: updatedName,
      description: updatedDesc,
      style: updates.style
        ? { ...updates.style, id: current.style.id, name: updatedName }
        : current.style,
    };

    this.customPresets[index] = updated;
    this.saveToStorage();
    this.notifyListeners();
    return updated;
  }

  /**
   * Delete a custom preset (factory built-in presets cannot be deleted)
   */
  public deleteCustomPreset(presetId: string): boolean {
    // Guard: never delete built-in presets
    const isBuiltIn = BUILT_IN_PRESETS.some((p) => p.id === presetId);
    if (isBuiltIn) {
      return false;
    }

    const prevLen = this.customPresets.length;
    this.customPresets = this.customPresets.filter((p) => p.id !== presetId);

    if (this.customPresets.length !== prevLen) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Export a preset to a formatted JSON string conforming to .vstyle.json specification
   */
  public exportPresetToJson(preset: StylePreset): string {
    const exportPayload = {
      format: 'vaani-style-preset',
      version: 1,
      preset: {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        style: preset.style,
      },
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  /**
   * Import a preset from a JSON string with schema validation
   */
  public importPresetFromJson(
    jsonString: string
  ): { success: boolean; preset?: StylePreset; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'File content is not a valid JSON object' };
      }

      // Handle both packaged format { preset: { name, style } } and direct StylePreset object
      let rawPreset: any;
      if (parsed.format === 'vaani-style-preset' && parsed.preset) {
        rawPreset = parsed.preset;
      } else if (parsed.name && parsed.style) {
        rawPreset = parsed;
      } else if (parsed.fontFamily && parsed.fontSize) {
        // Direct SubtitleStyle JSON
        rawPreset = {
          name: parsed.name || 'Imported Style',
          description: 'Imported style preset',
          style: parsed,
        };
      } else {
        return { success: false, error: 'Unrecognized preset format: missing style definition' };
      }

      const styleValidation = validateStyleJson(rawPreset.style);
      if (!styleValidation.valid || !styleValidation.style) {
        return {
          success: false,
          error: `Invalid style schema: ${styleValidation.errors.join(', ')}`,
        };
      }

      const importedName = (rawPreset.name || 'Imported Preset').trim();
      const importedDesc = (rawPreset.description || 'Imported preset').trim();

      const newPreset = this.saveCustomPreset(
        importedName,
        importedDesc,
        styleValidation.style
      );

      return { success: true, preset: newPreset };
    } catch (err: any) {
      return { success: false, error: `JSON Parse error: ${err.message || 'Malformed file'}` };
    }
  }

  /**
   * Subscribe to preset catalog changes
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
