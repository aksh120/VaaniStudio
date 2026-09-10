/**
 * Export Modal Component
 * Phase 9: TASK-043, TASK-044, TASK-045, TASK-046
 *
 * Comprehensive subtitle file exporter (SRT, VTT, ASS) and
 * hardware-optimized FFmpeg video burn-in rendering interface.
 */

import React, { useState, useEffect } from 'react';
import {
  ProjectData,
  SubtitleFormat,
  VideoExportResolution,
  VideoExportPreset,
  RenderProgressUpdate,
} from '../../../shared/types/models.js';
import { Download, FileText, Video, Check, AlertTriangle, FolderOpen, X } from 'lucide-react';
import { ExportConfirmationModal } from './ExportConfirmationModal.js';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onStatusMessage?: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onStatusMessage,
}) => {
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

  // Subscribe to IPC render progress updates
  useEffect(() => {
    if (!window.vaaniAPI?.onRenderProgress) return;

    const cleanup = window.vaaniAPI.onRenderProgress((update) => {
      setRenderProgress(update);
      if (update.status === 'rendering') {
        setIsRendering(true);
      } else if (update.status === 'completed') {
        setIsRendering(false);
        setShowSuccessModal(true);
        onStatusMessage?.(`Video rendered successfully: ${update.outputPath}`);
      } else if (update.status === 'failed') {
        setIsRendering(false);
        setRenderError(update.error || 'Video rendering failed.');
      } else if (update.status === 'cancelled') {
        setIsRendering(false);
        onStatusMessage?.('Video rendering was cancelled.');
      }
    });

    return () => cleanup();
  }, [onStatusMessage]);

  if (!isOpen) return null;

  const hasMedia = Boolean(project.media?.filePath);
  const eventCount = project.events.length;
  const durationSec = project.media?.durationSeconds || 0;

  // Handle Standalone Subtitle Export
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
        onStatusMessage?.(`Exported ${subtitleFormat.toUpperCase()} to: ${res.data}`);
      }
    } catch (err: any) {
      onStatusMessage?.(`Export failed: ${err?.message}`);
    } finally {
      setIsExportingSubtitles(false);
    }
  };

  // Browse output destination for video
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

  // Handle Video Burn-In Render
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
        totalDurationSeconds: durationSec,
        animationConfig: project.animation,
      });

      if (!res.success) {
        setIsRendering(false);
        setRenderError(res.error?.message || 'Failed to initiate render.');
      }
    } catch (err: any) {
      setIsRendering(false);
      setRenderError(err?.message || 'Unexpected error starting render.');
    }
  };

  // Handle Render Cancellation
  const handleCancelRender = async () => {
    if (!window.vaaniAPI) return;
    await window.vaaniAPI.cancelRenderVideo(renderProgress?.jobId);
    setIsRendering(false);
  };

  // Open containing folder
  const handleOpenFolder = (targetPath: string) => {
    if (window.vaaniAPI?.showItemInFolder) {
      window.vaaniAPI.showItemInFolder(targetPath);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog export-dialog">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <Download size={18} className="modal-icon" />
            <div>
              <h3 className="modal-title">Export Subtitles & Video</h3>
              <p className="modal-subtitle">
                Export standalone subtitle files or burn styled captions into MP4 video
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={isRendering}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Tab Navigation */}
        <div className="export-tab-nav">
          <button
            className={`export-tab-btn ${activeTab === 'subtitles' ? 'active' : ''}`}
            onClick={() => setActiveTab('subtitles')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={13} />
            <span>Subtitle Files</span>
          </button>
          <button
            className={`export-tab-btn ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Video size={13} />
            <span>Burn-In Video</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body export-modal-body">
          {/* Tab 1: Subtitle Files */}
          {activeTab === 'subtitles' && (
            <div className="export-section">
              {/* Format Selection Cards */}
              <div className="control-group">
                <label className="control-label">Export Format</label>
                <div className="export-format-grid">
                  <div
                    className={`format-card ${subtitleFormat === 'srt' ? 'selected' : ''}`}
                    onClick={() => setSubtitleFormat('srt')}
                  >
                    <div className="format-card-header">
                      <span className="format-title">SubRip (.srt)</span>
                      <span className="format-badge">Universal</span>
                    </div>
                    <p className="format-desc">
                      Industry standard text subtitles compatible with YouTube, Premiere, DaVinci, and VLC.
                    </p>
                  </div>

                  <div
                    className={`format-card ${subtitleFormat === 'vtt' ? 'selected' : ''}`}
                    onClick={() => setSubtitleFormat('vtt')}
                  >
                    <div className="format-card-header">
                      <span className="format-title">WebVTT (.vtt)</span>
                      <span className="format-badge">Web Standard</span>
                    </div>
                    <p className="format-desc">
                      HTML5 video standard with millisecond dot precision for online players and web platforms.
                    </p>
                  </div>

                  <div
                    className={`format-card ${subtitleFormat === 'ass' ? 'selected' : ''}`}
                    onClick={() => setSubtitleFormat('ass')}
                  >
                    <div className="format-card-header">
                      <span className="format-title">SubStation Alpha (.ass)</span>
                      <span className="format-badge highlight">Full Styling</span>
                    </div>
                    <p className="format-desc">
                      Preserves exact fonts, colors, outlines, drop shadows, and word-level karaoke timing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Format-specific options */}
              {subtitleFormat === 'ass' && (
                <div className="export-options-box">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeKaraoke}
                      onChange={(e) => setIncludeKaraoke(e.target.checked)}
                    />
                    <span>Include Word-Level Karaoke Timing Tags (\k / \kf)</span>
                  </label>
                  <span className="control-hint">
                    Enables dynamic word-by-word active highlight in supporting players (MPV, VLC, Aegisub).
                  </span>
                </div>
              )}

              {/* Encoding Options */}
              <div className="control-group" style={{ marginTop: '12px' }}>
                <label className="control-label">Character Encoding</label>
                <div className="segmented-button-row">
                  <button
                    type="button"
                    className={`segmented-btn ${encoding === 'utf-8' ? 'active' : ''}`}
                    onClick={() => setEncoding('utf-8')}
                  >
                    UTF-8 (Standard)
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${encoding === 'utf-8-bom' ? 'active' : ''}`}
                    onClick={() => setEncoding('utf-8-bom')}
                  >
                    UTF-8 with BOM (Windows Notepad)
                  </button>
                </div>
              </div>

              {/* Project Stats Banner */}
              <div className="export-stats-banner">
                <span>{eventCount} subtitle events</span>
                <span>{Math.round(durationSec)}s total timeline duration</span>
              </div>

              {/* Success Banner */}
              {subExportSuccess && (
                <div className="export-success-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} className="success-icon" />
                    <span>Exported to: {subExportSuccess}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenFolder(subExportSuccess)}
                  >
                    Open Folder
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Burn-In Video */}
          {activeTab === 'video' && (
            <div className="export-section">
              {!hasMedia ? (
                <div className="export-warning-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={15} />
                  <span>No video media is currently loaded in the project. Please import a video file first.</span>
                </div>
              ) : (
                <>
                  {/* Source Media Info */}
                  <div className="export-media-info">
                    <span className="media-label">Source Video:</span>
                    <span className="media-path" title={project.media?.filePath}>
                      {project.media?.fileName}
                    </span>
                    <span className="media-meta">
                      {project.media?.width && project.media?.height
                        ? `${project.media.width}x${project.media.height} • `
                        : ''}
                      {Math.round(durationSec)}s
                    </span>
                  </div>

                  {/* Resolution Selector */}
                  <div className="control-group">
                    <label className="control-label">Target Resolution</label>
                    <div className="resolution-pills-row">
                      {(['original', '1080p', '720p', '4k'] as VideoExportResolution[]).map((res) => (
                        <button
                          key={res}
                          type="button"
                          className={`resolution-pill ${resolution === res ? 'active' : ''}`}
                          onClick={() => setResolution(res)}
                        >
                          {res === 'original' ? 'Source Native' : res.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {resolution === '4k' && (
                      <span className="control-hint warning-hint" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={13} />
                        <span>4K burn-in on CPU hardware requires substantial encoding time. 1080p is recommended for fast turnaround.</span>
                      </span>
                    )}
                  </div>

                  {/* Encoding Speed / Quality Preset */}
                  <div className="control-group">
                    <label className="control-label">Encoding Speed & Quality</label>
                    <select
                      className="control-select"
                      value={preset}
                      onChange={(e) => setPreset(e.target.value as VideoExportPreset)}
                    >
                      <option value="fast">Fast (Recommended - High speed, near visually lossless)</option>
                      <option value="medium">Medium (Balanced file size & quality)</option>
                      <option value="slow">Slow (Maximum compression efficiency)</option>
                      <option value="ultrafast">Ultrafast (Draft preview speed)</option>
                    </select>
                  </div>

                  {/* Karaoke Highlight in Video Toggle */}
                  <div className="export-options-box">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={videoIncludeKaraoke}
                        onChange={(e) => setVideoIncludeKaraoke(e.target.checked)}
                      />
                      <span>Burn Word-Level Kinetic Karaoke Highlights into Video</span>
                    </label>
                  </div>

                  {/* Destination Path Selector */}
                  <div className="control-group">
                    <label className="control-label">Output Destination</label>
                    <div className="path-input-row">
                      <input
                        type="text"
                        className="control-input"
                        placeholder="Click browse to select output MP4 destination..."
                        value={customOutputPath}
                        onChange={(e) => setCustomOutputPath(e.target.value)}
                        readOnly={isRendering}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleBrowseOutputPath}
                        disabled={isRendering}
                      >
                        Browse...
                      </button>
                    </div>
                  </div>

                  {/* Live Render Progress Display */}
                  {renderProgress && (
                    <div className="render-progress-card">
                      <div className="progress-header-row">
                        <span className="progress-status-label">
                          {renderProgress.status === 'rendering'
                            ? 'Rendering Video with Subtitles...'
                            : renderProgress.status === 'completed'
                            ? 'Render Complete!'
                            : renderProgress.status === 'cancelled'
                            ? 'Render Cancelled'
                            : 'Render Failed'}
                        </span>
                        <span className="progress-percent-label">{renderProgress.percent}%</span>
                      </div>

                      <div className="progress-bar-track">
                        <div
                          className={`progress-bar-fill ${
                            renderProgress.status === 'completed'
                              ? 'success'
                              : renderProgress.status === 'failed'
                              ? 'danger'
                              : ''
                          }`}
                          style={{ width: `${renderProgress.percent}%` }}
                        />
                      </div>

                      {renderProgress.status === 'rendering' && (
                        <div className="render-metrics-row">
                          <span>Elapsed: {renderProgress.elapsedSeconds}s</span>
                          {renderProgress.etaSeconds !== undefined && (
                            <span>ETA: ~{renderProgress.etaSeconds}s</span>
                          )}
                          {renderProgress.speed && <span>Speed: {renderProgress.speed}</span>}
                          {renderProgress.fps && <span>{Math.round(renderProgress.fps)} fps</span>}
                        </div>
                      )}

                      {renderProgress.status === 'completed' && renderProgress.outputPath && (
                        <div className="render-completed-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenFolder(renderProgress.outputPath!)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <FolderOpen size={13} />
                            <span>Open Video Folder</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Error Banner */}
                  {renderError && (
                    <div className="export-warning-banner danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={14} />
                      <span>{renderError}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          {activeTab === 'subtitles' ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExportSubtitles}
                disabled={isExportingSubtitles || eventCount === 0}
              >
                {isExportingSubtitles ? 'Exporting...' : `Export ${subtitleFormat.toUpperCase()}...`}
              </button>
            </>
          ) : (
            <>
              {isRendering ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancelRender}
                >
                  Cancel Render
                </button>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStartRender}
                    disabled={!hasMedia || eventCount === 0}
                  >
                    Start Burn-In Render
                  </button>
                </>
              )}
            </>
          )}
        </div>
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
