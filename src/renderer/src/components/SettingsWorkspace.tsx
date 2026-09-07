import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { useUIStore } from '../store/uiStore.js';
import {
  HardwareProfile,
  ModelInfo,
  PerformanceMode,
  MemoryStats,
  DeepSystemScanResult,
  ModelsStorageSummary,
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
  const { theme, setTheme, setIsTutorialOpen } = useUIStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningMessage, setCleaningMessage] = useState<string | null>(null);
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadPercent, setDownloadPercent] = useState<number>(0);
  const [downloadMessage, setDownloadMessage] = useState<string>('');
  const [deepScanResult, setDeepScanResult] = useState<DeepSystemScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [shortcutFilter, setShortcutFilter] = useState('');
  const [storageSummary, setStorageSummary] = useState<ModelsStorageSummary | null>(null);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const fetchStorageSummary = async () => {
    if (window.vaaniAPI?.getModelsStorageSummary) {
      try {
        const res = await window.vaaniAPI.getModelsStorageSummary();
        if (res.success && res.data) {
          setStorageSummary(res.data);
        }
      } catch {
        // ignore
      }
    }
  };

  // Fetch memory stats & storage summary
  useEffect(() => {
    if (window.vaaniAPI?.getMemoryStats) {
      window.vaaniAPI.getMemoryStats().then((res) => {
        if (res.success && res.data) setMemoryStats(res.data);
      });
    }
    if (activeTab === 'models') {
      fetchStorageSummary();
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
    setDownloadMessage('Connecting to Hugging Face...');

    const cleanup = window.vaaniAPI.onProgress((prog) => {
      setDownloadPercent(prog.percent);
      if (prog.message) {
        setDownloadMessage(prog.message);
      }
    });

    try {
      const res = await window.vaaniAPI.downloadModel(modelId);
      cleanup();
      setDownloadingModelId(null);
      setDownloadPercent(0);
      setDownloadMessage('');
      if (res.success) {
        setStatusMessage('Model downloaded successfully.');
        onRefreshModels();
        fetchStorageSummary();
      } else {
        setStatusMessage(res.error?.message || 'Download failed.');
      }
    } catch (err: any) {
      cleanup();
      setDownloadingModelId(null);
      setDownloadPercent(0);
      setDownloadMessage('');
      setStatusMessage(err?.message || 'Download error.');
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!window.vaaniAPI) return;
    try {
      const res = await window.vaaniAPI.deleteModel(modelId);
      if (res.success) {
        setStatusMessage('Deleted model files and Hugging Face cache.');
        setModelToDelete(null);
        onRefreshModels();
        fetchStorageSummary();
      } else {
        setStatusMessage(res.error?.message || 'Failed to delete model.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Delete error.');
    }
  };

  const handleDeleteAllModels = async () => {
    if (!window.vaaniAPI) return;
    setIsDeletingAll(true);
    try {
      let count = 0;
      for (const m of models) {
        if (m.isDownloaded) {
          await window.vaaniAPI.deleteModel(m.id);
          count++;
        }
      }
      setStatusMessage(`Storage cleaned: ${count} local model(s) removed.`);
      setShowDeleteAllConfirm(false);
      onRefreshModels();
      fetchStorageSummary();
    } finally {
      setIsDeletingAll(false);
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

            <div
              className="control-group"
              style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Interactive Application Guide & Tour
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Revisit the interactive feature walkthrough explaining what does what, editor controls, and export options.
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsTutorialOpen(true)}
                  title="Open Interactive Feature Guide"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Open Feature Tour & Guide
                </button>
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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Speech Recognition Models & Storage
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Models run locally on your device via CTranslate2 INT8 quantization. You have full control over stored weights and disk space.
                </p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onRefreshModels();
                  fetchStorageSummary();
                }}
                title="Refresh model states and storage usage"
              >
                Refresh
              </button>
            </div>

            {/* Storage overview card */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                      Model Storage Directory
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: storageSummary?.isSetupFolder ? 'rgba(74, 222, 128, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: storageSummary?.isSetupFolder ? '#4ade80' : '#38bdf8',
                        border: `1px solid ${storageSummary?.isSetupFolder ? 'rgba(74, 222, 128, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                      }}
                    >
                      {storageSummary?.isSetupFolder ? 'Setup App Folder' : 'Local AppData'}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'Consolas, monospace',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all',
                      userSelect: 'text',
                    }}
                  >
                    {storageSummary?.storagePath || 'Locating storage path...'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {storageSummary?.storagePath && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        if (window.vaaniAPI?.showItemInFolder && storageSummary.storagePath) {
                          window.vaaniAPI.showItemInFolder(storageSummary.storagePath);
                        }
                      }}
                      title="Open storage folder in Windows File Explorer"
                    >
                      Open Folder
                    </button>
                  )}

                  {storageSummary && storageSummary.downloadedCount > 0 && (
                    <>
                      {showDeleteAllConfirm ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={isDeletingAll}
                            onClick={handleDeleteAllModels}
                          >
                            {isDeletingAll ? 'Deleting All...' : 'Confirm Delete All'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={isDeletingAll}
                            onClick={() => setShowDeleteAllConfirm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger, #ef4444)' }}
                          onClick={() => setShowDeleteAllConfirm(true)}
                          title="Delete all downloaded models to free disk space"
                        >
                          Delete All Models
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Disk Usage: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {storageSummary?.totalModelsSizeMB ?? 0} MB
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Downloaded Models: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {storageSummary?.downloadedCount ?? 0} / {models.length}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Cache Policy: </span>
                  <span>Deep clean purges model weights and Hugging Face cache</span>
                </div>
              </div>
            </div>

            {/* Model list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {models.map((m) => {
                const isDownloading = downloadingModelId === m.id;
                const isConfirmingDelete = modelToDelete === m.id;

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-surface)',
                      border: isDownloading ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <div
                      style={{
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
                          {isDownloading && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: 'var(--accent-active)',
                                backgroundColor: 'var(--accent-subtle)',
                                padding: '2px 6px',
                                borderRadius: '2px',
                              }}
                            >
                              Downloading ({downloadPercent.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                          {m.description}
                        </p>
                      </div>

                      <div>
                        {m.isDownloaded ? (
                          isConfirmingDelete ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteModel(m.id)}
                                title="Permanently delete model files and Hugging Face cache"
                              >
                                Confirm Delete
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setModelToDelete(null)}
                                title="Cancel deletion"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setModelToDelete(m.id)}
                              title="Delete model files to free disk space"
                            >
                              Delete Model
                            </button>
                          )
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

                    {isDownloading && (
                      <div style={{ width: '100%', paddingTop: '4px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px',
                          }}
                        >
                          <span style={{ fontFamily: 'monospace' }}>
                            {downloadMessage || 'Contacting Hugging Face Hub...'}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {downloadPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'var(--bg-app)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(4, Math.min(100, downloadPercent))}%`,
                              height: '100%',
                              backgroundColor: 'var(--accent-active)',
                              borderRadius: '3px',
                              transition: 'width 0.25s ease',
                            }}
                          />
                        </div>
                      </div>
                    )}
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
              <div style={{ marginTop: '16px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsTutorialOpen(true)}
                  title="Launch Interactive App Guide"
                >
                  Launch Interactive App Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
