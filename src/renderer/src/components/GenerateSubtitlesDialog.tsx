import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useProjectStore } from '../store/projectStore.js';
import { LanguageMode, ScriptMode, PerformanceMode, ModelInfo } from '../../../shared/types/models.js';

interface GenerateSubtitlesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelInfo[];
  selectedModelId: string;
  onSelectModelId: (id: string) => void;
  isTranscribing: boolean;
  transcriptionProgress: number;
  onStartTranscription: () => void;
  onCancelTranscription: () => void;
}

export const GenerateSubtitlesDialog: React.FC<GenerateSubtitlesDialogProps> = ({
  isOpen,
  onClose,
  models,
  selectedModelId,
  onSelectModelId,
  isTranscribing,
  transcriptionProgress,
  onStartTranscription,
  onCancelTranscription,
}) => {
  const { project, updateSettings } = useProjectStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0];
  const isModelReady = currentModel?.isDownloaded ?? true;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-active)' }} />
            <h3 className="modal-title">Generate Subtitles</h3>
          </div>
          {!isTranscribing && (
            <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Media Info Banner */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '12px',
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '11px' }}>
              Input Media File:
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {project.media ? project.media.fileName : 'No media loaded'}
            </div>
            {project.media && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                Duration: {project.media.durationSeconds.toFixed(1)}s
              </div>
            )}
          </div>

          {isTranscribing ? (
            /* Active Transcription Progress */
            <div style={{ padding: '24px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {transcriptionProgress < 30
                  ? 'Detecting speech and segmenting audio...'
                  : transcriptionProgress < 85
                  ? 'Transcribing speech with local AI engine...'
                  : 'Aligning timestamps and finalizing subtitles...'}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {transcriptionProgress.toFixed(1)}% complete
              </div>

              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    width: `${transcriptionProgress}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent-active)',
                    transition: 'width 200ms ease',
                  }}
                />
              </div>

              <button className="btn btn-danger" onClick={onCancelTranscription}>
                Cancel Generation
              </button>
            </div>
          ) : (
            /* 4-Step Simplified Generation Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Step 1: Language */}
              <div className="control-group">
                <label className="input-label">Step 1: Spoken Language</label>
                <select
                  className="select-box"
                  value={project.settings.languageMode}
                  onChange={(e) => updateSettings({ languageMode: e.target.value as LanguageMode })}
                >
                  <option value="auto">Auto-Detect Language (Recommended)</option>
                  <option value="hinglish">Hinglish (Mixed Hindi and English)</option>
                  <option value="english">English (Global or Indian Accent)</option>
                  <option value="hindi">Hindi (Pure Hindi)</option>
                </select>
              </div>

              {/* Step 2: Output Script */}
              <div className="control-group">
                <label className="input-label">Step 2: Subtitle Output Style</label>
                <select
                  className="select-box"
                  value={project.settings.scriptMode}
                  onChange={(e) => updateSettings({ scriptMode: e.target.value as ScriptMode })}
                >
                  <option value="roman">Roman Hinglish (e.g. "Ye video viral hoga")</option>
                  <option value="devanagari">Devanagari Script (e.g. "ये वीडियो वायरल होगा")</option>
                  <option value="exact">Exact Spoken (Verbatim speech)</option>
                  <option value="cleaned">Cleaned Speech (Remove "umm", "uh", filler words)</option>
                </select>
              </div>

              {/* Step 3: Quality Profile */}
              <div className="control-group">
                <label className="input-label">Step 3: Quality Profile</label>
                <select
                  className="select-box"
                  value={project.settings.performanceMode}
                  onChange={(e) => updateSettings({ performanceMode: e.target.value as PerformanceMode })}
                >
                  <option value="balanced">Balanced (Fast speed, high accuracy)</option>
                  <option value="fast">Fast (Lowest latency for quick previews)</option>
                  <option value="quality">Maximum Quality (Deepest transcription accuracy)</option>
                </select>
              </div>

              {/* Advanced Options Accordion */}
              <div style={{ marginTop: '2px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: '4px 0',
                    color: 'var(--accent-active)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>{showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}</span>
                </button>

                {showAdvanced && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div className="control-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Specific Model Engine</label>
                      <select
                        className="select-box"
                        value={selectedModelId}
                        onChange={(e) => onSelectModelId(e.target.value)}
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.sizeMB} MB){m.isDownloaded ? ' (Ready)' : ' (Needs Download)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!isModelReady && (
                      <div style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
                        Notice: This model weights are not downloaded yet. Please download from Settings &gt; Models.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isTranscribing && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!project.media || !isModelReady}
              onClick={() => {
                onStartTranscription();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={13} />
              <span>Generate Subtitles</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
