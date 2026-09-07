import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { PresetManager } from '../editor/presetManager.js';
import { KineticSubtitleRenderer } from './KineticSubtitleRenderer.js';
import { X } from 'lucide-react';
import {
  SubtitleStyle,
  StylePreset,
  HorizontalAlignment,
  TextTransform,
  AnimationConfig,
  AnimationType,
  SubtitleEvent,
} from '../../../shared/types/models.js';
import { DEFAULT_ANIMATION } from '../../../shared/defaults.js';

interface StyleWorkspaceProps {
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

export const StyleWorkspace: React.FC<StyleWorkspaceProps> = ({ presetManager }) => {
  const { project, updateStyle } = useProjectStore();
  const currentStyle = project.style;
  const [activeTab, setActiveTab] = useState<'typography' | 'appearance' | 'box' | 'position' | 'animation'>('typography');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const presets = presetManager.getAllPresets();
  const currentAnimation: AnimationConfig = currentStyle.animation || DEFAULT_ANIMATION;

  const handleApplyPreset = (preset: StylePreset) => {
    updateStyle({ ...preset.style });
    setFeedback(`Applied preset: ${preset.name}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleUpdate = <K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) => {
    updateStyle({
      ...currentStyle,
      [key]: value,
    });
  };

  const handleAnimationUpdate = <K extends keyof AnimationConfig>(key: K, value: AnimationConfig[K]) => {
    updateStyle({
      ...currentStyle,
      animation: {
        ...currentAnimation,
        [key]: value,
      },
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

    if (window.vaaniAPI?.saveCustomPreset) {
      window.vaaniAPI.saveCustomPreset(saved);
    }

    setSaveModalOpen(false);
    setNewPresetName('');
    setNewPresetDesc('');
    setFeedback(`Saved custom preset: ${saved.name}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Sample event for live preview
  const sampleEvent: SubtitleEvent = React.useMemo(() => {
    if (project.events.length > 0) {
      return project.events[0];
    }
    return {
      id: 'sample-preview',
      index: 1,
      startTime: 0,
      endTime: 10,
      text: 'Professional local subtitles made simple',
      words: [
        { id: 'w-1', word: 'Professional', startTime: 0, endTime: 2, confidence: 0.98 },
        { id: 'w-2', word: 'local', startTime: 2, endTime: 4, confidence: 0.99 },
        { id: 'w-3', word: 'subtitles', startTime: 4, endTime: 6, confidence: 0.97 },
        { id: 'w-4', word: 'made', startTime: 6, endTime: 8, confidence: 0.96 },
        { id: 'w-5', word: 'simple', startTime: 8, endTime: 10, confidence: 0.99 },
      ],
    };
  }, [project.events]);

  return (
    <div className="style-workspace">
      {/* Left: Compact Preset Browser */}
      <aside className="style-sidebar-presets">
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Presets ({presets.length})
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSaveModalOpen(true)}
            title="Save current styling as a new custom preset"
          >
            + Save Preset
          </button>
        </div>

        {feedback && (
          <div
            style={{
              padding: '6px 16px',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-active)',
              fontSize: '11px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {feedback}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {presets.map((p) => {
              const isSelected =
                p.style.fontFamily === currentStyle.fontFamily &&
                p.style.primaryColor === currentStyle.primaryColor;

              return (
                <div
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? 'var(--accent-active)' : 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    {!p.isBuiltIn && (
                      <span style={{ fontSize: '9px', backgroundColor: 'var(--border-medium)', padding: '1px 4px', borderRadius: '2px', color: 'var(--text-secondary)' }}>
                        Custom
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                      {p.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Right: Live Style Preview & Progressive Customization Tabs */}
      <main className="style-controls-pane">
        {/* Live Preview Screen Container */}
        <div className="style-preview-container">
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '12px',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Live Subtitle Style Preview
          </div>
          <KineticSubtitleRenderer
            event={sampleEvent}
            currentTime={3.0}
            styleConfig={currentStyle}
            scaleFactor={1.0}
          />
        </div>

        {/* Customization Progressive Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
          {(['typography', 'appearance', 'box', 'position', 'animation'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: '0',
                borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--accent-active)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab ? 600 : 500,
                textTransform: 'capitalize',
                padding: '8px 16px',
              }}
            >
              {tab === 'appearance' ? 'Colors & Stroke' : tab === 'box' ? 'Background Box' : tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Typography */}
        {activeTab === 'typography' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '640px' }}>
            <div className="control-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Font Family</label>
              <select
                className="select-box"
                value={currentStyle.fontFamily}
                onChange={(e) => handleUpdate('fontFamily', e.target.value)}
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f} value={f}>{f.split(',')[0]}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label className="input-label">Font Size ({currentStyle.fontSize}px)</label>
              <input
                type="range"
                min="16"
                max="80"
                value={currentStyle.fontSize}
                onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="control-group">
              <label className="input-label">Font Weight</label>
              <select
                className="select-box"
                value={currentStyle.fontWeight}
                onChange={(e) => handleUpdate('fontWeight', e.target.value)}
              >
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi-Bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra Bold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>

            <div className="control-group">
              <label className="input-label">Letter Spacing ({currentStyle.letterSpacing || 0}px)</label>
              <input
                type="range"
                min="-2"
                max="10"
                step="0.5"
                value={currentStyle.letterSpacing || 0}
                onChange={(e) => handleUpdate('letterSpacing', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="control-group">
              <label className="input-label">Text Transform</label>
              <select
                className="select-box"
                value={currentStyle.textTransform || 'none'}
                onChange={(e) => handleUpdate('textTransform', e.target.value as TextTransform)}
              >
                <option value="none">Normal Case</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
                <option value="capitalize">Capitalize Each Word</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 2: Colors & Stroke */}
        {activeTab === 'appearance' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '640px' }}>
            <div className="control-group">
              <label className="input-label">Text Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={currentStyle.primaryColor}
                  onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                  style={{ width: '36px', height: '32px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="input-text"
                  value={currentStyle.primaryColor}
                  onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                />
              </div>
            </div>

            <div className="control-group">
              <label className="input-label">Outline / Stroke Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={currentStyle.strokeColor || '#000000'}
                  onChange={(e) => handleUpdate('strokeColor', e.target.value)}
                  style={{ width: '36px', height: '32px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="input-text"
                  value={currentStyle.strokeColor || '#000000'}
                  onChange={(e) => handleUpdate('strokeColor', e.target.value)}
                />
              </div>
            </div>

            <div className="control-group">
              <label className="input-label">Stroke Width ({currentStyle.strokeWidth || 0}px)</label>
              <input
                type="range"
                min="0"
                max="12"
                value={currentStyle.strokeWidth || 0}
                onChange={(e) => handleUpdate('strokeWidth', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="control-group">
              <label className="input-label">Shadow Blur ({currentStyle.shadowBlur || 0}px)</label>
              <input
                type="range"
                min="0"
                max="24"
                value={currentStyle.shadowBlur || 0}
                onChange={(e) => handleUpdate('shadowBlur', Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Background Box */}
        {activeTab === 'box' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '640px' }}>
            <div className="control-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={Boolean(currentStyle.hasBackgroundBox)}
                  onChange={(e) => handleUpdate('hasBackgroundBox', e.target.checked)}
                />
                Enable Background Box Behind Subtitles
              </label>
            </div>

            {currentStyle.hasBackgroundBox && (
              <>
                <div className="control-group">
                  <label className="input-label">Box Background Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={currentStyle.backgroundColor?.startsWith('#') ? currentStyle.backgroundColor.substring(0, 7) : '#000000'}
                      onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                      style={{ width: '36px', height: '32px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="input-text"
                      value={currentStyle.backgroundColor || '#000000'}
                      onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="control-group">
                  <label className="input-label">Box Opacity ({Math.round((currentStyle.backgroundOpacity || 0) * 100)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentStyle.backgroundOpacity || 0}
                    onChange={(e) => handleUpdate('backgroundOpacity', Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="control-group">
                  <label className="input-label">Corner Radius ({currentStyle.boxBorderRadius || 0}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={currentStyle.boxBorderRadius || 0}
                    onChange={(e) => handleUpdate('boxBorderRadius', Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="control-group">
                  <label className="input-label">Padding X ({currentStyle.boxPaddingX || 0}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={currentStyle.boxPaddingX || 0}
                    onChange={(e) => handleUpdate('boxPaddingX', Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 4: Position */}
        {activeTab === 'position' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '640px' }}>
            <div className="control-group">
              <label className="input-label">Horizontal Alignment</label>
              <select
                className="select-box"
                value={currentStyle.position.alignment}
                onChange={(e) =>
                  updateStyle({
                    ...currentStyle,
                    position: {
                      ...currentStyle.position,
                      alignment: e.target.value as HorizontalAlignment,
                    },
                  })
                }
              >
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div className="control-group">
              <label className="input-label">Vertical Position ({currentStyle.position.verticalPercent}%)</label>
              <input
                type="range"
                min="5"
                max="95"
                value={currentStyle.position.verticalPercent}
                onChange={(e) =>
                  updateStyle({
                    ...currentStyle,
                    position: {
                      ...currentStyle.position,
                      verticalPercent: Number(e.target.value),
                    },
                  })
                }
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Animation */}
        {activeTab === 'animation' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '640px' }}>
            <div className="control-group">
              <label className="input-label">Entrance Transition</label>
              <select
                className="select-box"
                value={currentAnimation.entrance}
                onChange={(e) => handleAnimationUpdate('entrance', e.target.value as AnimationType)}
              >
                <option value="none">None (Instant)</option>
                <option value="fade">Fade In</option>
                <option value="pop">Pop Scale</option>
                <option value="slide-up">Slide Up</option>
                <option value="bounce">Bounce</option>
              </select>
            </div>

            <div className="control-group">
              <label className="input-label">Exit Transition</label>
              <select
                className="select-box"
                value={currentAnimation.exit}
                onChange={(e) => handleAnimationUpdate('exit', e.target.value as AnimationType)}
              >
                <option value="none">None (Instant)</option>
                <option value="fade">Fade Out</option>
                <option value="pop">Pop Scale</option>
                <option value="slide-up">Slide Up</option>
              </select>
            </div>

            <div className="control-group">
              <label className="input-label">Active Word Highlight Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={currentStyle.activeWordColor?.startsWith('#') ? currentStyle.activeWordColor.substring(0, 7) : '#FACC15'}
                  onChange={(e) => handleUpdate('activeWordColor', e.target.value)}
                  style={{ width: '36px', height: '32px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="input-text"
                  value={currentStyle.activeWordColor || '#FACC15'}
                  onChange={(e) => handleUpdate('activeWordColor', e.target.value)}
                />
              </div>
            </div>

            <div className="control-group">
              <label className="input-label">Karaoke Sweep Mode</label>
              <select
                className="select-box"
                value={currentAnimation.karaokeMode}
                onChange={(e) => handleAnimationUpdate('karaokeMode', e.target.value as any)}
              >
                <option value="step">Step (Word by Word discrete jump)</option>
                <option value="sweep">Sweep (Smooth continuous wipe)</option>
              </select>
            </div>
          </div>
        )}
      </main>

      {/* Save Custom Preset Modal */}
      {saveModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Save Custom Preset</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSaveModalOpen(false)} title="Close">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveCustom}>
              <div className="modal-body">
                <div className="control-group">
                  <label className="input-label">Preset Name</label>
                  <input
                    type="text"
                    className="input-text"
                    required
                    placeholder="e.g. My Vibrant Subtitles"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                  />
                </div>
                <div className="control-group">
                  <label className="input-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="Brief description of this style..."
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSaveModalOpen(false)}>
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
