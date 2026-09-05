import React, { useEffect } from 'react';
import { useProjectStore } from './store/projectStore.js';
import { LanguageMode, ScriptMode, PerformanceMode } from '../../shared/types/models.js';

export const App: React.FC = () => {
  const {
    project,
    hardware,
    setHardware,
    setMedia,
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
    }
  }, [setHardware, setStatusMessage]);

  const handleSelectMedia = async () => {
    if (!window.vaaniAPI) return;
    setStatusMessage('Selecting media file...');
    const res = await window.vaaniAPI.selectMediaFile();
    if (res.success && res.data) {
      const probeRes = await window.vaaniAPI.probeMedia(res.data);
      if (probeRes.success && probeRes.data) {
        setMedia(probeRes.data);
        setStatusMessage(`Loaded: ${probeRes.data.fileName}`);
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
                    Size: {(project.media.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <span className="brand-badge">Ready for ASR Ingestion</span>
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
              <span className="pane-title">Subtitle Events ({project.events.length})</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target: {project.settings.maxCharactersPerLine} CPL / {project.settings.targetReadingSpeedCPS} CPS
              </span>
            </div>
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
