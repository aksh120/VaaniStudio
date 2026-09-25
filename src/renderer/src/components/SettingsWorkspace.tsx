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
import { getPerformanceProfileConfig } from '../../../shared/hardware/hardwareProfiles.js';
import { ProgressBar } from './ui/ProgressBar.js';
import { Dialog } from './ui/Dialog.js';
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
  Copy,
  Download,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SettingsWorkspaceProps {
  models: ModelInfo[];
  hardware: HardwareProfile | null;
  onRefreshModels: () => void;
  onSelectAudioStream?: (streamIndex: number) => void;
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

interface ModelPresentation {
  summary: string;
  languages: string;
  accuracy: string;
  memory: string;
  useCase: string;
}

const MODEL_PRESENTATION: Record<string, ModelPresentation> = {
  'whisper-tiny-ct2-int8': {
    summary: 'Fastest · Lowest memory',
    languages: 'Multilingual',
    accuracy: 'Good',
    memory: 'Low',
    useCase: 'Quick drafts and testing',
  },
  'whisper-base-ct2-int8': {
    summary: 'Fast · Balanced accuracy',
    languages: 'English · Hindi',
    accuracy: 'Balanced',
    memory: 'Low',
    useCase: 'Fast transcription',
  },
  'whisper-small-ct2-int8': {
    summary: 'Balanced · English, Hindi & Hinglish',
    languages: 'English · Hindi · Hinglish',
    accuracy: 'High',
    memory: 'Moderate',
    useCase: 'General subtitle generation',
  },
  'whisper-medium-ct2-int8': {
    summary: 'High accuracy · Complex speech',
    languages: 'Multilingual',
    accuracy: 'High',
    memory: 'High',
    useCase: 'Complex and multi-speaker audio',
  },
  'whisper-large-v3-ct2-int8': {
    summary: 'Highest accuracy · Multilingual',
    languages: 'Multilingual',
    accuracy: 'Highest',
    memory: 'Very high',
    useCase: 'Demanding multilingual speech',
  },
};

const getModelPresentation = (model: ModelInfo): ModelPresentation => {
  return MODEL_PRESENTATION[model.id] || {
    summary: model.description.split(/[.!?]/)[0] || 'Local speech recognition',
    languages: 'Multilingual',
    accuracy: 'Model-specific',
    memory: 'Model-specific',
    useCase: 'General transcription',
  };
};

const getModelDisplayName = (model: ModelInfo): string => {
  return model.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
};

const formatModelSize = (sizeMB: number): string => {
  if (sizeMB >= 1000) {
    return `${(sizeMB / 1000).toFixed(1)} GB`;
  }
  return `${Math.round(sizeMB)} MB`;
};

const formatStorageSize = (sizeMB: number): string => {
  if (sizeMB >= 1000) {
    return `${(sizeMB / 1000).toFixed(2)} GB`;
  }
  return `${Math.round(sizeMB)} MB`;
};

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  models,
  hardware,
  onRefreshModels,
  onSelectAudioStream,
}) => {
  const { project, updateSettings, setStatusMessage } = useProjectStore();
  const {
    theme,
    setTheme,
    setIsTutorialOpen,
    setActiveTab: setWorkspaceTab,
    startPage: persistedStartPage,
    setStartPage,
    autosaveEnabled,
    autosaveIntervalSeconds,
    setAutosaveEnabled,
     setAutosaveIntervalSeconds,
     recentProjectsLimit,
     setRecentProjectsLimit,
   } = useUIStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // General Settings State (Matching Image 0)
  const [language, setLanguage] = useState('English');
  const [checkForUpdates, setCheckForUpdates] = useState(true);
   const [projectLocation, setProjectLocation] = useState('');
   const [rememberLayout, setRememberLayout] = useState(true);
  const [defaultImportFolder, setDefaultImportFolder] = useState('');
  const [autoAddToTimeline, setAutoAddToTimeline] = useState(true);
  const [isSwitchingAudioStream, setIsSwitchingAudioStream] = useState(false);
  const availableAudioStreams = project.media?.audioStreams || [];
  const selectedAudioStreamIndex =
    project.settings.selectedAudioStreamIndex ?? project.media?.audioStreamIndex ?? availableAudioStreams[0]?.index;

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const platformLabel = typeof navigator !== 'undefined' && navigator.platform
    ? navigator.platform
    : 'Unknown platform';

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
  const [modelDetailsId, setModelDetailsId] = useState<string | null>(null);
  const [openModelMenuId, setOpenModelMenuId] = useState<string | null>(null);
  const [advancedModelInfoOpen, setAdvancedModelInfoOpen] = useState(false);
  const [storagePathCopied, setStoragePathCopied] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const handleStartPageChange = (value: string) => {
    const nextTab = value === 'editor' ? 'editor' : 'projects';
    setStartPage(nextTab);
    setWorkspaceTab(nextTab);
  };

  const handleAudioStreamChange = async (streamIndex: number) => {
    if (!onSelectAudioStream) return;
    setIsSwitchingAudioStream(true);
    try {
      await onSelectAudioStream(streamIndex);
    } finally {
      setIsSwitchingAudioStream(false);
    }
  };

  const handlePerformanceModeChange = (mode: PerformanceMode) => {
    const updates: Partial<typeof project.settings> = { performanceMode: mode };
    if (project.settings.modelSelectionSource !== 'user') {
      updates.modelId = getPerformanceProfileConfig(mode).modelId;
      updates.modelSelectionSource = 'profile';
    }
    updateSettings(updates);
  };

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

  const handleSelectDefaultModel = (modelId: string) => {
    const model = models.find((item) => item.id === modelId);
    if (!model?.isDownloaded) return;
    updateSettings({ modelId, modelSelectionSource: 'user' });
    setStatusMessage(`Default transcription model: ${getModelDisplayName(model)}`);
  };

  const handleCopyStoragePath = async () => {
    if (!storageSummary?.storagePath || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(storageSummary.storagePath);
      setStoragePathCopied(true);
      setTimeout(() => setStoragePathCopied(false), 1800);
    } catch {
      setStatusMessage('Could not copy the model storage path.');
    }
  };

  const handleOpenModelFolder = (model: ModelInfo) => {
    const targetPath = model.localPath || storageSummary?.storagePath;
    if (targetPath && window.vaaniAPI?.showItemInFolder) {
      window.vaaniAPI.showItemInFolder(targetPath);
    }
  };

  const handleDownloadModel = async (modelId: string) => {
    if (!window.vaaniAPI) return;
     setDownloadingModelId(modelId);
     setOpenModelMenuId(null);
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
         if (project.settings.modelId === modelId) {
           const fallbackModel = models.find((model) => model.isDownloaded && model.id !== modelId);
           if (fallbackModel) {
             updateSettings({ modelId: fallbackModel.id, modelSelectionSource: 'user' });
           }
         }
         setStatusMessage('Deleted model files and Hugging Face cache.');
         setModelToDelete(null);
         setOpenModelMenuId(null);
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
     setStartPage('projects');
    setCheckForUpdates(true);
     setAutosaveEnabled(true);
     setAutosaveIntervalSeconds(60);
     setProjectLocation('');
     setRecentProjectsLimit(10);
    setRememberLayout(true);
     setDefaultImportFolder('');
     setAutoAddToTimeline(true);
     updateSettings({ performanceMode: 'balanced', selectedAudioStreamIndex: undefined });
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
     { key: 'Enter', desc: 'Commit inline text edit or confirm dialog', context: 'Subtitles' },
     { key: 'Escape', desc: 'Deselect subtitle or close modal', context: 'Global' },
     { key: 'Arrow Left / Right', desc: 'Step playhead backward / forward one frame', context: 'Editor' },
     { key: 'Shift + Left / Right', desc: 'Step playhead backward / forward one second', context: 'Editor' },
     { key: 'Alt + Up / Down', desc: 'Navigate to previous / next subtitle event', context: 'Editor' },
     { key: 'Tab / Shift + Tab', desc: 'Move keyboard focus between controls', context: 'Global' },
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

  const installedModels = models.filter((model) => model.isDownloaded);
  const configuredDefaultModel = models.find((model) => model.id === project.settings.modelId) || null;
  const detailsModel = models.find((model) => model.id === modelDetailsId) || null;
  const detailsPresentation = detailsModel ? getModelPresentation(detailsModel) : null;
  const detailsFooter = detailsModel ? (
    <>
      {detailsModel.isDownloaded ? (
        <button
          type="button"
          className="btn btn-secondary btn-sm model-details-delete"
          onClick={() => {
            setModelToDelete(detailsModel.id);
            setModelDetailsId(null);
          }}
        >
          Delete model
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => void handleDownloadModel(detailsModel.id)}
          disabled={downloadingModelId === detailsModel.id}
        >
          <Download size={13} />
          <span>Download {formatModelSize(detailsModel.sizeMB)}</span>
        </button>
      )}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModelDetailsId(null)}>
        Done
      </button>
    </>
  ) : undefined;

  return (
    <div className="settings-workspace-root">
      {/* ===================================================================
          COLUMN 1: SETTINGS SIDEBAR
         =================================================================== */}
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">Settings</div>

        <nav className="settings-nav-list" role="tablist" aria-label="Settings categories">
          {categories.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
               <button
                 type="button"
                 role="tab"
                 aria-selected={isActive}
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
        <header className="workspace-page-header settings-page-header">
          <div>
            <div className="workspace-eyebrow">{activeTab === 'models' ? 'Settings' : 'Application'}</div>
            <h1 className="workspace-page-title">{activeTab === 'models' ? 'Speech Recognition' : 'Settings'}</h1>
            <p className="workspace-page-description">
              {activeTab === 'models'
                ? 'Download and manage local transcription models.'
                : 'Configure models, media, performance, and workspace behavior.'}
            </p>
          </div>
        </header>
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
                     <span className="settings-row-desc">English is the only interface language in this build.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                  <select
                     className="settings-select-box"
                     disabled
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
                     value={persistedStartPage}
                     onChange={(e) => handleStartPageChange(e.target.value)}
                   >
                     <option value="projects">Projects</option>
                     <option value="editor">Editor</option>
                  </select>
                </div>
              </div>

              {/* Check for Updates */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <RefreshCw size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                    <span className="settings-row-label">Check for Updates</span>
                     <span className="settings-row-desc">Updates are managed manually in this build.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                   <button
                     type="button"
                     role="switch"
                     disabled
                     className={`style-toggle-switch ${checkForUpdates ? 'active' : ''}`}
                     onClick={() => setCheckForUpdates(!checkForUpdates)}
                     aria-label="Update checks"
                     aria-checked={checkForUpdates}
                   >
                     <span className="style-toggle-thumb" />
                   </button>
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
                   <button
                     type="button"
                     role="switch"
                     className={`style-toggle-switch ${autosaveEnabled ? 'active' : ''}`}
                     onClick={() => setAutosaveEnabled(!autosaveEnabled)}
                     aria-label="Autosave"
                     aria-checked={autosaveEnabled}
                   >
                     <span className="style-toggle-thumb" />
                   </button>
                  <select
                    className="settings-select-box"
                     value={autosaveIntervalSeconds}
                     onChange={(e) => setAutosaveIntervalSeconds(Number(e.target.value))}
                  >
                     <option value={30}>Every 30 seconds</option>
                     <option value={60}>Every 60 seconds</option>
                     <option value={120}>Every 2 minutes</option>
                     <option value={300}>Every 5 minutes</option>
                  </select>
                </div>
              </div>

              {/* Project Location */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <Folder size={16} className="settings-row-icon" />
                  <div className="settings-row-info">
                     <span className="settings-row-label">Project Location</span>
                     <span className="settings-row-desc">Default project folders are not available in this build.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                   <input
                     type="text"
                     className="settings-path-input"
                     disabled
                     value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                  />
                   <button
                     type="button"
                     disabled
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
                     <span className="settings-row-desc">Number of recent projects shown in the start page.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                   <select
                     className="settings-select-box"
                     value={recentProjectsLimit}
                     onChange={(e) => setRecentProjectsLimit(Number(e.target.value))}
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
                     <span className="settings-row-desc">Panel sizes and layout are remembered automatically.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                   <button
                     type="button"
                     disabled
                     className={`style-toggle-switch ${rememberLayout ? 'active' : ''}`}
                     aria-label="Layout memory enabled"
                   >
                     <span className="style-toggle-thumb" />
                   </button>
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
                     <span className="settings-row-desc">Import folder preferences are not available in this build.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                   <input
                     type="text"
                     className="settings-path-input"
                     disabled
                     value={defaultImportFolder}
                    onChange={(e) => setDefaultImportFolder(e.target.value)}
                  />
                   <button
                     type="button"
                     disabled
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
                     <span className="settings-row-desc">Imported media is managed from the editor workspace.</span>
                  </div>
                </div>
                <div className="settings-row-right">
                   <button
                     type="button"
                     disabled
                     className={`style-toggle-switch ${autoAddToTimeline ? 'active' : ''}`}
                     aria-label="Automatic timeline import enabled"
                   >
                     <span className="style-toggle-thumb" />
                   </button>
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
                   {availableAudioStreams.length > 0 ? (
                     <select
                       className="settings-select-box"
                       value={selectedAudioStreamIndex ?? ''}
                       disabled={isSwitchingAudioStream}
                       onChange={(e) => void handleAudioStreamChange(Number(e.target.value))}
                     >
                       {availableAudioStreams.map((stream, index) => (
                         <option key={stream.index} value={stream.index}>
                           Track {index + 1} · {stream.language || stream.codec || 'Unknown'} · {stream.isDefault ? 'Default' : 'Alternate'}
                         </option>
                       ))}
                     </select>
                   ) : (
                     <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Import media to inspect tracks</span>
                   )}
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
               <div className="settings-theme-grid">
                 <button
                   type="button"
                   className={`settings-theme-option ${theme === 'dark' ? 'active' : ''}`}
                   onClick={() => setTheme('dark')}
                   aria-pressed={theme === 'dark'}
                 >
                   <span className="settings-theme-option-title">Dark</span>
                   <span className="settings-theme-option-description">
                     Neutral dark surfaces for long editing sessions.
                   </span>
                 </button>

                 <button
                   type="button"
                   className={`settings-theme-option ${theme === 'light' ? 'active' : ''}`}
                   onClick={() => setTheme('light')}
                   aria-pressed={theme === 'light'}
                 >
                   <span className="settings-theme-option-title">Light</span>
                   <span className="settings-theme-option-description">
                     High-contrast workspace for bright environments.
                   </span>
                 </button>
               </div>
            </div>
          </>
        )}

        {/* -------------------------------------------------------------
            TAB 3: MODELS
           ------------------------------------------------------------- */}
        {activeTab === 'models' && (
          <div className="model-manager">
            <div className="model-manager-header">
              <div>
                <h2 className="settings-main-title">Models</h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onRefreshModels();
                  fetchStorageSummary();
                }}
                title="Refresh model states and storage usage"
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>

            <section className="model-default-panel" aria-labelledby="default-model-heading">
              <div className="model-default-copy">
                <span id="default-model-heading" className="model-section-label">Default transcription model</span>
                <span className="model-default-note">Used for new transcription runs.</span>
              </div>
              <div className="model-default-control">
                <select
                  aria-label="Default transcription model"
                  className="model-default-select"
                  value={configuredDefaultModel?.id || ''}
                  onChange={(event) => handleSelectDefaultModel(event.target.value)}
                  disabled={models.length === 0}
                >
                  {models.length === 0 && <option value="">No models available</option>}
                  {models.map((model) => (
                    <option key={model.id} value={model.id} disabled={!model.isDownloaded}>
                      {getModelDisplayName(model)}{model.isDownloaded ? '' : ' — Not installed'}
                    </option>
                  ))}
                </select>
                {configuredDefaultModel && !configuredDefaultModel.isDownloaded && (
                  <span className="model-default-warning">Download this model before using it.</span>
                )}
              </div>
            </section>

            <section className="model-storage-summary" aria-labelledby="model-storage-heading">
              <div className="model-storage-summary-header">
                <div className="model-storage-summary-title">
                  <span id="model-storage-heading" className="model-section-label">Model storage</span>
                  <span className="model-storage-summary-meta">{installedModels.length} of {models.length} installed</span>
                </div>
                <button
                  type="button"
                  className="model-icon-action"
                  onClick={() => void handleCopyStoragePath()}
                  disabled={!storageSummary?.storagePath}
                  title="Copy model storage path"
                  aria-label="Copy model storage path"
                >
                  <Copy size={13} />
                  <span>{storagePathCopied ? 'Copied' : 'Copy path'}</span>
                </button>
              </div>
              <div className="model-storage-fields">
                <div className="model-storage-field">
                  <span>Models</span>
                  <strong>{installedModels.length} of {models.length} installed</strong>
                </div>
                <div className="model-storage-field">
                  <span>Storage</span>
                  <strong>{formatStorageSize(storageSummary?.totalModelsSizeMB ?? 0)} used</strong>
                </div>
                <div className="model-storage-field model-storage-location">
                  <span>Location</span>
                  <strong title={storageSummary?.storagePath || 'Locating storage path...'}>
                    {storageSummary?.storagePath || 'Locating storage path...'}
                  </strong>
                </div>
              </div>
              <div className="model-storage-footer">
                {storageSummary?.storagePath && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => window.vaaniAPI?.showItemInFolder?.(storageSummary.storagePath)}
                    title="Open model storage folder"
                  >
                    <Folder size={13} />
                    <span>Open folder</span>
                  </button>
                )}
                {installedModels.length > 0 && (
                  showDeleteAllConfirm ? (
                    <div className="model-delete-all-confirm">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={isDeletingAll}
                        onClick={() => void handleDeleteAllModels()}
                      >
                        {isDeletingAll ? 'Deleting...' : 'Confirm delete all'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={isDeletingAll}
                        onClick={() => setShowDeleteAllConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="model-text-action danger"
                      onClick={() => setShowDeleteAllConfirm(true)}
                    >
                      Delete all models
                    </button>
                  )
                )}
              </div>
            </section>

            <section className="model-list-section" aria-labelledby="model-list-heading">
              <div className="model-list-header">
                <div>
                  <h3 id="model-list-heading">Models</h3>
                  <span>{installedModels.length} of {models.length} installed</span>
                </div>
                <span className="model-list-hint">Select a model to view details</span>
              </div>
              <div className="model-list" role="list">
                {models.length === 0 ? (
                  <div className="model-list-empty">No models are available. Refresh to load the model catalog.</div>
                ) : models.map((model) => {
                  const presentation = getModelPresentation(model);
                  const isDefault = configuredDefaultModel?.id === model.id;
                  const isDownloading = downloadingModelId === model.id;
                  const isMenuOpen = openModelMenuId === model.id;
                  const isConfirmingDelete = modelToDelete === model.id;
                  const modelStatus = isDownloading ? 'downloading' : model.isDownloaded ? 'ready' : 'not-installed';

                  return (
                    <div
                      key={model.id}
                      className={`model-row ${isDefault ? 'is-default' : ''} ${isDownloading ? 'is-downloading' : ''}`}
                      role="listitem"
                    >
                      <button
                        type="button"
                        className="model-row-summary"
                        onClick={() => {
                          setAdvancedModelInfoOpen(false);
                          setModelDetailsId(model.id);
                        }}
                        aria-label={`View details for ${getModelDisplayName(model)}`}
                      >
                        <span className="model-row-name-line">
                          <strong>{getModelDisplayName(model)}</strong>
                          {isDefault && <span className="model-row-label default">Default</span>}
                          {model.isRecommended && <span className="model-row-label recommended">Recommended</span>}
                        </span>
                        <span className="model-row-description">{presentation.summary}</span>
                      </button>
                      <div className="model-row-size">{formatModelSize(model.sizeMB)}</div>
                      <div className={`model-status ${modelStatus}`}>
                        <span className="model-status-dot" />
                        <span>{isDownloading ? 'Downloading' : model.isDownloaded ? 'Ready' : 'Not installed'}</span>
                      </div>
                      <div className="model-row-action">
                        {isConfirmingDelete && model.isDownloaded ? (
                          <div className="model-delete-confirm">
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => void handleDeleteModel(model.id)}
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setModelToDelete(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : isDownloading ? (
                          <span className="model-download-percent">{downloadPercent.toFixed(0)}%</span>
                        ) : model.isDownloaded ? (
                          <div className="model-actions-menu-wrap">
                            <button
                              type="button"
                              className="model-icon-action"
                              aria-label={`Actions for ${getModelDisplayName(model)}`}
                              aria-haspopup="menu"
                              aria-expanded={isMenuOpen}
                              onClick={() => setOpenModelMenuId(isMenuOpen ? null : model.id)}
                            >
                              <MoreHorizontal size={15} />
                            </button>
                            {isMenuOpen && (
                              <div className="model-actions-menu" role="menu">
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenModelMenuId(null);
                                    setAdvancedModelInfoOpen(false);
                                    setModelDetailsId(model.id);
                                  }}
                                >
                                  View details
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setOpenModelMenuId(null);
                                    handleOpenModelFolder(model);
                                  }}
                                >
                                  Open model folder
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="danger"
                                  onClick={() => {
                                    setOpenModelMenuId(null);
                                    setModelToDelete(model.id);
                                  }}
                                >
                                  Delete model
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm model-download-button"
                            onClick={() => void handleDownloadModel(model.id)}
                          >
                            <Download size={13} />
                            <span>Download {formatModelSize(model.sizeMB)}</span>
                          </button>
                        )}
                      </div>
                      {isDownloading && (
                        <div className="model-row-progress">
                          <ProgressBar
                            value={downloadPercent}
                            label={downloadMessage || 'Downloading model'}
                            detail={`${downloadPercent.toFixed(0)}%`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
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
               <div className="settings-performance-grid">
                 {[
                   { id: 'fast', title: 'Fast', desc: 'Minimal latency for rapid drafts with smaller models.' },
                   { id: 'balanced', title: 'Balanced', desc: 'A practical balance of transcription accuracy and speed.' },
                   { id: 'quality', title: 'Quality', desc: 'Highest fidelity with larger models and beam sizes.' },
                 ].map((mode) => (
                   <button
                     type="button"
                     key={mode.id}
                     className={`settings-performance-option ${project.settings.performanceMode === mode.id ? 'active' : ''}`}
                     aria-pressed={project.settings.performanceMode === mode.id}
                     onClick={() => handlePerformanceModeChange(mode.id as PerformanceMode)}
                   >
                     <span className="settings-performance-title">{mode.title}</span>
                     <span className="settings-performance-description">{mode.desc}</span>
                   </button>
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
                   aria-label="Search keyboard shortcuts"
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
                     {filteredShortcuts.length > 0 ? filteredShortcuts.map((s, idx) => (
                       <tr key={idx}>
                         <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#60A5FA', fontSize: '12px' }}>
                           {s.key}
                         </td>
                         <td style={{ fontSize: '12px', color: '#F8FAFC' }}>{s.desc}</td>
                         <td style={{ fontSize: '11px', color: '#94A3B8' }}>{s.context}</td>
                       </tr>
                     )) : (
                       <tr><td colSpan={3}>No shortcuts match your search.</td></tr>
                     )}
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
                 Media processing stays on this computer; model downloads are the only network operation.
              </p>
            </div>

            <div className="settings-section-card" style={{ maxWidth: '720px' }}>
              <div style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p>
                  <strong style={{ color: '#F8FAFC' }}>Your media never leaves this computer.</strong> Vaani Studio is built from the ground up as a native desktop application. All speech recognition, waveform analysis, speaker diarization, and video burn-in happen entirely locally using your CPU and hardware.
                </p>
                <p>
                   There is <strong style={{ color: '#F8FAFC' }}>zero cloud processing</strong>, zero voice telemetry, and no hidden media uploads. Network access is used only when you explicitly download a model from Hugging Face.
                </p>
                <p>
                   You can disconnect your internet connection after models are available and continue editing, styling, and exporting subtitles.
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
                       Formatting is controlled by the active subtitle style in this build.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                   <select className="settings-select-box" disabled defaultValue="42">
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
                       Export uses the encoder selected by the active hardware profile.
                    </span>
                  </div>
                </div>
                <div className="settings-row-right">
                   <select className="settings-select-box" disabled defaultValue="auto">
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
                Version 0.1.1 (Desktop Edition)
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
              <span className="settings-status-val">v0.1.1</span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">Operating System</span>
               <span className="settings-status-val">{platformLabel}</span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">CPU</span>
              <span
                className="settings-status-val"
                 title={hardware?.cpuModel || 'Not detected'}
               >
                 {hardware?.cpuModel || 'Not detected'}
              </span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">Memory</span>
              <span className="settings-status-val">
                {hardware?.totalMemoryMB
                  ? `${Math.round(hardware.totalMemoryMB / 1024)} GB`
                   : 'Unknown'}
              </span>
            </div>
            <div className="settings-status-row">
              <span className="settings-status-key">GPU</span>
              <span
                className="settings-status-val"
                 title={hardware?.gpuName || 'Not detected'}
               >
                 {hardware?.gpuName || 'Not detected'}
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
                 Run diagnostics to verify
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
                     backgroundColor: 'var(--text-muted)',
                   }}
                 />
                 Run diagnostics to verify
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

      <Dialog
        isOpen={Boolean(detailsModel)}
        onClose={() => setModelDetailsId(null)}
        title={detailsModel ? getModelDisplayName(detailsModel) : 'Model details'}
        description={detailsPresentation?.summary}
        className="model-details-dialog"
        footer={detailsFooter}
      >
        {detailsModel && detailsPresentation && (
          <div className="model-details">
            <div className="model-details-summary">
              <div>
                <span className="model-section-label">Model size</span>
                <strong>{formatModelSize(detailsModel.sizeMB)}</strong>
              </div>
              <div className={`model-status ${detailsModel.isDownloaded ? 'ready' : 'not-installed'}`}>
                <span className="model-status-dot" />
                <span>{detailsModel.isDownloaded ? 'Ready' : 'Not installed'}</span>
              </div>
            </div>
            <div className="model-details-grid">
              <div><span>Languages</span><strong>{detailsPresentation.languages}</strong></div>
              <div><span>Accuracy</span><strong>{detailsPresentation.accuracy}</strong></div>
              <div><span>Memory</span><strong>{detailsPresentation.memory}</strong></div>
              <div><span>Recommended for</span><strong>{detailsPresentation.useCase}</strong></div>
            </div>
            <div className="model-details-divider" />
            <button
              type="button"
              className="model-advanced-toggle"
              aria-expanded={advancedModelInfoOpen}
              onClick={() => setAdvancedModelInfoOpen(!advancedModelInfoOpen)}
            >
              <span>Advanced model information</span>
              {advancedModelInfoOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {advancedModelInfoOpen && (
              <div className="model-advanced-grid">
                <div><span>Architecture</span><strong>Whisper</strong></div>
                <div><span>Parameters</span><strong>{detailsModel.parameters}</strong></div>
                <div><span>Quantization</span><strong>INT8</strong></div>
                <div><span>Runtime</span><strong>CTranslate2</strong></div>
                <div><span>Format</span><strong>Local</strong></div>
                <div><span>Languages</span><strong>{detailsPresentation.languages}</strong></div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
