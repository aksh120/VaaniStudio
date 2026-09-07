import React, { useState } from 'react';
import { X } from 'lucide-react';
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
          <h3 className="modal-title">Generate Subtitles</h3>
          {!isTranscribing && (
            <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Media Info Strip */}
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
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Input Media:</div>
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
            /* Active Progress Screen */
            <div style={{ padding: '20px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {transcriptionProgress < 30
                  ? 'Detecting speech & segmenting audio...'
                  : transcriptionProgress < 85
                  ? 'Transcribing speech with Whisper...'
                  : 'Aligning timestamps & finalizing subtitles...'}
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
            /* Standard Generation Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="control-group">
                <label className="input-label">Spoken Language</label>
                <select
                  className="select-box"
                  value={project.settings.languageMode}
                  onChange={(e) => updateSettings({ languageMode: e.target.value as LanguageMode })}
                >
                  <option value="auto">Auto-Detect Language (Recommended)</option>
                  <option value="hinglish">Hinglish (Mixed Hindi & English)</option>
                  <option value="english">English (Global / Indian Accent)</option>
                  <option value="hindi">Hindi (Pure Hindi)</option>
                </select>
              </div>

              <div className="control-group">
                <label className="input-label">Subtitle Script & Formatting</label>
                <select
                  className="select-box"
                  value={project.settings.scriptMode}
                  onChange={(e) => updateSettings({ scriptMode: e.target.value as ScriptMode })}
                >
                  <option value="roman">Roman Hinglish (e.g. "Ye workflow fast hai")</option>
                  <option value="devanagari">Devanagari Script (e.g. "ये वर्कफ़्लो फ़ास्ट है")</option>
                  <option value="exact">Exact Spoken (Verbatim speech)</option>
                  <option value="cleaned">Cleaned Speech (Remove "umm", "uh", filler)</option>
                </select>
              </div>

              <div className="control-group">
                <label className="input-label">Quality Profile</label>
                <select
                  className="select-box"
                  value={project.settings.performanceMode}
                  onChange={(e) => updateSettings({ performanceMode: e.target.value as PerformanceMode })}
                >
                  <option value="balanced">Balanced (Recommended - Small Model)</option>
                  <option value="fast">Fast (Lower latency - Tiny/Base Model)</option>
                  <option value="quality">Maximum Quality (Medium Model)</option>
                </select>
              </div>

              {/* Collapsible Advanced Section */}
              <div style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '4px 0', color: 'var(--accent-active)', fontSize: '11px' }}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? '▲ Hide Advanced Options' : '▼ Show Advanced Options'}
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
                      <label className="input-label">Specific Whisper Model</label>
                      <select
                        className="select-box"
                        value={selectedModelId}
                        onChange={(e) => onSelectModelId(e.target.value)}
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.sizeMB} MB){m.isDownloaded ? ' - Ready' : ' - Needs Download'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {!isModelReady && (
                      <div style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
                        Note: This model weights are not downloaded yet. Please download from Settings &gt; Models first.
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
            >
              Generate Subtitles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
