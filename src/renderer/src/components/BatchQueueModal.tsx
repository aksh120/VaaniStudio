import React, { useState, useEffect } from 'react';
import {
  BatchJobConfig,
  BatchQueueState,
  LanguageMode,
  ScriptMode,
  ModelInfo,
} from '../../../shared/types/models.js';

interface BatchQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelInfo[];
  onStatusMessage?: (msg: string) => void;
}

export const BatchQueueModal: React.FC<BatchQueueModalProps> = ({
  isOpen,
  onClose,
  models,
  onStatusMessage,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<{ filePath: string; fileName: string }[]>([]);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('auto');
  const [scriptMode] = useState<ScriptMode>('roman');
  const [selectedModelId, setSelectedModelId] = useState<string>('whisper-small-ct2-int8');
  const [exportFormat, setExportFormat] = useState<'srt' | 'vtt' | 'ass'>('srt');
  const [outputDirectory, setOutputDirectory] = useState<string>('');
  const [autoDiarize, setAutoDiarize] = useState<boolean>(false);
  const [queueState, setQueueState] = useState<BatchQueueState>({
    isProcessing: false,
    activeItemId: null,
    items: [],
    completedCount: 0,
    totalCount: 0,
  });

  useEffect(() => {
    if (window.vaaniAPI && isOpen) {
      // Check initial batch status
      if (window.vaaniAPI.getBatchStatus) {
        window.vaaniAPI.getBatchStatus().then((res: any) => {
          if (res.success && res.data) {
            setQueueState(res.data);
          }
        });
      }

      // Listen for live batch progress updates
      if (window.vaaniAPI.onBatchProgress) {
        const cleanup = window.vaaniAPI.onBatchProgress((state: BatchQueueState) => {
          setQueueState(state);
          if (state.completedCount === state.totalCount && state.totalCount > 0 && !state.isProcessing) {
            onStatusMessage?.(`Batch completed: ${state.completedCount} files processed.`);
          }
        });
        return () => cleanup();
      }
    }
  }, [isOpen, onStatusMessage]);

  if (!isOpen) return null;

  const handleAddFiles = async () => {
    if (!window.vaaniAPI) return;
    const res = await window.vaaniAPI.selectMediaFile();
    if (res.success && res.data) {
      const filePath = res.data;
      const fileName = filePath.split(/[/\\]/).pop() || 'Media File';

      if (!selectedFiles.some((f) => f.filePath === filePath)) {
        setSelectedFiles((prev) => [...prev, { filePath, fileName }]);

        if (!outputDirectory) {
          // Set default output dir to same directory as first file
          const dir = filePath.substring(0, filePath.lastIndexOf(filePath.includes('/') ? '/' : '\\'));
          setOutputDirectory(dir);
        }
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartBatch = async () => {
    if (!window.vaaniAPI || selectedFiles.length === 0) return;

    const config: BatchJobConfig = {
      languageMode,
      scriptMode,
      modelId: selectedModelId,
      exportFormat,
      outputDirectory: outputDirectory || process.cwd(),
      autoDiarize,
    };

    onStatusMessage?.(`Starting batch processing of ${selectedFiles.length} files...`);
    await window.vaaniAPI.startBatchQueue(selectedFiles, config);
  };

  const handleCancel = async () => {
    if (window.vaaniAPI) {
      await window.vaaniAPI.cancelBatchQueue();
      onStatusMessage?.('Batch queue cancelled.');
    }
  };

  const overallPercent = queueState.totalCount > 0
    ? Math.round((queueState.completedCount / queueState.totalCount) * 100)
    : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '840px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-panel, #121824)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#3b82f6', letterSpacing: '0.5px' }}>
              Automation & Workflow
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
              Batch Media Processing Queue
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={queueState.isProcessing}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: queueState.isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '20px',
              padding: '4px',
            }}
          >
            x
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Batch Configuration Settings */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Language Mode
              </label>
              <select
                className="control-select"
                value={languageMode}
                disabled={queueState.isProcessing}
                onChange={(e) => setLanguageMode(e.target.value as LanguageMode)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px' }}
              >
                <option value="auto">Auto-Detect</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Export Subtitle Format
              </label>
              <select
                className="control-select"
                value={exportFormat}
                disabled={queueState.isProcessing}
                onChange={(e) => setExportFormat(e.target.value as 'srt' | 'vtt' | 'ass')}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px' }}
              >
                <option value="srt">SubRip (.srt)</option>
                <option value="vtt">WebVTT (.vtt)</option>
                <option value="ass">Advanced SubStation (.ass)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Speech Model
              </label>
              <select
                className="control-select"
                value={selectedModelId}
                disabled={queueState.isProcessing}
                onChange={(e) => setSelectedModelId(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px' }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.sizeMB} MB)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
              <input
                type="checkbox"
                id="batch-auto-diarize"
                checked={autoDiarize}
                disabled={queueState.isProcessing}
                onChange={(e) => setAutoDiarize(e.target.checked)}
              />
              <label htmlFor="batch-auto-diarize" style={{ fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                Enable automatic speaker identification and labeling
              </label>
            </div>
          </div>

          {/* Queued Files List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                Queued Files ({queueState.isProcessing ? queueState.items.length : selectedFiles.length})
              </span>
              {!queueState.isProcessing && (
                <button
                  className="btn btn-secondary"
                  onClick={handleAddFiles}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  Add Media Files
                </button>
              )}
            </div>

            <div
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {queueState.isProcessing ? (
                // Render live queue execution rows
                queueState.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '16px' }}>
                      <span style={{ color: '#f8fafc', fontWeight: 500 }}>{item.fileName}</span>
                      {item.outputPath && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Saved: {item.outputPath}
                        </div>
                      )}
                      {item.error && (
                        <div style={{ fontSize: '11px', color: '#ef4444' }}>
                          Error: {item.error}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor:
                            item.status === 'completed'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : item.status === 'failed'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : item.status === 'transcribing' || item.status === 'extracting'
                              ? 'rgba(59, 130, 246, 0.2)'
                              : 'rgba(255, 255, 255, 0.08)',
                          color:
                            item.status === 'completed'
                              ? '#4ade80'
                              : item.status === 'failed'
                              ? '#f87171'
                              : item.status === 'transcribing' || item.status === 'extracting'
                              ? '#60a5fa'
                              : '#94a3b8',
                        }}
                      >
                        {item.status}
                      </span>
                      <span style={{ width: '40px', textAlign: 'right', color: '#94a3b8' }}>
                        {item.progress}%
                      </span>
                    </div>
                  </div>
                ))
              ) : selectedFiles.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  No media files added yet. Click "Add Media Files" to build your batch queue.
                </div>
              ) : (
                selectedFiles.map((file, idx) => (
                  <div
                    key={file.filePath}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: '#f8fafc', fontWeight: 500 }}>{file.fileName}</span>
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px 6px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overall Progress Bar */}
          {queueState.isProcessing && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>
                  Batch Progress: {queueState.completedCount} of {queueState.totalCount} completed
                </span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{overallPercent}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${overallPercent}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {selectedFiles.length > 0 && !queueState.isProcessing
              ? `${selectedFiles.length} file(s) ready to process.`
              : queueState.isProcessing
              ? 'Sequential processing active.'
              : ''}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {queueState.isProcessing ? (
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                style={{ padding: '8px 18px', color: '#ef4444' }}
              >
                Cancel Queue
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 16px' }}>
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleStartBatch}
                  disabled={selectedFiles.length === 0}
                  style={{
                    padding: '8px 20px',
                    opacity: selectedFiles.length === 0 ? 0.5 : 1,
                    cursor: selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Start Batch Processing
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
