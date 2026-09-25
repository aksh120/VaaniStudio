import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { PresetManager } from '../editor/presetManager.js';
import {
  SubtitleStyle,
  StylePreset,
  TextTransform,
  AnimationConfig,
  AnimationType,
} from '../../../shared/types/models.js';
import { DEFAULT_ANIMATION } from '../../../shared/defaults.js';
import travelDocPreview from '../assets/travel_doc_preview.jpg';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { Dialog } from './ui/Dialog.js';

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

// Helper to detect if a text color is dark or light
const isColorDark = (colorStr?: string): boolean => {
  if (!colorStr) return false;
  const str = colorStr.trim().toLowerCase();
  if (str === 'black' || str === '#000' || str === '#000000') return true;
  if (str === 'white' || str === '#fff' || str === '#ffffff') return false;

  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16) || 0;
      const g = parseInt(hex.slice(2, 4), 16) || 0;
      const b = parseInt(hex.slice(4, 6), 16) || 0;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance < 140;
    }
  }

  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10) || 0;
    const g = parseInt(rgbMatch[2], 10) || 0;
    const b = parseInt(rgbMatch[3], 10) || 0;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140;
  }

  return false;
};

export const StyleWorkspace: React.FC<StyleWorkspaceProps> = ({ presetManager }) => {
  const { project, updateStyle } = useProjectStore();
  const currentStyle = project.style;
  const currentAnimation: AnimationConfig = currentStyle.animation || DEFAULT_ANIMATION;

  // Adaptive background for text contrast:
  // If text is dark -> bg is white. If text is white/light -> bg is dark.
  const isTextDark = useMemo(() => isColorDark(currentStyle.primaryColor), [currentStyle.primaryColor]);

  // Tabs & Navigation State
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    'typography' | 'colors' | 'background' | 'position' | 'animation'
  >('typography');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Preview Stage Display State
  const [fitMode, setFitMode] = useState('Fit');
  const [showSubtitles, setShowSubtitles] = useState(true);

  // Live Style Preview Stage State
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [safeZones, setSafeZones] = useState(false);
  const [previewBackdrop, setPreviewBackdrop] = useState<'white' | 'dark'>(isTextDark ? 'white' : 'dark');

  // Auto-adapt backdrop when text color changes
  useEffect(() => {
    setPreviewBackdrop(isTextDark ? 'white' : 'dark');
  }, [isTextDark]);

  // Dynamic Stage Scaling (fills available space up to the bottom Live Style Preview)
  const stageOuterRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const el = stageOuterRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setStageDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ratioNumber = aspectRatio === '9:16' ? 9 / 16 : aspectRatio === '1:1' ? 1 : 16 / 9;

  const canvasDimensions = useMemo(() => {
    if (stageDimensions.width > 0 && stageDimensions.height > 0) {
      const maxW = Math.min(stageDimensions.width, stageDimensions.height * ratioNumber);
      const maxH = maxW / ratioNumber;
      return {
        width: `${Math.floor(maxW)}px`,
        height: `${Math.floor(maxH)}px`,
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: aspectRatio === '9:16' ? '9 / 16' : aspectRatio === '1:1' ? '1 / 1' : '16 / 9',
      };
    }
    return {
      width: aspectRatio === '9:16' ? '250px' : aspectRatio === '1:1' ? '400px' : '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      aspectRatio: aspectRatio === '9:16' ? '9 / 16' : aspectRatio === '1:1' ? '1 / 1' : '16 / 9',
    };
  }, [stageDimensions, ratioNumber, aspectRatio]);

  // Accordion state in inspector
  const [isAdvancedTypographyOpen, setIsAdvancedTypographyOpen] = useState(true);

  // Modal State for custom preset
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const presets = presetManager.getAllPresets();

  // Filtered presets
  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return presets;
    const q = searchQuery.toLowerCase();
    return presets.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
    );
  }, [presets, searchQuery]);

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

  const handleAnimationUpdate = <K extends keyof AnimationConfig>(
    key: K,
    value: AnimationConfig[K]
  ) => {
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

    const saved = presetManager.saveCustomPreset(newPresetName, newPresetDesc, currentStyle);

    if (window.vaaniAPI?.saveCustomPreset) {
      window.vaaniAPI.saveCustomPreset(saved);
    }

    setSaveModalOpen(false);
    setNewPresetName('');
    setNewPresetDesc('');
    setFeedback(`Saved custom preset: ${saved.name}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  // Get display name matching presets
  const getPresetDisplayName = (name: string) => {
    if (name === 'Minimal Pill') return 'Minimal';
    if (name === 'Punch Reels') return 'Punch';
    if (name === 'Cinematic Serif') return 'Cinematic';
    return name;
  };

  // Render stylized thumbnail dynamically matching the preset's actual style
  const renderThumbnailContent = (preset: StylePreset) => {
    const s = preset.style;
    const isUppercase = s.textTransform === 'uppercase';
    const isItalic = s.fontStyle === 'italic';

    // Background box
    const hasBox = s.hasBackgroundBox;
    let bgBoxColor = 'transparent';
    if (hasBox) {
      const alpha = Math.round((s.backgroundOpacity ?? 0.85) * 255)
        .toString(16)
        .padStart(2, '0');
      bgBoxColor = s.backgroundColor?.startsWith('#')
        ? `${s.backgroundColor.slice(0, 7)}${alpha}`
        : s.backgroundColor || 'rgba(0,0,0,0.85)';
    }

    // Text stroke calculation (scaled so stroke paints cleanly behind thumbnail text)
    const strokeWidth = s.strokeWidth ? Math.min(1.0, Math.max(0.35, s.strokeWidth * 0.16)) : 0;
    const textStroke = strokeWidth > 0 ? `${strokeWidth}px ${s.strokeColor || '#000000'}` : undefined;

    // Drop shadow / glow calculation
    const shadowBlur = s.shadowBlur ? Math.min(4, Math.max(1, s.shadowBlur * 0.25)) : 0;
    const textShadow = shadowBlur > 0
      ? `0px 1px ${shadowBlur}px ${s.shadowColor || 'rgba(0,0,0,0.8)'}`
      : undefined;

    const baseColor = s.primaryColor || '#FFFFFF';
    const highlightColor = s.activeWordColor || baseColor;

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgBoxColor,
          borderRadius: hasBox ? `${Math.max(2, Math.min(6, (s.boxBorderRadius ?? 6) * 0.35))}px` : undefined,
          padding: hasBox ? '1px 5px' : '0',
          fontFamily: s.fontFamily || 'Inter, sans-serif',
          fontWeight: s.fontWeight || 600,
          fontStyle: isItalic ? 'italic' : 'normal',
          textTransform: s.textTransform || 'none',
          letterSpacing: s.letterSpacing ? `${s.letterSpacing * 0.3}px` : undefined,
          lineHeight: 1.15,
          fontSize: '10.5px',
          maxWidth: '100%',
        }}
      >
        <span
          style={{
            color: baseColor,
            WebkitTextStroke: textStroke,
            paintOrder: 'stroke fill',
            textShadow,
          }}
        >
          {isUppercase ? 'THE ' : 'The '}
        </span>
        <span
          style={{
            color: highlightColor,
            fontWeight: Math.min(900, (Number(s.fontWeight) || 600) + (highlightColor !== baseColor ? 100 : 0)),
            WebkitTextStroke: textStroke,
            paintOrder: 'stroke fill',
            textShadow,
          }}
        >
          {isUppercase ? 'QUICK' : 'quick'}
        </span>
      </div>
    );
  };

  // Computed subtitle styles ensuring unified rendering across video stage, live preview, and inspector card
  const getComputedSubtitleStyles = (
    style: SubtitleStyle,
    scaleFactor: number
  ) => {
    const hasBox = Boolean(style.hasBackgroundBox);
    let bgBoxColor = 'transparent';
    if (hasBox) {
      const alpha = Math.round((style.backgroundOpacity ?? 0.8) * 255)
        .toString(16)
        .padStart(2, '0');
      bgBoxColor = style.backgroundColor?.startsWith('#')
        ? `${style.backgroundColor.slice(0, 7)}${alpha}`
        : style.backgroundColor || 'rgba(0,0,0,0.8)';
    }

    const strokePx = style.strokeWidth
      ? Math.max(0.6, Number((style.strokeWidth * scaleFactor * 1.1).toFixed(1)))
      : 0;
    const strokeVal = strokePx > 0 ? `${strokePx}px ${style.strokeColor || '#000000'}` : undefined;

    const shadowX = Math.round((style.shadowOffsetX || 0) * scaleFactor);
    const shadowY = Math.round((style.shadowOffsetY ?? 2) * scaleFactor);
    const shadowBlur = Math.round((style.shadowBlur || 0) * scaleFactor);
    const shadowVal = (style.shadowBlur || style.shadowOffsetX || style.shadowOffsetY)
      ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${style.shadowColor || 'rgba(0,0,0,0.8)'}`
      : !hasBox && !strokeVal
        ? '0 1px 3px rgba(0,0,0,0.85)'
        : 'none';

    const fontSizePx = Math.max(11, Math.round((style.fontSize || 48) * scaleFactor));
    const padY = hasBox ? Math.max(3, Math.round((style.boxPaddingY ?? 6) * scaleFactor * 1.2)) : 0;
    const padX = hasBox ? Math.max(6, Math.round((style.boxPaddingX ?? 14) * scaleFactor * 1.2)) : 0;
    const radiusPx = hasBox ? Math.max(2, Math.round((style.boxBorderRadius ?? 6) * scaleFactor * 1.2)) : 0;

    return {
      capsuleStyle: {
        backgroundColor: bgBoxColor,
        padding: hasBox ? `${padY}px ${padX}px` : '0px',
        borderRadius: hasBox ? `${radiusPx}px` : '0px',
        boxShadow: hasBox ? '0 4px 16px rgba(0, 0, 0, 0.45)' : 'none',
        color: style.primaryColor || '#FFFFFF',
        fontFamily: style.fontFamily || 'Inter, sans-serif',
        fontSize: `${fontSizePx}px`,
        fontWeight: style.fontWeight || 600,
        fontStyle: style.fontStyle || 'normal',
        textTransform: style.textTransform || 'none',
        letterSpacing: style.letterSpacing ? `${(style.letterSpacing * scaleFactor).toFixed(1)}px` : '0px',
        lineHeight: style.lineHeight || 1.25,
        textAlign: (style.position?.alignment || 'center') as any,
        textShadow: shadowVal,
        WebkitTextStroke: strokeVal,
        paintOrder: 'stroke fill',
        display: 'inline-block',
        maxWidth: '92%',
        margin: '0 auto',
        wordBreak: 'break-word' as const,
      } as React.CSSProperties,
      activeWordStyle: {
        color: style.activeWordColor || '#FACC15',
        fontWeight: 700,
        WebkitTextStroke: strokeVal,
        paintOrder: 'stroke fill',
      } as React.CSSProperties,
    };
  };

  const videoSubtitleStyles = useMemo(
    () => getComputedSubtitleStyles(currentStyle, 0.36),
    [currentStyle]
  );
  const liveSubtitleStyles = useMemo(
    () => getComputedSubtitleStyles(currentStyle, 0.42),
    [currentStyle]
  );
  const inspectorSubtitleStyles = useMemo(
    () => getComputedSubtitleStyles(currentStyle, 0.28),
    [currentStyle]
  );

  return (
    <div className="style-workspace-root">
      {/* ===================================================================
          COLUMN 1: STYLE PRESETS SIDEBAR
         =================================================================== */}
      <aside className="style-presets-sidebar">
        {/* Header Bar */}
        <div className="style-presets-topbar">
          <div className="style-presets-header-title">
            <span>Presets</span>
            <span className="style-presets-badge">{presets.length}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSaveModalOpen(true)}
            style={{ padding: '3px 8px', height: '26px', fontSize: '11px', gap: '4px' }}
            title="Save current style as a new custom preset"
          >
            <Plus size={12} />
            <span>Save preset</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="style-search-container">
          <Search size={13} className="style-search-icon" />
          <input
            type="text"
            className="style-search-input"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              color: '#60A5FA',
              fontSize: '11px',
              borderBottom: '1px solid rgba(37, 99, 235, 0.3)',
            }}
          >
            {feedback}
          </div>
        )}

        {/* Presets Card List */}
        <div className="style-presets-scroll-list">
          {filteredPresets.map((p) => {
            const isSelected =
              currentStyle.name?.toLowerCase() === p.name.toLowerCase() ||
              (p.style.fontFamily === currentStyle.fontFamily &&
                p.style.primaryColor === currentStyle.primaryColor);

            return (
              <button
                type="button"
                key={p.id}
                className={`style-preset-card-item ${isSelected ? 'active' : ''}`}
                aria-pressed={isSelected}
                onClick={() => handleApplyPreset(p)}
                title={p.description}
              >
                <span className="style-preset-thumb-box">
                  <span className="style-preset-thumb-text">{renderThumbnailContent(p)}</span>
                </span>
                <span className="style-preset-details">
                  <span className="style-preset-name">{getPresetDisplayName(p.name)}</span>
                  <span className="style-preset-desc">{p.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ===================================================================
          COLUMN 2: VIDEO CANVAS & LIVE STYLE PREVIEW STAGE
         =================================================================== */}
      <section className="style-center-stage">
        {/* Video Player Card */}
        <div className="style-video-card-container">
          {/* Video Header Toolbar */}
          <div className="style-video-card-topbar">
            <select
              className="style-topbar-action-btn"
              value={fitMode}
              onChange={(e) => setFitMode(e.target.value)}
              style={{ outline: 'none' }}
              title="Preview Media Object Fit Scale"
            >
              <option value="Fit">Fit</option>
              <option value="Fill">Fill</option>
              <option value="100%">100%</option>
            </select>

            <button
              type="button"
              className={`style-topbar-action-btn ${showSubtitles ? 'active' : ''}`}
              onClick={() => setShowSubtitles(!showSubtitles)}
              title="Toggle Subtitle Visibility on Video"
            >
              {showSubtitles ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>Show Subtitles</span>
            </button>
          </div>

          {/* Video Stage Outer Frame */}
          <div ref={stageOuterRef} className="style-video-stage-outer">
            <div
              className="style-video-stage-canvas"
              onDragStart={(e) => e.preventDefault()}
              style={{
                ...canvasDimensions,
                borderRadius: aspectRatio === '16:9' ? '0' : '6px',
                boxShadow: aspectRatio === '16:9' ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.65)',
                userSelect: 'none',
              }}
            >
              {project.media?.filePath ? (
                <video
                  src={project.media.filePath}
                  className="style-video-bg-media"
                  controls={false}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{
                    objectFit: fitMode === 'Fit' ? 'contain' : fitMode === 'Fill' ? 'cover' : 'none',
                    width: '100%',
                    height: '100%',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <img
                  src={travelDocPreview}
                  alt="Travel Documentary Stage Preview"
                  className="style-video-bg-media"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  style={{
                    objectFit: fitMode === 'Fit' ? 'contain' : fitMode === 'Fill' ? 'cover' : 'none',
                    width: '100%',
                    height: '100%',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Live Subtitle Overlay */}
              {showSubtitles && (
                <div
                  className="style-video-overlay-subtitle-wrap"
                  style={{
                    top: `${currentStyle.position.verticalPercent}%`,
                    transform: 'translateY(-50%)',
                    justifyContent:
                      currentStyle.position.alignment === 'left'
                        ? 'flex-start'
                        : currentStyle.position.alignment === 'right'
                        ? 'flex-end'
                        : 'center',
                  }}
                >
                  <div style={videoSubtitleStyles.capsuleStyle}>
                    <div>
                      A journey through{' '}
                      <span style={videoSubtitleStyles.activeWordStyle}>
                        mountains
                      </span>{' '}
                      and stories
                    </div>
                    <div>that connect us all.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Style Preview Card */}
        <div className="style-live-preview-card">
          <div className="style-live-preview-header">
            <span className="style-live-title">Live Style Preview</span>
            <div className="style-live-controls-group">
              {/* Aspect Ratio Pills */}
              <div className="style-aspect-ratio-pills">
                <button
                  type="button"
                  className={`style-aspect-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                  aria-pressed={aspectRatio === '16:9'}
                  onClick={() => setAspectRatio('16:9')}
                >
                  16:9
                </button>
                <button
                  type="button"
                  className={`style-aspect-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
                  aria-pressed={aspectRatio === '9:16'}
                  onClick={() => setAspectRatio('9:16')}
                >
                  9:16
                </button>
                <button
                  type="button"
                  className={`style-aspect-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
                  aria-pressed={aspectRatio === '1:1'}
                  onClick={() => setAspectRatio('1:1')}
                >
                  1:1
                </button>
              </div>

              {/* Preview Box Color Switcher */}
              <div className="style-aspect-ratio-pills">
                <button
                  type="button"
                  className={`style-aspect-btn ${previewBackdrop === 'white' ? 'active' : ''}`}
                  aria-pressed={previewBackdrop === 'white'}
                  onClick={() => setPreviewBackdrop('white')}
                  title="White preview backdrop"
                >
                  White
                </button>
                <button
                  type="button"
                  className={`style-aspect-btn ${previewBackdrop === 'dark' ? 'active' : ''}`}
                  aria-pressed={previewBackdrop === 'dark'}
                  onClick={() => setPreviewBackdrop('dark')}
                  title="Dark preview backdrop"
                >
                  Dark
                </button>
              </div>

              {/* Safe Zones Toggle */}
              <div className="style-safezones-toggle">
                <span>Safe Zones</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={safeZones}
                  className={`style-toggle-switch ${safeZones ? 'active' : ''}`}
                  onClick={() => setSafeZones(!safeZones)}
                >
                  <span className="style-toggle-thumb" />
                </button>
              </div>
            </div>
          </div>

          {/* Subtitle Preview Box */}
          <div
            className="style-live-preview-box"
            style={{
              backgroundColor: previewBackdrop === 'white' ? '#FFFFFF' : '#080C16',
              borderColor: previewBackdrop === 'white' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {safeZones && (
              <>
                <div
                  className="style-safe-zone-box"
                  style={{
                    top: '5%',
                    bottom: '5%',
                    left: '5%',
                    right: '5%',
                    borderColor: previewBackdrop === 'white' ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.18)',
                    color: previewBackdrop === 'white' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.35)',
                  }}
                >
                  Action Safe 90%
                </div>
                <div
                  className="style-safe-zone-box"
                  style={{
                    top: '10%',
                    bottom: '10%',
                    left: '10%',
                    right: '10%',
                    borderColor: previewBackdrop === 'white' ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.18)',
                    color: previewBackdrop === 'white' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.35)',
                  }}
                >
                  Title Safe 80%
                </div>
              </>
            )}

            <div style={liveSubtitleStyles.capsuleStyle}>
              <div>
                A journey through{' '}
                <span style={liveSubtitleStyles.activeWordStyle}>
                  mountains
                </span>{' '}
                and stories
              </div>
              <div>that connect us all.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          COLUMN 3: RIGHT STYLE INSPECTOR PANEL
         =================================================================== */}
      <aside className="style-inspector-pane">
        {/* Category Tabs Header */}
        <div className="style-inspector-tabs-header" role="tablist" aria-label="Style properties">
          <button
            type="button"
            className={`style-tab-nav-btn ${activeInspectorTab === 'typography' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeInspectorTab === 'typography'}
            onClick={() => setActiveInspectorTab('typography')}
          >
            Typography
          </button>
          <button
            type="button"
            className={`style-tab-nav-btn ${activeInspectorTab === 'colors' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeInspectorTab === 'colors'}
            onClick={() => setActiveInspectorTab('colors')}
          >
            Colors &amp; Stroke
          </button>
          <button
            type="button"
            className={`style-tab-nav-btn ${activeInspectorTab === 'background' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeInspectorTab === 'background'}
            onClick={() => setActiveInspectorTab('background')}
          >
            Background
          </button>
          <button
            type="button"
            className={`style-tab-nav-btn ${activeInspectorTab === 'position' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeInspectorTab === 'position'}
            onClick={() => setActiveInspectorTab('position')}
          >
            Position
          </button>
          <button
            type="button"
            className={`style-tab-nav-btn ${activeInspectorTab === 'animation' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeInspectorTab === 'animation'}
            onClick={() => setActiveInspectorTab('animation')}
          >
            Animation
          </button>
        </div>

        {/* Tab 1: Typography */}
        {activeInspectorTab === 'typography' && (
          <div className="style-inspector-form-body">
            {/* Font Family */}
            <div className="style-input-group">
              <label className="style-field-label">Font Family</label>
              <select
                className="style-select-box"
                value={currentStyle.fontFamily}
                onChange={(e) => handleUpdate('fontFamily', e.target.value)}
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="style-input-group">
              <label className="style-field-label">Font Size</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="16"
                  max="96"
                  value={currentStyle.fontSize || 48}
                  onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.fontSize || 48} px</div>
              </div>
            </div>

            {/* Font Weight */}
            <div className="style-input-group">
              <label className="style-field-label">Font Weight</label>
              <select
                className="style-select-box"
                value={currentStyle.fontWeight}
                onChange={(e) => handleUpdate('fontWeight', e.target.value)}
              >
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi-Bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra-Bold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>

            {/* Text Transform */}
            <div className="style-input-group">
              <label className="style-field-label">Text Transform</label>
              <select
                className="style-select-box"
                value={currentStyle.textTransform || 'none'}
                onChange={(e) => handleUpdate('textTransform', e.target.value as TextTransform)}
              >
                <option value="none">Normal Case</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
              </select>
            </div>

            {/* Letter Spacing */}
            <div className="style-input-group">
              <label className="style-field-label">Letter Spacing</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="-2"
                  max="10"
                  step="0.5"
                  value={currentStyle.letterSpacing || 0}
                  onChange={(e) => handleUpdate('letterSpacing', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.letterSpacing || 0} px</div>
              </div>
            </div>

            {/* Line Height */}
            <div className="style-input-group">
              <label className="style-field-label">Line Height</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="1.0"
                  max="2.2"
                  step="0.1"
                  value={currentStyle.lineHeight || 1.2}
                  onChange={(e) => handleUpdate('lineHeight', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.lineHeight || 1.2}</div>
              </div>
            </div>

            {/* Text Preview Card */}
            <div className="style-input-group">
              <label className="style-field-label">Text Preview</label>
              <div
                className="style-text-preview-card"
                style={{
                  backgroundColor: isTextDark ? '#FFFFFF' : '#080C16',
                  borderColor: isTextDark ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div style={inspectorSubtitleStyles.capsuleStyle}>
                  <div>
                    A journey through{' '}
                    <span style={inspectorSubtitleStyles.activeWordStyle}>
                      mountains
                    </span>{' '}
                    and stories
                  </div>
                  <div>that connect us all.</div>
                </div>
              </div>
            </div>

            {/* Collapsible Advanced Typography Accordion */}
            <div className="style-accordion-section">
              <button
                type="button"
                className="style-accordion-header"
                aria-expanded={isAdvancedTypographyOpen}
                onClick={() => setIsAdvancedTypographyOpen(!isAdvancedTypographyOpen)}
              >
                <span>Advanced Typography</span>
                {isAdvancedTypographyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isAdvancedTypographyOpen && (
                <div className="style-accordion-content">
                  {/* Word Highlighting Switch */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <label className="style-field-label" style={{ margin: 0 }}>
                      Word Highlighting
                    </label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={currentAnimation.activeWordEmphasis !== false}
                      className={`style-toggle-switch ${currentAnimation.activeWordEmphasis !== false ? 'active' : ''}`}
                      onClick={() =>
                        handleAnimationUpdate(
                          'activeWordEmphasis',
                          !currentAnimation.activeWordEmphasis
                        )
                      }
                    >
                      <span className="style-toggle-thumb" />
                    </button>
                  </div>

                  {/* Highlight Color */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                    }}
                  >
                    <label className="style-field-label" style={{ margin: 0 }}>
                      Highlight Color
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        className="style-color-swatch"
                        style={{
                          width: '24px',
                          height: '16px',
                          borderRadius: '3px',
                          backgroundColor: currentStyle.activeWordColor || '#FACC15',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          position: 'relative',
                        }}
                      >
                        <input
                          type="color"
                          className="style-color-native-input"
                          value={currentStyle.activeWordColor || '#FACC15'}
                          onChange={(e) => handleUpdate('activeWordColor', e.target.value)}
                        />
                      </div>
                      <ChevronDown size={13} color="#94A3B8" />
                    </div>
                  </div>

                  {/* Highlight Weight */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                    }}
                  >
                    <label className="style-field-label" style={{ margin: 0 }}>
                      Highlight Weight
                    </label>
                    <select
                      className="style-select-box"
                      style={{ width: '110px', height: '28px', padding: '0 8px' }}
                      value={currentAnimation.activeWordEmphasis ? 'Bold' : 'Normal'}
                      onChange={(e) =>
                        handleAnimationUpdate('activeWordEmphasis', e.target.value === 'Bold')
                      }
                    >
                      <option value="Normal">Normal</option>
                      <option value="Medium">Medium</option>
                      <option value="Semi-Bold">Semi-Bold</option>
                      <option value="Bold">Bold</option>
                      <option value="Extra-Bold">Extra-Bold</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Colors & Stroke */}
        {activeInspectorTab === 'colors' && (
          <div className="style-inspector-form-body">
            {/* Primary Text Color */}
            <div className="style-input-group">
              <label className="style-field-label">Text Color</label>
              <div className="style-color-input-box">
                <div
                  className="style-color-swatch"
                  style={{ backgroundColor: currentStyle.primaryColor || '#FFFFFF' }}
                >
                  <input
                    type="color"
                    className="style-color-native-input"
                    value={currentStyle.primaryColor || '#FFFFFF'}
                    onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                  />
                </div>
                <span className="style-color-hex-text">
                  {(currentStyle.primaryColor || '#FFFFFF').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Active Word Highlight Color */}
            <div className="style-input-group">
              <label className="style-field-label">Active Word Highlight</label>
              <div className="style-color-input-box">
                <div
                  className="style-color-swatch"
                  style={{ backgroundColor: currentStyle.activeWordColor || '#FACC15' }}
                >
                  <input
                    type="color"
                    className="style-color-native-input"
                    value={currentStyle.activeWordColor || '#FACC15'}
                    onChange={(e) => handleUpdate('activeWordColor', e.target.value)}
                  />
                </div>
                <span className="style-color-hex-text">
                  {(currentStyle.activeWordColor || '#FACC15').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Stroke Width */}
            <div className="style-input-group">
              <label className="style-field-label">Stroke Width</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={currentStyle.strokeWidth || 0}
                  onChange={(e) => handleUpdate('strokeWidth', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.strokeWidth || 0} px</div>
              </div>
            </div>

            {/* Stroke Color */}
            <div className="style-input-group">
              <label className="style-field-label">Stroke Color</label>
              <div className="style-color-input-box">
                <div
                  className="style-color-swatch"
                  style={{ backgroundColor: currentStyle.strokeColor || '#000000' }}
                >
                  <input
                    type="color"
                    className="style-color-native-input"
                    value={currentStyle.strokeColor || '#000000'}
                    onChange={(e) => handleUpdate('strokeColor', e.target.value)}
                  />
                </div>
                <span className="style-color-hex-text">
                  {(currentStyle.strokeColor || '#000000').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Shadow Blur */}
            <div className="style-input-group">
              <label className="style-field-label">Shadow Blur</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={currentStyle.shadowBlur || 0}
                  onChange={(e) => handleUpdate('shadowBlur', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.shadowBlur || 0} px</div>
              </div>
            </div>

            {/* Shadow Offset Y */}
            <div className="style-input-group">
              <label className="style-field-label">Shadow Offset Y</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="-15"
                  max="25"
                  value={currentStyle.shadowOffsetY || 0}
                  onChange={(e) => handleUpdate('shadowOffsetY', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.shadowOffsetY || 0} px</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Background */}
        {activeInspectorTab === 'background' && (
          <div className="style-inspector-form-body">
            {/* Background Box Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <label className="style-field-label" style={{ margin: 0 }}>
                Background Box
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={currentStyle.hasBackgroundBox}
                className={`style-toggle-switch ${currentStyle.hasBackgroundBox ? 'active' : ''}`}
                onClick={() => handleUpdate('hasBackgroundBox', !currentStyle.hasBackgroundBox)}
              >
                <span className="style-toggle-thumb" />
              </button>
            </div>

            {/* Box Color */}
            <div className="style-input-group">
              <label className="style-field-label">Box Color</label>
              <div className="style-color-input-box">
                <div
                  className="style-color-swatch"
                  style={{
                    backgroundColor: currentStyle.backgroundColor?.startsWith('#')
                      ? currentStyle.backgroundColor
                      : '#000000',
                  }}
                >
                  <input
                    type="color"
                    className="style-color-native-input"
                    value={
                      currentStyle.backgroundColor?.startsWith('#')
                        ? currentStyle.backgroundColor
                        : '#000000'
                    }
                    onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                  />
                </div>
                <span className="style-color-hex-text">
                  {currentStyle.backgroundColor?.startsWith('#')
                    ? currentStyle.backgroundColor.toUpperCase()
                    : '#000000'}
                </span>
              </div>
            </div>

            {/* Background Opacity */}
            <div className="style-input-group">
              <label className="style-field-label">Background Opacity</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((currentStyle.backgroundOpacity ?? 0.8) * 100)}
                  onChange={(e) =>
                    handleUpdate('backgroundOpacity', Number(e.target.value) / 100)
                  }
                />
                <div className="style-numeric-badge">
                  {Math.round((currentStyle.backgroundOpacity ?? 0.8) * 100)}%
                </div>
              </div>
            </div>

            {/* Corner Radius */}
            <div className="style-input-group">
              <label className="style-field-label">Corner Radius</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={currentStyle.boxBorderRadius || 0}
                  onChange={(e) => handleUpdate('boxBorderRadius', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.boxBorderRadius || 0} px</div>
              </div>
            </div>

            {/* Padding X */}
            <div className="style-input-group">
              <label className="style-field-label">Padding Horizontal</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="0"
                  max="36"
                  value={currentStyle.boxPaddingX || 14}
                  onChange={(e) => handleUpdate('boxPaddingX', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.boxPaddingX || 14} px</div>
              </div>
            </div>

            {/* Padding Y */}
            <div className="style-input-group">
              <label className="style-field-label">Padding Vertical</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={currentStyle.boxPaddingY || 6}
                  onChange={(e) => handleUpdate('boxPaddingY', Number(e.target.value))}
                />
                <div className="style-numeric-badge">{currentStyle.boxPaddingY || 6} px</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Position */}
        {activeInspectorTab === 'position' && (
          <div className="style-inspector-form-body">
            {/* Alignment */}
            <div className="style-input-group">
              <label className="style-field-label">Alignment</label>
              <div className="style-align-group">
                <button
                  type="button"
                  className={`style-align-btn ${currentStyle.position.alignment === 'left' ? 'active' : ''}`}
                  onClick={() =>
                    handleUpdate('position', { ...currentStyle.position, alignment: 'left' })
                  }
                  title="Align Left"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  type="button"
                  className={`style-align-btn ${currentStyle.position.alignment === 'center' ? 'active' : ''}`}
                  onClick={() =>
                    handleUpdate('position', { ...currentStyle.position, alignment: 'center' })
                  }
                  title="Align Center"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  type="button"
                  className={`style-align-btn ${currentStyle.position.alignment === 'right' ? 'active' : ''}`}
                  onClick={() =>
                    handleUpdate('position', { ...currentStyle.position, alignment: 'right' })
                  }
                  title="Align Right"
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>

            {/* Vertical Position */}
            <div className="style-input-group">
              <label className="style-field-label">Vertical Position</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="10"
                  max="95"
                  value={currentStyle.position.verticalPercent}
                  onChange={(e) =>
                    handleUpdate('position', {
                      ...currentStyle.position,
                      verticalPercent: Number(e.target.value),
                    })
                  }
                />
                <div className="style-numeric-badge">{currentStyle.position.verticalPercent}%</div>
              </div>
            </div>

            {/* Position Preset */}
            <div className="style-input-group">
              <label className="style-field-label">Position Preset</label>
              <select
                className="style-select-box"
                value={
                  currentStyle.position.verticalPercent <= 30
                    ? 'Top Center'
                    : currentStyle.position.verticalPercent <= 60
                    ? 'Middle Center'
                    : 'Bottom Center'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  const vPercent = val === 'Top Center' ? 20 : val === 'Middle Center' ? 50 : 85;
                  handleUpdate('position', {
                    ...currentStyle.position,
                    verticalPercent: vPercent,
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

        {/* Tab 5: Animation */}
        {activeInspectorTab === 'animation' && (
          <div className="style-inspector-form-body">
            {/* Entrance Effect */}
            <div className="style-input-group">
              <label className="style-field-label">Entrance Animation</label>
              <select
                className="style-select-box"
                value={currentAnimation.entrance}
                onChange={(e) =>
                  handleAnimationUpdate('entrance', e.target.value as AnimationType)
                }
              >
                <option value="none">None</option>
                <option value="pop">Pop (Dynamic Zoom)</option>
                <option value="fade">Fade In</option>
                <option value="slide-up">Slide Up</option>
                <option value="bounce">Bounce</option>
              </select>
            </div>

            {/* Exit Effect */}
            <div className="style-input-group">
              <label className="style-field-label">Exit Animation</label>
              <select
                className="style-select-box"
                value={currentAnimation.exit}
                onChange={(e) =>
                  handleAnimationUpdate('exit', e.target.value as AnimationType)
                }
              >
                <option value="none">None</option>
                <option value="fade">Fade Out</option>
                <option value="slide-up">Slide Up</option>
              </select>
            </div>

            {/* Duration */}
            <div className="style-input-group">
              <label className="style-field-label">Animation Duration</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="25"
                  value={currentAnimation.durationMs || 150}
                  onChange={(e) =>
                    handleAnimationUpdate('durationMs', Number(e.target.value))
                  }
                />
                <div className="style-numeric-badge">{currentAnimation.durationMs || 150} ms</div>
              </div>
            </div>

            {/* Karaoke Mode */}
            <div className="style-input-group">
              <label className="style-field-label">Karaoke Highlight Mode</label>
              <select
                className="style-select-box"
                value={currentAnimation.karaokeMode || 'step'}
                onChange={(e) =>
                  handleAnimationUpdate(
                    'karaokeMode',
                    e.target.value as 'step' | 'sweep'
                  )
                }
              >
                <option value="step">Step (Word by Word)</option>
                <option value="sweep">Sweep (Smooth Gradient Fill)</option>
              </select>
            </div>

            {/* Active Word Scale */}
            <div className="style-input-group">
              <label className="style-field-label">Active Word Scale</label>
              <div className="style-slider-input-row">
                <input
                  type="range"
                  min="1.0"
                  max="1.3"
                  step="0.02"
                  value={currentAnimation.activeWordScale || 1.06}
                  onChange={(e) =>
                    handleAnimationUpdate('activeWordScale', Number(e.target.value))
                  }
                />
                <div className="style-numeric-badge">
                  {(currentAnimation.activeWordScale || 1.06).toFixed(2)}x
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ===================================================================
          MODAL: SAVE CUSTOM PRESET
         =================================================================== */}
       {saveModalOpen && (
         <Dialog
           isOpen={saveModalOpen}
           onClose={() => setSaveModalOpen(false)}
           title="Save custom preset"
           description="Store the current style settings for later use."
           className="style-preset-dialog"
         >
           <form onSubmit={handleSaveCustom} className="style-preset-form">
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="style-input-group">
                  <label className="style-field-label">Preset Name *</label>
                  <input
                    type="text"
                    className="style-number-input"
                    placeholder="e.g. My Reels Style"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="style-input-group">
                  <label className="style-field-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="style-number-input"
                    placeholder="e.g. Bold punch style with yellow highlight"
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
           </Dialog>
       )}
    </div>
  );
};
