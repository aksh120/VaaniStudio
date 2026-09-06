import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useProjectStore } from './store/projectStore.js';
import {
  LanguageMode,
  ScriptMode,
  PerformanceMode,
  ModelInfo,
  SubtitleEvent,
} from '../../shared/types/models.js';
import { transformScript } from '../../shared/intelligence/transliteration.js';
import { normalizeSubtitleEvent } from '../../shared/intelligence/textNormalizer.js';
import { VideoPlayerPreview, AspectRatioMode } from './components/VideoPlayerPreview.js';
import { WaveformTimeline } from './components/WaveformTimeline.js';
import { SubtitleListView } from './components/SubtitleListView.js';
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

export const App: React.FC = () => {
  const {
    project,
    hardware,
    audioWavPath,
    waveformData,
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
  const [detectedClassification, setDetectedClassification] = useState<string | null>(null);

  // Playback & Viewport state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('16:9');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

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

  const duration = project.media?.durationSeconds || 0;

  // Find currently active subtitle event for live preview overlay
  const activeSubtitle = useMemo(() => {
    return (
      project.events.find(
        (e) => currentTime >= e.startTime && currentTime <= e.endTime
      ) || null
    );
  }, [project.events, currentTime]);

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
    if (window.vaaniAPI) {
      window.vaaniAPI.getHardwareProfile().then((res) => {
        if (res.success && res.data) {
          setHardware(res.data);
          setStatusMessage(`Hardware detected: ${res.data.cpuModel}`);
        }
      });

      refreshModels();

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

  // Editor Operations Handlers
  const handleSplitAtPlayhead = useCallback(() => {
    const targetId = selectedEventId || activeSubtitle?.id;
    if (!targetId) {
      setStatusMessage('Select a subtitle event or move playhead over an event to split.');
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

  // Keyboard Shortcuts Hook
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
      setStatusMessage(`Transformed ${transformed.length} subtitles to ${newMode} mode.`);
    }
  };

  const handleStartTranscription = async () => {
    if (!window.vaaniAPI || !project.media) return;
    const targetAudio = audioWavPath || project.media.filePath;

    setIsTranscribing(true);
    setTranscriptionProgress(0);
    setStatusMessage('Initiating speech recognition worker...');

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

    if (res.success && res.data) {
      historyRef.current.clear(res.data.events);
      setEvents(res.data.events);
      syncHistoryState();

      if ((res.data as any).classification) {
        setDetectedClassification((res.data as any).classification);
      }
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
      historyRef.current.clear(res.data.events);
      syncHistoryState();
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

      {/* Editor Workspace Toolbar */}
      <div className="editor-main-toolbar">
        <div className="toolbar-group">
          <button
            className="ctrl-btn ctrl-btn-sm"
            disabled={!canUndo}
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            className="ctrl-btn ctrl-btn-sm"
            disabled={!canRedo}
            onClick={handleRedo}
            title="Redo (Ctrl+Y)"
          >
            ↪ Redo
          </button>
          <div className="toolbar-divider" />
          <button
            className="ctrl-btn ctrl-btn-sm"
            onClick={handleInsertSubtitle}
            title="Insert New Subtitle Event"
          >
            ➕ Insert
          </button>
          <button
            className="ctrl-btn ctrl-btn-sm"
            disabled={!selectedEventId && !activeSubtitle}
            onClick={handleSplitAtPlayhead}
            title="Split active subtitle at playhead (Ctrl+K or S)"
          >
            ✂ Split
          </button>
          <button
            className="ctrl-btn ctrl-btn-sm"
            disabled={!selectedEventId}
            onClick={handleMergeWithNext}
            title="Merge with adjacent subtitle (Ctrl+M)"
          >
            🔗 Merge
          </button>
          <button
            className="ctrl-btn ctrl-btn-sm"
            disabled={!selectedEventId}
            onClick={handleDuplicateSelected}
            title="Duplicate subtitle"
          >
            📑 Duplicate
          </button>
          <button
            className="ctrl-btn ctrl-btn-sm action-delete"
            disabled={!selectedEventId}
            onClick={handleDeleteSelected}
            title="Delete subtitle (Delete)"
          >
            🗑 Delete
          </button>
        </div>

        <div className="toolbar-group">
          {detectedClassification && (
            <span
              className="brand-badge"
              style={{ background: 'var(--accent-active)', fontSize: '10px' }}
            >
              {detectedClassification.replace(/_/g, ' ').toUpperCase()}
            </span>
          )}
          {isTranscribing ? (
            <button className="btn btn-danger btn-sm" onClick={handleCancelTranscription}>
              Cancel Transcription
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              disabled={!project.media || (currentModel && !currentModel.isDownloaded)}
              onClick={handleStartTranscription}
            >
              Generate Subtitles
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Viewport and Panels */}
      <main className="studio-main">
        {/* Left / Center Work Area */}
        <section className="editor-workspace">
          {/* Active Transcription Progress Bar */}
          {isTranscribing && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-surface-hover)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  marginBottom: '4px',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Transcribing speech with {currentModel?.name}...</span>
                <span>{transcriptionProgress.toFixed(1)}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'var(--bg-base)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
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

          {/* Top Half: Video Player Viewport */}
          <div className="viewport-pane" style={{ flex: '1 1 50%', minHeight: '260px' }}>
            <VideoPlayerPreview
              mediaPath={project.media?.filePath || null}
              duration={duration}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              isPlaying={isPlaying}
              onTogglePlayPause={() => setIsPlaying(!isPlaying)}
              activeSubtitle={activeSubtitle}
              styleConfig={project.style}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              playbackRate={playbackRate}
              onPlaybackRateChange={setPlaybackRate}
              onStepFrame={(dir) => {
                const step = dir * (1 / 30);
                setCurrentTime(Math.max(0, Math.min(duration, currentTime + step)));
              }}
              onStepSecond={(dir) => {
                const step = dir * 1.0;
                setCurrentTime(Math.max(0, Math.min(duration, currentTime + step)));
              }}
            />
          </div>

          {/* Interactive Multi-Scale Waveform Timeline */}
          <WaveformTimeline
            duration={duration}
            currentTime={currentTime}
            onSeek={setCurrentTime}
            waveformData={waveformData}
            events={project.events}
            selectedEventId={selectedEventId}
            onSelectEvent={selectEvent}
            onUpdateEventTiming={handleUpdateTiming}
            onSplitAtPlayhead={handleSplitAtPlayhead}
          />

          {/* High-Performance Virtualized Subtitle List View */}
          <div style={{ flex: '1 1 50%', minHeight: '220px', display: 'flex', flexDirection: 'column' }}>
            <SubtitleListView
              events={project.events}
              selectedEventId={selectedEventId}
              currentTime={currentTime}
              onSelectEvent={selectEvent}
              onUpdateText={handleUpdateText}
              onUpdateTiming={handleUpdateTiming}
              onSplit={handleSplitAtPlayhead}
              onMerge={handleMergeWithNext}
              onDuplicate={handleDuplicateSelected}
              onDelete={handleDeleteSelected}
              onSearchReplace={handleSearchReplace}
            />
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
                onChange={(e) => handleScriptModeChange(e.target.value as ScriptMode)}
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
