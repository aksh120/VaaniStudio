import React, { useState } from 'react';
import {
  SubtitleEvent,
  SubtitleStyle,
  MediaInfo,
  ScriptMode,
} from '../../../shared/types/models.js';
import { AspectRatioMode } from './VideoPlayerPreview.js';
import { BUILT_IN_PRESETS } from '../../../shared/subtitles/defaultPresets.js';
import { useUIStore } from '../store/uiStore.js';
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Scissors,
  GitMerge,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
} from 'lucide-react';

export interface ContextualInspectorProps {
  selectedEvent: SubtitleEvent | null;
  onUpdateText: (id: string, text: string) => void;
  onUpdateTiming: (id: string, start: number, end: number) => void;
  onUpdateSpeaker: (id: string, speaker: string) => void;
  onSplit: () => void;
  onMerge: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  styleConfig: SubtitleStyle;
  onUpdateStyle: (style: Partial<SubtitleStyle>) => void;
  media: MediaInfo | null;
  aspectRatio: AspectRatioMode;
  onAspectRatioChange: (ratio: AspectRatioMode) => void;
  onDiarizeSpeakers: () => void;
  isDiarizing: boolean;
  audioWavPath: string | null;
  eventsCount: number;
  scriptMode: ScriptMode;
  onScriptModeChange: (mode: ScriptMode) => void;
  onClose: () => void;
}

export const ContextualInspector: React.FC<ContextualInspectorProps> = ({
  selectedEvent,
  onUpdateText,
  onUpdateTiming,
  onUpdateSpeaker,
  onSplit,
  onMerge,
  onDuplicate,
  onDelete,
  styleConfig,
  onUpdateStyle,
  media,
  aspectRatio,
  onAspectRatioChange,
  onDiarizeSpeakers,
  isDiarizing,
  audioWavPath,
  eventsCount,
  scriptMode,
  onScriptModeChange,
  onClose: _onClose,
}) => {
  const { inspectorTab, setInspectorTab } = useUIStore();

  const [styleMode, setStyleMode] = useState<'quick' | 'advanced'>('quick');
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false);
  const [isWordTimingOpen, setIsWordTimingOpen] = useState(false);
  const [isAppliedToast, setIsAppliedToast] = useState(false);

  const currentPreset =
    BUILT_IN_PRESETS.find(
      (p) => p.name.toLowerCase() === styleConfig.name?.toLowerCase()
    ) || BUILT_IN_PRESETS[0];

  const handleSelectPreset = (preset: (typeof BUILT_IN_PRESETS)[0]) => {
    onUpdateStyle(preset.style);
    setIsPresetPickerOpen(false);
  };

  const handleResetToPreset = () => {
    onUpdateStyle(currentPreset.style);
  };

  const handleApplyToAll = () => {
    onUpdateStyle({ ...styleConfig });
    setIsAppliedToast(true);
    setTimeout(() => setIsAppliedToast(false), 1800);
  };

  return (
    <div className="contextual-inspector-root">
      {/* 3-Tab Navigation Header (Image 0 Target UI: Style | Translate | Review) */}
      <div className="inspector-nav-tabs">
        <button
          className={`inspector-nav-btn ${inspectorTab === 'style' ? 'active' : ''}`}
          onClick={() => setInspectorTab('style')}
          title="Style Preset and Visual Appearance"
        >
          Style
        </button>
        <button
          className={`inspector-nav-btn ${inspectorTab === 'translate' ? 'active' : ''}`}
          onClick={() => setInspectorTab('translate')}
          title="Language Script and Translation"
        >
          Translate
        </button>
        <button
          className={`inspector-nav-btn ${inspectorTab === 'review' || inspectorTab === 'subtitle' ? 'active' : ''}`}
          onClick={() => setInspectorTab('review')}
          title="Subtitle Event Timing and Review"
        >
          Review
        </button>
      </div>

      {/* Main Inspector Scroll Area */}
      <div className="inspector-scroll-area">
        {/* ===================================================================
            TAB 1: REVIEW & SUBTITLE TAB
           =================================================================== */}
        {(inspectorTab === 'review' || inspectorTab === 'subtitle') && (
          <>
            {selectedEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Subtitle Header / Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Subtitle #{selectedEvent.index}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={onSplit}
                      title="Split Subtitle at Playhead"
                      style={{ padding: '2px 6px', height: '22px' }}
                    >
                      <Scissors size={11} />
                      <span style={{ fontSize: '10px' }}>Split</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={onMerge}
                      title="Merge with Next Subtitle"
                      style={{ padding: '2px 6px', height: '22px' }}
                    >
                      <GitMerge size={11} />
                      <span style={{ fontSize: '10px' }}>Merge</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={onDuplicate}
                      title="Duplicate Subtitle"
                      style={{ padding: '2px 6px', height: '22px' }}
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={onDelete}
                      title="Delete Subtitle"
                      style={{ padding: '2px 6px', height: '22px', color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Subtitle Text Area */}
                <div className="control-group">
                  <label className="input-label">Subtitle Text</label>
                  <textarea
                    className="textarea-control"
                    rows={4}
                    value={selectedEvent.text}
                    onChange={(e) => onUpdateText(selectedEvent.id, e.target.value)}
                    placeholder="Enter subtitle text..."
                    style={{ resize: 'vertical', fontSize: '12px', lineHeight: 1.4 }}
                  />
                </div>

                {/* Timing Row */}
                <div className="inspector-row-2col">
                  <div className="control-group">
                    <label className="input-label">Start (s)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      className="input-text"
                      value={selectedEvent.startTime.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateTiming(selectedEvent.id, val, selectedEvent.endTime);
                      }}
                      style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div className="control-group">
                    <label className="input-label">End (s)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      className="input-text"
                      value={selectedEvent.endTime.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateTiming(selectedEvent.id, selectedEvent.startTime, val);
                      }}
                      style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="inspector-row-2col">
                  <div className="control-group">
                    <label className="input-label">Duration</label>
                    <div
                      style={{
                        padding: '5px 8px',
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {(selectedEvent.endTime - selectedEvent.startTime).toFixed(2)}s
                    </div>
                  </div>
                  <div className="control-group">
                    <label className="input-label">Reading Speed</label>
                    <div
                      style={{
                        padding: '5px 8px',
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '11px',
                        color:
                          selectedEvent.cps && selectedEvent.cps > 21
                            ? 'var(--color-warning)'
                            : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {selectedEvent.cps ? `${selectedEvent.cps.toFixed(1)} CPS` : 'Normal'}
                    </div>
                  </div>
                </div>

                {/* Speaker Label */}
                <div className="control-group">
                  <label className="input-label">Speaker</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="e.g. Speaker 1, Host, Guest"
                    value={selectedEvent.speakerLabel || ''}
                    onChange={(e) => onUpdateSpeaker(selectedEvent.id, e.target.value)}
                    style={{ fontSize: '11px' }}
                  />
                </div>

                {/* Word-Level Timings Accordion */}
                {selectedEvent.words && selectedEvent.words.length > 0 && (
                  <div className="inspector-accordion">
                    <div
                      className="inspector-accordion-head"
                      onClick={() => setIsWordTimingOpen(!isWordTimingOpen)}
                    >
                      <span>Word Timings ({selectedEvent.words.length})</span>
                      {isWordTimingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                    {isWordTimingOpen && (
                      <div className="inspector-accordion-body" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        {selectedEvent.words.map((w, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '11px',
                              padding: '3px 6px',
                              borderRadius: '3px',
                              backgroundColor: 'var(--bg-surface-elevated)',
                            }}
                          >
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{w.word}</span>
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                              {w.startTime.toFixed(2)}s - {w.endTime.toFixed(2)}s
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 16px',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  gap: '8px',
                }}
              >
                <FileText size={24} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '12px', fontWeight: 500 }}>No Subtitle Selected</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Click a subtitle in the list or timeline to inspect and edit its parameters.
                </span>
              </div>
            )}
          </>
        )}

        {/* ===================================================================
            TAB 2: STYLE TAB (Image 0 Target UI)
           =================================================================== */}
        {inspectorTab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Current Preset Card */}
            <div className="current-preset-section">
              <span className="current-preset-label">Current Preset</span>
              <div
                className="current-preset-card"
                onClick={() => setIsPresetPickerOpen(!isPresetPickerOpen)}
                title="Click to select a style preset"
              >
                <div className="preset-thumbnail">
                  <span className="preset-thumb-text">{currentPreset.name}</span>
                </div>
                <div className="preset-info-wrap">
                  <span className="preset-card-title">{currentPreset.name}</span>
                  <span className="preset-card-desc">{currentPreset.description}</span>
                </div>
                {isPresetPickerOpen ? (
                  <ChevronDown size={16} color="#94A3B8" />
                ) : (
                  <ChevronRight size={16} color="#94A3B8" />
                )}
              </div>

              {/* Expandable Preset Picker Drawer */}
              {isPresetPickerOpen && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '8px',
                    backgroundColor: '#0E1524',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}
                >
                  {BUILT_IN_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor:
                          styleConfig.name === preset.name ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                        border:
                          styleConfig.name === preset.name
                            ? '1px solid #2563EB'
                            : '1px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '28px',
                          borderRadius: '4px',
                          backgroundColor: '#090D16',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#F8FAFC',
                          flexShrink: 0,
                        }}
                      >
                        {preset.name.slice(0, 5)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                          {preset.name}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#94A3B8',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {preset.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Style vs Advanced Segmented Switcher */}
            <div className="style-mode-segmented">
              <button
                type="button"
                className={`style-mode-btn ${styleMode === 'quick' ? 'active' : ''}`}
                onClick={() => setStyleMode('quick')}
              >
                Quick Style
              </button>
              <button
                type="button"
                className={`style-mode-btn ${styleMode === 'advanced' ? 'active' : ''}`}
                onClick={() => setStyleMode('advanced')}
              >
                Advanced
              </button>
            </div>

            {/* Form Controls: Quick Style */}
            {styleMode === 'quick' && (
              <div className="style-form-grid">
                {/* Row 1: Font Family | Font Size */}
                <div className="style-form-row-2col">
                  <div className="style-input-group">
                    <label className="style-field-label">Font Family</label>
                    <select
                      className="style-select-box"
                      value={styleConfig.fontFamily}
                      onChange={(e) => onUpdateStyle({ fontFamily: e.target.value })}
                    >
                      <option value="Inter, system-ui, sans-serif">Inter</option>
                      <option value="Roboto, system-ui, sans-serif">Roboto</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Segoe UI', sans-serif">Segoe UI</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                      <option value="Impact, sans-serif">Impact</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                    </select>
                  </div>
                  <div className="style-input-group">
                    <label className="style-field-label">Font Size</label>
                    <input
                      type="number"
                      min="16"
                      max="120"
                      className="style-number-input"
                      value={styleConfig.fontSize}
                      onChange={(e) => onUpdateStyle({ fontSize: parseInt(e.target.value) || 44 })}
                    />
                  </div>
                </div>

                {/* Row 2: Font Weight | Text Color */}
                <div className="style-form-row-2col">
                  <div className="style-input-group">
                    <label className="style-field-label">Font Weight</label>
                    <select
                      className="style-select-box"
                      value={styleConfig.fontWeight}
                      onChange={(e) => onUpdateStyle({ fontWeight: parseInt(e.target.value) || 600 })}
                    >
                      <option value="400">Regular (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra-Bold (800)</option>
                    </select>
                  </div>
                  <div className="style-input-group">
                    <label className="style-field-label">Text Color</label>
                    <div className="style-color-input-box">
                      <div
                        className="style-color-swatch"
                        style={{ backgroundColor: styleConfig.primaryColor }}
                      >
                        <input
                          type="color"
                          className="style-color-native-input"
                          value={styleConfig.primaryColor}
                          onChange={(e) => onUpdateStyle({ primaryColor: e.target.value })}
                        />
                      </div>
                      <span className="style-color-hex-text">{styleConfig.primaryColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Background | Alignment */}
                <div className="style-form-row-2col">
                  <div className="style-input-group">
                    <label className="style-field-label">Background</label>
                    <div className="style-color-input-box">
                      <div
                        className="style-color-swatch"
                        style={{
                          backgroundColor: styleConfig.backgroundColor?.startsWith('#')
                            ? styleConfig.backgroundColor
                            : '#000000',
                        }}
                      >
                        <input
                          type="color"
                          className="style-color-native-input"
                          value={
                            styleConfig.backgroundColor?.startsWith('#')
                              ? styleConfig.backgroundColor
                              : '#000000'
                          }
                          onChange={(e) =>
                            onUpdateStyle({ backgroundColor: e.target.value, hasBackgroundBox: true })
                          }
                        />
                      </div>
                      <span className="style-color-hex-text">
                        {styleConfig.backgroundColor?.startsWith('#')
                          ? styleConfig.backgroundColor.toUpperCase()
                          : '#000000'}
                      </span>
                      <span className="style-opacity-badge">
                        {Math.round((styleConfig.backgroundOpacity ?? 0.8) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="style-input-group">
                    <label className="style-field-label" style={{ visibility: 'hidden' }}>Alignment</label>
                    <div className="style-align-group">
                      <button
                        type="button"
                        className={`style-align-btn ${styleConfig.position.alignment === 'left' ? 'active' : ''}`}
                        onClick={() =>
                          onUpdateStyle({ position: { ...styleConfig.position, alignment: 'left' } })
                        }
                        title="Align Left"
                      >
                        <AlignLeft size={16} />
                      </button>
                      <button
                        type="button"
                        className={`style-align-btn ${styleConfig.position.alignment === 'center' ? 'active' : ''}`}
                        onClick={() =>
                          onUpdateStyle({ position: { ...styleConfig.position, alignment: 'center' } })
                        }
                        title="Align Center"
                      >
                        <AlignCenter size={16} />
                      </button>
                      <button
                        type="button"
                        className={`style-align-btn ${styleConfig.position.alignment === 'right' ? 'active' : ''}`}
                        onClick={() =>
                          onUpdateStyle({ position: { ...styleConfig.position, alignment: 'right' } })
                        }
                        title="Align Right"
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 4: Position */}
                <div className="style-input-group">
                  <label className="style-field-label">Position</label>
                  <select
                    className="style-select-box"
                    value={
                      styleConfig.position.verticalPercent <= 30
                        ? 'Top Center'
                        : styleConfig.position.verticalPercent <= 60
                        ? 'Middle Center'
                        : 'Bottom Center'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const vPercent = val === 'Top Center' ? 20 : val === 'Middle Center' ? 50 : 85;
                      onUpdateStyle({
                        position: {
                          ...styleConfig.position,
                          verticalPercent: vPercent,
                        },
                      });
                    }}
                  >
                    <option value="Bottom Center">Bottom Center</option>
                    <option value="Middle Center">Middle Center</option>
                    <option value="Top Center">Top Center</option>
                  </select>
                </div>
              </div>
            )}

            {/* Form Controls: Advanced */}
            {styleMode === 'advanced' && (
              <div className="style-form-grid">
                {/* Active Word Highlight Color */}
                <div className="style-input-group">
                  <label className="style-field-label">Active Word Highlight Color</label>
                  <div className="style-color-input-box">
                    <div
                      className="style-color-swatch"
                      style={{ backgroundColor: styleConfig.activeWordColor || '#FACC15' }}
                    >
                      <input
                        type="color"
                        className="style-color-native-input"
                        value={styleConfig.activeWordColor || '#FACC15'}
                        onChange={(e) => onUpdateStyle({ activeWordColor: e.target.value })}
                      />
                    </div>
                    <span className="style-color-hex-text">
                      {(styleConfig.activeWordColor || '#FACC15').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Stroke */}
                <div className="style-form-row-2col">
                  <div className="style-input-group">
                    <label className="style-field-label">Stroke Width (px)</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      className="style-number-input"
                      value={styleConfig.strokeWidth}
                      onChange={(e) => onUpdateStyle({ strokeWidth: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="style-input-group">
                    <label className="style-field-label">Stroke Color</label>
                    <div className="style-color-input-box">
                      <div
                        className="style-color-swatch"
                        style={{ backgroundColor: styleConfig.strokeColor || '#000000' }}
                      >
                        <input
                          type="color"
                          className="style-color-native-input"
                          value={styleConfig.strokeColor || '#000000'}
                          onChange={(e) => onUpdateStyle({ strokeColor: e.target.value })}
                        />
                      </div>
                      <span className="style-color-hex-text">
                        {(styleConfig.strokeColor || '#000000').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shadow */}
                <div className="style-form-row-2col">
                  <div className="style-input-group">
                    <label className="style-field-label">Shadow Blur</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      className="style-number-input"
                      value={styleConfig.shadowBlur}
                      onChange={(e) => onUpdateStyle({ shadowBlur: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="style-input-group">
                    <label className="style-field-label">Shadow Offset Y</label>
                    <input
                      type="number"
                      min="-20"
                      max="20"
                      className="style-number-input"
                      value={styleConfig.shadowOffsetY}
                      onChange={(e) => onUpdateStyle({ shadowOffsetY: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Box Padding & Corner Radius */}
                <div className="style-form-row-2col">
                  <div className="style-input-group">
                    <label className="style-field-label">Corner Radius (px)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      className="style-number-input"
                      value={styleConfig.boxBorderRadius}
                      onChange={(e) => onUpdateStyle({ boxBorderRadius: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="style-input-group">
                    <label className="style-field-label">Background Opacity (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="style-number-input"
                      value={Math.round((styleConfig.backgroundOpacity ?? 0.8) * 100)}
                      onChange={(e) =>
                        onUpdateStyle({
                          backgroundOpacity: (parseInt(e.target.value) || 80) / 100,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Spacing & Line Height */}
                <div className="style-form-row-2col">
                  <div className="style-input-group">
                    <label className="style-field-label">Letter Spacing (px)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="-2"
                      max="10"
                      className="style-number-input"
                      value={styleConfig.letterSpacing}
                      onChange={(e) =>
                        onUpdateStyle({ letterSpacing: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="style-input-group">
                    <label className="style-field-label">Line Height</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="2.5"
                      className="style-number-input"
                      value={styleConfig.lineHeight}
                      onChange={(e) =>
                        onUpdateStyle({ lineHeight: parseFloat(e.target.value) || 1.3 })
                      }
                    />
                  </div>
                </div>

                {/* Vertical Position Slider */}
                <div className="style-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="style-field-label">Vertical Position</label>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
                      {styleConfig.position.verticalPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={styleConfig.position.verticalPercent}
                    onChange={(e) =>
                      onUpdateStyle({
                        position: {
                          ...styleConfig.position,
                          verticalPercent: parseInt(e.target.value) || 85,
                        },
                      })
                    }
                    style={{ width: '100%', accentColor: '#2563EB' }}
                  />
                </div>
              </div>
            )}

            {/* Preview Section */}
            <div className="style-input-group">
              <label className="style-field-label">Preview</label>
              <div className="style-preview-box">
                <div
                  className="style-preview-capsule"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.82)',
                    color: styleConfig.primaryColor || '#FFFFFF',
                    fontFamily: styleConfig.fontFamily || 'Inter, sans-serif',
                    fontWeight: styleConfig.fontWeight || 600,
                    fontSize: '13px',
                    borderRadius: `${styleConfig.boxBorderRadius ?? 6}px`,
                    letterSpacing: '0.2px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  The{' '}
                  <span
                    style={{
                      color: styleConfig.activeWordColor || '#FACC15',
                      fontWeight: 700,
                    }}
                  >
                    quick
                  </span>{' '}
                  brown fox jumps over the lazy dog
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="style-actions-row">
              <button
                type="button"
                className="style-btn-reset"
                onClick={handleResetToPreset}
              >
                Reset to Preset
              </button>
              <button
                type="button"
                className="style-btn-apply"
                onClick={handleApplyToAll}
              >
                {isAppliedToast ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Applied!
                  </span>
                ) : (
                  'Apply to All'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: TRANSLATE TAB
           =================================================================== */}
        {inspectorTab === 'translate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="inspector-group">
              <span className="inspector-group-title">Language Script Mode</span>
              <div className="control-group">
                <label className="input-label">Script Transformation</label>
                <select
                  className="select-box"
                  value={scriptMode}
                  onChange={(e) => onScriptModeChange(e.target.value as ScriptMode)}
                  style={{ fontSize: '11px' }}
                >
                  <option value="roman">Roman Hinglish</option>
                  <option value="devanagari">Devanagari</option>
                  <option value="exact">Exact Spoken (Verbatim)</option>
                  <option value="cleaned">Cleaned Speech (Filler Removed)</option>
                </select>
                <p className="control-help-text" style={{ fontSize: '10.5px', marginTop: '4px' }}>
                  Auto-formats subtitles between Devanagari Hindi, Romanized Hinglish, or verbatim transcriptions.
                </p>
              </div>
            </div>

            <div className="inspector-group">
              <span className="inspector-group-title">Speaker Diarization</span>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                disabled={!audioWavPath || eventsCount === 0 || isDiarizing}
                onClick={onDiarizeSpeakers}
              >
                {isDiarizing ? 'Diarizing Speakers...' : 'Diarize Speakers'}
              </button>
              <p className="control-help-text" style={{ fontSize: '10.5px' }}>
                Automatically identify and assign distinct speaker labels across all subtitle events.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: VIDEO PROPERTIES TAB
           =================================================================== */}
        {inspectorTab === 'video' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="inspector-group">
              <span className="inspector-group-title">Media File</span>
              <div
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '11px',
                  color: media ? 'var(--text-primary)' : 'var(--text-muted)',
                  wordBreak: 'break-all',
                }}
              >
                {media ? media.fileName : 'No media loaded'}
              </div>
            </div>

            {media && (
              <>
                <div className="inspector-group">
                  <span className="inspector-group-title">Video Stream</span>
                  <div className="inspector-row-2col">
                    <div className="control-group">
                      <label className="input-label">Duration</label>
                      <div
                        style={{
                          padding: '5px 8px',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {media.durationSeconds.toFixed(1)}s
                      </div>
                    </div>
                    <div className="control-group">
                      <label className="input-label">Container</label>
                      <div
                        style={{
                          padding: '5px 8px',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {media.videoCodec ? media.videoCodec.toUpperCase() : 'MP4/MKV'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inspector-group">
                  <span className="inspector-group-title">Preview Frame</span>
                  <div className="control-group">
                    <label className="input-label">Aspect Ratio Format</label>
                    <select
                      className="select-box"
                      value={aspectRatio}
                      onChange={(e) => onAspectRatioChange(e.target.value as AspectRatioMode)}
                      style={{ fontSize: '11px' }}
                    >
                      <option value="original">Original (Video Native)</option>
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Vertical Reel</option>
                      <option value="1:1">1:1 Square</option>
                      <option value="4:5">4:5 Portrait</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================================================================
            TAB 4: AUDIO & SPEAKERS TAB
           =================================================================== */}
        {inspectorTab === 'audio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="inspector-group">
              <span className="inspector-group-title">Audio Stream</span>
              <div className="inspector-row-2col">
                <div className="control-group">
                  <label className="input-label">Sample Rate</label>
                  <div
                    style={{
                      padding: '5px 8px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    16 kHz (PCM)
                  </div>
                </div>
                <div className="control-group">
                  <label className="input-label">Channels</label>
                  <div
                    style={{
                      padding: '5px 8px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    1 (Mono Normalized)
                  </div>
                </div>
              </div>
            </div>

            <div className="inspector-group">
              <span className="inspector-group-title">Language Script Mode</span>
              <div className="control-group">
                <select
                  className="select-box"
                  value={scriptMode}
                  onChange={(e) => onScriptModeChange(e.target.value as ScriptMode)}
                  style={{ fontSize: '11px' }}
                >
                  <option value="roman">Roman Hinglish</option>
                  <option value="devanagari">Devanagari</option>
                  <option value="exact">Exact Spoken (Verbatim)</option>
                  <option value="cleaned">Cleaned Speech (Filler Removed)</option>
                </select>
              </div>
            </div>

            <div className="inspector-group">
              <span className="inspector-group-title">Speaker Diarization</span>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                disabled={!audioWavPath || eventsCount === 0 || isDiarizing}
                onClick={onDiarizeSpeakers}
              >
                {isDiarizing ? 'Diarizing Speakers...' : 'Diarize Speakers'}
              </button>
              <p className="control-help-text" style={{ fontSize: '10.5px' }}>
                Identify and assign speaker profiles across subtitle events automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
