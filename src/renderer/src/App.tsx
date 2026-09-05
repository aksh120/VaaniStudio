import React, { useEffect } from 'react';
import { useProjectStore } from './store/projectStore.js';
import { LanguageMode, ScriptMode, PerformanceMode } from '../../shared/types/models.js';

export const App: React.FC = () => {
  const {
    project,
    hardware,
    audioWavPath,
    waveformData,
    setHardware,
    setMedia,
    setAudioWavPath,
    setWaveformData,
    updateSettings,
    updateStyle,
    statusMessage,
    setStatusMessage,
    loadProjectData,
  } = useProjectStore();

  useEffect(() => {
    // Initialize hardware profile from IPC bridge
    if (window.vaaniAPI) {
      window.vaaniAPI.getHardwareProfile().then((res) => {
        if (res.success && res.data) {
          setHardware(res.data);
          setStatusMessage(`Hardware detected: ${res.data.cpuModel}`);
        }
      });

      // Listen to streaming progress updates from media pipeline
      const cleanupProgress = window.vaaniAPI.onProgress((prog) => {
        setStatusMessage(prog.message);
      });

      return () => cleanupProgress();
    }
  }, [setHardware, setStatusMessage]);

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
              <span className="pane-title">
                Subtitle Events ({project.events.length})
                {waveformData && (
                  <span style={{ marginLeft: '12px', color: 'var(--accent-active)', fontWeight: 'normal' }}>
                    Waveform: {waveformData.peaks.length} samples
                  </span>
                )}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target: {project.settings.maxCharactersPerLine} CPL / {project.settings.targetReadingSpeedCPS} CPS
              </span>
            </div>

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
                  No subtitle events generated yet. Import media to run local transcription.
                </div>
              ) : (
                project.events.map((evt) => (
                  <div key={evt.id} className="event-row">
                    <span className="event-index">#{evt.index}</span>
                    <span className="event-time">
                      {evt.startTime.toFixed(2)}s - {evt.endTime.toFixed(2)}s
                    </span>
                    <span className="event-text">{evt.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Inspector & Settings Sidebar */}
        <aside className="sidebar-inspector">
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
                <option value="fast">Fast (Quantized Base Model)</option>
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
