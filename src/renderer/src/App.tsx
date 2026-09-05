import React, { useEffect, useState } from 'react';
import { useProjectStore } from './store/projectStore.js';
import {
  LanguageMode,
  ScriptMode,
  PerformanceMode,
  ModelInfo,
} from '../../shared/types/models.js';

export const App: React.FC = () => {
  const {
    project,
    hardware,
    audioWavPath,
    waveformData,
    selectedEventId,
    setHardware,
    setMedia,
    setAudioWavPath,
    setWaveformData,
    setEvents,
    selectEvent,
    updateSettings,
    updateStyle,
    statusMessage,
    setStatusMessage,
    loadProjectData,
  } = useProjectStore();

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('whisper-tiny-ct2-int8');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  // Load models catalog and refresh status
  const refreshModels = async () => {
    if (window.vaaniAPI) {
      const res = await window.vaaniAPI.getModels();
      if (res.success && res.data) {
        setModels(res.data);
      }
    }
  };

  useEffect(() => {
    // Initialize hardware profile from IPC bridge
    if (window.vaaniAPI) {
      window.vaaniAPI.getHardwareProfile().then((res) => {
        if (res.success && res.data) {
          setHardware(res.data);
          setStatusMessage(`Hardware detected: ${res.data.cpuModel}`);
        }
      });

      refreshModels();

      // Listen to streaming progress updates from media/ASR pipeline
      const cleanupProgress = window.vaaniAPI.onProgress((prog) => {
        setStatusMessage(prog.message);
        if (prog.stage === 'transcribing') {
          setTranscriptionProgress(prog.percent);
        } else if (prog.stage === 'idle' && isDownloading) {
          setDownloadProgress(prog.percent);
        }
      });

      return () => cleanupProgress();
    }
  }, [setHardware, setStatusMessage, isDownloading]);

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0];

  const handleSelectMedia = async () => {
    if (!window.vaaniAPI) return;
    setStatusMessage('Selecting media file...');
    const res = await window.vaaniAPI.selectMediaFile();
    if (res.success && res.data) {
      const filePath = res.data;
      setStatusMessage('Probing media container...');
      const probeRes = await window.vaaniAPI.probeMedia(filePath);

      if (probeRes.success && probeRes.data) {
        const mediaInfo = probeRes.data;
        setMedia(mediaInfo);
        setStatusMessage(`Probed: ${mediaInfo.fileName} (${mediaInfo.durationSeconds.toFixed(1)}s). Extracting 16kHz audio...`);

        // Extract normalized 16 kHz audio
        const extractRes = await window.vaaniAPI.extractAudio(filePath, {
          normalize: true,
          durationSeconds: mediaInfo.durationSeconds,
        });

        if (extractRes.success && extractRes.data) {
          const wavPath = extractRes.data;
          setAudioWavPath(wavPath);
          setStatusMessage('Computing audio waveform peaks...');

          // Compute waveform peaks
          const waveRes = await window.vaaniAPI.generateWaveform(wavPath, { bucketsPerSecond: 50 });
          if (waveRes.success && waveRes.data) {
            setWaveformData(waveRes.data);
            setStatusMessage(`Media ready: ${mediaInfo.fileName} (${waveRes.data.peaks.length} waveform peaks)`);
          } else {
            setStatusMessage('Audio extracted, waveform computation skipped.');
          }
        } else {
          setStatusMessage(`Audio extraction failed: ${extractRes.error?.message}`);
        }
      } else {
        setStatusMessage(`Probe failed: ${probeRes.error?.message || 'Unsupported media file'}`);
      }
    } else {
      setStatusMessage('Media selection cancelled.');
    }
  };

  const handleDownloadModel = async () => {
    if (!window.vaaniAPI || !currentModel) return;
    setIsDownloading(true);
    setDownloadProgress(5);
    setStatusMessage(`Starting download of ${currentModel.name}...`);

    const res = await window.vaaniAPI.downloadModel(currentModel.id);
    setIsDownloading(false);

    if (res.success) {
      setStatusMessage(`Model ${currentModel.name} is ready for transcription.`);
      await refreshModels();
    } else {
      setStatusMessage(`Model download failed: ${res.error?.message}`);
    }
  };

  const handleDeleteModel = async () => {
    if (!window.vaaniAPI || !currentModel) return;
    setStatusMessage(`Deleting ${currentModel.name}...`);
    const res = await window.vaaniAPI.deleteModel(currentModel.id);
    if (res.success) {
      setStatusMessage(`Deleted local weights for ${currentModel.name}`);
      await refreshModels();
    } else {
      setStatusMessage(`Failed to delete model: ${res.error?.message}`);
    }
  };

  const handleStartTranscription = async () => {
    if (!window.vaaniAPI || !project.media) return;
    const targetAudio = audioWavPath || project.media.filePath;

    setIsTranscribing(true);
    setTranscriptionProgress(0);
    setStatusMessage('Initiating speech recognition worker...');

    const res = await window.vaaniAPI.startTranscription(targetAudio, {
      modelId: selectedModelId,
      language: project.settings.languageMode === 'auto' ? 'auto' : (project.settings.languageMode === 'hindi' ? 'hi' : 'en'),
      vadFilter: true,
      beamSize: 5,
    });

    setIsTranscribing(false);

    if (res.success && res.data) {
      setEvents(res.data.events);
      setStatusMessage(
        `Transcription complete: ${res.data.events.length} subtitle events generated (Detected: ${res.data.language.toUpperCase()}).`
      );
    } else {
      setStatusMessage(`Transcription failed: ${res.error?.message || 'Unknown error'}`);
    }
  };

  const handleCancelTranscription = async () => {
    if (!window.vaaniAPI) return;
    setStatusMessage('Cancelling transcription...');
    await window.vaaniAPI.cancelTranscription();
    setIsTranscribing(false);
    setStatusMessage('Transcription cancelled by user.');
  };

  const handleSaveProject = async () => {
    if (!window.vaaniAPI) return;
    setStatusMessage('Saving project...');
    const res = await window.vaaniAPI.saveProject(project);
    if (res.success && res.data) {
      setStatusMessage(`Project saved to ${res.data}`);
    } else {
      setStatusMessage('Project save cancelled.');
    }
  };

  const handleOpenProject = async () => {
    if (!window.vaaniAPI) return;
    setStatusMessage('Opening project...');
    const res = await window.vaaniAPI.loadProject();
    if (res.success && res.data) {
      loadProjectData(res.data);
      setStatusMessage(`Opened project: ${res.data.projectName}`);
    } else {
      setStatusMessage('Open project cancelled.');
    }
  };

  const selectedEvent = project.events.find((e) => e.id === selectedEventId) || project.events[0];

  return (
    <div className="app-container">
      {/* Top Application Bar */}
      <header className="titlebar">
        <div className="titlebar-brand">
          <span className="brand-badge">PRO</span>
          <span className="brand-title">Vaani Studio</span>
          <span className="brand-tagline">Local AI Subtitles</span>
        </div>

        <div className="titlebar-actions">
          <button className="btn btn-secondary" onClick={handleOpenProject}>
            Open Project
          </button>
          <button className="btn btn-secondary" onClick={handleSaveProject}>
            Save Project
          </button>
          <button className="btn btn-primary" onClick={handleSelectMedia}>
            Import Media
          </button>
        </div>
      </header>

      {/* Main Studio Viewport and Panels */}
      <main className="studio-main">
        {/* Left / Center Work Area */}
        <section className="editor-workspace">
          {/* Media Viewport */}
          <div className="viewport-pane">
            <div className="preview-canvas-container">
              {project.media ? (
                <div className="preview-placeholder">
                  <div className="preview-placeholder-title">{project.media.fileName}</div>
                  <div className="preview-placeholder-subtitle">
                    Duration: {project.media.durationSeconds.toFixed(1)}s | Size: {(project.media.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span className="brand-badge" style={{ background: 'var(--accent-active)' }}>
                      Audio: {project.media.audioCodec?.toUpperCase() || 'PCM'} | {project.media.audioSampleRate}Hz | {project.media.audioChannels}ch
                    </span>
                    {project.media.videoCodec && (
                      <span className="brand-badge" style={{ background: 'var(--bg-surface-hover)' }}>
                        Video: {project.media.videoCodec?.toUpperCase()} | {project.media.width}x{project.media.height}
                        {project.media.fps ? ` @ ${project.media.fps}fps` : ''}
                      </span>
                    )}
                    <span className="brand-badge" style={{ background: 'var(--accent-success)' }}>
                      {audioWavPath ? 'Normalized 16kHz WAV Ready' : 'Probed'}
                    </span>
                  </div>

                  {/* Subtitle Overlay Preview */}
                  {selectedEvent && (
                    <div
                      style={{
                        marginTop: '24px',
                        padding: `${project.style.boxPaddingY || 8}px ${project.style.boxPaddingX || 16}px`,
                        backgroundColor: project.style.hasBackgroundBox ? 'rgba(0,0,0,0.75)' : 'transparent',
                        borderRadius: `${project.style.boxBorderRadius || 4}px`,
                        color: project.style.primaryColor,
                        fontFamily: project.style.fontFamily,
                        fontSize: `${project.style.fontSize * 0.4}px`,
                        fontWeight: project.style.fontWeight,
                        textAlign: project.style.position.alignment,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        maxWidth: '90%',
                      }}
                    >
                      {selectedEvent.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="preview-placeholder">
                  <div className="preview-placeholder-title">No Media Loaded</div>
                  <div className="preview-placeholder-subtitle">
                    Import an audio or video file (MP4, MKV, MOV, WAV, MP3) to begin automated transcription.
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={handleSelectMedia}>
                    Select Media File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subtitle Events & Timeline Pane */}
          <div className="events-pane">
            <div className="pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="pane-title">Subtitle Events ({project.events.length})</span>
                {waveformData && (
                  <span style={{ fontSize: '12px', color: 'var(--accent-active)' }}>
                    Waveform: {waveformData.peaks.length} peaks
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isTranscribing ? (
                  <button className="btn btn-danger" onClick={handleCancelTranscription}>
                    Cancel
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={!project.media || (currentModel && !currentModel.isDownloaded)}
                    onClick={handleStartTranscription}
                  >
                    Generate Subtitles
                  </button>
                )}
              </div>
            </div>

            {/* Active Transcription Progress Bar */}
            {isTranscribing && (
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  <span>Transcribing speech with {currentModel?.name}...</span>
                  <span>{transcriptionProgress.toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-base)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${transcriptionProgress}%`,
                      height: '100%',
                      backgroundColor: 'var(--accent-active)',
                      transition: 'width 200ms ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Waveform Visualization Strip */}
            {waveformData && waveformData.peaks.length > 0 && (
              <div
                style={{
                  height: '42px',
                  backgroundColor: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  gap: '1px',
                  overflowX: 'auto',
                }}
              >
                {waveformData.peaks.slice(0, 300).map((peak, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: '1 0 2px',
                      height: `${Math.max(4, peak * 36)}px`,
                      backgroundColor: 'var(--accent-active)',
                      borderRadius: '1px',
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="events-list">
              {project.events.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {project.media
                    ? 'Media loaded. Click "Generate Subtitles" to begin local AI transcription.'
                    : 'No subtitle events generated yet. Import media to run local transcription.'}
                </div>
              ) : (
                project.events.map((evt) => (
                  <div
                    key={evt.id}
                    className={`event-row ${selectedEventId === evt.id ? 'event-row-selected' : ''}`}
                    onClick={() => selectEvent(evt.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="event-index">#{evt.index}</span>
                    <span className="event-time">
                      {evt.startTime.toFixed(2)}s - {evt.endTime.toFixed(2)}s
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="event-text">{evt.text}</div>
                      {/* Word Timing Chips */}
                      {evt.words && evt.words.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {evt.words.map((w) => (
                            <span
                              key={w.id}
                              style={{
                                fontSize: '10px',
                                padding: '1px 4px',
                                backgroundColor: 'var(--bg-base)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '3px',
                                color: 'var(--text-muted)',
                              }}
                              title={`${w.startTime.toFixed(2)}s - ${w.endTime.toFixed(2)}s (${Math.round(w.confidence * 100)}%)`}
                            >
                              {w.word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {evt.cps && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        {evt.cps} CPS
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Inspector & Settings Sidebar */}
        <aside className="sidebar-inspector">
          {/* ASR Model Management */}
          <div className="inspector-section">
            <span className="section-label">ASR Model Management</span>

            <div className="control-group">
              <label className="control-label">Whisper Model</label>
              <select
                className="control-select"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.sizeMB} MB){m.isDownloaded ? ' - Ready' : ''}
                  </option>
                ))}
              </select>
            </div>

            {currentModel && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <p style={{ margin: '0 0 8px 0' }}>{currentModel.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Status: {currentModel.isDownloaded ? 'Downloaded' : 'Not Downloaded'}</span>
                  {currentModel.isDownloaded ? (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      onClick={handleDeleteModel}
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      disabled={isDownloading}
                      onClick={handleDownloadModel}
                    >
                      {isDownloading ? `Downloading (${downloadProgress.toFixed(0)}%)...` : `Download (${currentModel.sizeMB} MB)`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Project & Language Intelligence */}
          <div className="inspector-section">
            <span className="section-label">Speech Intelligence</span>

            <div className="control-group">
              <label className="control-label">Language Mode</label>
              <select
                className="control-select"
                value={project.settings.languageMode}
                onChange={(e) => updateSettings({ languageMode: e.target.value as LanguageMode })}
              >
                <option value="hinglish">Hinglish (Mixed Hindi & English)</option>
                <option value="english">English (Global / Indian Accent)</option>
                <option value="hindi">Hindi (Pure Devanagari)</option>
                <option value="auto">Auto-Detect Language</option>
              </select>
            </div>

            <div className="control-group">
              <label className="control-label">Script Mode</label>
              <select
                className="control-select"
                value={project.settings.scriptMode}
                onChange={(e) => updateSettings({ scriptMode: e.target.value as ScriptMode })}
              >
                <option value="roman">Roman Hinglish (e.g. "Ye feature better hai")</option>
                <option value="devanagari">Devanagari (e.g. "ये फीचर बेटर है")</option>
                <option value="exact">Exact Spoken (Verbatim)</option>
                <option value="cleaned">Cleaned Speech (Filler Removed)</option>
              </select>
            </div>

            <div className="control-group">
              <label className="control-label">Performance Mode</label>
              <select
                className="control-select"
                value={project.settings.performanceMode}
                onChange={(e) => updateSettings({ performanceMode: e.target.value as PerformanceMode })}
              >
                <option value="fast">Fast (Quantized Tiny/Base Model)</option>
                <option value="balanced">Balanced (Quantized Small Model)</option>
                <option value="quality">Maximum Quality (Medium Model)</option>
              </select>
            </div>
          </div>

          {/* Subtitle Styling Studio */}
          <div className="inspector-section">
            <span className="section-label">Subtitle Styling</span>

            <div className="control-group">
              <label className="control-label">Font Family</label>
              <input
                className="control-input"
                type="text"
                value={project.style.fontFamily}
                onChange={(e) => updateStyle({ fontFamily: e.target.value })}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Font Size (px)</label>
              <input
                className="control-input"
                type="number"
                min="16"
                max="96"
                value={project.style.fontSize}
                onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Primary Color</label>
              <input
                className="control-input"
                type="color"
                value={project.style.primaryColor}
                onChange={(e) => updateStyle({ primaryColor: e.target.value })}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Active Word Highlight</label>
              <input
                className="control-input"
                type="color"
                value={project.style.activeWordColor}
                onChange={(e) => updateStyle({ activeWordColor: e.target.value })}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Stroke Width (px)</label>
              <input
                className="control-input"
                type="number"
                min="0"
                max="12"
                value={project.style.strokeWidth}
                onChange={(e) => updateStyle({ strokeWidth: Number(e.target.value) })}
              />
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Diagnostic Status Bar */}
      <footer className="statusbar">
        <div className="statusbar-left">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>Local & Private (Zero Cloud)</span>
          </div>
          <span>|</span>
          <span>{statusMessage}</span>
        </div>

        <div className="statusbar-right">
          <span>CPU: {hardware ? `${hardware.physicalCores} Cores / ${hardware.logicalCores} Threads` : 'Probing...'}</span>
          <span>|</span>
          <span>Inference: {hardware ? hardware.inferenceDevice.toUpperCase() : 'CPU'}</span>
        </div>
      </footer>
    </div>
  );
};
