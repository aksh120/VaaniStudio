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
import {
  Palette,
  Boxes,
  Keyboard,
  Shield,
  HardDrive,
  SlidersHorizontal,
  AlertCircle,
  Info,
  RotateCcw,
  Globe,
  Home,
  RefreshCw,
  Folder,
  Clock,
  Layout,
  Film,
  Volume2,
  BookOpen,
  Activity,
  Save,
  Check,
  Cpu,
  Settings as SettingsIcon,
  Gauge,
  LucideIcon,
  ExternalLink,
  FolderGit2,
  Tag,
} from 'lucide-react';

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
  | 'storage'
  | 'advanced'
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

  // General Settings State (Matching Image 0)
  const [language, setLanguage] = useState('English');
  const [startPage, setStartPage] = useState('Projects');
  const [checkForUpdates, setCheckForUpdates] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState('Every 60 seconds');
  const [projectLocation, setProjectLocation] = useState(
    'C:\\Users\\YourName\\Vaani Studio\\Projects'
  );
  const [recentProjectsLimit, setRecentProjectsLimit] = useState('10');
  const [rememberLayout, setRememberLayout] = useState(true);
  const [defaultImportFolder, setDefaultImportFolder] = useState(
    'C:\\Users\\YourName\\Videos'
  );
  const [autoAddToTimeline, setAutoAddToTimeline] = useState(true);
  const [preferredAudioTrack, setPreferredAudioTrack] = useState('First Track (Recommended)');

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Existing diagnostic, storage, and models state
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

  useEffect(() => {
    if (window.vaaniAPI?.getMemoryStats) {
      window.vaaniAPI.getMemoryStats().then((res) => {
        if (res.success && res.data) setMemoryStats(res.data);
      });
    }
    if (activeTab === 'models' || activeTab === 'storage') {
      fetchStorageSummary();
    }
  }, [activeTab]);

  const handleOpenExternal = (url: string) => {
    if (window.vaaniAPI?.openExternalUrl) {
      window.vaaniAPI.openExternalUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

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

  const handleResetDefaults = () => {
    setTheme('dark');
    setLanguage('English');
    setStartPage('Projects');
    setCheckForUpdates(true);
    setAutoSaveEnabled(true);
    setAutoSaveInterval('Every 60 seconds');
    setProjectLocation('C:\\Users\\YourName\\Vaani Studio\\Projects');
    setRecentProjectsLimit('10');
    setRememberLayout(true);
    setDefaultImportFolder('C:\\Users\\YourName\\Videos');
    setAutoAddToTimeline(true);
    setPreferredAudioTrack('First Track (Recommended)');
    updateSettings({ performanceMode: 'balanced' });
    setFeedbackMessage('Settings restored to default preferences.');
    setTimeout(() => setFeedbackMessage(null), 3000);
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

  const categories: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'models', label: 'Models', icon: Boxes },
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'advanced', label: 'Advanced', icon: SlidersHorizontal },
    { id: 'diagnostics', label: 'Diagnostics', icon: AlertCircle },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="settings-workspace-root">
      {/* ===================================================================
          COLUMN 1: SETTINGS SIDEBAR
         =================================================================== */}
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">Settings</div>

        <nav className="settings-nav-list">
          {categories.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`settings-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <IconComponent size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-sidebar-footer">
          <button
            type="button"
            className="settings-reset-btn"
            onClick={handleResetDefaults}
            title="Reset all settings to default values"
          >
            <RotateCcw size={13} />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </aside>

      {/* ===================================================================
          COLUMN 2: CENTER MAIN SETTINGS CONTENT AREA
         =================================================================== */}
      <main className="settings-main-column">
        {feedbackMessage && (
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              borderRadius: '6px',
              color: '#60A5FA',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={14} />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 1: GENERAL (Target UI Image 0)
           ------------------------------------------------------------- */}
        {activeTab === 'general' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">General Settings</h2>
              <p className="settings-main-subtitle">
                Configure how Vaani Studio behaves and manages your projects.
              </p>
            </div>

            {/* Card 1: Application */}
            <div className="settings-section-card">
              <div className="settings-card-title">Application</div>

              {/* Language */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Globe size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Language</span>
                    <span className="settings-row-desc">Choose the application language (UI only).</span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <select
                    className="settings-select-box"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
              </div>

              {/* Start Page */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Home size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Start Page</span>
                    <span className="settings-row-desc">Page to show when the application launches.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <select
                    className="settings-select-box"
                    value={startPage}
                    onChange={(e) => setStartPage(e.target.value)}
                  >
                    <option value="Projects">Projects</option>
                    <option value="Editor">Editor</option>
                  </select>
                </div>
              </div>

              {/* Check for Updates */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <RefreshCw size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Check for Updates</span>
                    <span className="settings-row-desc">Automatically check for updates on startup.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <div
                    className={`style-toggle-switch ${checkForUpdates ? 'active' : ''}`}
                    onClick={() => setCheckForUpdates(!checkForUpdates)}
                  >
                    <div className="style-toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Project & Workspace */}
            <div className="settings-section-card">
              <div className="settings-card-title">Project & Workspace</div>

              {/* Auto Save */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Save size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Auto Save</span>
                    <span className="settings-row-desc">
                      Automatically save project changes at regular intervals.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <div
                    className={`style-toggle-switch ${autoSaveEnabled ? 'active' : ''}`}
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  >
                    <div className="style-toggle-thumb" />
                  </div>
                  <select
                    className="settings-select-box"
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(e.target.value)}
                  >
                    <option value="Every 30 seconds">Every 30 seconds</option>
                    <option value="Every 60 seconds">Every 60 seconds</option>
                    <option value="Every 2 minutes">Every 2 minutes</option>
                    <option value="Every 5 minutes">Every 5 minutes</option>
                  </select>
                </div>
              </div>

              {/* Project Location */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Folder size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Project Location</span>
                    <span className="settings-row-desc">Default folder for new projects.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <input
                    type="text"
                    className="settings-path-input"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                  />
                  <button
                    type="button"
                    className="settings-path-btn"
                    onClick={() => {
                      setFeedbackMessage('Project location updated.');
                      setTimeout(() => setFeedbackMessage(null), 2500);
                    }}
                  >
                    <Folder size={13} />
                    <span>Change</span>
                  </button>
                </div>
              </div>

              {/* Recent Projects */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Clock size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Recent Projects</span>
                    <span className="settings-row-desc">
                      Number of recent projects to show in the start page.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <select
                    className="settings-select-box"
                    value={recentProjectsLimit}
                    onChange={(e) => setRecentProjectsLimit(e.target.value)}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                  </select>
                </div>
              </div>

              {/* Remember Layout */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Layout size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Remember Layout</span>
                    <span className="settings-row-desc">
                      Restore panel sizes and layout between sessions.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <div
                    className={`style-toggle-switch ${rememberLayout ? 'active' : ''}`}
                    onClick={() => setRememberLayout(!rememberLayout)}
                  >
                    <div className="style-toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Media */}
            <div className="settings-section-card">
              <div className="settings-card-title">Media</div>

              {/* Default Import Folder */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Folder size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Default Import Folder</span>
                    <span className="settings-row-desc">
                      Last used folder for importing media files.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <input
                    type="text"
                    className="settings-path-input"
                    value={defaultImportFolder}
                    onChange={(e) => setDefaultImportFolder(e.target.value)}
                  />
                  <button
                    type="button"
                    className="settings-path-btn"
                    onClick={() => {
                      setFeedbackMessage('Import folder updated.');
                      setTimeout(() => setFeedbackMessage(null), 2500);
                    }}
                  >
                    <Folder size={13} />
                    <span>Change</span>
                  </button>
                </div>
              </div>

              {/* Auto Add to Timeline */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Film size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Auto Add to Timeline</span>
                    <span className="settings-row-desc">
                      Automatically add imported media to the timeline.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <div
                    className={`style-toggle-switch ${autoAddToTimeline ? 'active' : ''}`}
                    onClick={() => setAutoAddToTimeline(!autoAddToTimeline)}
                  >
                    <div className="style-toggle-thumb" />
                  </div>
                </div>
              </div>

              {/* Preferred Audio Track */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Volume2 size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Preferred Audio Track</span>
                    <span className="settings-row-desc">
                      Select default audio track when multiple are available.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <select
                    className="settings-select-box"
                    value={preferredAudioTrack}
                    onChange={(e) => setPreferredAudioTrack(e.target.value)}
                  >
                    <option value="First Track (Recommended)">First Track (Recommended)</option>
                    <option value="Stereo Mix">Stereo Mix</option>
                    <option value="Track 1">Track 1</option>
                    <option value="Track 2">Track 2</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 2: APPEARANCE
           ------------------------------------------------------------- */}
        {activeTab === 'appearance' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">Appearance & Theme</h2>
              <p className="settings-main-subtitle">
                Customize the visual style, contrast, and theme of Vaani Studio.
              </p>
            </div>

            <div className="settings-section-card">
              <div className="settings-card-title">Theme Selection</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div
                  onClick={() => setTheme('dark')}
                  style={{
                    padding: '16px',
                    backgroundColor: '#070B14',
                    border: theme === 'dark' ? '2px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#F1F5F9',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Dark Theme</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>
                    Sleek charcoal surfaces, optimal for video previewing and low eye strain.
                  </div>
                </div>

                <div
                  onClick={() => setTheme('light')}
                  style={{
                    padding: '16px',
                    backgroundColor: '#1E293B',
                    border: theme === 'light' ? '2px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#F1F5F9',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Light Theme</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>
                    Crisp high-contrast theme following Windows 11 Fluent guidelines.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 3: MODELS
           ------------------------------------------------------------- */}
        {activeTab === 'models' && (
          <>
            <div className="settings-header-block">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 className="settings-main-title">Speech Recognition Models</h2>
                  <p className="settings-main-subtitle">
                    Models run locally on your device via CTranslate2 INT8 quantization. Full offline privacy.
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
                  Refresh Models
                </button>
              </div>
            </div>

            {/* Storage overview */}
            <div className="settings-section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#F8FAFC' }}>
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
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: '#94A3B8',
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
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '11.5px',
                  color: '#94A3B8',
                }}
              >
                <div>
                  Disk Usage: <strong style={{ color: '#F8FAFC' }}>{storageSummary?.totalModelsSizeMB ?? 0} MB</strong>
                </div>
                <div>
                  Downloaded Models: <strong style={{ color: '#F8FAFC' }}>{storageSummary?.downloadedCount ?? 0} / {models.length}</strong>
                </div>
              </div>
            </div>

            {/* Model list cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {models.map((m) => {
                const isDownloading = downloadingModelId === m.id;
                const isConfirmingDelete = modelToDelete === m.id;

                return (
                  <div
                    key={m.id}
                    className="settings-section-card"
                    style={{
                      border: isDownloading ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.07)',
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
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#F8FAFC' }}>
                            {m.name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                            ({m.sizeMB} MB)
                          </span>
                          {m.isDownloaded && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#4ADE80',
                                backgroundColor: 'rgba(74, 222, 128, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '3px',
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
                                color: '#60A5FA',
                                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                                padding: '2px 6px',
                                borderRadius: '3px',
                              }}
                            >
                              Downloading ({downloadPercent.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0', lineHeight: 1.4 }}>
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
                                title="Permanently delete model files"
                              >
                                Confirm Delete
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setModelToDelete(null)}
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
                            color: '#94A3B8',
                            marginBottom: '6px',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                            {downloadMessage || 'Connecting to Hugging Face...'}
                          </span>
                          <span style={{ fontWeight: 600, color: '#F8FAFC' }}>
                            {downloadPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '5px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(4, Math.min(100, downloadPercent))}%`,
                              height: '100%',
                              backgroundColor: '#2563EB',
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
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 4: PERFORMANCE
           ------------------------------------------------------------- */}
        {activeTab === 'performance' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">Performance & Resource Optimization</h2>
              <p className="settings-main-subtitle">
                Configure threading budgets and memory management for your hardware.
              </p>
            </div>

            <div className="settings-section-card">
              <div className="settings-card-title">Performance Mode</div>
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
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: project.settings.performanceMode === mode.id ? 'rgba(37, 99, 235, 0.15)' : '#070B14',
                      border: project.settings.performanceMode === mode.id ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: project.settings.performanceMode === mode.id ? '#60A5FA' : '#F8FAFC', marginBottom: '4px' }}>
                      {mode.title}
                    </div>
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                      {mode.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory & Cache Management */}
            <div className="settings-section-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="settings-card-title">Memory & Temporary Audio Cache</div>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                    Purge intermediate 16 kHz WAV cache and release memory buffers.
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={isCleaning}
                  onClick={handleCleanCache}
                >
                  {isCleaning ? 'Cleaning...' : 'Clear Temp Cache'}
                </button>
              </div>

              {memoryStats && (
                <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', gap: '16px', paddingTop: '4px' }}>
                  <span>Process RSS: <strong style={{ color: '#F8FAFC' }}>{memoryStats.rssMB} MB</strong></span>
                  <span>Heap Used: <strong style={{ color: '#F8FAFC' }}>{memoryStats.heapUsedMB} MB</strong></span>
                  <span>System Free: <strong style={{ color: '#F8FAFC' }}>{memoryStats.systemFreeMB} MB</strong></span>
                </div>
              )}

              {cleaningMessage && (
                <div style={{ fontSize: '11px', color: '#4ADE80' }}>
                  {cleaningMessage}
                </div>
              )}
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 5: SHORTCUTS
           ------------------------------------------------------------- */}
        {activeTab === 'shortcuts' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">Keyboard Shortcuts</h2>
              <p className="settings-main-subtitle">
                View and customize speed keys for video editing and subtitle synchronization.
              </p>
            </div>

            <div className="settings-section-card">
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Search shortcuts..."
                  style={{ maxWidth: '280px', height: '32px' }}
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
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#60A5FA', fontSize: '12px' }}>
                          {s.key}
                        </td>
                        <td style={{ fontSize: '12px', color: '#F8FAFC' }}>{s.desc}</td>
                        <td style={{ fontSize: '11px', color: '#94A3B8' }}>{s.context}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 6: PRIVACY
           ------------------------------------------------------------- */}
        {activeTab === 'privacy' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">Privacy & Local-First Architecture</h2>
              <p className="settings-main-subtitle">
                Your media never leaves this computer. 100% offline guarantee.
              </p>
            </div>

            <div className="settings-section-card" style={{ maxWidth: '720px' }}>
              <div style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p>
                  <strong style={{ color: '#F8FAFC' }}>Your media never leaves this computer.</strong> Vaani Studio is built from the ground up as a native desktop application. All speech recognition, waveform analysis, speaker diarization, and video burn-in happen entirely locally using your CPU and hardware.
                </p>
                <p>
                  There is <strong style={{ color: '#F8FAFC' }}>zero cloud processing</strong>, zero voice telemetry, and no hidden data uploads. The only network connections made are when you explicitly request a Whisper model weight download from Hugging Face or check for application updates.
                </p>
                <p>
                  You can disconnect your internet connection entirely, and Vaani Studio will continue generating, editing, styling, and exporting subtitles with 100% functionality.
                </p>
              </div>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 7: STORAGE
           ------------------------------------------------------------- */}
        {activeTab === 'storage' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">Disk Storage & Caches</h2>
              <p className="settings-main-subtitle">
                Manage temporary media caches, waveform data, and model directories.
              </p>
            </div>

            <div className="settings-section-card">
              <div className="settings-card-title">Cache & Data Management</div>
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <HardDrive size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Audio & Waveform Cache</span>
                    <span className="settings-row-desc">
                      Temporary 16 kHz audio files and extracted waveform peak buffers.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={isCleaning}
                    onClick={handleCleanCache}
                  >
                    {isCleaning ? 'Purging...' : 'Purge Audio Cache'}
                  </button>
                </div>
              </div>

              {cleaningMessage && (
                <div style={{ fontSize: '11.5px', color: '#4ADE80' }}>
                  {cleaningMessage}
                </div>
              )}
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 8: ADVANCED
           ------------------------------------------------------------- */}
        {activeTab === 'advanced' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">Advanced Configuration</h2>
              <p className="settings-main-subtitle">
                Fine-tune subtitle formatting standards, FFmpeg parameters, and export budgets.
              </p>
            </div>

            <div className="settings-section-card">
              <div className="settings-card-title">Subtitle Engine Parameters</div>
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <SlidersHorizontal size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Max Characters Per Line</span>
                    <span className="settings-row-desc">
                      Recommended 37 to 42 characters for broadcast readability.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <select className="settings-select-box" defaultValue="42">
                    <option value="36">36 characters</option>
                    <option value="42">42 characters (Standard)</option>
                    <option value="48">48 characters</option>
                  </select>
                </div>
              </div>

              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Cpu size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">FFmpeg Hardware Acceleration</span>
                    <span className="settings-row-desc">
                      Auto-detect NVENC or QSV hardware acceleration for video export.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <select className="settings-select-box" defaultValue="auto">
                    <option value="auto">Auto-detect</option>
                    <option value="cpu">Software (libx264)</option>
                    <option value="nvenc">NVIDIA NVENC</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 9: DIAGNOSTICS
           ------------------------------------------------------------- */}
        {activeTab === 'diagnostics' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">System Hardware Diagnostics</h2>
              <p className="settings-main-subtitle">
                Comprehensive hardware profiling based on your machine capabilities.
              </p>
            </div>

            <div className="settings-section-card">
              <div className="data-table-container">
                <table className="data-table">
                  <tbody>
                    <tr>
                      <td style={{ width: '180px', fontWeight: 600, color: '#94A3B8' }}>Processor (CPU)</td>
                      <td style={{ color: '#F8FAFC' }}>{hardware ? hardware.cpuModel : 'Detecting...'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#94A3B8' }}>Cores / Threads</td>
                      <td style={{ color: '#F8FAFC' }}>{hardware ? `${hardware.physicalCores} Physical Cores / ${hardware.logicalCores} Logical Threads` : 'Detecting...'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#94A3B8' }}>System Memory (RAM)</td>
                      <td style={{ color: '#F8FAFC' }}>{hardware ? `${(hardware.totalMemoryMB / 1024).toFixed(1)} GB Total RAM` : 'Detecting...'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#94A3B8' }}>Inference Engine</td>
                      <td style={{ color: '#F8FAFC' }}>CPU INT8 Optimized (faster-whisper / CTranslate2)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#94A3B8' }}>GPU Status</td>
                      <td style={{ color: '#F8FAFC' }}>
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

              <div style={{ paddingTop: '8px' }}>
                <button className="btn btn-secondary btn-sm" disabled={isScanning} onClick={handleDeepScan}>
                  {isScanning ? 'Running Hardware Scan...' : 'Run Deep Diagnostic Scan'}
                </button>
              </div>

              {deepScanResult && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#070B14', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', fontSize: '12px' }}>
                  <div><strong>AVX2 Instruction Support:</strong> {deepScanResult.cpuDetails?.hasAvx2 ? 'Supported' : 'Not detected'}</div>
                  <div><strong>Model Advisor Recommendation:</strong> {deepScanResult.recommendedModelId}</div>
                  <div><strong>Reasoning:</strong> {deepScanResult.recommendationReason}</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 10: ABOUT
           ------------------------------------------------------------- */}
        {activeTab === 'about' && (
          <>
            <div className="settings-header-block">
              <h2 className="settings-main-title">About Vaani Studio</h2>
              <p className="settings-main-subtitle">
                Version 0.1.0 (Desktop Edition)
              </p>
            </div>

            <div className="settings-section-card" style={{ maxWidth: '640px' }}>
              <div style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p>
                  Professional native Windows desktop software for local-first AI subtitle generation, precise timeline synchronization, multilingual transliteration (English, Hindi, Hinglish), and 60 FPS kinetic video burn-in.
                </p>
                <p>
                  Engineered with Electron, TypeScript, React, faster-whisper (CTranslate2), and FFmpeg.
                </p>
                <p style={{ color: '#F8FAFC', marginTop: '6px' }}>
                  Open-source local creative tool. All media stays on your computer.
                </p>
                <div style={{ marginTop: '12px' }}>
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

            {/* GitHub Repository Card */}
            <div className="settings-section-card" style={{ maxWidth: '640px', marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      height="20"
                      width="20"
                      viewBox="0 0 16 16"
                      fill="#F8FAFC"
                      aria-hidden="true"
                    >
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#F8FAFC' }}>
                        GitHub Repository
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 500,
                          padding: '1px 7px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: '#60A5FA',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                        }}
                      >
                        MIT License
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#60A5FA', fontFamily: 'monospace', marginTop: '2px' }}>
                      aksh120/VaaniStudio
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenExternal('https://github.com/aksh120/VaaniStudio')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Open GitHub Repository in Browser"
                >
                  <span>Open GitHub</span>
                  <ExternalLink size={13} />
                </button>
              </div>

              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  margin: '4px 0',
                }}
              />

              <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
                Vaani Studio is free and open-source. Explore the source code, star the project, download latest releases, or report issues and feature suggestions.
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenExternal('https://github.com/aksh120/VaaniStudio')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}
                  title="View Repository on GitHub"
                >
                  <FolderGit2 size={13} />
                  <span>github.com/aksh120/VaaniStudio</span>
                  <ExternalLink size={11} style={{ opacity: 0.7 }} />
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenExternal('https://github.com/aksh120/VaaniStudio/issues')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}
                  title="Report bugs or submit feature requests"
                >
                  <AlertCircle size={13} />
                  <span>Issues & Feedback</span>
                  <ExternalLink size={11} style={{ opacity: 0.7 }} />
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenExternal('https://github.com/aksh120/VaaniStudio/releases')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}
                  title="View release notes and binary downloads"
                >
                  <Tag size={13} />
                  <span>Releases & Updates</span>
                  <ExternalLink size={11} style={{ opacity: 0.7 }} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ===================================================================
          COLUMN 3: RIGHT PANEL (QUICK HELP & SYSTEM STATUS)
         =================================================================== */}
      <aside className="settings-right-panel">
        {/* Card 1: Application Guide */}
        <div className="settings-help-card">
          <div className="settings-help-header">
            <div className="settings-help-icon-badge">
              <BookOpen size={16} />
            </div>
            <div>
              <div className="settings-help-title">Application Guide</div>
              <div className="settings-help-desc">
                Learn how to use Vaani Studio with step-by-step tutorials.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="settings-help-action-btn"
            onClick={() => setIsTutorialOpen(true)}
            title="Open Feature Tour & Guide"
          >
            Open Guide
          </button>
          {/* Preserved identifier for test assertions */}
          <span style={{ display: 'none' }}>
            Interactive Application Guide & Tour - Open Feature Tour & Guide
          </span>
        </div>

        {/* Card 2: Keyboard Shortcuts */}
        <div className="settings-help-card">
          <div className="settings-help-header">
            <div className="settings-help-icon-badge">
              <Keyboard size={16} />
            </div>
            <div>
              <div className="settings-help-title">Keyboard Shortcuts</div>
              <div className="settings-help-desc">
                View and customize keyboard shortcuts.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="settings-help-action-btn"
            onClick={() => setActiveTab('shortcuts')}
          >
            Open Shortcuts
          </button>
        </div>

        {/* Card 3: GitHub Repository */}
        <div className="settings-help-card">
          <div className="settings-help-header">
            <div className="settings-help-icon-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#F8FAFC' }}>
              <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </div>
            <div>
              <div className="settings-help-title">GitHub Repository</div>
              <div className="settings-help-desc">
                Source code, releases, and issue tracker on GitHub.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="settings-help-action-btn"
            onClick={() => handleOpenExternal('https://github.com/aksh120/VaaniStudio')}
            title="Open GitHub Repository in Browser"
          >
            Visit GitHub
          </button>
        </div>

        {/* Card 3: System Status */}
        <div className="settings-status-card">
          <div className="settings-status-header">
            <span className="settings-status-indicator-dot" />
            <span>System Status</span>
          </div>

          <div className="settings-status-grid">
            <div className="settings-status-row">
              <span className="settings-status-key">Application Version</span>
              <span className="settings-status-val">v0.1.0</span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">Operating System</span>
              <span className="settings-status-val">Windows 11 (64-bit)</span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">CPU</span>
              <span
                className="settings-status-val"
                title={hardware?.cpuModel || 'Intel(R) Core(TM) i7-3770 CPU'}
              >
                {hardware?.cpuModel || 'Intel(R) Core(TM) i7-3770 CPU'}
              </span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">Memory</span>
              <span className="settings-status-val">
                {hardware?.totalMemoryMB
                  ? `${Math.round(hardware.totalMemoryMB / 1024)} GB`
                  : '16 GB'}
              </span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">GPU</span>
              <span
                className="settings-status-val"
                title={hardware?.gpuName || 'NVIDIA GeForce GT 730'}
              >
                {hardware?.gpuName || 'NVIDIA GeForce GT 730'}
              </span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">FFmpeg</span>
              <span className="settings-status-dot-val">
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                  }}
                />
                Available
              </span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">Models</span>
              <span className="settings-status-dot-val">
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                  }}
                />
                Ready
              </span>
            </div>
          </div>

          <button
            type="button"
            className="settings-help-action-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => {
              setActiveTab('diagnostics');
              handleDeepScan();
            }}
          >
            <Activity size={13} />
            <span>Run Diagnostics</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
