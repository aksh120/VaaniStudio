import React, { useState } from 'react';
import {
  SubtitleStyle,
  StylePreset,
  HorizontalAlignment,
  TextTransform,
  AnimationConfig,
  AnimationType,
} from '../../../shared/types/models.js';
import { PresetManager } from '../editor/presetManager.js';
import { DEFAULT_ANIMATION } from '../../../shared/defaults.js';

export interface StylePresetStudioProps {
  currentStyle: SubtitleStyle;
  onUpdateStyle: (style: SubtitleStyle) => void;
  presetManager: PresetManager;
}

const AVAILABLE_FONTS = [
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'Montserrat, sans-serif',
  'Outfit, sans-serif',
  'Poppins, sans-serif',
  'Arial, sans-serif',
  'Segoe UI, sans-serif',
  'Impact, sans-serif',
  'Georgia, serif',
  'Merriweather, serif',
  'Courier New, monospace',
];

export const StylePresetStudio: React.FC<StylePresetStudioProps> = ({
  currentStyle,
  onUpdateStyle,
  presetManager,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'typography' | 'appearance' | 'position' | 'motion'>('presets');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const presets = presetManager.getAllPresets();

  const currentAnimation: AnimationConfig = currentStyle.animation || DEFAULT_ANIMATION;

  const handleApplyPreset = (preset: StylePreset) => {
    onUpdateStyle({ ...preset.style });
    setStatusFeedback(`Applied preset: ${preset.name}`);
    setTimeout(() => setStatusFeedback(null), 2500);
  };

  const handleUpdate = <K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) => {
    onUpdateStyle({
      ...currentStyle,
      [key]: value,
    });
  };

  const handleAnimationUpdate = <K extends keyof AnimationConfig>(key: K, value: AnimationConfig[K]) => {
    onUpdateStyle({
      ...currentStyle,
      animation: {
        ...currentAnimation,
        [key]: value,
      },
    });
  };

  const handlePositionUpdate = (
    alignment: HorizontalAlignment,
    verticalPercent: number
  ) => {
    onUpdateStyle({
      ...currentStyle,
      position: { alignment, verticalPercent },
    });
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const saved = presetManager.saveCustomPreset(
      newPresetName,
      newPresetDesc,
      currentStyle
    );

    // If Electron is active, also persist to appData directory
    if (window.vaaniAPI?.saveCustomPreset) {
      window.vaaniAPI.saveCustomPreset(saved);
    }

    setSaveModalOpen(false);
    setNewPresetName('');
    setNewPresetDesc('');
    setStatusFeedback(`Saved custom preset: ${saved.name}`);
    setTimeout(() => setStatusFeedback(null), 2500);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom preset?')) {
      presetManager.deleteCustomPreset(id);
      if (window.vaaniAPI?.deleteCustomPreset) {
        window.vaaniAPI.deleteCustomPreset(id);
      }
      setStatusFeedback('Custom preset deleted.');
      setTimeout(() => setStatusFeedback(null), 2500);
    }
  };

  const handleExport = async (preset: StylePreset) => {
    if (window.vaaniAPI?.exportPresetFile) {
      const res = await window.vaaniAPI.exportPresetFile(preset);
      if (res.success && res.data) {
        setStatusFeedback(`Exported preset to: ${res.data}`);
      }
    } else {
      // Fallback: download JSON in browser
      const json = presetManager.exportPresetToJson(preset);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${preset.name.toLowerCase().replace(/\s+/g, '_')}.vstyle.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusFeedback('Preset downloaded.');
    }
    setTimeout(() => setStatusFeedback(null), 2500);
  };

  const handleImport = async () => {
    if (window.vaaniAPI?.importPresetFile) {
      const res = await window.vaaniAPI.importPresetFile();
      if (res.success && res.data) {
        const importRes = presetManager.importPresetFromJson(res.data);
        if (importRes.success && importRes.preset) {
          onUpdateStyle(importRes.preset.style);
          setStatusFeedback(`Imported preset: ${importRes.preset.name}`);
        } else {
          alert(`Failed to import: ${importRes.error}`);
        }
      }
    } else {
      // Fallback: file input trigger
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.vstyle.json,.json';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const text = await file.text();
          const importRes = presetManager.importPresetFromJson(text);
          if (importRes.success && importRes.preset) {
            onUpdateStyle(importRes.preset.style);
            setStatusFeedback(`Imported preset: ${importRes.preset.name}`);
          } else {
            alert(`Failed to import: ${importRes.error}`);
          }
        }
      };
      input.click();
    }
    setTimeout(() => setStatusFeedback(null), 2500);
  };

  return (
    <div className="style-studio-container">
      {/* Studio Header & Tab Navigation */}
      <div className="style-studio-nav">
        <button
          className={`style-nav-tab ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          🎨 Presets
        </button>
        <button
          className={`style-nav-tab ${activeTab === 'typography' ? 'active' : ''}`}
          onClick={() => setActiveTab('typography')}
        >
          🔤 Typography
        </button>
        <button
          className={`style-nav-tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          ✨ Appearance
        </button>
        <button
          className={`style-nav-tab ${activeTab === 'position' ? 'active' : ''}`}
          onClick={() => setActiveTab('position')}
        >
          📐 Placement
        </button>
        <button
          className={`style-nav-tab ${activeTab === 'motion' ? 'active' : ''}`}
          onClick={() => setActiveTab('motion')}
        >
          🎬 Motion
        </button>
      </div>

      {statusFeedback && (
        <div className="style-feedback-banner">{statusFeedback}</div>
      )}

      {/* Tab 1: Presets Catalog */}
      {activeTab === 'presets' && (
        <div className="style-section-content">
          <div className="preset-toolbar">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setSaveModalOpen(true)}
              title="Save current styling as a new custom preset"
            >
              + Save As New
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleImport}
              title="Import .vstyle.json preset"
            >
              📥 Import
            </button>
          </div>

          <div className="preset-card-grid">
            {presets.map((p) => {
              const isSelected =
                currentStyle.fontFamily === p.style.fontFamily &&
                currentStyle.primaryColor === p.style.primaryColor &&
                currentStyle.hasBackgroundBox === p.style.hasBackgroundBox;

              return (
                <div
                  key={p.id}
                  className={`preset-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleApplyPreset(p)}
                >
                  <div className="preset-card-header">
                    <span className="preset-card-title">{p.name}</span>
                    <div className="preset-card-actions">
                      <button
                        className="preset-mini-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(p);
                        }}
                        title="Export this preset to .vstyle.json"
                      >
                        📤
                      </button>
                      {!p.isBuiltIn && (
                        <button
                          className="preset-mini-btn danger"
                          onClick={(e) => handleDeleteCustom(p.id, e)}
                          title="Delete custom preset"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="preset-card-desc">{p.description}</p>

                  {/* Visual Style Preview Snippet */}
                  <div
                    className="preset-mini-preview"
                    style={{
                      backgroundColor: p.style.hasBackgroundBox
                        ? p.style.backgroundColor
                        : '#0B0F19',
                      color: p.style.primaryColor,
                      fontFamily: p.style.fontFamily,
                      fontWeight: p.style.fontWeight,
                      textTransform: p.style.textTransform,
                      WebkitTextStroke: p.style.strokeWidth
                        ? `${Math.max(1, Math.round(p.style.strokeWidth * 0.5))}px ${p.style.strokeColor}`
                        : undefined,
                    }}
                  >
                    <span>Aa</span>
                    <span style={{ color: p.style.activeWordColor, marginLeft: '6px' }}>
                      Highlight
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Typography Controls */}
      {activeTab === 'typography' && (
        <div className="style-section-content">
          <div className="control-group">
            <label className="control-label">Font Family</label>
            <select
              className="control-select"
              value={currentStyle.fontFamily}
              onChange={(e) => handleUpdate('fontFamily', e.target.value)}
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <div className="slider-label-row">
              <label className="control-label">Font Size</label>
              <span className="slider-value">{currentStyle.fontSize || 48}px</span>
            </div>
            <input
              type="range"
              className="control-slider"
              min="16"
              max="120"
              value={currentStyle.fontSize || 48}
              onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label className="control-label">Font Weight</label>
            <div className="segmented-button-row">
              {[
                { label: 'Regular', val: 400 },
                { label: 'SemiBold', val: 600 },
                { label: 'Bold', val: 700 },
                { label: 'Black', val: 900 },
              ].map((w) => (
                <button
                  key={w.val}
                  className={`segmented-btn ${currentStyle.fontWeight === w.val ? 'active' : ''}`}
                  onClick={() => handleUpdate('fontWeight', w.val)}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Text Transform</label>
            <div className="segmented-button-row">
              {(['none', 'uppercase', 'lowercase'] as TextTransform[]).map((t) => (
                <button
                  key={t}
                  className={`segmented-btn ${currentStyle.textTransform === t ? 'active' : ''}`}
                  onClick={() => handleUpdate('textTransform', t)}
                >
                  {t === 'none' ? 'Standard' : t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <div className="slider-label-row">
              <label className="control-label">Letter Spacing</label>
              <span className="slider-value">{(currentStyle.letterSpacing || 0).toFixed(1)}px</span>
            </div>
            <input
              type="range"
              className="control-slider"
              min="-2"
              max="10"
              step="0.5"
              value={currentStyle.letterSpacing || 0}
              onChange={(e) => handleUpdate('letterSpacing', Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="slider-label-row">
              <label className="control-label">Line Height</label>
              <span className="slider-value">{(currentStyle.lineHeight || 1.3).toFixed(2)}x</span>
            </div>
            <input
              type="range"
              className="control-slider"
              min="1.0"
              max="2.0"
              step="0.05"
              value={currentStyle.lineHeight || 1.3}
              onChange={(e) => handleUpdate('lineHeight', Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Appearance (Colors, Stroke, Shadow, Background Box) */}
      {activeTab === 'appearance' && (
        <div className="style-section-content">
          {/* Colors */}
          <div className="style-subgroup">
            <span className="subgroup-title">Colors & Highlights</span>
            <div className="color-row">
              <label className="color-label">Primary Text</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  className="color-picker"
                  value={currentStyle.primaryColor.startsWith('#') ? currentStyle.primaryColor.substring(0, 7) : '#FFFFFF'}
                  onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                />
                <input
                  type="text"
                  className="control-input hex-input"
                  value={currentStyle.primaryColor}
                  onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                />
              </div>
            </div>

            <div className="color-row">
              <label className="color-label">Active Word Highlight</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  className="color-picker"
                  value={currentStyle.activeWordColor?.startsWith('#') ? currentStyle.activeWordColor.substring(0, 7) : '#FFD700'}
                  onChange={(e) => handleUpdate('activeWordColor', e.target.value)}
                />
                <input
                  type="text"
                  className="control-input hex-input"
                  value={currentStyle.activeWordColor || '#FFD700'}
                  onChange={(e) => handleUpdate('activeWordColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stroke / Outline */}
          <div className="style-subgroup">
            <span className="subgroup-title">Text Stroke / Outline</span>
            <div className="slider-label-row">
              <label className="control-label">Stroke Width</label>
              <span className="slider-value">{currentStyle.strokeWidth || 0}px</span>
            </div>
            <input
              type="range"
              className="control-slider"
              min="0"
              max="16"
              value={currentStyle.strokeWidth || 0}
              onChange={(e) => handleUpdate('strokeWidth', Number(e.target.value))}
            />

            {Boolean(currentStyle.strokeWidth && currentStyle.strokeWidth > 0) && (
              <div className="color-row" style={{ marginTop: '8px' }}>
                <label className="color-label">Stroke Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    className="color-picker"
                    value={currentStyle.strokeColor?.startsWith('#') ? currentStyle.strokeColor.substring(0, 7) : '#000000'}
                    onChange={(e) => handleUpdate('strokeColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="control-input hex-input"
                    value={currentStyle.strokeColor || '#000000'}
                    onChange={(e) => handleUpdate('strokeColor', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Drop Shadow */}
          <div className="style-subgroup">
            <span className="subgroup-title">Shadow & Glow</span>
            <div className="slider-label-row">
              <label className="control-label">Shadow Blur</label>
              <span className="slider-value">{currentStyle.shadowBlur || 0}px</span>
            </div>
            <input
              type="range"
              className="control-slider"
              min="0"
              max="25"
              value={currentStyle.shadowBlur || 0}
              onChange={(e) => handleUpdate('shadowBlur', Number(e.target.value))}
            />

            <div className="color-row" style={{ marginTop: '8px' }}>
              <label className="color-label">Shadow Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  className="color-picker"
                  value={currentStyle.shadowColor?.startsWith('#') ? currentStyle.shadowColor.substring(0, 7) : '#000000'}
                  onChange={(e) => handleUpdate('shadowColor', e.target.value)}
                />
                <input
                  type="text"
                  className="control-input hex-input"
                  value={currentStyle.shadowColor || '#000000'}
                  onChange={(e) => handleUpdate('shadowColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Background Box */}
          <div className="style-subgroup">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="subgroup-title">Background Box</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(currentStyle.hasBackgroundBox)}
                  onChange={(e) => handleUpdate('hasBackgroundBox', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {currentStyle.hasBackgroundBox && (
              <>
                <div className="color-row" style={{ marginTop: '10px' }}>
                  <label className="color-label">Background Color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      className="color-picker"
                      value={currentStyle.backgroundColor?.startsWith('#') ? currentStyle.backgroundColor.substring(0, 7) : '#000000'}
                      onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="control-input hex-input"
                      value={currentStyle.backgroundColor || '#000000'}
                      onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="slider-label-row" style={{ marginTop: '8px' }}>
                  <label className="control-label">Box Opacity</label>
                  <span className="slider-value">{Math.round((currentStyle.backgroundOpacity ?? 0.8) * 100)}%</span>
                </div>
                <input
                  type="range"
                  className="control-slider"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={currentStyle.backgroundOpacity ?? 0.8}
                  onChange={(e) => handleUpdate('backgroundOpacity', Number(e.target.value))}
                />

                <div className="slider-label-row" style={{ marginTop: '8px' }}>
                  <label className="control-label">Corner Radius</label>
                  <span className="slider-value">{currentStyle.boxBorderRadius || 0}px</span>
                </div>
                <input
                  type="range"
                  className="control-slider"
                  min="0"
                  max="24"
                  value={currentStyle.boxBorderRadius || 0}
                  onChange={(e) => handleUpdate('boxBorderRadius', Number(e.target.value))}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Placement & Positioning */}
      {activeTab === 'position' && (
        <div className="style-section-content">
          <div className="control-group">
            <label className="control-label">Horizontal Alignment</label>
            <div className="segmented-button-row">
              {(['left', 'center', 'right'] as HorizontalAlignment[]).map((align) => (
                <button
                  key={align}
                  className={`segmented-btn ${(currentStyle.position?.alignment || 'center') === align ? 'active' : ''}`}
                  onClick={() =>
                    handlePositionUpdate(
                      align,
                      currentStyle.position?.verticalPercent ?? 85
                    )
                  }
                >
                  {align.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Quick Vertical Placement</label>
            <div className="segmented-button-row">
              {[
                { label: 'Top (15%)', val: 15 },
                { label: 'Center (50%)', val: 50 },
                { label: 'Bottom (85%)', val: 85 },
              ].map((pos) => (
                <button
                  key={pos.val}
                  className={`segmented-btn ${currentStyle.position?.verticalPercent === pos.val ? 'active' : ''}`}
                  onClick={() =>
                    handlePositionUpdate(
                      currentStyle.position?.alignment || 'center',
                      pos.val
                    )
                  }
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <div className="slider-label-row">
              <label className="control-label">Custom Vertical Position</label>
              <span className="slider-value">
                {currentStyle.position?.verticalPercent ?? 85}%
              </span>
            </div>
            <input
              type="range"
              className="control-slider"
              min="5"
              max="95"
              value={currentStyle.position?.verticalPercent ?? 85}
              onChange={(e) =>
                handlePositionUpdate(
                  currentStyle.position?.alignment || 'center',
                  Number(e.target.value)
                )
              }
            />
            <span className="control-hint">
              0% is top of video canvas, 100% is bottom baseline.
            </span>
          </div>
        </div>
      )}

      {/* Tab 5: Motion & Kinetic Animation (Phase 8: TASK-040, TASK-041, TASK-042) */}
      {activeTab === 'motion' && (
        <div className="style-section-content">
          {/* Quick Motion Presets */}
          <div className="style-subgroup">
            <span className="subgroup-title">⚡ Quick Motion Presets</span>
            <div className="segmented-button-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  handleAnimationUpdate('entrance', 'pop');
                  handleAnimationUpdate('exit', 'fade');
                  handleAnimationUpdate('durationMs', 150);
                  handleAnimationUpdate('karaokeMode', 'step');
                  handleAnimationUpdate('activeWordEmphasis', true);
                  handleAnimationUpdate('activeWordScale', 1.10);
                }}
              >
                🔥 Punch Pop
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  handleAnimationUpdate('entrance', 'fade');
                  handleAnimationUpdate('exit', 'fade');
                  handleAnimationUpdate('durationMs', 200);
                  handleAnimationUpdate('karaokeMode', 'sweep');
                  handleAnimationUpdate('activeWordEmphasis', false);
                  handleAnimationUpdate('activeWordScale', 1.00);
                }}
              >
                🎵 Smooth Lyric
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  handleAnimationUpdate('entrance', 'slide-up');
                  handleAnimationUpdate('exit', 'slide-up');
                  handleAnimationUpdate('durationMs', 180);
                  handleAnimationUpdate('karaokeMode', 'step');
                  handleAnimationUpdate('activeWordEmphasis', true);
                  handleAnimationUpdate('activeWordScale', 1.06);
                }}
              >
                🚀 Dynamic Rise
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  handleAnimationUpdate('entrance', 'fade');
                  handleAnimationUpdate('exit', 'fade');
                  handleAnimationUpdate('durationMs', 120);
                  handleAnimationUpdate('karaokeMode', 'step');
                  handleAnimationUpdate('activeWordEmphasis', false);
                  handleAnimationUpdate('activeWordScale', 1.00);
                }}
              >
                🌿 Subtle Fade
              </button>
            </div>
          </div>

          {/* Entrance Transition */}
          <div className="control-group">
            <label className="control-label">Entrance Animation</label>
            <select
              className="control-select"
              value={currentAnimation.entrance}
              onChange={(e) => handleAnimationUpdate('entrance', e.target.value as AnimationType)}
            >
              <option value="pop">Scale Pop (Spring Pop In)</option>
              <option value="fade">Fade In (Smooth Dissolve)</option>
              <option value="slide-up">Slide Up (Smooth Eased Rise)</option>
              <option value="bounce">Bounce (Dynamic Kinetic)</option>
              <option value="none">None (Instant Cut)</option>
            </select>
          </div>

          {/* Exit Transition */}
          <div className="control-group">
            <label className="control-label">Exit Animation</label>
            <select
              className="control-select"
              value={currentAnimation.exit}
              onChange={(e) => handleAnimationUpdate('exit', e.target.value as AnimationType)}
            >
              <option value="fade">Fade Out (Gentle Dissolve)</option>
              <option value="pop">Scale Pop Down</option>
              <option value="slide-up">Slide Up Out</option>
              <option value="bounce">Bounce Out</option>
              <option value="none">None (Instant Cut)</option>
            </select>
          </div>

          {/* Transition Duration */}
          <div className="control-group">
            <div className="slider-label-row">
              <label className="control-label">Transition Duration</label>
              <span className="slider-value">{currentAnimation.durationMs}ms</span>
            </div>
            <input
              type="range"
              className="control-slider"
              min="50"
              max="500"
              step="25"
              value={currentAnimation.durationMs}
              onChange={(e) => handleAnimationUpdate('durationMs', Number(e.target.value))}
            />
            <span className="control-hint">
              Controls the speed of entrance and exit animations (50ms - 500ms).
            </span>
          </div>

          {/* Word-Level Karaoke Mode */}
          <div className="control-group">
            <label className="control-label">Karaoke Highlighting Mode</label>
            <div className="segmented-button-row">
              <button
                type="button"
                className={`segmented-btn ${currentAnimation.karaokeMode === 'step' ? 'active' : ''}`}
                onClick={() => handleAnimationUpdate('karaokeMode', 'step')}
              >
                Step Jump (\k)
              </button>
              <button
                type="button"
                className={`segmented-btn ${currentAnimation.karaokeMode === 'sweep' ? 'active' : ''}`}
                onClick={() => handleAnimationUpdate('karaokeMode', 'sweep')}
              >
                Smooth Sweep (\kf)
              </button>
            </div>
            <span className="control-hint">
              Step snaps active color on word onset. Sweep wipes highlight progressively across each word.
            </span>
          </div>

          {/* Active Word Pop Emphasis */}
          <div className="control-group">
            <div className="toggle-row">
              <div>
                <div className="control-label">Active Word Pop Emphasis</div>
                <div className="control-sublabel">Slightly scale up currently spoken word</div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(currentAnimation.activeWordEmphasis)}
                  onChange={(e) => handleAnimationUpdate('activeWordEmphasis', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {currentAnimation.activeWordEmphasis && (
              <>
                <div className="slider-label-row" style={{ marginTop: '10px' }}>
                  <label className="control-label">Emphasis Scale</label>
                  <span className="slider-value">
                    {Math.round((currentAnimation.activeWordScale || 1.08) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  className="control-slider"
                  min="1.00"
                  max="1.30"
                  step="0.02"
                  value={currentAnimation.activeWordScale || 1.08}
                  onChange={(e) => handleAnimationUpdate('activeWordScale', Number(e.target.value))}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {saveModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Save Custom Preset</h3>
              <button className="modal-close-btn" onClick={() => setSaveModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCustom}>
              <div className="modal-body">
                <div className="control-group">
                  <label className="control-label">Preset Name</label>
                  <input
                    type="text"
                    className="control-input"
                    placeholder="e.g. My Neon Reel"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="control-group">
                  <label className="control-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="control-input"
                    placeholder="e.g. High-contrast bold styling with yellow highlight"
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSaveModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
