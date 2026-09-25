import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/Dialog.js';
import { ProgressBar } from './ui/ProgressBar.js';
import { Plus, Trash2 } from 'lucide-react';
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
       modelSelectionSource: 'user',
       performanceMode: 'balanced',
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

  const footer = queueState.isProcessing ? (
    <div className="dialog-footer-actions">
      <button type="button" className="btn btn-danger" onClick={handleCancel}>
        Cancel Queue
      </button>
    </div>
  ) : (
    <>
      <span className="batch-footer-status">
        {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'} ready.` : 'No files selected.'}
      </span>
      <div className="dialog-footer-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleStartBatch}
          disabled={selectedFiles.length === 0}
        >
          Start Batch
        </button>
      </div>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Processing"
      description="Transcribe and export multiple media files sequentially."
      className="batch-queue-dialog"
      dismissible={!queueState.isProcessing}
      hideClose={queueState.isProcessing}
      footer={footer}
    >
      <div className="batch-dialog-body">
          {/* Batch Configuration Settings */}
          <div className="batch-config-grid">
            <div>
              <label className="batch-field-label">
                Language Mode
              </label>
              <select
                className="control-select batch-select"
                value={languageMode}
                disabled={queueState.isProcessing}
                onChange={(e) => setLanguageMode(e.target.value as LanguageMode)}
              >
                <option value="auto">Auto-Detect</option>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>

            <div>
              <label className="batch-field-label">
                Export Subtitle Format
              </label>
              <select
                className="control-select batch-select"
                value={exportFormat}
                disabled={queueState.isProcessing}
                onChange={(e) => setExportFormat(e.target.value as 'srt' | 'vtt' | 'ass')}
              >
                <option value="srt">SubRip (.srt)</option>
                <option value="vtt">WebVTT (.vtt)</option>
                <option value="ass">Advanced SubStation (.ass)</option>
              </select>
            </div>

            <div>
              <label className="batch-field-label">
                Speech Model
              </label>
              <select
                className="control-select batch-select"
                value={selectedModelId}
                disabled={queueState.isProcessing}
                onChange={(e) => setSelectedModelId(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.sizeMB} MB)
                  </option>
                ))}
              </select>
            </div>

             <div className="batch-diarize-option">
              <input
                type="checkbox"
                id="batch-auto-diarize"
                checked={autoDiarize}
                disabled={queueState.isProcessing}
                onChange={(e) => setAutoDiarize(e.target.checked)}
              />
               <label htmlFor="batch-auto-diarize" className="batch-diarize-label">
                Enable automatic speaker identification and labeling
              </label>
            </div>
          </div>

          {/* Queued Files List */}
          <div>
             <div className="batch-section-heading">
               <span className="batch-section-title">
                 Queued files ({queueState.isProcessing ? queueState.items.length : selectedFiles.length})
               </span>
               {!queueState.isProcessing && (
                 <button
                   type="button"
                   className="btn btn-secondary btn-sm"
                   onClick={handleAddFiles}
                 >
                   <Plus size={13} />
                   <span>Add media</span>
                 </button>
               )}
             </div>

             <div className="batch-file-list">
              {queueState.isProcessing ? (
                // Render live queue execution rows
                queueState.items.map((item) => (
                   <div key={item.id} className="batch-file-row batch-file-progress-row">
                     <div className="batch-file-details">
                       <span className="batch-file-name">{item.fileName}</span>
                      {item.outputPath && (
                         <div className="batch-file-output">
                          Saved: {item.outputPath}
                        </div>
                      )}
                      {item.error && (
                         <div className="batch-file-error">
                          Error: {item.error}
                        </div>
                      )}
                    </div>

                     <div className="batch-file-meta">
                       <span className={`batch-file-status ${item.status}`}>
                         {item.status}
                       </span>
                       <span className="batch-file-percent">
                        {item.progress}%
                      </span>
                    </div>
                  </div>
                ))
              ) : selectedFiles.length === 0 ? (
                 <div className="batch-file-empty">
                   No media files added yet. Use Add media to build the queue.
                 </div>
              ) : (
                selectedFiles.map((file, idx) => (
                   <div key={file.filePath} className="batch-file-row">
                     <span className="batch-file-name">{file.fileName}</span>
                     <button
                       type="button"
                       className="batch-file-remove"
                       onClick={() => handleRemoveFile(idx)}
                     >
                       <Trash2 size={13} />
                       <span>Remove</span>
                     </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overall Progress Bar */}
           {queueState.isProcessing && (
             <ProgressBar
               value={overallPercent}
               label="Batch progress"
               detail={`${queueState.completedCount} of ${queueState.totalCount} completed`}
             />
           )}
      </div>
    </Dialog>
  );
};
