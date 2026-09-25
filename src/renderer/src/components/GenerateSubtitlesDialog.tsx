import React, { useMemo } from 'react';
import {
  MessageSquare,
  Type,
  Cpu,
  Zap,
  Folder,
  Download,
  CheckCircle2,
  Info,
  Captions,
  Play,
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore.js';
import { useUIStore } from '../store/uiStore.js';
import { ProgressBar } from './ui/ProgressBar.js';
import { Dialog } from './ui/Dialog.js';
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
  onSelectMedia?: () => void;
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

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
  onSelectMedia,
}) => {
  const { project, updateSettings } = useProjectStore();
  const { openInEditorAfterGeneration, setOpenInEditorAfterGeneration } = useUIStore();

  const currentModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId) || models[0];
  }, [models, selectedModelId]);

  const isModelReady = Boolean(currentModel?.isDownloaded);

  if (!isOpen) return null;

  const media = project.media;
  const durationSec = media?.durationSeconds || 0;
  const fileSizeMB = media?.fileSizeBytes
    ? Math.round(media.fileSizeBytes / (1024 * 1024))
    : 0;
  const selectedAudioStream = media?.audioStreams?.find(
    (stream) => stream.index === (media.audioStreamIndex ?? media.audioStreams?.[0]?.index)
  );

  const footer = !isTranscribing ? (
    <>
      <label className="gen-footer-checkbox-label">
        <input
          type="checkbox"
          className="gen-checkbox"
          checked={openInEditorAfterGeneration}
          onChange={(e) => setOpenInEditorAfterGeneration(e.target.checked)}
        />
        <span className="gen-checkbox-text">
          <span className="gen-checkbox-title">Open in editor after generation</span>
          <span className="gen-checkbox-desc">Edit the generated subtitles when processing finishes.</span>
        </span>
      </label>
      <div className="gen-footer-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary gen-submit-btn"
          disabled={!media || !isModelReady}
          onClick={onStartTranscription}
        >
          <Captions size={14} />
          <span>Generate Subtitles</span>
        </button>
      </div>
    </>
  ) : undefined;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Subtitles"
      description="Transcribe speech from the active media with a local model."
      className="gen-subtitles-modal"
      dismissible={!isTranscribing}
      hideClose={isTranscribing}
      footer={footer}
    >
      <div className="gen-modal-body">
          {/* Media Info Card */}
          <div className="gen-media-card">
            <div className="gen-media-thumb">
              <div className="gen-thumb-play-circle">
                <Play size={13} fill="currentColor" />
              </div>
              <span className="gen-thumb-duration-badge">
                {formatDuration(durationSec)}
              </span>
            </div>

            <div className="gen-media-details">
              <div className="gen-media-filename" title={media?.fileName || 'No media selected'}>
                {media?.fileName || 'No media file selected'}
              </div>
              <div className="gen-media-filepath" title={media?.filePath || ''}>
                {media?.filePath || 'Select a video or audio file to start generating subtitles.'}
              </div>
              {media && (
                <div className="gen-media-specs">
                  <span>Duration: {durationSec.toFixed(1)}s</span>
                  <span className="spec-divider">|</span>
                   <span>{media.width && media.height ? `${media.width}×${media.height}` : 'Audio only'}</span>
                  <span className="spec-divider">|</span>
                   <span>{media.fps ? `${Math.round(media.fps)} FPS` : 'FPS unavailable'}</span>
                  <span className="spec-divider">|</span>
                    {selectedAudioStream && (
                      <>
                        <span className="spec-divider">|</span>
                        <span>Audio: {selectedAudioStream.language || selectedAudioStream.codec || `Track ${selectedAudioStream.index}`}</span>
                      </>
                    )}
                    {fileSizeMB > 0 && <span>{fileSizeMB} MB</span>}
                </div>
              )}
            </div>

            {onSelectMedia && !isTranscribing && (
              <button
                type="button"
                className="gen-change-file-btn"
                onClick={onSelectMedia}
                title="Select a different media file"
              >
                <Folder size={14} />
                <span>Change File</span>
              </button>
            )}
          </div>

          {isTranscribing ? (
            /* Active Transcription Progress */
            <div className="gen-transcribing-state">
              <div className="gen-transcribing-headline">
                {transcriptionProgress < 25
                  ? 'Extracting audio stream and segmenting speech...'
                  : transcriptionProgress < 80
                  ? 'Transcribing speech with local neural engine...'
                  : 'Aligning word timestamps and finalizing subtitle blocks...'}
              </div>

               <ProgressBar
                 value={transcriptionProgress}
                 label="Transcription"
                 detail={`${transcriptionProgress.toFixed(1)}% complete`}
                 className="gen-transcription-progress"
               />

               <div className="gen-transcribing-actions">
                 <button
                   type="button"
                   className="btn btn-danger btn-sm"
                   onClick={onCancelTranscription}
                 >
                   Cancel Generation
                 </button>
               </div>
            </div>
          ) : (
            /* 4-Step Form Rows */
            <div className="gen-form-container">
              {/* Row 1: Spoken Language */}
              <div className="gen-form-row">
                <div className="gen-row-label-col">
                  <div className="gen-row-icon">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <div className="gen-row-title">1. Spoken Language</div>
                    <div className="gen-row-desc">Select the language spoken in the video.</div>
                  </div>
                </div>
                <div className="gen-row-input-col">
                  <select
                    className="gen-select-box"
                    value={project.settings.languageMode}
                    onChange={(e) => updateSettings({ languageMode: e.target.value as LanguageMode })}
                  >
                    <option value="hinglish">Hinglish (Mixed Hindi and English)</option>
                    <option value="auto">Auto-Detect Language</option>
                    <option value="english">English (Global or Indian Accent)</option>
                    <option value="hindi">Hindi (Pure Hindi)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Subtitle Output Style */}
              <div className="gen-form-row">
                <div className="gen-row-label-col">
                  <div className="gen-row-icon">
                    <Type size={16} />
                  </div>
                  <div>
                    <div className="gen-row-title">2. Subtitle Output Style</div>
                    <div className="gen-row-desc">Choose how the subtitles should look and feel.</div>
                  </div>
                </div>
                <div className="gen-row-input-col">
                  <select
                    className="gen-select-box"
                    value={project.settings.scriptMode}
                    onChange={(e) => updateSettings({ scriptMode: e.target.value as ScriptMode })}
                  >
                    <option value="roman">Roman Hinglish (e.g. "Ye video viral hoga")</option>
                    <option value="devanagari">Devanagari Script (e.g. "ये वीडियो वायरल होगा")</option>
                    <option value="exact">Exact Spoken (Verbatim speech)</option>
                    <option value="cleaned">Cleaned Speech (Remove "umm", "uh", filler words)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: AI Model */}
              <div className="gen-form-row gen-model-row">
                <div className="gen-row-label-col">
                  <div className="gen-row-icon">
                    <Cpu size={16} />
                  </div>
                  <div>
                     <div className="gen-row-title">3. Model</div>
                    <div className="gen-row-desc">Select a speech-to-text model for transcription.</div>
                  </div>
                </div>
                <div className="gen-row-input-col">
                  <select
                    className="gen-select-box"
                    value={selectedModelId}
                    onChange={(e) => onSelectModelId(e.target.value)}
                  >
                    {models.map((m) => {
                      return (
                        <option key={m.id} value={m.id}>
                           {m.name} {m.isRecommended ? '(recommended)' : ''} ({m.sizeMB} MB)
                          {m.isDownloaded ? ' • Downloaded' : ' • Needs Download'}
                        </option>
                      );
                    })}
                  </select>

                  {/* Download Status Indicator */}
                  <div className="gen-model-status-row">
                    {isModelReady ? (
                      <>
                        <CheckCircle2 size={13} className="status-icon-ready" />
                        <span className="status-text-ready">Model ready for instant offline transcription.</span>
                      </>
                    ) : (
                      <>
                        <Download size={13} className="status-icon-download" />
                         <span className="status-text-download">Download this model from Settings before starting.</span>
                      </>
                    )}
                  </div>

                  {/* Informational Box */}
                  <div className="gen-model-info-box">
                    <Info size={14} className="info-icon" />
                    <span>
                      Models are downloaded only once and stored locally on your computer. You can manage downloaded models in Settings &gt; Models.
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 4: Quality Profile */}
              <div className="gen-form-row">
                <div className="gen-row-label-col">
                  <div className="gen-row-icon">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="gen-row-title">4. Quality Profile</div>
                    <div className="gen-row-desc">Balance speed and accuracy based on your needs.</div>
                  </div>
                </div>
                <div className="gen-row-input-col">
                  <select
                    className="gen-select-box"
                    value={project.settings.performanceMode}
                    onChange={(e) => updateSettings({ performanceMode: e.target.value as PerformanceMode })}
                  >
                    <option value="balanced">Balanced (Fast speed, high accuracy)</option>
                    <option value="fast">Fast (Lowest latency for quick previews)</option>
                    <option value="quality">Maximum Quality (Deepest transcription accuracy)</option>
                  </select>
                  <div className="gen-profile-desc">
                    {project.settings.performanceMode === 'balanced'
                      ? 'Good balance for most videos. Recommended for general use.'
                      : project.settings.performanceMode === 'fast'
                      ? 'Fastest processing speed, ideal for quick drafts and rapid review.'
                      : 'Highest transcription fidelity, recommended for multi-speaker or technical audio.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </Dialog>
  );
};
