import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import {
  SubtitleFormat,
  VideoExportResolution,
  VideoExportPreset,
  RenderProgressUpdate,
} from '../../../shared/types/models.js';
import { ExportConfirmationModal } from './ExportConfirmationModal.js';
import { ProgressBar } from './ui/ProgressBar.js';

interface ExportWorkspaceProps {
  onOpenBatchQueue: () => void;
}

export const ExportWorkspace: React.FC<ExportWorkspaceProps> = ({ onOpenBatchQueue }) => {
  const { project, setStatusMessage } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'subtitles' | 'video'>('subtitles');

  // Subtitle Export State
  const [subtitleFormat, setSubtitleFormat] = useState<SubtitleFormat>('srt');
  const [includeKaraoke, setIncludeKaraoke] = useState<boolean>(true);
  const [encoding, setEncoding] = useState<'utf-8' | 'utf-8-bom'>('utf-8');
  const [isExportingSubtitles, setIsExportingSubtitles] = useState(false);
  const [subExportSuccess, setSubExportSuccess] = useState<string | null>(null);

  // Video Render State
  const [resolution, setResolution] = useState<VideoExportResolution>('original');
  const [preset, setPreset] = useState<VideoExportPreset>('fast');
  const [videoIncludeKaraoke, setVideoIncludeKaraoke] = useState<boolean>(true);
  const [customOutputPath, setCustomOutputPath] = useState<string>('');
  const [renderProgress, setRenderProgress] = useState<RenderProgressUpdate | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  useEffect(() => {
    if (!window.vaaniAPI?.onRenderProgress) return;

    const cleanup = window.vaaniAPI.onRenderProgress((update) => {
      setRenderProgress(update);
      if (update.status === 'rendering') {
        setIsRendering(true);
      } else if (update.status === 'completed') {
        setIsRendering(false);
        setShowSuccessModal(true);
        setStatusMessage(`Video rendered successfully: ${update.outputPath}`);
      } else if (update.status === 'failed') {
        setIsRendering(false);
        setRenderError(update.error || 'Video rendering failed.');
      } else if (update.status === 'cancelled') {
        setIsRendering(false);
        setStatusMessage('Video rendering was cancelled.');
      }
    });

    return () => cleanup();
  }, [setStatusMessage]);

  const hasMedia = Boolean(project.media?.filePath);
  const eventCount = project.events.length;

  const handleExportSubtitles = async () => {
    if (!window.vaaniAPI) return;
    setIsExportingSubtitles(true);
    setSubExportSuccess(null);

    try {
      const res = await window.vaaniAPI.exportSubtitles({
        events: project.events,
        style: project.style,
        options: {
          format: subtitleFormat,
          includeKaraoke: subtitleFormat === 'ass' ? includeKaraoke : false,
          encoding,
        },
      });

      if (res.success && res.data) {
        setSubExportSuccess(res.data);
        setStatusMessage(`Exported ${subtitleFormat.toUpperCase()} to: ${res.data}`);
      }
    } catch (err: any) {
      setStatusMessage(`Export failed: ${err?.message}`);
    } finally {
      setIsExportingSubtitles(false);
    }
  };

  const handleBrowseOutputPath = async () => {
    if (!window.vaaniAPI?.selectSavePath) return;

    const defaultName = `${(project.projectName || 'video_with_subtitles').replace(/[^a-zA-Z0-9_-]/g, '_')}_burned.mp4`;
    const res = await window.vaaniAPI.selectSavePath({
      title: 'Select Destination for Burned-in Video',
      defaultPath: defaultName,
      filters: [{ name: 'MP4 Video (*.mp4)', extensions: ['mp4'] }],
    });

    if (res.success && res.data) {
      setCustomOutputPath(res.data);
    }
  };

  const handleStartRender = async () => {
    if (!window.vaaniAPI || !hasMedia) return;

    let outputPath = customOutputPath.trim();
    if (!outputPath) {
      const defaultName = `${(project.projectName || 'video_with_subtitles').replace(/[^a-zA-Z0-9_-]/g, '_')}_burned.mp4`;
      const saveRes = await window.vaaniAPI.selectSavePath({
        title: 'Save Burned-in Video',
        defaultPath: defaultName,
        filters: [{ name: 'MP4 Video (*.mp4)', extensions: ['mp4'] }],
      });

      if (!saveRes.success || !saveRes.data) return;
      outputPath = saveRes.data;
      setCustomOutputPath(outputPath);
    }

    setRenderError(null);
    setIsRendering(true);

    try {
      const res = await window.vaaniAPI.startRenderVideo({
        options: {
          inputVideoPath: project.media!.filePath,
          outputPath,
          resolution,
          preset,
          includeKaraoke: videoIncludeKaraoke,
        },
        events: project.events,
        style: project.style,
        totalDurationSeconds: project.media!.durationSeconds,
        animationConfig: project.animation,
      });

      if (!res.success) {
        setIsRendering(false);
        setRenderError(res.error?.message || 'Failed to start video rendering.');
      }
    } catch (err: any) {
      setIsRendering(false);
      setRenderError(err?.message || 'Failed to start video rendering.');
    }
  };

  const handleCancelRender = async () => {
    if (!window.vaaniAPI) return;
    await window.vaaniAPI.cancelRenderVideo(renderProgress?.jobId);
    setIsRendering(false);
    setStatusMessage('Render cancelled.');
  };

  return (
    <div className="export-workspace">
      <div className="export-workspace-inner">
        <header className="workspace-page-header">
          <div>
            <div className="workspace-eyebrow">Output</div>
            <h1 className="workspace-page-title">Export</h1>
            <p className="workspace-page-description">Write subtitle files or render styled subtitles into the video.</p>
          </div>
        </header>

        <div className="export-project-summary">
          <div className="export-project-summary-meta">
            <span>Project</span>
            <strong>{project.projectName || 'Untitled Project'}</strong>
            <span>Subtitles</span>
            <strong>{eventCount} lines</strong>
            <span>Media</span>
            <strong>{project.media ? project.media.fileName : 'None'}</strong>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenBatchQueue}
            title="Process multiple media files in batch"
          >
            Batch Queue
          </button>
        </div>

        <div className="export-mode-tabs" role="tablist" aria-label="Export type">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'subtitles'}
            className={`export-mode-tab ${activeTab === 'subtitles' ? 'active' : ''}`}
            onClick={() => setActiveTab('subtitles')}
          >
            Subtitle Files
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'video'}
            className={`export-mode-tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            Burn-In Video
          </button>
        </div>

        {/* Tab 1: Subtitle Files Export */}
        {activeTab === 'subtitles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="control-group">
              <label className="input-label">Output Format</label>
               <div className="export-format-grid">
                {[
                  { id: 'srt', title: 'SubRip (.srt)', desc: 'Standard format. Compatible with all video players and YouTube.' },
                  { id: 'vtt', title: 'WebVTT (.vtt)', desc: 'HTML5 video standard. Perfect for web playback.' },
                  { id: 'ass', title: 'Advanced SubStation (.ass)', desc: 'Preserves fonts, colors, positioning, and kinetic highlight.' },
                ].map((f) => (
                   <button
                     type="button"
                     key={f.id}
                     onClick={() => setSubtitleFormat(f.id as SubtitleFormat)}
                      className={`export-format-card ${subtitleFormat === f.id ? 'selected' : ''}`}
                      aria-pressed={subtitleFormat === f.id}
                    >
                      <span className="export-format-title">{f.title}</span>
                      <span className="export-format-description">{f.desc}</span>
                   </button>
                 ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="control-group">
                <label className="input-label">File Encoding</label>
                <select
                  className="select-box"
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value as any)}
                >
                  <option value="utf-8">UTF-8 (Standard)</option>
                  <option value="utf-8-bom">UTF-8 with BOM (Legacy Windows / Premiere Pro)</option>
                </select>
              </div>

              {subtitleFormat === 'ass' && (
                <div className="control-group">
                  <label className="input-label">Kinetic Karaoke Tags</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={includeKaraoke}
                      onChange={(e) => setIncludeKaraoke(e.target.checked)}
                    />
                    Include ASS word-level \k timing tags
                  </label>
                </div>
              )}
            </div>

            {subExportSuccess && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-success-subtle)',
                  border: '1px solid var(--color-success)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--color-success)',
                }}
              >
                Saved file to: {subExportSuccess}
              </div>
            )}

            <div>
              <button
                className="btn btn-primary"
                disabled={eventCount === 0 || isExportingSubtitles}
                onClick={handleExportSubtitles}
              >
                {isExportingSubtitles ? 'Exporting...' : `Export ${subtitleFormat.toUpperCase()} File`}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Video Burn-In Render */}
        {activeTab === 'video' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {!hasMedia ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <h3 className="empty-state-title">No Video Loaded</h3>
                <p className="empty-state-description">
                  Burn-in rendering requires an imported video file in the active project.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="control-group">
                    <label className="input-label">Output Resolution</label>
                    <select
                      className="select-box"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as VideoExportResolution)}
                    >
                      <option value="original">Original Video Resolution</option>
                      <option value="1080p">1080p Full HD (1920x1080)</option>
                      <option value="720p">720p HD (1280x720)</option>
                      <option value="4k">4K Ultra HD (3840x2160)</option>
                    </select>
                  </div>

                  <div className="control-group">
                    <label className="input-label">Render Quality & Speed</label>
                    <select
                      className="select-box"
                      value={preset}
                      onChange={(e) => setPreset(e.target.value as VideoExportPreset)}
                    >
                      <option value="fast">Fast (Recommended for speed)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="slow">Slow (Higher compression)</option>
                      <option value="ultrafast">Ultrafast (Quickest draft)</option>
                    </select>
                  </div>
                </div>

                <div className="control-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={videoIncludeKaraoke}
                      onChange={(e) => setVideoIncludeKaraoke(e.target.checked)}
                    />
                    Burn kinetic active word karaoke animations into video
                  </label>
                </div>

                <div className="control-group">
                  <label className="input-label">Destination File Path</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-text"
                      placeholder="Default: [video_name]_burned.mp4"
                      value={customOutputPath}
                      onChange={(e) => setCustomOutputPath(e.target.value)}
                    />
                    <button className="btn btn-secondary" onClick={handleBrowseOutputPath}>
                      Browse...
                    </button>
                  </div>
                </div>

                {/* Render Progress or Error */}
                {renderError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--color-danger-subtle)',
                      border: '1px solid var(--color-danger)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: 'var(--color-danger)',
                    }}
                  >
                    Render Error: {renderError}
                  </div>
                )}

                {isRendering && renderProgress && (
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        Rendering video frames...
                      </span>
                      <span style={{ color: 'var(--accent-active)', fontWeight: 600 }}>
                        {renderProgress.percent ? `${renderProgress.percent.toFixed(1)}%` : 'Processing'}
                      </span>
                    </div>

                     <ProgressBar
                       value={renderProgress.percent || 5}
                       label="Rendering video"
                       detail={renderProgress.percent ? `${renderProgress.percent.toFixed(1)}%` : 'Processing'}
                     />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  {isRendering ? (
                    <button className="btn btn-danger" onClick={handleCancelRender}>
                      Cancel Rendering
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      disabled={eventCount === 0}
                      onClick={handleStartRender}
                    >
                      Burn Subtitles & Export Video
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ExportConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        outputPath={renderProgress?.outputPath || customOutputPath}
        elapsedSeconds={renderProgress?.elapsedSeconds}
        resolution={resolution}
        subtitleCount={project.events.length}
      />
    </div>
  );
};
