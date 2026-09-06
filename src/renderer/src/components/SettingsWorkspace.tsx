import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { useUIStore } from '../store/uiStore.js';
import {
  HardwareProfile,
  ModelInfo,
  PerformanceMode,
  MemoryStats,
  DeepSystemScanResult,
} from '../../../shared/types/models.js';

interface SettingsWorkspaceProps {
  models: ModelInfo[];
  hardware: HardwareProfile | null;
  onRefreshModels: () => void;
}

type SettingsTab =
  | 'general'
  | 'appearance'
  | 'models'
  | 'performance'
  | 'shortcuts'
  | 'privacy'
  | 'diagnostics'
  | 'about';

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  models,
  hardware,
  onRefreshModels,
}) => {
  const { project, updateSettings, setStatusMessage } = useProjectStore();
  const { theme, setTheme } = useUIStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningMessage, setCleaningMessage] = useState<string | null>(null);
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadPercent, setDownloadPercent] = useState<number>(0);
  const [deepScanResult, setDeepScanResult] = useState<DeepSystemScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [shortcutFilter, setShortcutFilter] = useState('');

  // Fetch memory stats
  useEffect(() => {
    if (window.vaaniAPI?.getMemoryStats) {
      window.vaaniAPI.getMemoryStats().then((res) => {
        if (res.success && res.data) setMemoryStats(res.data);
      });
    }
  }, [activeTab]);

  const handleCleanCache = async () => {
    if (!window.vaaniAPI?.cleanCache) return;
    setIsCleaning(true);
    setCleaningMessage(null);
    try {
      const res = await window.vaaniAPI.cleanCache({ clearAllAudio: false });
      if (res.success && res.data) {
        setCleaningMessage(`Freed ${res.data.freedMB} MB (${res.data.filesDeleted} temp files removed).`);
        const memRes = await window.vaaniAPI.getMemoryStats();
        if (memRes.success && memRes.data) setMemoryStats(memRes.data);
      }
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDownloadModel = async (modelId: string) => {
    if (!window.vaaniAPI) return;
    setDownloadingModelId(modelId);
    setDownloadPercent(5);

    const cleanup = window.vaaniAPI.onProgress((prog) => {
      setDownloadPercent(prog.percent);
    });

    try {
      const res = await window.vaaniAPI.downloadModel(modelId);
      cleanup();
      setDownloadingModelId(null);
      if (res.success) {
        setStatusMessage(`Model downloaded successfully.`);
        onRefreshModels();
      }
    } catch {
      cleanup();
      setDownloadingModelId(null);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!window.vaaniAPI) return;
    try {
      const res = await window.vaaniAPI.deleteModel(modelId);
      if (res.success) {
        setStatusMessage(`Deleted local model weights.`);
        onRefreshModels();
      }
    } catch {
      // ignore
    }
  };

  const handleDeepScan = async () => {
    if (!window.vaaniAPI?.runDeepSystemScan) return;
    setIsScanning(true);
    try {
      const res = await window.vaaniAPI.runDeepSystemScan(true);
      if (res.success && res.data) {
        setDeepScanResult(res.data);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const shortcuts = [
    { key: 'Space', desc: 'Toggle Video Playback / Pause', context: 'Global' },
    { key: 'Ctrl + Z', desc: 'Undo last subtitle or timing edit', context: 'Global' },
    { key: 'Ctrl + Y', desc: 'Redo edit', context: 'Global' },
    { key: 'Ctrl + K / S', desc: 'Split active subtitle at playhead position', context: 'Editor' },
    { key: 'Ctrl + M', desc: 'Merge selected subtitle with adjacent segment', context: 'Editor' },
    { key: 'Delete', desc: 'Delete currently selected subtitle', context: 'Subtitles' },
    { key: 'Ctrl + F', desc: 'Toggle Find & Replace bar', context: 'Subtitles' },
    { key: 'Enter', desc: 'Commit inline text edit or confirm dialog', context: 'Subtitles' },
    { key: 'Escape', desc: 'Deselect subtitle or close modal', context: 'Global' },
    { key: 'Arrow Left / Right', desc: 'Step playhead backward / forward 1 second', context: 'Editor' },
    { key: 'Shift + Left / Right', desc: 'Step playhead backward / forward 1 frame (1/30s)', context: 'Editor' },
    { key: 'Arrow Up / Down', desc: 'Navigate to previous / next subtitle event', context: 'Editor' },
  ];

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.key.toLowerCase().includes(shortcutFilter.toLowerCase()) ||
      s.desc.toLowerCase().includes(shortcutFilter.toLowerCase()) ||
      s.context.toLowerCase().includes(shortcutFilter.toLowerCase())
  );

  return (
    <div className="settings-workspace">
      {/* Left Navigation Tabs */}
      <nav className="settings-nav">
        {[
          { id: 'general', label: 'General' },
          { id: 'appearance', label: 'Appearance' },
          { id: 'models', label: 'Models' },
          { id: 'performance', label: 'Performance' },
          { id: 'shortcuts', label: 'Shortcuts' },
          { id: 'privacy', label: 'Privacy' },
          { id: 'diagnostics', label: 'Diagnostics' },
          { id: 'about', label: 'About' },
        ].map((item) => (
          <button
            key={item.id}
            className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id as SettingsTab)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Main Settings Content Area */}
      <main className="settings-content-pane">
        {/* 1. General */}
        {activeTab === 'general' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              General Settings
            </h3>

            <div className="control-group">
              <label className="input-label">Background Autosave</label>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Vaani Studio automatically captures recovery snapshots every 60 seconds when unsaved changes exist.
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-success)',
                  backgroundColor: 'var(--color-success-subtle)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                ● Active (Interval: 60s)
              </span>
            </div>

            <div className="control-group" style={{ marginTop: '20px' }}>
              <label className="input-label">Audio Extraction Sample Rate</label>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                16,000 Hz Mono (Whisper Optimal Standard). Normalized via FFmpeg.
              </div>
            </div>

            <div className="control-group" style={{ marginTop: '20px' }}>
              <label className="input-label">Project Workspace Persistence</label>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Theme preferences, inspector width, and recent project entries are securely persisted in local storage.
              </div>
            </div>
          </div>
        )}

        {/* 2. Appearance */}
        {activeTab === 'appearance' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Appearance & Theme
            </h3>
            <div className="control-group">
              <label className="input-label">Theme Mode</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <div
                  onClick={() => setTheme('dark')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    backgroundColor: '#101622',
                    border: theme === 'dark' ? '2px solid var(--border-focus)' : '1px solid #28344B',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: '#F1F5F9',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Dark Theme</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Sleek charcoal surfaces, optimal for video previewing and low eye strain.
                  </div>
                </div>

                <div
                  onClick={() => setTheme('light')}
                  style={{
                    flex: 1,
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    border: theme === 'light' ? '2px solid var(--border-focus)' : '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: '#0F172A',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Light Theme</div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Crisp high-contrast theme following Windows 11 Fluent guidelines.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Models */}
        {activeTab === 'models' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Whisper Speech Recognition Models
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Models run 100% locally on your computer via CTranslate2 INT8 quantization. Download once and use offline indefinitely.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {models.map((m) => {
                const isDownloading = downloadingModelId === m.id;

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {m.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ({m.sizeMB} MB)
                        </span>
                        {m.isDownloaded && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: 'var(--color-success)',
                              backgroundColor: 'var(--color-success-subtle)',
                              padding: '2px 6px',
                              borderRadius: '2px',
                            }}
                          >
                            Ready
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {m.description}
                      </p>
                    </div>

                    <div>
                      {m.isDownloaded ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDeleteModel(m.id)}
                          title="Delete local model weights to free disk space"
                        >
                          Delete Weights
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={isDownloading}
                          onClick={() => handleDownloadModel(m.id)}
                        >
                          {isDownloading ? `Downloading (${downloadPercent.toFixed(0)}%)...` : `Download (${m.sizeMB} MB)`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Performance */}
        {activeTab === 'performance' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Performance & Resource Optimization
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Configure threading budgets and memory management for your hardware.
            </p>

            <div className="control-group">
              <label className="input-label">Performance Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { id: 'fast', title: 'Fast Mode', desc: 'Minimal latency. Optimized for rapid drafts with Tiny/Base models.' },
                  { id: 'balanced', title: 'Balanced Mode (Recommended)', desc: 'Optimal trade-off between transcription accuracy and speed.' },
                  { id: 'quality', title: 'Maximum Quality', desc: 'Highest transcription fidelity using larger beam sizes and models.' },
                ].map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => updateSettings({ performanceMode: mode.id as PerformanceMode })}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: project.settings.performanceMode === mode.id ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                      border: project.settings.performanceMode === mode.id ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: project.settings.performanceMode === mode.id ? 'var(--accent-active)' : 'var(--text-primary)', marginBottom: '4px' }}>
                      {mode.title}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {mode.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory & Cache Management */}
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Memory & Temporary Audio Cache
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={isCleaning}
                  onClick={handleCleanCache}
                >
                  {isCleaning ? 'Cleaning...' : 'Clear Temp Cache'}
                </button>
              </div>

              {memoryStats && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                  <span>Process RSS: {memoryStats.rssMB} MB</span>
                  <span>Heap Used: {memoryStats.heapUsedMB} MB</span>
                  <span>System Free: {memoryStats.systemFreeMB} MB</span>
                </div>
              )}

              {cleaningMessage && (
                <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '8px' }}>
                  {cleaningMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Shortcuts */}
        {activeTab === 'shortcuts' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Keyboard Shortcuts
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="input-text"
                placeholder="Search shortcuts..."
                style={{ maxWidth: '280px' }}
                value={shortcutFilter}
                onChange={(e) => setShortcutFilter(e.target.value)}
              />
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '180px' }}>Shortcut</th>
                    <th>Action</th>
                    <th style={{ width: '100px' }}>Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShortcuts.map((s, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-active)', fontSize: '12px' }}>
                        {s.key}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{s.desc}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.context}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Privacy */}
        {activeTab === 'privacy' && (
          <div style={{ maxWidth: '640px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Privacy & Local-First Architecture
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>
                <strong>Your media never leaves this computer.</strong> Vaani Studio is built from the ground up as a native desktop application. All speech recognition, waveform analysis, speaker diarization, and video burn-in happen entirely locally using your CPU and hardware.
              </p>
              <p>
                There is <strong>zero cloud processing</strong>, zero voice telemetry, and no hidden data uploads. The only network connections made are when you explicitly request a Whisper model weight download from Hugging Face or check for application updates.
              </p>
              <p>
                You can disconnect your internet connection entirely, and Vaani Studio will continue generating, editing, styling, and exporting subtitles with 100% functionality.
              </p>
            </div>
          </div>
        )}

        {/* 7. Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              System Hardware Diagnostics
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Honest hardware profiling based on your machine's actual capabilities.
            </p>

            <div className="data-table-container" style={{ marginBottom: '16px' }}>
              <table className="data-table">
                <tbody>
                  <tr>
                    <td style={{ width: '180px', fontWeight: 600, color: 'var(--text-secondary)' }}>Processor (CPU)</td>
                    <td>{hardware ? hardware.cpuModel : 'Detecting...'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Cores / Threads</td>
                    <td>{hardware ? `${hardware.physicalCores} Physical Cores / ${hardware.logicalCores} Logical Threads` : 'Detecting...'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>System Memory (RAM)</td>
                    <td>{hardware ? `${(hardware.totalMemoryMB / 1024).toFixed(1)} GB Total RAM` : 'Detecting...'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Inference Engine</td>
                    <td>
                      CPU INT8 Optimized (CTranslate2)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>GPU Status</td>
                    <td>
                      {hardware?.gpuName ? (
                        <span>{hardware.gpuName} ({hardware.hasCudaSupport ? 'CUDA Supported' : 'CUDA acceleration unavailable; CPU INT8 baseline used'})</span>
                      ) : (
                        'Standard CPU baseline'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button className="btn btn-secondary btn-sm" disabled={isScanning} onClick={handleDeepScan}>
              {isScanning ? 'Running Hardware Scan...' : 'Run Deep Diagnostic Scan'}
            </button>

            {deepScanResult && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                <div><strong>AVX2 Instruction Support:</strong> {deepScanResult.cpuDetails?.hasAvx2 ? 'Supported' : 'Not detected'}</div>
                <div><strong>Model Advisor Recommendation:</strong> {deepScanResult.recommendedModelId}</div>
                <div><strong>Reasoning:</strong> {deepScanResult.recommendationReason}</div>
              </div>
            )}
          </div>
        )}

        {/* 8. About */}
        {activeTab === 'about' && (
          <div style={{ maxWidth: '540px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Vaani Studio
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Version 0.1.0 (Desktop Edition)
            </p>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p>
                Professional native Windows desktop software for local-first AI subtitle generation, precise timeline synchronization, multilingual transliteration (English, Hindi, Hinglish), and 60 FPS kinetic video burn-in.
              </p>
              <p>
                Engineered with Electron, TypeScript, React, faster-whisper (CTranslate2), and FFmpeg.
              </p>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                Open-source local creative tool. All media stays on your computer.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
