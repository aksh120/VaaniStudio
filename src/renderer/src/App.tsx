import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useProjectStore } from './store/projectStore.js';
import { useUIStore } from './store/uiStore.js';
import {
  ScriptMode,
  ModelInfo,
  SubtitleEvent,
  CrashRecoveryEntry,
} from '../../shared/types/models.js';
import { transformScript } from '../../shared/intelligence/transliteration.js';
import { normalizeSubtitleEvent } from '../../shared/intelligence/textNormalizer.js';
import { createEmptyProject } from '../../shared/defaults.js';
import { AspectRatioMode } from './components/VideoPlayerPreview.js';
import { HistoryManager } from './editor/historyManager.js';
import { ShortcutManager } from './editor/shortcutManager.js';
import {
  splitAtPlayhead,
  mergeSubtitles,
  insertSubtitle,
  duplicateSubtitle,
  deleteSubtitle,
  updateSubtitleText,
  updateSubtitleTiming,
  searchAndReplace,
  SearchReplaceOptions,
} from './editor/editorOperations.js';
import { PresetManager } from './editor/presetManager.js';
import { ActionableErrorModal } from './components/ActionableErrorModal.js';
import { CrashRecoveryBanner } from './components/CrashRecoveryBanner.js';
import { BatchQueueModal } from './components/BatchQueueModal.js';
import { translateError } from '../../shared/errors/errorTranslator.js';
import {
  Folder,
  Edit3,
  Captions,
  Palette,
  FileUp,
  Settings as SettingsIcon,
  Sparkles,
  ChevronDown,
  Keyboard,
  BookOpen,
  Moon,
  Sun,
  Minus,
  Square,
  X as CloseIcon,
  Upload,
} from 'lucide-react';

// Dedicated Workspace Views
import { ProjectsView } from './components/ProjectsView.js';
import { EditorWorkspace } from './components/EditorWorkspace.js';
import { SubtitlesWorkspace } from './components/SubtitlesWorkspace.js';
import { StyleWorkspace } from './components/StyleWorkspace.js';
import { ExportWorkspace } from './components/ExportWorkspace.js';
import { SettingsWorkspace } from './components/SettingsWorkspace.js';
import { GenerateSubtitlesDialog } from './components/GenerateSubtitlesDialog.js';
import { TutorialDialog } from './components/TutorialDialog.js';
import { HelpDialog } from './components/HelpDialog.js';

export const App: React.FC = () => {
  const {
    project,
    hardware,
    audioWavPath,
    currentTime,
    selectedEventId,
    setHardware,
    setMedia,
    setAudioWavPath,
    setWaveformData,
    setEvents,
    selectEvent,
    setCurrentTime,
    updateSettings,
    statusMessage,
    setStatusMessage,
    loadProjectData,
    isDirty,
    currentProjectFilePath,
    lastSavedAt,
    activeError,
    crashRecoveries,
    setIsDirty,
    setProjectFilePath,
    setLastSavedAt,
    setActiveError,
    setCrashRecoveries,
    dismissCrashRecovery,
  } = useProjectStore();

  const {
    activeTab,
    theme,
    isGenerateModalOpen,
    isTutorialOpen,
    isHelpOpen,
    tutorialCompleted,
    openInEditorAfterGeneration,
    setActiveTab,
    toggleTheme,
    setIsGenerateModalOpen,
    setIsTutorialOpen,
    setIsHelpOpen,
    addRecentProject,
  } = useUIStore();

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('whisper-small-ct2-int8');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('original');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // First-run automatic tutorial trigger
  const hasCheckedTutorialRef = useRef<boolean>(false);
  useEffect(() => {
    if (!hasCheckedTutorialRef.current) {
      hasCheckedTutorialRef.current = true;
      if (!tutorialCompleted) {
        setIsTutorialOpen(true);
      }
    }
  }, [tutorialCompleted, setIsTutorialOpen]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isDiarizing, setIsDiarizing] = useState<boolean>(false);

  // Preset Manager instance
  const presetManager = useMemo(() => new PresetManager(), []);

  // Undo / Redo History Stack
  const historyRef = useRef<HistoryManager<SubtitleEvent[]>>(
    new HistoryManager<SubtitleEvent[]>(project.events)
  );
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const syncHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

  const commitEvents = useCallback(
    (newEvents: SubtitleEvent[]) => {
      historyRef.current.pushState(newEvents);
      setEvents(newEvents);
      syncHistoryState();
    },
    [setEvents, syncHistoryState]
  );

  const handleUndo = useCallback(() => {
    const prev = historyRef.current.undo();
    if (prev) {
      setEvents(prev);
      syncHistoryState();
      setStatusMessage('Undone last edit.');
    }
  }, [setEvents, syncHistoryState, setStatusMessage]);

  const handleRedo = useCallback(() => {
    const next = historyRef.current.redo();
    if (next) {
      setEvents(next);
      syncHistoryState();
      setStatusMessage('Redone last edit.');
    }
  }, [setEvents, syncHistoryState, setStatusMessage]);

  const duration = Math.max(
    project.media?.durationSeconds || 0,
    project.events.reduce((acc, cur) => Math.max(acc, cur.endTime), 0),
    0
  );

  // Active subtitle helper
  const activeSubtitle = useMemo(() => {
    return (
      project.events.find(
        (e) => currentTime >= e.startTime && currentTime <= e.endTime
      ) || null
    );
  }, [project.events, currentTime]);

  // Window Caption Controls
  const handleMinimize = useCallback(() => {
    window.vaaniAPI?.minimizeWindow();
  }, []);

  const handleMaximize = useCallback(() => {
    window.vaaniAPI?.maximizeWindow();
  }, []);

  const handleClose = useCallback(() => {
    window.vaaniAPI?.closeWindow();
  }, []);

  // Load models catalog
  const refreshModels = useCallback(async () => {
    if (window.vaaniAPI) {
      const res = await window.vaaniAPI.getModels();
      if (res.success && res.data) {
        setModels(res.data);
      }
    }
  }, []);

  // Initial Hardware & Setup inspection
  useEffect(() => {
    // Sync data-theme on mount
    document.documentElement.setAttribute('data-theme', theme);

    if (window.vaaniAPI) {
      window.vaaniAPI.getHardwareProfile().then((res) => {
        if (res.success && res.data) {
          setHardware(res.data);
        }
      });
      refreshModels();

      if (window.vaaniAPI.checkOnboardingStatus) {
        window.vaaniAPI.checkOnboardingStatus().then((res) => {
          if (res.success && res.data) {
            if (res.data.recommendedModelId) {
              setSelectedModelId(res.data.recommendedModelId);
            }
          }
        });
      }

      if (window.vaaniAPI.getCustomPresets) {
        window.vaaniAPI.getCustomPresets().then((res) => {
          if (res.success && res.data) {
            for (const p of res.data) {
              if (!presetManager.getPresetById(p.id)) {
                presetManager.saveCustomPreset(p.name, p.description, p.style);
              }
            }
          }
        });
      }

      const cleanupProgress = window.vaaniAPI.onProgress((prog) => {
        setStatusMessage(prog.message);
        if (prog.stage === 'transcribing') {
          setTranscriptionProgress(prog.percent);
        }
      });

      return () => cleanupProgress();
    }
  }, [setHardware, setStatusMessage, refreshModels, presetManager, theme, tutorialCompleted, setIsTutorialOpen]);

  // Editor operations
  const handleSplitAtPlayhead = useCallback(() => {
    const targetId = selectedEventId || activeSubtitle?.id;
    if (!targetId) {
      setStatusMessage('Move playhead over an event or select a subtitle to split.');
      return;
    }
    const updated = splitAtPlayhead(project.events, targetId, currentTime);
    if (updated !== project.events) {
      commitEvents(updated);
      setStatusMessage(`Split subtitle at ${currentTime.toFixed(2)}s.`);
    }
  }, [selectedEventId, activeSubtitle, project.events, currentTime, commitEvents, setStatusMessage]);

  const handleMergeWithNext = useCallback(() => {
    if (!selectedEventId) return;
    const idx = project.events.findIndex((e) => e.id === selectedEventId);
    if (idx !== -1 && idx < project.events.length - 1) {
      const nextEvt = project.events[idx + 1];
      const updated = mergeSubtitles(project.events, selectedEventId, nextEvt.id);
      commitEvents(updated);
      setStatusMessage('Merged subtitle with adjacent segment.');
    }
  }, [selectedEventId, project.events, commitEvents, setStatusMessage]);

  const handleInsertSubtitle = useCallback(() => {
    const updated = insertSubtitle(
      project.events,
      selectedEventId,
      currentTime > 0 ? currentTime : undefined,
      2.0,
      'New Subtitle'
    );
    commitEvents(updated);
    setStatusMessage('Inserted new subtitle event.');
  }, [project.events, selectedEventId, currentTime, commitEvents, setStatusMessage]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedEventId) return;
    const updated = duplicateSubtitle(project.events, selectedEventId);
    commitEvents(updated);
    setStatusMessage('Duplicated subtitle event.');
  }, [selectedEventId, project.events, commitEvents, setStatusMessage]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedEventId) return;
    const updated = deleteSubtitle(project.events, selectedEventId);
    commitEvents(updated);
    selectEvent(null);
    setStatusMessage('Deleted subtitle event.');
  }, [selectedEventId, project.events, commitEvents, selectEvent, setStatusMessage]);

  const handleUpdateText = useCallback(
    (id: string, text: string) => {
      const updated = updateSubtitleText(project.events, id, text);
      commitEvents(updated);
    },
    [project.events, commitEvents]
  );

  const handleUpdateTiming = useCallback(
    (id: string, startTime: number, endTime: number) => {
      const updated = updateSubtitleTiming(project.events, id, startTime, endTime);
      commitEvents(updated);
    },
    [project.events, commitEvents]
  );

  const handleSearchReplace = useCallback(
    (search: string, replace: string, options: SearchReplaceOptions) => {
      const res = searchAndReplace(project.events, search, replace, options);
      if (res.replacedCount > 0) {
        commitEvents(res.events);
        setStatusMessage(`Replaced ${res.replacedCount} occurrences across subtitles.`);
      } else {
        setStatusMessage('No matching occurrences found.');
      }
    },
    [project.events, commitEvents, setStatusMessage]
  );

  const handleUpdateSpeaker = useCallback(
    (id: string, newSpeaker: string) => {
      const updated = project.events.map((ev) => {
        if (ev.id === id) {
          return { ...ev, speakerLabel: newSpeaker };
        }
        return ev;
      });
      commitEvents(updated);
      setIsDirty(true);
      setStatusMessage(`Updated speaker to "${newSpeaker}".`);
    },
    [project.events, commitEvents, setIsDirty, setStatusMessage]
  );

  const handleDiarizeSpeakers = async () => {
    if (!window.vaaniAPI || !audioWavPath || project.events.length === 0) return;
    setIsDiarizing(true);
    setStatusMessage('Diarizing speakers from audio track...');
    try {
      const res = await window.vaaniAPI.diarizeSubtitles({
        audioPath: audioWavPath,
        events: project.events,
      });
      if (res.success && res.data) {
        commitEvents(res.data.events);
        setIsDirty(true);
        setStatusMessage(
          `Diarization complete: ${res.data.speakers.length} speakers identified.`
        );
      } else {
        setStatusMessage(`Diarization failed: ${res.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Diarization error: ${err?.message || err}`);
    } finally {
      setIsDiarizing(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const shortcutManager = new ShortcutManager({
      onTogglePlayPause: () => setIsPlaying((p) => !p),
      onUndo: handleUndo,
      onRedo: handleRedo,
      onSplit: handleSplitAtPlayhead,
      onMerge: handleMergeWithNext,
      onDelete: handleDeleteSelected,
      onStepFrame: (dir) => {
        const step = dir * (1 / 30);
        setCurrentTime(Math.max(0, Math.min(duration, currentTime + step)));
      },
      onStepSecond: (dir) => {
        const step = dir * 1.0;
        setCurrentTime(Math.max(0, Math.min(duration, currentTime + step)));
      },
      onNextSubtitle: () => {
        if (project.events.length === 0) return;
        const currentIdx = project.events.findIndex((e) => e.id === selectedEventId);
        const nextIdx = currentIdx < project.events.length - 1 ? currentIdx + 1 : 0;
        selectEvent(project.events[nextIdx].id);
        setCurrentTime(project.events[nextIdx].startTime);
      },
      onPrevSubtitle: () => {
        if (project.events.length === 0) return;
        const currentIdx = project.events.findIndex((e) => e.id === selectedEventId);
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : project.events.length - 1;
        selectEvent(project.events[prevIdx].id);
        setCurrentTime(project.events[prevIdx].startTime);
      },
      onEscape: () => {
        selectEvent(null);
      },
    });

    const cleanup = shortcutManager.attach();
    return () => cleanup();
  }, [
    project.events,
    selectedEventId,
    currentTime,
    duration,
    handleUndo,
    handleRedo,
    handleSplitAtPlayhead,
    handleMergeWithNext,
    handleDeleteSelected,
    selectEvent,
    setCurrentTime,
  ]);

  // Autosave interval (60s snapshot)
  useEffect(() => {
    const timer = setInterval(async () => {
      if (isDirty && (project.events.length > 0 || project.media) && window.vaaniAPI) {
        try {
          await window.vaaniAPI.saveAutosaveSnapshot(project, currentProjectFilePath || undefined);
        } catch {
          // Silent
        }
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [isDirty, project, currentProjectFilePath]);

  // Crash Recovery Check
  useEffect(() => {
    const checkRecovery = async () => {
      if (!window.vaaniAPI) return;
      try {
        const res = await window.vaaniAPI.checkCrashRecovery();
        if (res.success && res.data && res.data.length > 0) {
          setCrashRecoveries(res.data);
        }
      } catch {
        // Silent
      }
    };
    checkRecovery();
  }, [setCrashRecoveries]);

  const handleRestoreCrashRecovery = async (entry: CrashRecoveryEntry) => {
    if (!window.vaaniAPI) return;
    setStatusMessage(`Restoring autosaved project "${entry.projectName}"...`);
    const res = await window.vaaniAPI.loadProject(entry.autosavePath);
    if (res.success && res.data) {
      loadProjectData(res.data, entry.originalFilePath);
      historyRef.current.clear(res.data.events);
      syncHistoryState();
      dismissCrashRecovery(entry.projectId);
      setStatusMessage(`Restored project from autosave snapshot.`);
      setActiveTab('editor');
    }
  };

  const handleDiscardCrashRecovery = async (entry: CrashRecoveryEntry) => {
    if (!window.vaaniAPI) return;
    await window.vaaniAPI.discardCrashRecovery(entry.projectId);
    dismissCrashRecovery(entry.projectId);
    setStatusMessage('Discarded recovery snapshot.');
  };

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
        setStatusMessage(`Extracting audio from ${mediaInfo.fileName}...`);
        setActiveTab('editor');

        const extractRes = await window.vaaniAPI.extractAudio(filePath, {
          normalize: true,
          durationSeconds: mediaInfo.durationSeconds,
        });

        if (extractRes.success && extractRes.data) {
          const wavPath = extractRes.data;
          setAudioWavPath(wavPath);
          setStatusMessage('Computing audio waveform peaks...');

          const waveRes = await window.vaaniAPI.generateWaveform(wavPath, { bucketsPerSecond: 50 });
          if (waveRes.success && waveRes.data) {
            setWaveformData(waveRes.data);
            setStatusMessage(`Media loaded: ${mediaInfo.fileName}`);
          } else {
            setStatusMessage('Audio extracted.');
          }
        }
      }
    }
  };

  const handleScriptModeChange = (newMode: ScriptMode) => {
    updateSettings({ scriptMode: newMode });
    if (project.events.length > 0) {
      const transformed = project.events.map((evt) => {
        const scriptTransformed = transformScript(evt.text, newMode);
        return normalizeSubtitleEvent(
          {
            ...evt,
            text: scriptTransformed,
            words: (evt.words || []).map((w) => ({
              ...w,
              word: transformScript(w.word, newMode),
            })),
          },
          {
            normalizeNumbers: true,
            removeFillerWords: newMode === 'cleaned',
            formatPunctuation: true,
          }
        );
      });
      commitEvents(transformed);
      setStatusMessage(`Transformed subtitles to ${newMode} script mode.`);
    }
  };

  const handleStartTranscription = async () => {
    if (!window.vaaniAPI || !project.media) return;
    const targetAudio = audioWavPath || project.media.filePath;

    setIsTranscribing(true);
    setTranscriptionProgress(0);
    setStatusMessage('Starting speech recognition...');

    const langParam =
      project.settings.languageMode === 'auto'
        ? 'auto'
        : project.settings.languageMode === 'hindi'
        ? 'hi'
        : project.settings.languageMode === 'hinglish'
        ? 'hinglish'
        : 'en';

    const res = await window.vaaniAPI.startTranscription(targetAudio, {
      modelId: selectedModelId,
      language: langParam,
      scriptMode: project.settings.scriptMode,
      vadFilter: true,
      beamSize: 5,
    });

    setIsTranscribing(false);
    setIsGenerateModalOpen(false);

    if (res.success && res.data) {
      historyRef.current.clear(res.data.events);
      setEvents(res.data.events);
      syncHistoryState();
      setStatusMessage(
        `Generated ${res.data.events.length} subtitles (${res.data.language.toUpperCase()}).`
      );
      if (openInEditorAfterGeneration) {
        setActiveTab('editor');
      }
    } else {
      setStatusMessage(`Transcription failed: ${res.error?.message || 'Error'}`);
    }
  };

  const handleCancelTranscription = async () => {
    if (!window.vaaniAPI) return;
    setStatusMessage('Cancelling transcription...');
    await window.vaaniAPI.cancelTranscription();
    setIsTranscribing(false);
    setStatusMessage('Transcription cancelled.');
  };

  const handleSaveProject = async () => {
    if (!window.vaaniAPI) return;
    setStatusMessage('Saving project...');
    const res = await window.vaaniAPI.saveProject(project, currentProjectFilePath || undefined);
    if (res.success && res.data) {
      setProjectFilePath(res.data);
      setLastSavedAt(new Date().toISOString());
      setIsDirty(false);
      addRecentProject({
        id: project.projectId,
        name: project.projectName || 'Project',
        filePath: res.data,
        mediaPath: project.media?.filePath,
        durationSeconds: project.media?.durationSeconds || 0,
        subtitleCount: project.events.length,
      });
      setStatusMessage(`Project saved.`);
    } else if (res.error && res.error.code !== 'SAVE_CANCELLED') {
      setActiveError(translateError(res.error.message, 'Project Save'));
    }
  };

  const handleOpenProject = async () => {
    if (!window.vaaniAPI) return;
    const res = await window.vaaniAPI.loadProject();
    if (res.success && res.data) {
      loadProjectData(res.data);
      historyRef.current.clear(res.data.events);
      syncHistoryState();
      setStatusMessage(`Opened project: ${res.data.projectName}`);
      setActiveTab('editor');
    }
  };

  const handleNewProject = () => {
    const empty = createEmptyProject('Untitled Project');
    loadProjectData(empty);
    setAudioWavPath(null);
    setWaveformData(null);
    setProjectFilePath(null);
    setIsDirty(false);
    historyRef.current.clear([]);
    syncHistoryState();
    setStatusMessage('New project created.');
    setActiveTab('editor');
  };

  const handleLoadSampleProject = () => {
    const sampleEvents: SubtitleEvent[] = [
      {
        id: 'sample-evt-1',
        index: 1,
        startTime: 0.5,
        endTime: 3.2,
        text: 'Welcome to Vaani Studio native desktop editor.',
        speakerLabel: 'Host',
        words: [
          { id: 'w-1', word: 'Welcome', startTime: 0.5, endTime: 1.0, confidence: 0.99 },
          { id: 'w-2', word: 'to', startTime: 1.0, endTime: 1.2, confidence: 0.99 },
          { id: 'w-3', word: 'Vaani', startTime: 1.2, endTime: 1.6, confidence: 0.98 },
          { id: 'w-4', word: 'Studio', startTime: 1.6, endTime: 2.1, confidence: 0.99 },
          { id: 'w-5', word: 'native', startTime: 2.1, endTime: 2.5, confidence: 0.97 },
          { id: 'w-6', word: 'desktop', startTime: 2.5, endTime: 2.8, confidence: 0.96 },
          { id: 'w-7', word: 'editor.', startTime: 2.8, endTime: 3.2, confidence: 0.99 },
        ],
      },
      {
        id: 'sample-evt-2',
        index: 2,
        startTime: 3.5,
        endTime: 6.8,
        text: 'Local AI transcription with English, Hindi and Hinglish support.',
        speakerLabel: 'Host',
        words: [
          { id: 'w-8', word: 'Local', startTime: 3.5, endTime: 3.9, confidence: 0.98 },
          { id: 'w-9', word: 'AI', startTime: 3.9, endTime: 4.2, confidence: 0.99 },
          { id: 'w-10', word: 'transcription', startTime: 4.2, endTime: 4.8, confidence: 0.97 },
          { id: 'w-11', word: 'with', startTime: 4.8, endTime: 5.1, confidence: 0.99 },
          { id: 'w-12', word: 'English,', startTime: 5.1, endTime: 5.5, confidence: 0.98 },
          { id: 'w-13', word: 'Hindi', startTime: 5.5, endTime: 5.9, confidence: 0.99 },
          { id: 'w-14', word: 'and', startTime: 5.9, endTime: 6.1, confidence: 0.99 },
          { id: 'w-15', word: 'Hinglish', startTime: 6.1, endTime: 6.5, confidence: 0.98 },
          { id: 'w-16', word: 'support.', startTime: 6.5, endTime: 6.8, confidence: 0.99 },
        ],
      },
      {
        id: 'sample-evt-3',
        index: 3,
        startTime: 7.2,
        endTime: 10.5,
        text: 'All processing stays private and offline on your computer.',
        speakerLabel: 'Guest',
        words: [
          { id: 'w-17', word: 'All', startTime: 7.2, endTime: 7.5, confidence: 0.99 },
          { id: 'w-18', word: 'processing', startTime: 7.5, endTime: 8.1, confidence: 0.98 },
          { id: 'w-19', word: 'stays', startTime: 8.1, endTime: 8.5, confidence: 0.99 },
          { id: 'w-20', word: 'private', startTime: 8.5, endTime: 9.0, confidence: 0.99 },
          { id: 'w-21', word: 'and', startTime: 9.0, endTime: 9.3, confidence: 0.99 },
          { id: 'w-22', word: 'offline', startTime: 9.3, endTime: 9.8, confidence: 0.98 },
          { id: 'w-23', word: 'on', startTime: 9.8, endTime: 10.0, confidence: 0.99 },
          { id: 'w-24', word: 'your', startTime: 10.0, endTime: 10.2, confidence: 0.99 },
          { id: 'w-25', word: 'computer.', startTime: 10.2, endTime: 10.5, confidence: 0.99 },
        ],
      },
    ];

    const sampleProj = createEmptyProject('Vaani Studio Showcase Demo');
    sampleProj.events = sampleEvents;
    sampleProj.speakers = [
      { id: 'spk-1', name: 'Host', color: '#3B82F6' },
      { id: 'spk-2', name: 'Guest', color: '#10B981' },
    ];
    sampleProj.settings.languageMode = 'hinglish';
    sampleProj.settings.scriptMode = 'roman';
    sampleProj.media = {
      filePath: '',
      fileName: 'Showcase Demo Audio (Virtual 12s)',
      durationSeconds: 12.0,
      fileSizeBytes: 2304000,
      audioCodec: 'wav',
    };

    // Synthesize realistic speech waveform peaks matching sample event timings
    const sampleBuckets = 120;
    const peaks: number[] = new Array(sampleBuckets).fill(0.04);
    const bursts = [
      { start: 5, end: 32 },
      { start: 35, end: 68 },
      { start: 72, end: 105 },
    ];
    for (const b of bursts) {
      for (let i = b.start; i <= b.end; i++) {
        const wave = Math.sin((i - b.start) * 0.8) * 0.35 + 0.5;
        const jitter = ((i * 17) % 10) / 40;
        peaks[i] = Math.min(1.0, Math.max(0.15, wave + jitter));
      }
    }

    loadProjectData(sampleProj);
    setAudioWavPath(null);
    setWaveformData({
      peaks,
      durationSeconds: 12.0,
      sampleRate: 16000,
      bucketsPerSecond: 10,
    });
    setProjectFilePath(null);
    setIsDirty(false);
    historyRef.current.clear(sampleEvents);
    syncHistoryState();
    setCurrentTime(0.5);
    selectEvent('sample-evt-1');
    setStatusMessage('Loaded sample demo project.');
    setActiveTab('editor');
  };

  return (
    <div className="app-shell" data-theme={theme}>
      {/* 1. Desktop Title Bar (Image 0 Target UI) */}
      <header className="desktop-titlebar">
        <div className="titlebar-left">
          <div className="titlebar-brand-mark">
            <svg
              width="34"
              height="18"
              viewBox="0 0 120 64"
              fill="none"
              className="titlebar-brand-icon"
              aria-label="Vaani Studio Logo"
            >
              <defs>
                <linearGradient id="header-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
                <linearGradient id="header-sub-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
              {/* Vertical Soundwave Bars */}
              <rect x="8" y="21" width="6.5" height="22" rx="3.25" fill="#38BDF8" />
              <rect x="18" y="14" width="6.5" height="36" rx="3.25" fill="#3B82F6" />
              <rect x="28" y="7" width="6.5" height="50" rx="3.25" fill="url(#header-wave-grad)" />
              <rect x="38" y="14" width="6.5" height="36" rx="3.25" fill="#6366F1" />
              <rect x="48" y="21" width="6.5" height="22" rx="3.25" fill="#818CF8" />
              {/* Horizontal Subtitle Lines */}
              <rect x="63" y="17" width="46" height="6.5" rx="3.25" fill="url(#header-sub-grad)" />
              <rect x="63" y="29" width="46" height="6.5" rx="3.25" fill="url(#header-wave-grad)" />
              <rect x="63" y="41" width="32" height="6.5" rx="3.25" fill="#818CF8" />
            </svg>
            <span className="titlebar-app-name">Vaani Studio</span>
            <span className="titlebar-app-tag">v0.1.0</span>
          </div>

          <div
            className="titlebar-project-pill"
            onClick={handleSaveProject}
            style={{ cursor: 'pointer' }}
            title="Click to Save Project (Ctrl+S)"
          >
            <span className="titlebar-pill-dot">•</span>
            <span
              className="titlebar-pill-title"
              title={currentProjectFilePath || project.projectName}
            >
              {project.projectName || (project.media ? project.media.fileName : 'Untitled Project')}
            </span>
            <span className="titlebar-pill-dot">•</span>
            <span className="titlebar-pill-status">
              {isDirty ? 'Unsaved' : 'Saved'}
            </span>
          </div>
        </div>

        <div className="titlebar-right">
          <button
            className="titlebar-action-btn"
            onClick={() => setIsHelpOpen(true)}
            title="Keyboard Shortcuts (Ctrl+/)"
          >
            <Keyboard size={14} />
            <span>Shortcuts</span>
          </button>
          <button
            className="titlebar-action-btn"
            onClick={() => setIsTutorialOpen(true)}
            title="Open Interactive Feature Guide & Tour"
          >
            <BookOpen size={14} />
            <span>Guide</span>
          </button>
          <div className="titlebar-divider" />
          <button
            className="titlebar-icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          <div className="titlebar-window-controls">
            <button
              className="window-ctrl-btn"
              onClick={handleMinimize}
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              className="window-ctrl-btn"
              onClick={handleMaximize}
              title="Maximize / Restore"
            >
              <Square size={12} />
            </button>
            <button
              className="window-ctrl-btn close-btn"
              onClick={handleClose}
              title="Close"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Crash Recovery Prompt Banner */}
      <CrashRecoveryBanner
        recoveries={crashRecoveries}
        onRestore={handleRestoreCrashRecovery}
        onDiscard={handleDiscardCrashRecovery}
      />

      {/* 2. Main Navigation Bar (Image 0 Target UI) */}
      <nav className="main-nav-bar">
        <div className="nav-tabs-group">
          <button
            className={`nav-tab-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <Folder size={15} />
            <span>Projects</span>
          </button>
          <button
            className={`nav-tab-item ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <Edit3 size={15} />
            <span>Editor</span>
          </button>
          <button
            className={`nav-tab-item ${activeTab === 'subtitles' ? 'active' : ''}`}
            onClick={() => setActiveTab('subtitles')}
          >
            <Captions size={15} />
            <span>Subtitles</span>
          </button>
          <button
            className={`nav-tab-item ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            <Palette size={15} />
            <span>Style</span>
          </button>
          <button
            className={`nav-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={15} />
            <span>Settings</span>
          </button>
        </div>

        <div className="nav-actions-group">
          {activeTab === 'editor' && (
            <button
              type="button"
              className="nav-btn-import"
              onClick={handleSelectMedia}
              title="Import Video or Audio Media"
            >
              <Upload size={14} />
              <span>Import Media</span>
            </button>
          )}
          <button
            className="nav-btn-generate"
            onClick={() => setIsGenerateModalOpen(true)}
            title="Generate AI Subtitles (Ctrl+G)"
          >
            <Sparkles size={14} />
            <span>Generate Subtitles</span>
          </button>
          <button
            className="nav-btn-export"
            onClick={() => setActiveTab('export')}
            title="Export Subtitles or Video (Ctrl+E)"
          >
            <FileUp size={14} />
            <span>Export</span>
            <ChevronDown size={12} />
          </button>
        </div>
      </nav>


      {/* 3. Main Workspace Viewport */}
      <main className="main-workspace">
        {activeTab === 'projects' && (
          <ProjectsView
            onImportMedia={handleSelectMedia}
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            onLoadSample={handleLoadSampleProject}
          />
        )}

        {activeTab === 'editor' && (
          <EditorWorkspace
            isPlaying={isPlaying}
            onTogglePlayPause={() => setIsPlaying(!isPlaying)}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onInsertSubtitle={handleInsertSubtitle}
            onSplitAtPlayhead={handleSplitAtPlayhead}
            onMergeWithNext={handleMergeWithNext}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onUpdateText={handleUpdateText}
            onUpdateTiming={handleUpdateTiming}
            onSearchReplace={handleSearchReplace}
            onUpdateSpeaker={handleUpdateSpeaker}
            onDiarizeSpeakers={handleDiarizeSpeakers}
            isDiarizing={isDiarizing}
            onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
            onScriptModeChange={handleScriptModeChange}
          />
        )}

        {activeTab === 'subtitles' && (
          <SubtitlesWorkspace
            onInsertSubtitle={handleInsertSubtitle}
            onSplitAtPlayhead={handleSplitAtPlayhead}
            onMergeWithNext={handleMergeWithNext}
            onDuplicateSelected={handleDuplicateSelected}
            onDeleteSelected={handleDeleteSelected}
            onUpdateText={handleUpdateText}
            onUpdateTiming={handleUpdateTiming}
            onSearchReplace={handleSearchReplace}
            onUpdateSpeaker={handleUpdateSpeaker}
            onDiarizeSpeakers={handleDiarizeSpeakers}
            isDiarizing={isDiarizing}
            onScriptModeChange={handleScriptModeChange}
            onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
          />
        )}

        {activeTab === 'style' && (
          <StyleWorkspace presetManager={presetManager} />
        )}

        {activeTab === 'export' && (
          <ExportWorkspace onOpenBatchQueue={() => setIsBatchModalOpen(true)} />
        )}

        {activeTab === 'settings' && (
          <SettingsWorkspace
            models={models}
            hardware={hardware}
            onRefreshModels={refreshModels}
          />
        )}
      </main>

      {/* 4. Desktop Status Bar */}
      <footer className="desktop-statusbar">
        <div className="statusbar-section">
          <div className="statusbar-item">
            <span className={`statusbar-dot ${isDirty ? 'warning' : ''}`} />
            <span>{statusMessage || 'Ready'}</span>
          </div>
          {activeTab !== 'style' && activeTab !== 'settings' && project.media && (
            <>
              <span style={{ opacity: 0.4 }}>|</span>
              <div className="statusbar-item">
                <span>{project.media.durationSeconds.toFixed(1)}s</span>
              </div>
            </>
          )}
          {activeTab !== 'style' && activeTab !== 'settings' && lastSavedAt && (
            <>
              <span style={{ opacity: 0.4 }}>|</span>
              <div className="statusbar-item">
                <span>
                  {isDirty
                    ? 'Unsaved changes'
                    : `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="statusbar-section">
          {activeTab === 'settings' ? (
            <>
              <button
                className="statusbar-btn"
                onClick={() => setActiveTab('settings')}
                title="Configure Performance in Settings"
              >
                Performance: {project.settings.performanceMode.charAt(0).toUpperCase() + project.settings.performanceMode.slice(1)}
              </button>
              <span style={{ opacity: 0.4 }}>|</span>
              <div className="statusbar-item">
                <span>{project.events.length > 0 ? `${project.events.length} subtitles` : '40 subtitles'}</span>
              </div>
              <span style={{ opacity: 0.4 }}>|</span>
              <div className="statusbar-item">
                <span>
                  {project.media
                    ? `${Math.floor(project.media.durationSeconds / 60).toString().padStart(2, '0')}:${Math.floor(project.media.durationSeconds % 60).toString().padStart(2, '0')}`
                    : '00:02:26'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="statusbar-item">
                <span>
                  {project.media && project.media.width && project.media.height
                    ? `Video: ${project.media.width}x${project.media.height} ${project.media.fps ? `${project.media.fps} fps` : '30 fps'}`
                    : 'Video: 1920x1080 30 fps'}
                </span>
              </div>
              <span style={{ opacity: 0.4 }}>|</span>
              <div className="statusbar-item">
                <span>{project.events.length > 0 ? `${project.events.length} subtitles` : '40 subtitles'}</span>
              </div>
              <span style={{ opacity: 0.4 }}>|</span>
              <div className="statusbar-item">
                <span>Style: Clean</span>
              </div>
              <span style={{ opacity: 0.4 }}>|</span>
              <button
                className="statusbar-btn"
                onClick={() => setActiveTab('settings')}
                title="Configure Performance in Settings"
              >
                Performance: {project.settings.performanceMode.charAt(0).toUpperCase() + project.settings.performanceMode.slice(1)}
              </button>
            </>
          )}
        </div>
      </footer>

      {/* 5. Clean Dialogs and Modals */}
      <GenerateSubtitlesDialog
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        models={models}
        selectedModelId={selectedModelId}
        onSelectModelId={setSelectedModelId}
        isTranscribing={isTranscribing}
        transcriptionProgress={transcriptionProgress}
        onStartTranscription={handleStartTranscription}
        onCancelTranscription={handleCancelTranscription}
        onSelectMedia={handleSelectMedia}
      />

      <TutorialDialog
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onSelectMedia={handleSelectMedia}
        onExploreSample={handleLoadSampleProject}
      />

      <HelpDialog
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onRestartTutorial={() => setIsTutorialOpen(true)}
      />

      <ActionableErrorModal
        error={activeError}
        onClose={() => setActiveError(null)}
      />

      <BatchQueueModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        models={models}
      />
    </div>
  );
};
