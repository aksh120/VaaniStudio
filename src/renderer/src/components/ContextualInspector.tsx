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
  X,
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
  onClose,
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
       <div className="inspector-nav-tabs" role="tablist" aria-label="Inspector sections">
         <button
           type="button"
           role="tab"
           aria-selected={inspectorTab === 'style'}
           className={`inspector-nav-btn ${inspectorTab === 'style' ? 'active' : ''}`}
           onClick={() => setInspectorTab('style')}
          title="Style Preset and Visual Appearance"
        >
          Style
        </button>
            <button
             type="button"
             role="tab"
             aria-selected={inspectorTab === 'translate'}
             className={`inspector-nav-btn ${inspectorTab === 'translate' ? 'active' : ''}`}
             onClick={() => setInspectorTab('translate')}
           title="Language and script presentation"
         >
           Script
        </button>
             <button
               type="button"
               role="tab"
               aria-selected={inspectorTab === 'review' || inspectorTab === 'subtitle'}
               className={`inspector-nav-btn ${inspectorTab === 'review' || inspectorTab === 'subtitle' ? 'active' : ''}`}
               onClick={() => setInspectorTab('review')}
             title="Subtitle Event Timing and Review"
           >
             Review
           </button>
             <button
               type="button"
               role="tab"
               aria-selected={inspectorTab === 'video'}
               className={`inspector-nav-btn ${inspectorTab === 'video' ? 'active' : ''}`}
               onClick={() => setInspectorTab('video')}
             title="Media Properties"
           >
             Media
           </button>
             <button
               type="button"
               className="inspector-close-btn"
             onClick={onClose}
             aria-label="Hide inspector"
             title="Hide inspector"
           >
             <X size={14} strokeWidth={1.5} />
           </button>
      </div>

      {/* Main Inspector Scroll Area */}
      <div className="inspector-scroll-area">
        {(inspectorTab === 'review' || inspectorTab === 'subtitle') && (
          <>
            {selectedEvent ? (
              <div className="inspector-stack">
                <div className="inspector-event-header">
                  <span className="inspector-event-title">
                    Subtitle #{selectedEvent.index}
                  </span>
                  <div className="inspector-event-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={onSplit}
                      title="Split subtitle at playhead"
                    >
                      <Scissors size={14} strokeWidth={1.5} />
                      <span>Split</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={onMerge}
                      title="Merge with next subtitle"
                    >
                      <GitMerge size={14} strokeWidth={1.5} />
                      <span>Merge</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-icon"
                      onClick={onDuplicate}
                      aria-label="Duplicate subtitle"
                      title="Duplicate subtitle"
                    >
                      <Copy size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={onDelete}
                      aria-label="Delete subtitle"
                      title="Delete subtitle"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Subtitle Text Area */}
                <div className="control-group">
                  <label className="input-label">Subtitle text</label>
                  <textarea
                    className="textarea-control"
                    rows={4}
                    value={selectedEvent.text}
                    onChange={(e) => onUpdateText(selectedEvent.id, e.target.value)}
                    placeholder="Subtitle text"
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
                      className="input-text tabular-nums"
                      value={selectedEvent.startTime.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateTiming(selectedEvent.id, val, selectedEvent.endTime);
                      }}
                    />
                  </div>
                  <div className="control-group">
                    <label className="input-label">End (s)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      className="input-text tabular-nums"
                      value={selectedEvent.endTime.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateTiming(selectedEvent.id, selectedEvent.startTime, val);
                      }}
                    />
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="inspector-row-2col">
                  <div className="control-group">
                    <label className="input-label">Duration</label>
                    <div className="inspector-readout">
                      {(selectedEvent.endTime - selectedEvent.startTime).toFixed(2)}s
                    </div>
                  </div>
                  <div className="control-group">
                    <label className="input-label">Reading speed</label>
                    <div className={`inspector-readout ${selectedEvent.cps && selectedEvent.cps > 21 ? 'is-warning' : ''}`}>
                      {selectedEvent.cps ? `${selectedEvent.cps.toFixed(1)} CPS` : 'Normal'}
                    </div>
                  </div>
                </div>

                 {selectedEvent.wordTimingState === 'legacy-unverified' && (
                   <div role="status" className="inspector-warning-banner">
                     Legacy timing is unverified. Re-extract audio and regenerate subtitles before export
                   </div>
                 )}

                 {/* Speaker Label */}
                <div className="control-group">
                  <label className="input-label">Speaker</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="Speaker name"
                    value={selectedEvent.speakerLabel || ''}
                    onChange={(e) => onUpdateSpeaker(selectedEvent.id, e.target.value)}
                  />
                </div>

                {/* Word-Level Timings Accordion */}
                {selectedEvent.words && selectedEvent.words.length > 0 && (
                  <div className="inspector-accordion">
                     <button
                       type="button"
                       className="inspector-accordion-head"
                       aria-expanded={isWordTimingOpen}
                       onClick={() => setIsWordTimingOpen(!isWordTimingOpen)}
                     >
                       <span>Word timings ({selectedEvent.words.length})</span>
                       {isWordTimingOpen ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                     </button>
                    {isWordTimingOpen && (
                      <div className="inspector-accordion-body">
                        {selectedEvent.words.map((w, idx) => (
                          <div key={idx} className="inspector-word-row">
                            <span className="inspector-word-text">{w.word}</span>
                            <span className="inspector-word-time">
                              {w.startTime.toFixed(2)}s – {w.endTime.toFixed(2)}s
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="inspector-empty-selection">
                <FileText size={20} strokeWidth={1.5} />
                <span className="inspector-empty-title">No subtitle selected</span>
                <span className="inspector-empty-desc">
                  Select a subtitle in the list or timeline to inspect its timing and text
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
               <button
                 type="button"
                 className="current-preset-card"
                 onClick={() => setIsPresetPickerOpen(!isPresetPickerOpen)}
                 aria-expanded={isPresetPickerOpen}
                 title="Select a style preset"
               >
                 <span className="preset-thumbnail">
                   <span className="preset-thumb-text">{currentPreset.name}</span>
                 </span>
                 <span className="preset-info-wrap">
                   <span className="preset-card-title">{currentPreset.name}</span>
                   <span className="preset-card-desc">{currentPreset.description}</span>
                 </span>
                 {isPresetPickerOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
               </button>

              {/* Expandable Preset Picker Drawer */}
              {isPresetPickerOpen && (
                 <div className="preset-picker-list">
                  {BUILT_IN_PRESETS.map((preset) => (
                     <button
                       type="button"
                       key={preset.id}
                       className={`preset-picker-item ${styleConfig.name === preset.name ? 'active' : ''}`}
                       onClick={() => handleSelectPreset(preset)}
                       aria-pressed={styleConfig.name === preset.name}
                     >
                       <span className="preset-picker-thumb">{preset.name.slice(0, 5)}</span>
                       <span className="preset-picker-copy">
                         <span className="preset-picker-name">{preset.name}</span>
                         <span className="preset-picker-description">{preset.description}</span>
                       </span>
                     </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Style vs Advanced Segmented Switcher */}
            <div className="style-mode-segmented">
              <button
                type="button"
                 className={`style-mode-btn ${styleMode === 'quick' ? 'active' : ''}`}
                 aria-pressed={styleMode === 'quick'}
                 onClick={() => setStyleMode('quick')}
              >
                Quick Style
              </button>
              <button
                type="button"
                 className={`style-mode-btn ${styleMode === 'advanced' ? 'active' : ''}`}
                 aria-pressed={styleMode === 'advanced'}
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
                        <AlignLeft size={16} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        className={`style-align-btn ${styleConfig.position.alignment === 'center' ? 'active' : ''}`}
                        onClick={() =>
                          onUpdateStyle({ position: { ...styleConfig.position, alignment: 'center' } })
                        }
                        title="Align Center"
                      >
                        <AlignCenter size={16} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        className={`style-align-btn ${styleConfig.position.alignment === 'right' ? 'active' : ''}`}
                        onClick={() =>
                          onUpdateStyle({ position: { ...styleConfig.position, alignment: 'right' } })
                        }
                        title="Align Right"
                      >
                        <AlignRight size={16} strokeWidth={1.5} />
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
                  <div className="style-accordion-row">
                    <label className="style-field-label">Vertical position</label>
                    <span className="style-color-hex-text">
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
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
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
                Reset to preset
              </button>
              <button
                type="button"
                className="style-btn-apply"
                onClick={handleApplyToAll}
              >
                {isAppliedToast ? (
                  <>
                    <Check size={14} strokeWidth={1.5} />
                    <span>Applied</span>
                  </>
                ) : (
                  'Apply to all'
                )}
              </button>
            </div>
          </div>
        )}

        {inspectorTab === 'translate' && (
          <div className="inspector-stack">
            <div className="inspector-group">
              <span className="inspector-group-title">Language script mode</span>
              <div className="control-group">
                <label className="input-label">Script transformation</label>
                <select
                  className="select-box"
                  value={scriptMode}
                  onChange={(e) => onScriptModeChange(e.target.value as ScriptMode)}
                >
                  <option value="roman">Roman Hinglish</option>
                  <option value="devanagari">Devanagari</option>
                  <option value="exact">Exact spoken (verbatim)</option>
                  <option value="cleaned">Cleaned speech (filler removed)</option>
                </select>
                <p className="control-help-text">
                  Formats subtitles between Devanagari, Roman Hinglish, and verbatim text
                </p>
              </div>
            </div>

            <div className="inspector-group">
              <span className="inspector-group-title">Speaker diarization</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={!audioWavPath || eventsCount === 0 || isDiarizing}
                onClick={onDiarizeSpeakers}
              >
                {isDiarizing ? 'Diarizing speakers...' : 'Diarize speakers'}
              </button>
              <p className="control-help-text">
                Identify and assign speaker labels across subtitle events
              </p>
            </div>
          </div>
        )}

        {inspectorTab === 'video' && (
          <div className="inspector-stack">
            <div className="inspector-group">
              <span className="inspector-group-title">Media file</span>
              <div className="inspector-media-name">
                {media ? media.fileName : 'No media loaded'}
              </div>
            </div>

            {media && (
              <>
                <div className="inspector-group">
                  <span className="inspector-group-title">Video stream</span>
                  <div className="inspector-row-2col">
                    <div className="control-group">
                      <label className="input-label">Duration</label>
                      <div className="inspector-readout">
                        {media.durationSeconds.toFixed(1)}s
                      </div>
                    </div>
                    <div className="control-group">
                      <label className="input-label">Container</label>
                      <div className="inspector-readout">
                        {media.videoCodec ? media.videoCodec.toUpperCase() : 'MP4/MKV'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inspector-group">
                  <span className="inspector-group-title">Preview frame</span>
                  <div className="control-group">
                    <label className="input-label">Aspect ratio</label>
                    <select
                      className="select-box"
                      value={aspectRatio}
                      onChange={(e) => onAspectRatioChange(e.target.value as AspectRatioMode)}
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

        {inspectorTab === 'audio' && (
          <div className="inspector-stack">
            <div className="inspector-group">
              <span className="inspector-group-title">Audio stream</span>
              <div className="inspector-row-2col">
                <div className="control-group">
                  <label className="input-label">Sample rate</label>
                  <div className="inspector-readout">
                    16 kHz (PCM)
                  </div>
                </div>
                <div className="control-group">
                  <label className="input-label">Channels</label>
                  <div className="inspector-readout">
                    1 (Mono)
                  </div>
                </div>
              </div>
            </div>

            <div className="inspector-group">
              <span className="inspector-group-title">Language script mode</span>
              <div className="control-group">
                <select
                  className="select-box"
                  value={scriptMode}
                  onChange={(e) => onScriptModeChange(e.target.value as ScriptMode)}
                >
                  <option value="roman">Roman Hinglish</option>
                  <option value="devanagari">Devanagari</option>
                  <option value="exact">Exact spoken (verbatim)</option>
                  <option value="cleaned">Cleaned speech (filler removed)</option>
                </select>
              </div>
            </div>

            <div className="inspector-group">
              <span className="inspector-group-title">Speaker diarization</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={!audioWavPath || eventsCount === 0 || isDiarizing}
                onClick={onDiarizeSpeakers}
              >
                {isDiarizing ? 'Diarizing speakers...' : 'Diarize speakers'}
              </button>
              <p className="control-help-text">
                Identify and assign speaker profiles across subtitle events
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
